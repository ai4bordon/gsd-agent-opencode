# gsd-agent-opencode

[README на английском](README.md)

## Происхождение проекта и благодарности

Этот проект основан на:
- **Get Shit Done (GSD)** от TACHES: https://github.com/glittercowboy/get-shit-done
- **Адаптации под OpenCode (`gsd-opencode`)** от Roman и контрибьюторов: https://github.com/rokicool/gsd-opencode

В этом контексте выражаю искреннюю благодарность:
- автору GSD за действительно практичную и эффективную агентную систему;
- автору и контрибьюторам `gsd-opencode` за адаптацию системы под отличную экосистему OpenCode.

`gsd-agent-opencode` — это профессиональная OpenCode-first система агентной разработки с дисциплиной `command-first`: от идеи до валидации через повторяемый конвейер `context -> plan -> execute -> verify`.

Проект предоставляет:
- slash-команды `/gsd-*` для управляемого процесса разработки;
- специализированных агентов (`planner`, `executor`, `verifier`, `debugger` и т.д.);
- workflow/reference шаблоны для стабильного выполнения без дрейфа контекста.

## Что такое GSD (исходная система)

**Get Shit Done (GSD)** — это исходная агентная система автора TACHES https://github.com/glittercowboy/get-shit-done для context engineering и spec-driven разработки: не «просто чат с ИИ», а управляемый производственный контур от идеи до проверенного результата.

GSD решает ключевую проблему длинных AI-сессий: **`context rot`** (когда по мере роста контекста деградируют качество решений и точность исполнения).

### Что GSD дает на практике

- **Повторяемый delivery-цикл:** понятный маршрут `new-project -> discuss -> plan -> execute -> verify`.
- **Структурированная память проекта:** артефакты (`PROJECT`, `REQUIREMENTS`, `ROADMAP`, `STATE`, `PLAN`, `SUMMARY`) позволяют продолжать работу между сессиями без потери контекста.
- **Разделение ролей через сабагентов:** planner/executor/verifier/debugger выполняют профильные задачи вместо попытки решить всё в одном окне.
- **Качество через проверки, а не обещания:** планы верифицируются до выполнения, а результат сверяется с целями после выполнения.
- **Трассируемость изменений:** атомарные шаги и прозрачная последовательность работ упрощают откат, аудит и сопровождение.

### Чем GSD отличается от многих других AI-workflow систем

- **Меньше процессного «театра»:** в исходном позиционировании GSD акцент на практической доставке фич, а не на перегруженных церемониях.
- **Не только генерация кода:** GSD покрывает полный контур (контекст, требования, планирование, выполнение, верификация), а не сценарий «сгенерируй один файл».
- **Операционная дисциплина вместо ad-hoc чата:** система ведет по шагам и хранит состояние, снижая случайные развороты процесса.
- **Сильный упор на воспроизводимость:** один и тот же pipeline можно повторять по фазам и milestone с сопоставимым качеством.

### Ключевые преимущества перед ad-hoc подходом

- **Меньше регрессий и состояния «почти готово»:** благодаря обязательным этапам верификации и gap-циклам.
- **Быстрее возврат в проект после пауз:** состояние уже сохранено в `.planning/`.
- **Лучше масштабируется на длинные задачи:** за счет декомпозиции и распределения по сабагентам.
- **Выше управляемость качества:** явные артефакты, критерии done и поэтапное движение.

Оригинальный репозиторий GSD: https://github.com/glittercowboy/get-shit-done

## Отличия этой версии

- OpenCode-first реализация GSD с фокусом на стабильный командный pipeline в OpenCode.
- Добавлен primary-оркестратор `Gsd-agent`, который маршрутизирует весь жизненный цикл и поддерживает дисциплину `Next command`.
- Введена строгая политика продолжения: ответы вроде `ok/continue/давай` исполняют pending-команду.
- Усилен анти-дрейф контроль через приоритет команд: `explicit > pending > autonomy`.
- Интегрирован RALF Lite для ограниченных retry-петель с явными условиями остановки.

<table>
  <thead>
    <tr>
      <th>Область</th>
      <th>Upstream Get Shit Done</th>
      <th>Этот репозиторий</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Фокус дистрибуции</td>
      <td>Универсальная мульти-рантайм система (Claude/OpenCode/Gemini)</td>
      <td>OpenCode-first дистрибуция и UX под OpenCode</td>
    </tr>
    <tr>
      <td>Главный оркестратор</td>
      <td>Общая оркестрация через команды и workflow</td>
      <td>Явный primary-агент <code>Gsd-agent</code> как диспетчер полного цикла</td>
    </tr>
    <tr>
      <td>Политика продолжения</td>
      <td>Стандартный переход между командами</td>
      <td>Жесткая дисциплина <code>pending command</code>: <code>ok/continue/давай</code> буквально исполняет последний <code>Next command</code></td>
    </tr>
    <tr>
      <td>Маршрутизация изменений</td>
      <td>Общие workflow-правила</td>
      <td>Primary-агент принудительно маршрутизирует repo-changing действия через команды <code>/gsd-*</code> и сабагентов</td>
    </tr>
    <tr>
      <td>Анти-дрейф контроль</td>
      <td>Контекстная дисциплина GSD</td>
      <td>Дополнительная политика приоритета команд (<code>explicit &gt; pending &gt; autonomy</code>) снижает «срыв в свободный чат»</td>
    </tr>
    <tr>
      <td>Петли автопочинки</td>
      <td>Базовые циклы verify/fix</td>
      <td>Явная интеграция RALF Lite (ограниченные retry-петли с условиями остановки)</td>
    </tr>
  </tbody>
</table>

По сравнению с upstream-системой эта версия делает поведение в OpenCode более детерминированным и операционно устойчивым именно для итеративной схемы «довести проект до готового результата».

## Что внутри

<table>
  <thead>
    <tr>
      <th>Слой</th>
      <th>Назначение</th>
      <th>Путь</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Slash-команды</td>
      <td>Точки входа, маршрутизация этапов, запуск сабагентов</td>
      <td><code>commands/gsd/</code></td>
    </tr>
    <tr>
      <td>Агенты</td>
      <td>Специализированные роли pipeline</td>
      <td><code>agents/</code></td>
    </tr>
    <tr>
      <td>Workflow-правила</td>
      <td>Протоколы выполнения, верификации, resume и debug</td>
      <td><code>get-shit-done/workflows/</code></td>
    </tr>
    <tr>
      <td>References</td>
      <td>Политики checkpoint, RALF Lite, профили моделей, config</td>
      <td><code>get-shit-done/references/</code></td>
    </tr>
    <tr>
      <td>Состояние проекта</td>
      <td>Источник истины между сессиями</td>
      <td><code>.planning/</code></td>
    </tr>
  </tbody>
</table>

## Основной pipeline

Для фазы `N`:

1. `/gsd-discuss-phase N` — уточнить решения и снять неоднозначность.
2. `/gsd-plan-phase N` — исследование (опционально), генерация плана, проверка плана.
3. `/gsd-execute-phase N` — выполнить план по задачам/волнам.
4. `/gsd-verify-work N` — UAT и закрытие пробелов через gap-loop.

Если непонятно, что делать дальше: `/gsd-progress`.

## Ключевые команды

### Старт и основной поток

- `/gsd-new-project` — инициализация: контекст, требования, roadmap.
- `/gsd-map-codebase` — анализ существующего проекта перед новым milestone/roadmap.
- `/gsd-discuss-phase N` — фиксация продуктовых/технических решений по фазе.
- `/gsd-plan-phase N` — создание исполнимого `*-PLAN.md` с проверкой качества плана.
- `/gsd-execute-phase N` — выполнение задач с checkpoint-протоколом.
- `/gsd-verify-work N` — UAT, верификация и запуск gap-плана при необходимости.

### Управление процессом

- `/gsd-progress` — текущий статус и рекомендуемая следующая команда.
- `/gsd-pause-work`, `/gsd-resume-work` — корректная пауза/продолжение.
- `/gsd-audit-milestone`, `/gsd-complete-milestone <version>` — аудит и закрытие milestone.
- `/gsd-add-phase`, `/gsd-insert-phase`, `/gsd-remove-phase` — изменение фаз roadmap.

### Операционные команды

- `/gsd-debug` — структурированная диагностика дефектов.
- `/gsd-quick` — быстрый режим для небольших задач.
- `/gsd-research-phase` — targeted research до/во время планирования.
- `/gsd-settings`, `/gsd-set-profile`, `/gsd-set-model` — управление профилями и моделями.
- `/gsd-help`, `/gsd-whats-new`, `/gsd-update` — справка и обновления.

## Артефакты в `.planning/`

Базовые файлы состояния:
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`

Артефакты фазы:
- `*-PLAN.md`
- `*-SUMMARY.md`
- `*-VERIFICATION.md`
- `*-UAT.md`

## Требования

- Node.js `>= 18`
- OpenCode, который загружает slash-команды из `commands/`

## Установка

Поддерживаются 2 scope:
- `--global` -> `${OPENCODE_CONFIG_DIR:-~/.config/opencode}`
- `--local` -> `./.opencode` в текущем проекте

### Вариант A (рекомендуется): установить CLI из GitHub

```bash
npm i -g github:ai4bordon/gsd-agent-opencode
gsd-agent-opencode install --global
```

Локальная установка в проект:

```bash
gsd-agent-opencode install --local
```

### Вариант B: запустить установщик напрямую из репозитория

```bash
node bin/gsd.js install --global
node bin/gsd.js install --local
```

### Вариант C: one-shot через `npx`

```bash
npx github:ai4bordon/gsd-agent-opencode --global
npx github:ai4bordon/gsd-agent-opencode --local
```

## Проверка, обновление, удаление

```bash
gsd-agent-opencode list
gsd-agent-opencode check
gsd-agent-opencode update --global
gsd-agent-opencode uninstall --global
```

Полезно:
- dry-run удаления: `gsd-agent-opencode uninstall --global --dry-run`
- кастомный глобальный путь: `gsd-agent-opencode install --global --config-dir <path>`

## Быстрый старт в проекте

1. Перезапустите OpenCode после установки.
2. Для существующего проекта: `/gsd-map-codebase`, затем `/gsd-new-project`.
3. Для нового проекта: сразу `/gsd-new-project`.
4. Работайте по фазам через `/gsd-plan-phase` -> `/gsd-execute-phase` -> `/gsd-verify-work`.

## Документация

- Полный гайд (RU): [docs/GSD_AgentSystemGuide.html](docs/GSD_AgentSystemGuide.html)
- Full guide (EN): [docs/GSD_AgentSystemGuide_EN.html](docs/GSD_AgentSystemGuide_EN.html)

## Благодарности

- Исходная система **Get Shit Done**: https://github.com/glittercowboy/get-shit-done
- OpenCode-адаптация, на которую опирается проект: https://github.com/rokicool/gsd-opencode

## Лицензия

MIT, см. `LICENSE`.
