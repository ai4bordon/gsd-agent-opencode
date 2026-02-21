# RALF Lite Execution Loops

RALF Lite is a bounded retry-and-repair loop used only where outcomes are objectively verifiable.

## Scope

- `execute-plan`: `task type="auto"` only
- `execute-phase`: `autonomous: true` plans only
- never bypass `checkpoint:*`
- never bypass Rule 4 architectural decisions

## Configuration Model

RALF Lite reads settings from two layers:

1. **Global defaults** (source of truth)
   - Path: `${OPENCODE_CONFIG_DIR:-~/.config/opencode}/get-shit-done/config.json`
2. **Project overrides** (optional)
   - Path: `.planning/config.json`
   - Key: `ralf_lite`

Effective config = global defaults + project overrides.

## Default Settings

```json
{
  "ralf_lite": {
    "enabled": true,
    "max_iterations": 3,
    "error_fingerprint_repeats": 2,
    "no_progress_repeats": 2,
    "apply_to": {
      "auto_tasks": true,
      "autonomous_plans": true,
      "tdd_tasks": false
    }
  }
}
```

## Stop Conditions

Success stop:
- task/plan verification is green
- done criteria are satisfied

Failure stop:
- max iterations reached
- same error fingerprint repeats `error_fingerprint_repeats`
- no progress repeats `no_progress_repeats`

No time-based stop is used by default.

## Error Fingerprint

Use the first stable failure signature from verification output:
- first non-empty error line
- normalize dynamic values (ids, timestamps, line numbers) where practical
- compare normalized signature across iterations

If signature repeats without meaningful state change, stop and hand off.

## Progress Signal

Count as progress when one of these changed vs previous iteration:
- a previously failing check now passes
- error fingerprint changed to a different, downstream error
- code diff for the task/plan changed with a plausible fix direction

If none of the above changed, treat as no-progress iteration.

## Handoff on Exhaustion

When loop exhausts, stop and return a structured checkpoint with:
- iteration count
- fingerprints per iteration
- what was already auto-fixed
- recommended next action (decision or manual investigation)

## Reporting

Every completed plan summary should include `## RALF Lite Loop Report`:
- enabled/disabled
- effective config
- iterations used per auto task and per autonomous plan
- stop reason (`success`, `max_iterations`, `repeated_fingerprint`, `no_progress`)
