# project-context

Собирает структуру проекта и содержимое файлов в Markdown для формирования контекстных подсказок (prompts) при работе с LLM.

[Repository](https://github.com/zarly/project-context)

Описание

projectContext рекурсивно обходит директорию и собирает файлы, формируя удобный Markdown-репрезентатив проекта — с путями и содержимым файлов. Это полезно, если нужно передать кодовую базу в LLM как читаемый контекст.

Ключевые особенности

- Рекурсивный обход директории.
- Формирование Markdown с заголовком (название проекта) и секциями для каждого файла, например:

  ## src/index.ts

  ```
  // содержимое файла
  ```

- Нормализация путей в POSIX-стиль (/).
- Ограничение по длине результирующего Markdown (по умолчанию 10000 символов).
- Поддержка include/exclude правил (micromatch), похожих на tsconfig.

Быстрый старт — CLI

В корне репозитория добавлен исполняемый скрипт `project-context`.

Запуск локально (в каталоге проекта):

  ./bin/project-context

Или указать путь:

  ./bin/project-context /path/to/project

Если установить пакет глобально (или связать локально через npm link), команда будет доступна как `project-context`.

Примеры

- Вывести контекст текущей директории в stdout:

  project-context

- Записать контекст в файл:

  project-context > project.md

Примечания по запуску

- Скрипт пытается подключить сначала скомпилированный модуль `./projectContext.js`. Если его нет, он пытается подключить TypeScript-модуль через `ts-node/register`. Если оба варианта недоступны, будет сообщение с инструкцией: запустить `npm run build` или установить `ts-node`.

API (TypeScript)

Функция экспортируется из `projectContext.ts`:

```ts
import { projectContext } from './projectContext';

// Возвращает markdown для текущей директории
const md = await projectContext();
```

Тип и опции

export interface ProjectContextOptions {
  include?: string[]; // шаблоны для включения (micromatch)
  exclude?: string[]; // шаблоны для исключения
  limit?: number;     // максимальная длина результирующего Markdown
}

По умолчанию `include` включает типичные исходники: `**/*.ts`, `**/*.tsx`, `**/*.js`, `**/*.jsx`, `**/*.json`, `**/*.md`, `**/*.txt`.
По умолчанию `exclude` содержит: `node_modules`, `dist`, `build`, `out`, `coverage`, `.git`, `package-lock.json`.

Ошибки

Если итоговый Markdown превышает указанный `limit`, функция выбрасывает ошибку `Output exceeds limit of ${limit} characters`.

Установка и тесты

1. Установите зависимости:

   npm install

2. Соберите (при необходимости):

   npm run build

3. Запустите тесты (vitest):

   npx vitest

Дополнения и улучшения

Возможные направления развития:

- Чтение только первых N строк файла (preview) для уменьшения объёма.
- Игнорирование бинарных файлов по сигнатуре.
- Добавление оглавления/индекса файлов в начале Markdown.

Лицензия: MIT
