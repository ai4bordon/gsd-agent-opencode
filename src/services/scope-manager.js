import os from "os";
import path from "path";

import { DEFAULT_CONFIG_DIR, LOCAL_CONFIG_DIR } from "../../lib/constants.js";
import { expandPath, validatePath } from "../utils/path-resolver.js";

export class ScopeManager {
  constructor({ scope, configDir } = {}) {
    if (!scope || !["global", "local"].includes(scope)) {
      throw new Error('scope должен быть "global" или "local"');
    }
    this.scope = scope;

    const explicitConfigDir = configDir;
    const envConfigDir = process.env.OPENCODE_CONFIG_DIR;
    const defaultGlobalDir = path.join(os.homedir(), DEFAULT_CONFIG_DIR);

    this._isCustomConfig = Boolean(explicitConfigDir || envConfigDir);

    if (explicitConfigDir) {
      const expanded = expandPath(explicitConfigDir);
      const abs = path.isAbsolute(expanded) ? expanded : path.resolve(process.cwd(), expanded);
      // Разрешаем абсолютные пути (без ограничения baseDir), но нормализуем
      this.globalDir = validatePath(abs, path.parse(abs).root);
    } else if (envConfigDir) {
      // env может быть относительным к homedir или абсолютным
      const expanded = expandPath(envConfigDir);
      this.globalDir = path.isAbsolute(expanded) ? expanded : path.join(os.homedir(), expanded);
    } else {
      this.globalDir = defaultGlobalDir;
    }

    this.localDir = path.join(process.cwd(), LOCAL_CONFIG_DIR);
  }

  getTargetDir() {
    return this.scope === "global" ? this.globalDir : this.localDir;
  }

  getPathPrefix() {
    if (this.scope === "local") return "./.opencode";

    const home = os.homedir();
    const target = this.getTargetDir();

    // Если использован кастомный каталог (флаг или env) — не используем ~ shorthand.
    // Это уменьшает шанс проблем с расширением ~ в нестандартных окружениях.
    if (this._isCustomConfig) {
      return target.replace(/\\/g, "/");
    }

    if (target.startsWith(home)) {
      return "~" + target.slice(home.length).replace(/\\/g, "/");
    }
    return target.replace(/\\/g, "/");
  }
}
