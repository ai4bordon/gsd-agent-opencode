import fs from "fs/promises";
import path from "path";
import os from "os";
import { constants as fsConstants } from "fs";

import ora from "ora";

import {
  DIRECTORIES_TO_COPY,
  PATH_PATTERNS,
  VERSION_FILE,
  MANIFEST_FILENAME,
} from "../../lib/constants.js";
import { ManifestManager } from "./manifest-manager.js";

function normalizeSlashes(p) {
  return p.replace(/\\/g, "/");
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export class FileOperations {
  constructor(scopeManager, logger) {
    this.scopeManager = scopeManager;
    this.logger = logger;
  }

  async install(sourceDir, targetDir, { version, force } = {}) {
    const spinner = ora({ text: "Подготовка установки...", color: "cyan" }).start();

    const prefix = this.scopeManager.getPathPrefix();
    const prefixWithSlash = `${prefix.replace(/\/$/, "")}/`;

    const tempRoot = `${targetDir}.tmp-${Date.now()}`;
    const manifest = new ManifestManager(targetDir);

    try {
      // 1) создать temp
      await fs.mkdir(tempRoot, { recursive: true });

      // 2) скопировать исходные директории в temp (с заменой путей)
      spinner.text = "Копирование ресурсов...";
      for (const dirName of DIRECTORIES_TO_COPY) {
        const srcPath = path.join(sourceDir, dirName);
        if (!(await exists(srcPath))) continue;
        const dstPath = path.join(tempRoot, dirName);
        await this._copyDirWithReplacement(srcPath, dstPath, {
          prefixWithSlash,
          scope: this.scopeManager.scope,
        });
      }

      // 2.1) Команды: ставим ТОЛЬКО в commands/gsd.
      const sourceCommandsNew = path.join(sourceDir, "commands", "gsd");
      const targetCommands = path.join(tempRoot, "commands", "gsd");
      if (await exists(sourceCommandsNew)) {
        await this._copyDirWithReplacement(sourceCommandsNew, targetCommands, {
          prefixWithSlash,
          scope: this.scopeManager.scope,
        });
      } else {
        throw new Error("Не найдены команды в исходниках: commands/gsd");
      }

      // 3) применить в target (аккуратно, не трогая чужие файлы)
      spinner.text = "Применение установки...";
      await fs.mkdir(targetDir, { recursive: true });



      // agents: копируем файлы поверх
      const tempAgents = path.join(tempRoot, "agents");
      if (await exists(tempAgents)) {
        const targetAgents = path.join(targetDir, "agents");
        await fs.mkdir(targetAgents, { recursive: true });
        await this._copyFlatDir(tempAgents, targetAgents, {
          filter: (name) => /^gsd-.*\.md$/i.test(name),
        });
      }

      // commands/gsd: заменяем целиком директорию (namespace пакета)
      await this._replaceDir(path.join(tempRoot, "commands", "gsd"), path.join(targetDir, "commands", "gsd"));

      // get-shit-done: заменяем целиком
      await this._replaceDir(path.join(tempRoot, "get-shit-done"), path.join(targetDir, "get-shit-done"));

      // 4) VERSION
      if (version) {
        const versionPath = path.join(targetDir, VERSION_FILE);
        await fs.mkdir(path.dirname(versionPath), { recursive: true });
        await fs.writeFile(versionPath, `v${version}`, "utf-8");
      }

      // 5) инициализировать global config defaults (не затирать, если существует)
      const defaultConfigPath = path.join(targetDir, "get-shit-done", "config.default.json");
      const runtimeConfigPath = path.join(targetDir, "get-shit-done", "config.json");
      if (!(await exists(runtimeConfigPath)) && (await exists(defaultConfigPath))) {
        await fs.copyFile(defaultConfigPath, runtimeConfigPath);
      }

      // 6) собрать и записать manifest
      spinner.text = "Формирование манифеста...";
      const installedFiles = [];
      await this._collectFiles(path.join(targetDir, "get-shit-done"), installedFiles);
      await this._collectFiles(path.join(targetDir, "commands", "gsd"), installedFiles);
      await this._collectFiles(path.join(targetDir, "agents"), installedFiles, {
        filter: (file) => /^gsd-.*\.md$/i.test(path.basename(file)),
      });

      for (const filePath of installedFiles) {
        const rel = normalizeSlashes(path.relative(targetDir, filePath));
        const stat = await fs.stat(filePath);
        const hash = await ManifestManager.calculateHash(filePath);
        manifest.addFile(filePath, rel, stat.size, hash);
      }

      // сохранить в get-shit-done/INSTALLED_FILES.json
      const manifestPath = path.join(targetDir, MANIFEST_FILENAME);
      await fs.mkdir(path.dirname(manifestPath), { recursive: true });
      await fs.writeFile(manifestPath, JSON.stringify(manifest.getAllEntries(), null, 2), "utf-8");

      spinner.succeed("Установка завершена");
      this.logger.success(`Установлено в ${prefix}`);
      this.logger.dim("После установки перезапустите OpenCode, чтобы команды загрузились.");
      return { success: true };
    } catch (error) {
      spinner.fail("Установка не удалась");
      throw error;
    } finally {
      // cleanup temp
      try {
        await fs.rm(tempRoot, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  }

  async _copyFlatDir(srcDir, dstDir, { filter } = {}) {
    const entries = await fs.readdir(srcDir, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isFile()) continue;
      if (filter && !filter(ent.name)) continue;
      const src = path.join(srcDir, ent.name);
      const dst = path.join(dstDir, ent.name);
      await fs.copyFile(src, dst, fsConstants.COPYFILE_FICLONE);
    }
  }

  async _replaceDir(srcDir, dstDir) {
    if (!(await exists(srcDir))) return;
    await fs.mkdir(path.dirname(dstDir), { recursive: true });
    // удалить старое
    await fs.rm(dstDir, { recursive: true, force: true });
    // попытаться rename (быстрее), иначе copy+rm
    try {
      await fs.rename(srcDir, dstDir);
    } catch (e) {
      if (e?.code === "EXDEV") {
        await this._copyDirRaw(srcDir, dstDir);
        await fs.rm(srcDir, { recursive: true, force: true });
      } else {
        // fallback
        await this._copyDirRaw(srcDir, dstDir);
        await fs.rm(srcDir, { recursive: true, force: true });
      }
    }
  }

  async _copyDirRaw(srcDir, dstDir) {
    await fs.mkdir(dstDir, { recursive: true });
    const entries = await fs.readdir(srcDir, { withFileTypes: true });
    for (const ent of entries) {
      const src = path.join(srcDir, ent.name);
      const dst = path.join(dstDir, ent.name);
      if (ent.isDirectory()) {
        await this._copyDirRaw(src, dst);
      } else {
        await fs.copyFile(src, dst, fsConstants.COPYFILE_FICLONE);
      }
    }
  }

  async _copyDirWithReplacement(srcDir, dstDir, { prefixWithSlash, scope }) {
    await fs.mkdir(dstDir, { recursive: true });
    const entries = await fs.readdir(srcDir, { withFileTypes: true });

    for (const ent of entries) {
      const src = path.join(srcDir, ent.name);
      const dst = path.join(dstDir, ent.name);
      if (ent.isDirectory()) {
        await this._copyDirWithReplacement(src, dst, { prefixWithSlash, scope });
        continue;
      }

      if (ent.isFile() && ent.name.toLowerCase().endsWith(".md")) {
        let content = await fs.readFile(src, "utf-8");

        // 1) вариант A: @gsd-agent-opencode/ -> @<prefix>/
        content = content.replace(PATH_PATTERNS.pkgAtReference, () => `@${prefixWithSlash}`);

        // 2) страховка: @~/.config/opencode/ -> @<prefix>/
        content = content.replace(PATH_PATTERNS.globalAtReference, () => `@${prefixWithSlash}`);

        // 3) локальная установка: иногда встречаются plain `~/.config/opencode/` в примерах.
        // Не трогаем bash-шаблоны с ${OPENCODE_CONFIG_DIR:-...}, поэтому заменяем только «голые» в тексте.
        if (scope === "local") {
          content = content.replace(PATH_PATTERNS.globalPlainReference, () => prefixWithSlash);
        }

        await fs.writeFile(dst, content, "utf-8");
        continue;
      }

      if (ent.isFile()) {
        await fs.copyFile(src, dst, fsConstants.COPYFILE_FICLONE);
      }
    }
  }

  async _collectFiles(rootDir, out, { filter } = {}) {
    if (!(await exists(rootDir))) return;
    const entries = await fs.readdir(rootDir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(rootDir, ent.name);
      if (ent.isDirectory()) {
        await this._collectFiles(full, out, { filter });
      } else if (ent.isFile()) {
        if (filter && !filter(full)) continue;
        out.push(full);
      }
    }
  }
}
