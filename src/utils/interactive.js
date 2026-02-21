import { select, confirm, input } from "@inquirer/prompts";

export async function promptInstallScope() {
  return select({
    message: "Куда установить gsd-agent-opencode?",
    choices: [
      {
        name: "Глобально (OPENCODE_CONFIG_DIR / ~/.config/opencode)",
        value: "global",
      },
      {
        name: "Локально (./.opencode в текущем проекте)",
        value: "local",
      },
    ],
  });
}

export async function promptConfirmDanger(message) {
  return confirm({
    message,
    default: false,
  });
}

export async function promptTypeYes(message) {
  const value = await input({
    message,
    default: "no",
  });
  return value.trim().toLowerCase() === "yes";
}
