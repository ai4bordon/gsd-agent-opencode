# gsd-agent-opencode

[README in Russian](README_RU.md)

## Project Lineage and Thanks

This project is based on:
- **Get Shit Done (GSD)** by TACHES: https://github.com/glittercowboy/get-shit-done
- **OpenCode adaptation (`gsd-opencode`)** by Roman and contributors: https://github.com/rokicool/gsd-opencode

In this context, we express sincere gratitude:
- to the author of GSD for a truly practical and effective agentic delivery system;
- to the author and contributors of `gsd-opencode` for adapting the system to the excellent OpenCode ecosystem.

`gsd-agent-opencode` is a professional OpenCode-first agentic development system with `command-first` discipline: from idea to validation through a repeatable `context -> plan -> execute -> verify` pipeline.

This project provides:
- `/gsd-*` slash commands for a controlled development workflow;
- specialized agents (`planner`, `executor`, `verifier`, `debugger`, etc.);
- workflow/reference templates for stable execution without context drift.


## What GSD is (upstream system)

**Get Shit Done (GSD)** is the original agent system by TACHES https://github.com/glittercowboy/get-shit-done for context engineering and spec-driven development: not "just chatting with AI," but a managed production loop from idea to validated result.

GSD addresses a key long-session AI problem: **`context rot`** (as context grows, solution quality and execution precision degrade).

### What GSD provides in practice

- **Repeatable delivery cycle:** the same clear route `new-project -> discuss -> plan -> execute -> verify`.
- **Structured project memory:** artifacts (`PROJECT`, `REQUIREMENTS`, `ROADMAP`, `STATE`, `PLAN`, `SUMMARY`) let you continue work across sessions without losing context.
- **Role separation through subagents:** planner/executor/verifier/debugger handle specialized work instead of trying to do everything in one window.
- **Quality through checks, not promises:** plans are verified before execution, and outcomes are checked against goals after execution.
- **Change traceability:** atomic steps and a clear work sequence simplify rollback, audit, and maintenance.

### How GSD differs from many other AI workflow systems

- **Less process theater:** in the original positioning, GSD emphasizes practical feature delivery over overloaded ceremonies.
- **Not only code generation:** GSD covers the full loop (context, requirements, planning, execution, verification), not just a single "generate a file" scenario.
- **Operational discipline instead of ad-hoc chat:** the system guides steps and preserves state, reducing random process detours.
- **Strong focus on reproducibility:** the same pipeline can be repeated by phases and milestones with comparable quality.

### Key advantages over an ad-hoc approach

- **Fewer regressions and "almost done" outcomes:** thanks to mandatory verification stages and gap loops.
- **Faster return to project work after pauses:** state is already captured in `.planning/`.
- **Scales better for long tasks:** through decomposition and distribution across subagents.
- **Higher quality controllability:** explicit artifacts, done criteria, and staged progression.

Original GSD repository: https://github.com/glittercowboy/get-shit-done

## Differences in this version

- OpenCode-first GSD implementation focused on a stable command pipeline in OpenCode.
- Added primary orchestrator `Gsd-agent`, which dispatches the full lifecycle and enforces `Next command` discipline.
- Introduced strict continuation policy: replies like `ok/continue/let's go` execute the pending command.
- Strengthened anti-drift control via command priority: `explicit > pending > autonomy`.
- Integrated RALF Lite for bounded retry loops with clear stop conditions.


<table>
  <thead>
    <tr>
      <th>Area</th>
      <th>Upstream Get Shit Done</th>
      <th>This repository</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Distribution focus</td>
      <td>Universal multi-runtime system (Claude/OpenCode/Gemini)</td>
      <td>OpenCode-first distribution and UX for OpenCode</td>
    </tr>
    <tr>
      <td>Main orchestrator</td>
      <td>General orchestration via commands and workflow</td>
      <td>Explicit primary agent <code>Gsd-agent</code> as dispatcher of the full cycle</td>
    </tr>
    <tr>
      <td>Continuation policy</td>
      <td>Standard transition between commands</td>
      <td>Strict <code>pending command</code> discipline: <code>ok/continue/let's go</code> executes the last <code>Next command</code> literally</td>
    </tr>
    <tr>
      <td>Change routing</td>
      <td>General workflow rules</td>
      <td>Primary agent force-routes repo-changing actions through <code>/gsd-*</code> commands and subagents</td>
    </tr>
    <tr>
      <td>Anti-drift control</td>
      <td>GSD context discipline</td>
      <td>Additional command priority policy (<code>explicit &gt; pending &gt; autonomy</code>) to reduce "free-chat derailment"</td>
    </tr>
    <tr>
      <td>Auto-repair loops</td>
      <td>Base verify/fix loops</td>
      <td>Explicit RALF Lite integration (bounded retry loops with stop conditions)</td>
    </tr>
  </tbody>
</table>

ы
Compared to the upstream system, this version makes OpenCode behavior more deterministic and operationally robust specifically for iterative "drive project to done" workflows.

## What's inside

<table>
  <thead>
    <tr>
      <th>Layer</th>
      <th>Purpose</th>
      <th>Path</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Slash commands</td>
      <td>Entry points, stage routing, subagent launches</td>
      <td><code>commands/gsd/</code></td>
    </tr>
    <tr>
      <td>Agents</td>
      <td>Specialized pipeline roles</td>
      <td><code>agents/</code></td>
    </tr>
    <tr>
      <td>Workflow rules</td>
      <td>Execution, verification, resume, debug protocols</td>
      <td><code>get-shit-done/workflows/</code></td>
    </tr>
    <tr>
      <td>References</td>
      <td>Checkpoint policies, RALF Lite, model profiles, config</td>
      <td><code>get-shit-done/references/</code></td>
    </tr>
    <tr>
      <td>Project state</td>
      <td>Source of truth across sessions</td>
      <td><code>.planning/</code></td>
    </tr>
  </tbody>
</table>

## Core pipeline

For phase `N`:

1. `/gsd-discuss-phase N` - clarify decisions and remove ambiguity.
2. `/gsd-plan-phase N` - research (optional), generate plan, validate plan.
3. `/gsd-execute-phase N` - execute the plan by tasks/waves.
4. `/gsd-verify-work N` - UAT and gap closure via gap loop.

If it is unclear what to do next: `/gsd-progress`.

## Key commands

### Start and main flow

- `/gsd-new-project` - initialization: context, requirements, roadmap.
- `/gsd-map-codebase` - analyze an existing project before a new milestone/roadmap.
- `/gsd-discuss-phase N` - lock product/technical decisions for the phase.
- `/gsd-plan-phase N` - create executable `*-PLAN.md` with plan quality checks.
- `/gsd-execute-phase N` - execute tasks with checkpoint protocol.
- `/gsd-verify-work N` - UAT, verification, and gap-plan launch if needed.

### Process management

- `/gsd-progress` - current status and recommended next command.
- `/gsd-pause-work`, `/gsd-resume-work` - proper pause/resume.
- `/gsd-audit-milestone`, `/gsd-complete-milestone <version>` - milestone audit and closure.
- `/gsd-add-phase`, `/gsd-insert-phase`, `/gsd-remove-phase` - roadmap phase changes.

### Operational commands

- `/gsd-debug` - structured defect analysis.
- `/gsd-quick` - fast mode for smaller tasks.
- `/gsd-research-phase` - targeted research before/during planning.
- `/gsd-settings`, `/gsd-set-profile`, `/gsd-set-model` - profile and model management.
- `/gsd-help`, `/gsd-whats-new`, `/gsd-update` - help and updates.

## Artifacts in `.planning/`

Base state files:
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`

Phase artifacts:
- `*-PLAN.md`
- `*-SUMMARY.md`
- `*-VERIFICATION.md`
- `*-UAT.md`

## Requirements

- Node.js `>= 18`
- OpenCode that loads slash commands from `commands/`

## Installation

2 scopes are supported:
- `--global` -> `${OPENCODE_CONFIG_DIR:-~/.config/opencode}`
- `--local` -> `./.opencode` in the current project

### Option A (recommended): install CLI from GitHub

```bash
npm i -g github:ai4bordon/gsd-agent-opencode
gsd-agent-opencode install --global
```

Local project install:

```bash
gsd-agent-opencode install --local
```

### Option B: run installer directly from repository

```bash
node bin/gsd.js install --global
node bin/gsd.js install --local
```

### Option C: one-shot via `npx`

```bash
npx github:ai4bordon/gsd-agent-opencode --global
npx github:ai4bordon/gsd-agent-opencode --local
```

## Check, update, uninstall

```bash
gsd-agent-opencode list
gsd-agent-opencode check
gsd-agent-opencode update --global
gsd-agent-opencode uninstall --global
```

Useful:
- uninstall dry-run: `gsd-agent-opencode uninstall --global --dry-run`
- custom global path: `gsd-agent-opencode install --global --config-dir <path>`

## Quick start in a project

1. Restart OpenCode after installation.
2. For an existing project: `/gsd-map-codebase`, then `/gsd-new-project`.
3. For a new project: start directly with `/gsd-new-project`.
4. Work by phases via `/gsd-plan-phase` -> `/gsd-execute-phase` -> `/gsd-verify-work`.

## Documentation

- Full guide (RU): [Open in browser](https://raw.githack.com/ai4bordon/gsd-agent-opencode/main/docs/GSD_AgentSystemGuide.html)
- Full guide (EN): [Open in browser](https://raw.githack.com/ai4bordon/gsd-agent-opencode/main/docs/GSD_AgentSystemGuide_EN.html)

## Acknowledgements

- Upstream **Get Shit Done** system: https://github.com/glittercowboy/get-shit-done
- OpenCode adaptation this project builds on: https://github.com/rokicool/gsd-opencode

## License

MIT, see `LICENSE`.
