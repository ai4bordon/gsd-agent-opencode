import fs from "fs/promises";
import path from "path";

import { ScopeManager } from "../services/scope-manager.js";
import { logger } from "../utils/logger.js";
import { ERROR_CODES, VERSION_FILE } from "../../lib/constants.js";

async function readVersion(targetDir) {
  try {
    const raw = await fs.readFile(path.join(targetDir, VERSION_FILE), "utf-8");
    return raw.trim() || null;
  } catch {
    return null;
  }
}

async function printScope(scope, options) {
  const scopeManager = new ScopeManager({ scope, configDir: options.configDir });
  const targetDir = scopeManager.getTargetDir();
  const version = await readVersion(targetDir);
  const label = scope === "global" ? "Глобально" : "Локально";

  logger.heading(label);
  logger.dim(`Путь: ${scopeManager.getPathPrefix()}`);
  if (!version) {
    logger.warning("Не установлено");
    return;
  }
  logger.success(`Версия: ${version}`);
}

export async function listCommand(options = {}) {
  const onlyGlobal = Boolean(options.global);
  const onlyLocal = Boolean(options.local);

  if (onlyGlobal && onlyLocal) {
    logger.error("Нельзя указывать одновременно --global и --local");
    return ERROR_CODES.GENERAL_ERROR;
  }

  if (onlyGlobal) {
    await printScope("global", options);
    return ERROR_CODES.SUCCESS;
  }
  if (onlyLocal) {
    await printScope("local", options);
    return ERROR_CODES.SUCCESS;
  }

  await printScope("global", options);
  await printScope("local", options);
  return ERROR_CODES.SUCCESS;
}
