import { logger } from "../utils/logger.js";
import { installCommand } from "./install.js";

/**
 * Обновление = переустановка из текущего пакета.
 *
 * Если пользователь запустил update через npx github:..., значит источник уже «последний коммит».
 * Если пакет установлен через npm - это «обновление до установленной версии пакета».
 */
export async function updateCommand(options = {}) {
  logger.heading("Обновление");
  logger.dim("Обновление выполняется как безопасная переустановка.");
  return installCommand({ ...options, force: Boolean(options.force) });
}
