import os from "os";
import path from "path";

/**
 * Раскрывает `~` и нормализует путь.
 */
export function expandPath(inputPath) {
  if (!inputPath) return inputPath;
  if (inputPath.startsWith("~/") || inputPath.startsWith("~\\")) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}

/**
 * Защита от path traversal. Возвращает абсолютный нормализованный путь.
 *
 * baseDir:
 * - для global: обычно "/" (разрешить абсолютные пути)
 * - для local: process.cwd() (запретить выход наружу)
 */
export function validatePath(targetPath, baseDir) {
  const expanded = expandPath(targetPath);
  const resolved = path.resolve(expanded);

  if (!baseDir) return resolved;
  const baseResolved = path.resolve(expandPath(baseDir));

  // На Windows сравнение должно быть case-insensitive
  const isWin = process.platform === "win32";
  const resolvedCmp = isWin ? resolved.toLowerCase() : resolved;
  const baseCmp = isWin ? baseResolved.toLowerCase() : baseResolved;

  if (baseCmp === path.parse(baseCmp).root.toLowerCase?.() || baseCmp === path.parse(baseCmp).root) {
    // baseDir == root -> разрешаем всё абсолютное
    return resolved;
  }

  const rel = path.relative(baseResolved, resolved);
  const relCmp = isWin ? rel.toLowerCase() : rel;

  if (relCmp.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Попытка выйти за пределы разрешенной директории: ${targetPath}`);
  }

  return resolved;
}
