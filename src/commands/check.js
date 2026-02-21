import fs from "fs/promises";
import path from "path";

import { ScopeManager } from "../services/scope-manager.js";
import { logger } from "../utils/logger.js";
import { ERROR_CODES, PACKAGE_ID, VERSION_FILE } from "../../lib/constants.js";

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, onFile) {
  if (!(await exists(dir))) return;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walk(full, onFile);
    } else if (ent.isFile()) {
      await onFile(full);
    }
  }
}

async function checkScope(scope, options) {
  const scopeManager = new ScopeManager({ scope, configDir: options.configDir });
  const targetDir = scopeManager.getTargetDir();
  const prefix = scopeManager.getPathPrefix();

  const label = scope === "global" ? "Глобально" : "Локально";
  logger.heading(`${label} проверка`);
  logger.dim(`Путь: ${prefix}`);

  const versionPath = path.join(targetDir, VERSION_FILE);
  if (!(await exists(versionPath))) {
    logger.warning("Не установлено (нет VERSION файла)");
    return { ok: false, installed: false };
  }

  const requiredDirs = [
    path.join(targetDir, "get-shit-done"),
    path.join(targetDir, "agents"),
  ];

  let ok = true;
  for (const d of requiredDirs) {
    if (!(await exists(d))) {
      ok = false;
      logger.error(`Отсутствует директория: ${path.relative(targetDir, d)}`);
    }
  }

  // Проверка наличия primary-агента (Gsd-agent.md / gsd-agent.md)
  try {
    const agentsDir = path.join(targetDir, "agents");
    const files = await fs.readdir(agentsDir);
    const hasPrimary = files.some((f) => /^gsd-agent\.md$/i.test(f));
    if (!hasPrimary) {
      ok = false;
      logger.error("Не найден primary-агент: ожидается agents/Gsd-agent.md (или gsd-agent.md)");
    }
  } catch {
    ok = false;
    logger.error("Не удалось проверить директорию agents/");
  }

  // Проверка: не осталось плейсхолдера @gsd-agent-opencode/
  const badTokens = [];
  const token = `@${PACKAGE_ID}/`;

  const scanRoots = [
    path.join(targetDir, "get-shit-done"),
    path.join(targetDir, "commands", "gsd"),
    path.join(targetDir, "agents"),
  ];

  for (const root of scanRoots) {
    await walk(root, async (filePath) => {
      if (!filePath.toLowerCase().endsWith(".md")) return;
      const content = await fs.readFile(filePath, "utf-8");
      if (content.includes(token)) {
        badTokens.push(path.relative(targetDir, filePath));
      }
      if (scope === "local" && content.includes("@~/.config/opencode/")) {
        badTokens.push(path.relative(targetDir, filePath) + " (остался @~/.config/opencode/)" );
      }
    });
  }

  if (badTokens.length > 0) {
    ok = false;
    logger.error("Найдены неразрешенные ссылки (path replacement не отработал):");
    for (const p of badTokens.slice(0, 15)) {
      logger.dim(`- ${p}`);
    }
    if (badTokens.length > 15) logger.dim(`... и еще ${badTokens.length - 15}`);
  } else {
    logger.success("Пути в markdown выглядят корректно");
  }

  if (ok) logger.success("ОК");
  return { ok, installed: true };
}

export async function checkCommand(options = {}) {
  const onlyGlobal = Boolean(options.global);
  const onlyLocal = Boolean(options.local);

  if (onlyGlobal && onlyLocal) {
    logger.error("Нельзя указывать одновременно --global и --local");
    return ERROR_CODES.GENERAL_ERROR;
  }

  const results = [];
  if (onlyGlobal) results.push(await checkScope("global", options));
  else if (onlyLocal) results.push(await checkScope("local", options));
  else {
    results.push(await checkScope("global", options));
    results.push(await checkScope("local", options));
  }

  const anyInstalled = results.some((r) => r.installed);
  const allOk = results.filter((r) => r.installed).every((r) => r.ok);

  if (!anyInstalled) return ERROR_CODES.GENERAL_ERROR;
  return allOk ? ERROR_CODES.SUCCESS : ERROR_CODES.GENERAL_ERROR;
}
