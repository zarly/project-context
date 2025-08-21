# project-context

Функция projectContext собирает содержимое файлов и структуру директории и возвращает их в виде Markdown-текста. Это удобно для формирования контекстных подсказок (prompts) при работе с LLM: вы можете передать проект как читаемый Markdown, содержащий пути файлов и их содержимое.

Основные характеристики

- Рекурсивно обходит директорию и собирает файлы.
- Формирует Markdown: заголовок с названием проекта и секции для каждого файла вида:

  ## path/to/file.ext

  ```
  <содержимое файла>
  ```

- Нормализует пути в POSIX-стиль (использует "/").
- Имеет ограничение по максимальной длине генерируемого текста (по умолчанию 10000 символов) и выбрасывает ошибку, если результат превышает лимит.
- Поддерживает include/exclude опции, похожие на правила в tsconfig (реализовано через micromatch).

API / Контракт

Экспортируемая функция:

- projectContext(dir?: string, options?: { include?: string[]; exclude?: string[]; limit?: number }): Promise<string>

Параметры:
- dir (optional): путь к корневой директории. Если не указан, используется process.cwd().
- options (optional): объект опций
  - include (optional): массив строк с шаблонами для включения файлов/путей. По умолчанию включаются типичные исходники: ts, tsx, js, jsx, json, md, txt.
    Пример по умолчанию: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.json", "**/*.md", "**/*.txt"]
  - exclude (optional): массив шаблонов для исключения. По умолчанию исключаются: node_modules, dist, build, out, coverage, .git.
  - limit (optional): максимальная длина результирующей Markdown-строки в символах. По умолчанию 10000.

Возвращаемое значение:
- Promise, который разрешается в строку (Markdown) с перечислением файлов и их содержимым.

Ошибки:
- Если итоговая строка превышает limit, функция выбрасывает Error с сообщением `Output exceeds limit of ${limit} characters`.

Пример использования (TypeScript)

```ts
import { projectContext } from './projectContext';

async function main() {
  // Возвращает markdown для текущей директории
  const md = await projectContext();
  console.log(md);

  // Указать директорию и увеличить лимит
  const md2 = await projectContext('/path/to/project', { limit: 50000 });
  console.log(md2);

  // Использовать options: включить всё и убрать исключения
  const md3 = await projectContext('/path/to/project', { include: ['**/*'], exclude: [], limit: 20000 });
  console.log(md3);
}

main().catch(console.error);
```


Тесты

Пример тестов (vitest) включён в репозиторий как projectContext.test.ts. Тесты создают временные директории и проверяют работу include/exclude и содержание.

Как запускать тесты

1. Установите зависимости (npm):

   npm install

2. Запустите vitest:

   npx vitest


Возможные улучшения

- Поддержка чтения только заголовков файлов (первые N строк) для уменьшения объёма.
- Игнорирование бинарных файлов по сигнатуре или расширению.
- Вывод отдельного оглавления/индекса файлов в начале Markdown.
