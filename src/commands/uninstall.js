import fs from "fs/promises";
import path from "path";

import { ScopeManager } from "../services/scope-manager.js";
import { ManifestManager } from "../services/manifest-manager.js";
import { logger } from "../utils/logger.js";
import { promptTypeYes } from "../utils/interactive.js";
import { ALLOWED_NAMESPACES, ERROR_CODES, VERSION_FILE } from "../../lib/constants.js";

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function isAllowed(relativePath) {
  const p = (relativePath || "").replace(/\\/g, "/");
  return ALLOWED_NAMESPACES.some((re) => re.test(p));
}

async function uninstallScope(scope, options) {
  const scopeManager = new ScopeManager({ scope, configDir: options.configDir });
  const targetDir = scopeManager.getTargetDir();

  const label = scope === "global" ? "Глобально" : "Локально";
  logger.heading(`${label} удаление`);
  logger.dim(`Путь: ${scopeManager.getPathPrefix()}`);

  if (!(await exists(path.join(targetDir, VERSION_FILE)))) {
    logger.warning("Не установлено (нет VERSION файла)");
    return { ok: true, removed: 0 };
  }

  const manifest = new ManifestManager(targetDir);
  const entries = await manifest.load();
  const safeEntries = (entries || []).filter((e) => isAllowed(e.relativePath));

  if (!entries || entries.length === 0) {
    logger.warning("Манифест не найден. Будет выполнено консервативное удаление известных директорий.");
  }

  logger.dim(`Файлов к удалению (безопасный namespace): ${safeEntries.length}`);
  for (const e of safeEntries.slice(0, 20)) {
    logger.dim(`- ${e.relativePath}`);
  }
  if (safeEntries.length > 20) logger.dim(`... и еще ${safeEntries.length - 20}`);

  if (options.dryRun) {
    logger.info("dry-run: ничего не удалено");
    return { ok: true, removed: 0 };
  }

  if (!options.force) {
    const ok = await promptTypeYes("Это удалит файлы, перечисленные выше. Введите \"yes\", чтобы продолжить:");
    if (!ok) {
      logger.info("Отмена.");
      return { ok: true, removed: 0 };
    }
  }

  // Удаление
  let removed = 0;
  if (safeEntries.length > 0) {
    for (const e of safeEntries) {
      try {
        await fs.rm(e.path, { force: true });
        removed++;
      } catch {
        // ignore
      }
    }
  } else {
    // fallback
    await fs.rm(path.join(targetDir, "get-shit-done"), { recursive: true, force: true });
    await fs.rm(path.join(targetDir, "commands", "gsd"), { recursive: true, force: true });
    try {
      const agentsDir = path.join(targetDir, "agents");
      const agentFiles = await fs.readdir(agentsDir);
      await Promise.all(agentFiles.filter((f) => /^gsd-.*\.md$/i.test(f)).map((f) => fs.rm(path.join(agentsDir, f), { force: true })));
    } catch {
      // ignore
    }
  }

  // Удалить VERSION и манифест на всякий
  await fs.rm(path.join(targetDir, VERSION_FILE), { force: true });
  await fs.rm(path.join(targetDir, "get-shit-done", "INSTALLED_FILES.json"), { force: true });

  // Подчистить директории
  await fs.rm(path.join(targetDir, "get-shit-done"), { recursive: true, force: true });
  await fs.rm(path.join(targetDir, "commands", "gsd"), { recursive: true, force: true });

  // Локальная установка: если корень .opencode пустой — удалить
  if (scope === "local") {
    try {
      // убрать пустые корневые директории
      for (const maybeEmpty of ["agents", "commands"]) {
        const p = path.join(targetDir, maybeEmpty);
        try {
          const entries = await fs.readdir(p);
          if (entries.length === 0) await fs.rmdir(p);
        } catch {
          // ignore
        }
      }

      const entriesLeft = await fs.readdir(targetDir);
      if (entriesLeft.length === 0) {
        await fs.rmdir(targetDir);
      }
    } catch {
      // ignore
    }
  }

  logger.success(`Удалено файлов: ${removed}`);
  return { ok: true, removed };
}

export async function uninstallCommand(options = {}) {
  const onlyGlobal = Boolean(options.global);
  const onlyLocal = Boolean(options.local);
  if (onlyGlobal && onlyLocal) {
    logger.error("Нельзя указывать одновременно --global и --local");
    return ERROR_CODES.GENERAL_ERROR;
  }

  if (onlyGlobal) {
    await uninstallScope("global", options);
    return ERROR_CODES.SUCCESS;
  }
  if (onlyLocal) {
    await uninstallScope("local", options);
    return ERROR_CODES.SUCCESS;
  }

  // если scope не указан, пробуем удалить обе (консервативно)
  await uninstallScope("local", options);
  await uninstallScope("global", options);
  return ERROR_CODES.SUCCESS;
}
