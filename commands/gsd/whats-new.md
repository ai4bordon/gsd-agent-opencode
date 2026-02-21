---
name: gsd-whats-new
description: Показать, что нового в GSD с вашей установленной версии
subtask: true
---

<objective>
Display changes between installed version and latest available version.

Shows version comparison, changelog entries for missed versions, and update instructions.
</objective>

<process>

<step name="get_installed_version">
read installed version from VERSION file (local install has priority):

```bash
GLOBAL_OPENCODE_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"

if [ -f ./.opencode/get-shit-done/VERSION ]; then
  cat ./.opencode/get-shit-done/VERSION 2>/dev/null
else
  cat "$GLOBAL_OPENCODE_DIR/get-shit-done/VERSION" 2>/dev/null
fi
```

**If VERSION file missing:**
```
## GSD What's New

**Installed version:** Unknown

Your installation doesn't include version tracking.

**To fix:** `npx gsd-agent-opencode --global`

This will reinstall with version tracking enabled.
```

STOP here if no VERSION file.
</step>

<step name="fetch_remote_changelog">
Fetch latest CHANGELOG.md from GitHub:

Use webfetch tool with:
- URL: `https://raw.githubusercontent.com/ai4bordon/gsd-agent-opencode/main/CHANGELOG.md`
- Prompt: "Extract all version entries with their dates and changes. Return in Keep-a-Changelog format."

**If fetch fails:**
Fall back to local changelog:
```bash
GLOBAL_OPENCODE_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"

if [ -f ./.opencode/get-shit-done/CHANGELOG.md ]; then
  cat ./.opencode/get-shit-done/CHANGELOG.md 2>/dev/null
else
  cat "$GLOBAL_OPENCODE_DIR/get-shit-done/CHANGELOG.md" 2>/dev/null
fi
```

Note to user: "Couldn't check for updates (offline or GitHub unavailable). Showing local changelog."
</step>

<step name="parse_versions">
From the remote (or local) changelog:

1. **Extract latest version** - First `## [X.Y.Z]` line after `## [Unreleased]`
2. **Compare with installed** - From VERSION file
3. **Extract entries between** - All version sections from latest down to (but not including) installed

**Version comparison:**
- If installed == latest: "You're on the latest version"
- If installed < latest: Show changes since installed version
- If installed > latest: "You're ahead of latest release (development version?)"
</step>

<step name="display_output">
Format output clearly:

**If up to date:**
```
## GSD What's New

**Installed:** 1.4.26
**Latest:** 1.4.26

You're on the latest version.

[View full changelog](https://github.com/ai4bordon/gsd-agent-opencode/blob/main/CHANGELOG.md)
```

**If updates available:**
```
## GSD What's New

**Installed:** 1.4.23
**Latest:** 1.4.26

---

### Changes since your version:

## [1.4.26] - 2026-01-20

### Added
- Feature X
- Feature Y

### Changed
- **BREAKING:** Changed Z behavior

## [1.4.25] - 2026-01-18

### Fixed
- Bug in feature A

---

[View full changelog](https://github.com/ai4bordon/gsd-agent-opencode/blob/main/CHANGELOG.md)

**To update:** `npx gsd-agent-opencode --global`
```

**Breaking changes:** Surface prominently with **BREAKING:** prefix in the output.
</step>

</process>

<success_criteria>
- [ ] Installed version read from VERSION file
- [ ] Remote changelog fetched (or graceful fallback to local)
- [ ] Version comparison displayed clearly
- [ ] Changes since installed version shown (if any)
- [ ] Update instructions provided when behind
</success_criteria>
