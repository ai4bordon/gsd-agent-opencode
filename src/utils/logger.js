import chalk from "chalk";

let verboseEnabled = false;

export function setVerbose(enabled) {
  verboseEnabled = Boolean(enabled);
}

export const logger = {
  heading(text) {
    process.stdout.write(`\n${chalk.bold(text)}\n`);
  },
  info(text) {
    process.stdout.write(`${text}\n`);
  },
  success(text) {
    process.stdout.write(`${chalk.green("✓")} ${text}\n`);
  },
  warning(text) {
    process.stdout.write(`${chalk.yellow("!")} ${text}\n`);
  },
  error(text) {
    process.stderr.write(`${chalk.red("✗")} ${text}\n`);
  },
  dim(text) {
    process.stdout.write(`${chalk.dim(text)}\n`);
  },
  debug(text) {
    if (!verboseEnabled) return;
    process.stderr.write(`${chalk.dim("[debug]")} ${chalk.dim(text)}\n`);
  },
};
