<planning_config>

Configuration options for `.planning/` directory behavior and RALF Lite overrides.

<config_schema>
```json
{
  "planning": {
    "commit_docs": true,
    "search_gitignored": false
  },
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

| Option | Default | Description |
|--------|---------|-------------|
| `commit_docs` | `true` | Whether to commit planning artifacts to git |
| `search_gitignored` | `false` | Add `--no-ignore` to broad rg searches |

`ralf_lite` keys are optional project-level overrides. Global defaults are read from `${OPENCODE_CONFIG_DIR:-~/.config/opencode}/get-shit-done/config.json`.
</config_schema>

<commit_docs_behavior>

**When `commit_docs: true` (default):**
- Planning files committed normally
- SUMMARY.md, STATE.md, ROADMAP.md tracked in git
- Full history of planning decisions preserved

**When `commit_docs: false`:**
- Skip all `git add`/`git commit` for `.planning/` files
- User must add `.planning/` to `.gitignore`
- Useful for: OSS contributions, client projects, keeping planning private

**Checking the config:**

```bash
# Check config.json first
COMMIT_DOCS=$(cat .planning/config.json 2>/dev/null | grep -o '"commit_docs"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")

# Auto-detect gitignored (overrides config)
git check-ignore -q .planning 2>/dev/null && COMMIT_DOCS=false
```

**Auto-detection:** If `.planning/` is gitignored, `commit_docs` is automatically `false` regardless of config.json. This prevents git errors when users have `.planning/` in `.gitignore`.

**Conditional git operations:**

```bash
if [ "$COMMIT_DOCS" = "true" ]; then
  git add .planning/STATE.md
  git commit -m "docs: update state"
fi
```

</commit_docs_behavior>

<search_behavior>

**When `search_gitignored: false` (default):**
- Standard rg behavior (respects .gitignore)
- Direct path searches work: `rg "pattern" .planning/` finds files
- Broad searches skip gitignored: `rg "pattern"` skips `.planning/`

**When `search_gitignored: true`:**
- Add `--no-ignore` to broad rg searches that should include `.planning/`
- Only needed when searching entire repo and expecting `.planning/` matches

**Note:** Most GSD operations use direct file reads or explicit paths, which work regardless of gitignore status.

</search_behavior>

<ralf_lite_behavior>

RALF Lite uses a two-layer config merge:

1. Global defaults: `${OPENCODE_CONFIG_DIR:-~/.config/opencode}/get-shit-done/config.json`
2. Project overrides: `.planning/config.json` under `ralf_lite`

Effective config = global defaults + local overrides.

Example project override:

```json
{
  "ralf_lite": {
    "enabled": true,
    "max_iterations": 3,
    "apply_to": {
      "tdd_tasks": false
    }
  }
}
```

Notes:
- No time limit is applied by default.
- `max_iterations` should stay small (recommended: 3).
- RALF Lite applies only to autonomous execution (`auto_tasks`, `autonomous_plans`).

</ralf_lite_behavior>

<setup_uncommitted_mode>

To use uncommitted mode:

1. **Set config:**
   ```json
   "planning": {
     "commit_docs": false,
     "search_gitignored": true
   }
   ```

2. **Add to .gitignore:**
   ```
   .planning/
   ```

3. **Existing tracked files:** If `.planning/` was previously tracked:
   ```bash
   git rm -r --cached .planning/
   git commit -m "chore: stop tracking planning docs"
   ```

</setup_uncommitted_mode>

</planning_config>
