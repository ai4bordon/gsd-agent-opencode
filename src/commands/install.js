import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { ScopeManager } from "../services/scope-manager.js";
import { FileOperations } from "../services/file-ops.js";
import { ManifestManager } from "../services/manifest-manager.js";
import { logger } from "../utils/logger.js";
import { promptInstallScope, promptConfirmDanger } from "../utils/interactive.js";
import { ALLOWED_NAMESPACES, ERROR_CODES, VERSION_FILE } from "../../lib/constants.js";

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function getSourceDirectory() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // src/commands -> src -> package root
  return path.resolve(__dirname, "../..");
}

async function getPackageVersion(sourceDir) {
  try {
    const raw = await fs.readFile(path.join(sourceDir, "package.json"), "utf-8");
    const pkg = JSON.parse(raw);
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

async function removeOldInstallation(targetDir) {
  const manifest = new ManifestManager(targetDir);
  const entries = await manifest.load();
  if (!entries || entries.length === 0) {
    // fallback: минимальная очистка известных директорий
    await fs.rm(path.join(targetDir, "get-shit-done"), { recursive: true, force: true });
    await fs.rm(path.join(targetDir, "commands", "gsd"), { recursive: true, force: true });
    // агенты: удалим только gsd-*.md
    try {
      const agentsDir = path.join(targetDir, "agents");
      const agentFiles = await fs.readdir(agentsDir);
      await Promise.all(
        agentFiles
          .filter((f) => /^gsd-.*\.md$/i.test(f))
          .map((f) => fs.rm(path.join(agentsDir, f), { force: true }))
      );
    } catch {
      // ignore
    }
    return;
  }

  for (const entry of entries) {
    const rel = (entry.relativePath || "").replace(/\\/g, "/");
    const allowed = ALLOWED_NAMESPACES.some((re) => re.test(rel));
    if (!allowed) continue;
    try {
      await fs.rm(entry.path, { force: true });
    } catch {
      // ignore
    }
  }

  // почистить пустые директории (консервативно)
  const dirsToTry = [path.join(targetDir, "commands", "gsd"), path.join(targetDir, "get-shit-done")];
  for (const d of dirsToTry) {
    try {
      await fs.rm(d, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

export async function installCommand(options = {}) {
  try {
    if (options.global && options.local) {
      logger.error("Нельзя указывать одновременно --global и --local");
      return ERROR_CODES.GENERAL_ERROR;
    }
    if (options.configDir && options.local) {
      logger.error("--config-dir нельзя использовать вместе с --local");
      return ERROR_CODES.GENERAL_ERROR;
    }

    let scope = options.global ? "global" : options.local ? "local" : null;
    if (!scope) {
      scope = await promptInstallScope();
    }

    const scopeManager = new ScopeManager({ scope, configDir: options.configDir });
    const targetDir = scopeManager.getTargetDir();
    const sourceDir = getSourceDirectory();
    const version = await getPackageVersion(sourceDir);

    // preflight
    if (!(await exists(path.join(sourceDir, "agents"))) || !(await exists(path.join(sourceDir, "get-shit-done")))) {
      logger.error("Похоже, пакет собран неправильно: не найдены папки agents/ или get-shit-done/");
      return ERROR_CODES.GENERAL_ERROR;
    }

    const hasCommandsNew = await exists(path.join(sourceDir, "commands", "gsd"));
    if (!hasCommandsNew) {
      logger.error("Похоже, пакет собран неправильно: не найдены команды (commands/gsd)");
      return ERROR_CODES.GENERAL_ERROR;
    }

    // если уже установлено - спросить подтверждение (или force)
    const versionPath = path.join(targetDir, VERSION_FILE);
    const alreadyInstalled = await exists(versionPath);
    if (alreadyInstalled && !options.force) {
      const ok = await promptConfirmDanger(
        `Обнаружена существующая установка в ${scopeManager.getPathPrefix()}. Переустановить (файлы GSD будут перезаписаны)?`
      );
      if (!ok) {
        logger.info("Отмена.");
        return ERROR_CODES.SUCCESS;
      }
    }

    // очистка старых файлов
    if (alreadyInstalled || options.force) {
      await removeOldInstallation(targetDir);
    }

    const fileOps = new FileOperations(scopeManager, logger);
    await fileOps.install(sourceDir, targetDir, { version, force: options.force });
    return ERROR_CODES.SUCCESS;
  } catch (error) {
    logger.error(error?.message || String(error));
    if (options.verbose && error?.stack) logger.debug(error.stack);
    return ERROR_CODES.GENERAL_ERROR;
  }
}
