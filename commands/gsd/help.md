---
name: gsd-help
description: Показать команды GSD и краткий usage guide
subtask: true
---

<objective>
Показать полный справочник команд GSD.

Выводи ТОЛЬКО справочный контент ниже. НЕ добавляй:

- анализ конкретного проекта
- git status или контекст файлов
- предложения следующих шагов
- любые комментарии вне справочника
  </objective>

<reference>
# Справочник команд GSD

**GSD** (Get Shit Done) создает иерархические project plans, оптимизированные для solo agentic development в OpenCode.

## Быстрый старт

1. `/gsd-new-project` — инициализировать проект (включает research, requirements, roadmap)
2. `/gsd-plan-phase 1` — создать детальный plan для первой фазы
3. `/gsd-execute-phase 1` — выполнить фазу

## Обновления

GSD быстро развивается. Периодически проверяй изменения:

```
/gsd-whats-new
```

Показывает, что изменилось с вашей установленной версии. Обновление:

```bash
# Если пакет опубликован в npm:
npx gsd-agent-opencode@latest --global

# Если ставите прямо с GitHub:
npx github:ai4bordon/gsd-agent-opencode --global
```

## Базовый workflow

```
/gsd-new-project → /gsd-plan-phase → /gsd-execute-phase → repeat
```

### Инициализация проекта

**`/gsd-new-project`**
Инициализирует новый проект через единый flow.

Одна команда переводит от идеи к ready-for-planning:
- deep questioning для понимания, что вы строите
- optional domain research (запускает 4 параллельных researcher agents)
- формирование requirements со scope v1/v2/out-of-scope
- создание roadmap с разбивкой на фазы и success criteria

Создает все артефакты `.planning/`:
- `PROJECT.md` — vision и requirements
- `config.json` — workflow mode (interactive/yolo)
- `research/` — domain research (если включен)
- `REQUIREMENTS.md` — scoped requirements с REQ-ID
- `ROADMAP.md` — фазы, сопоставленные с requirements
- `STATE.md` — память проекта

Usage: `/gsd-new-project`

**`/gsd-map-codebase`**
Делает map существующего codebase для brownfield-проектов.

- анализирует codebase через параллельных Explore agents
- создает `.planning/codebase/` с 7 целевыми документами
- покрывает stack, architecture, structure, conventions, testing, integrations, concerns
- использовать перед `/gsd-new-project` на существующем codebase

Usage: `/gsd-map-codebase`

### Планирование фазы

**`/gsd-discuss-phase <number>`**
Помогает сформулировать видение фазы до планирования.

- фиксирует, как вы представляете работу фазы
- создает CONTEXT.md с видением, обязательными требованиями и границами
- использовать, когда есть идеи, как это должно выглядеть/работать

Usage: `/gsd-discuss-phase 2`

**`/gsd-research-phase <number>`**
Глубокий ecosystem research для нишевых/сложных доменов.

- выявляет standard stack, architecture patterns, pitfalls
- создает RESEARCH.md с knowledge уровня “как это строят эксперты”
- применять для 3D, games, audio, shaders, ML и других специализированных доменов
- это больше, чем выбор одной library — это знания по ecosystem

Usage: `/gsd-research-phase 3`

**`/gsd-list-phase-assumptions <number>`**
Показывает, что OpenCode планирует сделать до старта.

- показывает предполагаемый подход OpenCode к фазе
- дает возможность скорректировать курс, если видение понято неверно
- файлы не создаются, только conversational output

Usage: `/gsd-list-phase-assumptions 3`

**`/gsd-plan-phase <number>`**
Создает детальный execution plan для конкретной фазы.

- генерирует `.planning/phases/XX-phase-name/XX-YY-PLAN.md`
- разбивает фазу на конкретные исполнимые задачи
- включает verification criteria и success measures
- поддерживает несколько plans на фазу (XX-01, XX-02 и т.д.)

Usage: `/gsd-plan-phase 1`
Result: создает `.planning/phases/01-foundation/01-01-PLAN.md`

### Выполнение

**`/gsd-execute-phase <phase-number>`**
Выполняет все планы в фазе.

- группирует планы по wave (из frontmatter), waves идут последовательно
- планы внутри wave выполняются параллельно через Task tool
- проверяет phase goal после завершения всех plans
- обновляет REQUIREMENTS.md, ROADMAP.md, STATE.md

Usage: `/gsd-execute-phase 5`

### Quick mode

**`/gsd-quick`**
Выполняет небольшие ad-hoc задачи с гарантиями GSD, но пропускает optional agents.

Quick mode использует ту же систему с коротким путём:
- запускает planner + executor (без researcher, checker, verifier)
- quick-задачи живут в `.planning/quick/` отдельно от фаз
- обновляет tracking в STATE.md (а не ROADMAP.md)

Используйте, когда точно понятно, что делать, и задача маленькая — без отдельного research/verification.

Usage: `/gsd-quick`
Result: создает `.planning/quick/NNN-slug/PLAN.md`, `.planning/quick/NNN-slug/SUMMARY.md`

### Управление roadmap

**`/gsd-add-phase <description>`**
Добавляет новую фазу в конец текущего milestone.

- добавляет запись в ROADMAP.md
- использует следующий последовательный номер
- обновляет структуру phase-директорий

Usage: `/gsd-add-phase "Add admin dashboard"`

**`/gsd-insert-phase <after> <description>`**
Вставляет срочную работу как decimal phase между существующими фазами.

- создает промежуточную фазу (например, 7.1 между 7 и 8)
- полезно для найденной mid-milestone работы
- сохраняет корректный порядок фаз

Usage: `/gsd-insert-phase 7 "Fix critical auth bug"`
Result: создает Phase 7.1

**`/gsd-remove-phase <number>`**
Удаляет будущую фазу и перенумеровывает последующие.

- удаляет phase directory и все ссылки
- перенумеровывает последующие фазы, закрывая “дырку”
- работает только для будущих (не начатых) фаз
- git commit сохраняет исторический след

Usage: `/gsd-remove-phase 17`
Result: Phase 17 удалена, phases 18-20 становятся 17-19

### Управление milestone

**`/gsd-new-milestone <name>`**
Запускает новый milestone через единый flow.

- deep questioning для следующего этапа продукта
- optional domain research (4 параллельных researcher agents)
- формирование requirements со scope
- создание roadmap с разбивкой на фазы

Повторяет flow `/gsd-new-project` для brownfield-проектов (когда уже есть PROJECT.md).

Usage: `/gsd-new-milestone "v2.0 Features"`

**`/gsd-complete-milestone <version>`**
Архивирует завершенный milestone и готовит следующую версию.

- создает запись в MILESTONES.md со статистикой
- архивирует полные детали в директорию milestones/
- создает git tag релиза
- подготавливает workspace к следующей версии

Usage: `/gsd-complete-milestone 1.0.0`

### Отслеживание прогресса

**`/gsd-progress`**
Показывает статус проекта и направляет к следующему шагу.

- показывает progress bar и процент завершения
- суммирует недавнюю работу из SUMMARY-файлов
- показывает текущую позицию и что дальше
- перечисляет ключевые решения и открытые issues
- предлагает выполнить следующий plan или создать его
- определяет 100% завершение milestone

Usage: `/gsd-progress`

### Управление сессией

**`/gsd-resume-work`**
Возобновляет работу из прошлой сессии с полным восстановлением контекста.

- читает STATE.md как project context
- показывает текущую позицию и недавний прогресс
- предлагает дальнейшие действия по текущему состоянию

Usage: `/gsd-resume-work`

**`/gsd-pause-work`**
Создает context handoff при паузе работы в середине фазы.

- создает `.continue-here` с текущим состоянием
- обновляет раздел session continuity в STATE.md
- фиксирует контекст незавершенной работы

Usage: `/gsd-pause-work`

### Debugging

**`/gsd-debug [issue description]`**
Systematic debugging с сохранением состояния между context reset.

- собирает симптомы через adaptive questioning
- создает `.planning/debug/[slug].md` для трекинга расследования
- расследует по scientific method (evidence → hypothesis → test)
- переживает `/new`: запустите `/gsd-debug` без аргументов для продолжения
- архивирует resolved issues в `.planning/debug/resolved/`

Usage: `/gsd-debug "login button doesn't work"`
Usage: `/gsd-debug` (resume active session)

### Управление todo

**`/gsd-add-todo [description]`**
Фиксирует идею или задачу как todo из текущего диалога.

- извлекает контекст из conversation (или использует переданное описание)
- создает структурированный todo-файл в `.planning/todos/pending/`
- определяет area по file paths для группировки
- проверяет дубликаты перед созданием
- обновляет счетчик todo в STATE.md

Usage: `/gsd-add-todo` (берет из conversation)
Usage: `/gsd-add-todo Add auth token refresh`

**`/gsd-check-todos [area]`**
Показывает pending todos и позволяет выбрать задачу в работу.

- выводит список pending todos (title, area, age)
- поддерживает фильтр area (например, `/gsd-check-todos api`)
- загружает полный контекст выбранного todo
- маршрутизирует к следующему действию (сделать сейчас, добавить в фазу, brainstorm)
- переносит todo в done/ при старте выполнения

Usage: `/gsd-check-todos`
Usage: `/gsd-check-todos api`

### User Acceptance Testing

**`/gsd-verify-work [phase]`**
Проверяет реализованные фичи через conversational UAT.

- извлекает testable deliverables из SUMMARY.md
- показывает тесты по одному (ответы yes/no)
- автоматически диагностирует сбои и создает fix plans
- готовит к повторному выполнению при найденных issues

Usage: `/gsd-verify-work 3`

### Milestone audit

**`/gsd-audit-milestone [version]`**
Проводит milestone audit относительно исходного замысла.

- читает все phase VERIFICATION.md
- проверяет coverage требований
- запускает integration checker для cross-phase wiring
- создает MILESTONE-AUDIT.md с gaps и tech debt

Usage: `/gsd-audit-milestone`

**`/gsd-plan-milestone-gaps`**
Создает фазы для закрытия gaps, найденных в audit.

- читает MILESTONE-AUDIT.md и группирует gaps по фазам
- приоритизирует по приоритету требований (must/should/nice)
- добавляет gap-closure фазы в ROADMAP.md
- готовит почву для `/gsd-plan-phase` по новым фазам

Usage: `/gsd-plan-milestone-gaps`

### Конфигурация

**`/gsd-settings`**
Интерактивно настраивает workflow toggles и model profile.

- переключает researcher, plan checker, verifier agents
- выбирает model profile (quality/balanced/budget)
- обновляет `.planning/config.json`

Usage: `/gsd-settings`

**`/gsd-set-profile <profile>`**
Быстро переключает model profile для агентов GSD.

- `quality` — Opus почти везде, кроме verification
- `balanced` — Opus для planning, Sonnet для execution (default)
- `budget` — Sonnet для writing, Haiku для research/verification

Usage: `/gsd-set-profile budget`

### Служебные команды

**`/gsd-help`**
Показывает этот справочник команд.

**`/gsd-whats-new`**
Показывает изменения с вашей установленной версии.

- сравнивает установленную и последнюю версии
- показывает changelog entries для пропущенных версий
- подсвечивает breaking changes
- дает инструкции по обновлению, если вы отстали

Usage: `/gsd-whats-new`

**`/gsd-update`**
Обновляет GSD до последней версии с предпросмотром changelog.

- показывает изменения до обновления
- запрашивает подтверждение перед install
- удобнее, чем raw `npx gsd-agent-opencode`

Usage: `/gsd-update`

## Файлы и структура

```
.planning/
├── PROJECT.md            # Видение проекта
├── ROADMAP.md            # Текущая разбивка по фазам
├── STATE.md              # Память и контекст проекта
├── config.json           # Workflow mode и gates
├── todos/                # Зафиксированные идеи и задачи
│   ├── pending/          # Todo в ожидании выполнения
│   └── done/             # Завершенные todo
├── debug/                # Активные debug sessions
│   └── resolved/         # Архив resolved issues
├── codebase/             # Codebase map (brownfield)
│   ├── STACK.md          # Языки, frameworks, dependencies
│   ├── ARCHITECTURE.md   # Patterns, layers, data flow
│   ├── STRUCTURE.md      # Layout директорий, ключевые файлы
│   ├── CONVENTIONS.md    # Coding standards, naming
│   ├── TESTING.md        # Test setup и patterns
│   ├── INTEGRATIONS.md   # Внешние сервисы и API
│   └── CONCERNS.md       # Tech debt и известные проблемы
└── phases/
    ├── 01-foundation/
    │   ├── 01-01-PLAN.md
    │   └── 01-01-SUMMARY.md
    └── 02-core-features/
        ├── 02-01-PLAN.md
        └── 02-01-SUMMARY.md
```

## Workflow modes

Задаются в `/gsd-new-project`:

**Interactive mode**

- подтверждает каждое ключевое решение
- останавливается на checkpoints для одобрения
- дает больше пошаговых подсказок

**YOLO mode**

- авто-одобряет большинство решений
- выполняет планы без промежуточного подтверждения
- останавливается только на критических checkpoints

Режим можно изменить в любой момент через `.planning/config.json`.

## Конфигурация planning

Настройка управления planning-артефактами в `.planning/config.json`:

**`planning.commit_docs`** (default: `true`)
- `true`: planning-артефакты коммитятся в git (стандартный workflow)
- `false`: planning-артефакты остаются локальными и не коммитятся

Когда `commit_docs: false`:
- добавьте `.planning/` в `.gitignore`
- полезно для OSS contributions, клиентских проектов и приватного planning
- все planning-файлы продолжают работать штатно, просто не трекаются в git

**`planning.search_gitignored`** (default: `false`)
- `true`: добавляет `--no-ignore` к широким ripgrep-поискам
- нужно только если `.planning/` в gitignore, но вы хотите включать его в глобальные поиски

Пример конфигурации:
```json
{
  "planning": {
    "commit_docs": false,
    "search_gitignored": true
  }
}
```

## Конфигурация RALF Lite

RALF Lite управляет bounded retry loops при autonomous execution.

Уровни конфигурации:
- global defaults: `${OPENCODE_CONFIG_DIR:-~/.config/opencode}/get-shit-done/config.json`
- project override: `.planning/config.json` в секции `ralf_lite`

Поведение по default:
- enabled: `true`
- max_iterations: `3`
- error_fingerprint_repeats: `2`
- no_progress_repeats: `2`
- apply_to.auto_tasks: `true`
- apply_to.autonomous_plans: `true`
- apply_to.tdd_tasks: `false`

Пример project override:
```json
{
  "ralf_lite": {
    "max_iterations": 3,
    "apply_to": {
      "tdd_tasks": false
    }
  }
}
```

## Частые workflow-сценарии

**Старт нового проекта:**

```
/gsd-new-project        # Единый flow: questioning → research → requirements → roadmap
/new
/gsd-plan-phase 1       # Создать plans для первой фазы
/new
/gsd-execute-phase 1    # Выполнить все plans фазы
```

**Возобновление после паузы:**

```
/gsd-progress  # Посмотреть, где остановились, и продолжить
```

**Добавление срочной mid-milestone работы:**

```
/gsd-insert-phase 5 "Critical security fix"
/gsd-plan-phase 5.1
/gsd-execute-phase 5.1
```

**Завершение milestone:**

```
/gsd-complete-milestone 1.0.0
/new
/gsd-new-milestone  # Старт следующего milestone (questioning → research → requirements → roadmap)
```

**Фиксация идей во время работы:**

```
/gsd-add-todo                    # Захват из контекста диалога
/gsd-add-todo Fix modal z-index  # Захват с явным описанием
/gsd-check-todos                 # Просмотр и выполнение todo
/gsd-check-todos api             # Фильтр по area
```

**Debugging issue:**

```
/gsd-debug "form submission fails silently"  # Старт debug session
# ... идет расследование, контекст заполняется ...
/new
/gsd-debug                                    # Продолжить с места остановки
```

## Где смотреть помощь

- read `.planning/PROJECT.md` для vision проекта
- read `.planning/STATE.md` для текущего контекста
- проверь `.planning/ROADMAP.md` для статуса фаз
- запусти `/gsd-progress`, чтобы понять текущую точку и следующий шаг
  </reference>
