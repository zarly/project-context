import fs from 'node:fs/promises';
import path from 'node:path';
import micromatch from 'micromatch';

export interface ProjectContextOptions {
  include?: string[];
  exclude?: string[];
  limit?: number;
}

type MarkdownParts = string[];

const DEFAULT_INCLUDE = ['**/*.ts', '**/*.tsx', '**/*.vue', '**/*.json', '**/*.md', '.editorconfig'];
const DEFAULT_EXCLUDE = ['node_modules', 'dist', 'build', 'out', 'coverage', '.git', 'package-lock.json', 'LICENSE'];

async function collectFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(current: string) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const ent of entries) {
      const res = path.join(current, ent.name);
      if (ent.isDirectory()) {
        await walk(res);
      } else if (ent.isFile()) {
        files.push(res);
      }
    }
  }

  await walk(root);
  return files;
}

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

function isPlainPattern(p: string): boolean {
  // consider it "plain" if it contains no glob metacharacters
  return !/[*?\[\]{}]/.test(p);
}

function shouldInclude(relPath: string, include: string[], exclude: string[]): boolean {
  // exclude wins
  for (const ex of exclude) {
    if (!ex) continue;
    // direct micromatch support
    try {
      if (micromatch.isMatch(relPath, ex, { dot: true })) return false;
    } catch (_) {
      // ignore bad patterns
    }

    // treat plain patterns (no glob meta) as path prefixes
    if (isPlainPattern(ex)) {
      const normalized = ex.replace(/\\/g, '/');
      if (relPath === normalized || relPath.startsWith(normalized + '/')) return false;
    }
  }

  // if include list is empty -> include everything (unless excluded)
  if (!include || include.length === 0) return true;

  for (const inc of include) {
    if (!inc) continue;
    try {
      if (micromatch.isMatch(relPath, inc, { dot: true })) return true;
    } catch (_) {
      // ignore
    }

    if (isPlainPattern(inc)) {
      const normalized = inc.replace(/\\/g, '/');
      if (relPath === normalized || relPath.startsWith(normalized + '/')) return true;
    }
  }

  return false;
}

async function fileSection(filePath: string, root: string): Promise<string> {
  const rel = toPosix(path.relative(root, filePath));
  const content = await fs.readFile(filePath, 'utf8');
  return `## ${rel}\n\n\`\`\`\n${content}\n\`\`\`\n`;
}

function joinParts<T extends string[]>(parts: T): string {
  return parts.join('\n');
}

// Reads directory recursively and returns markdown with filenames and contents.
// Supports include/exclude similar to tsconfig (using micromatch for matching).
export async function projectContext(dir?: string, options: ProjectContextOptions = {}): Promise<string> {
  const root = dir || process.cwd();
  const limit = options.limit ?? 10000;
  const include = options.include ? options.include.slice() : DEFAULT_INCLUDE.slice();
  const exclude = options.exclude ? options.exclude.slice() : DEFAULT_EXCLUDE.slice();

  const files = await collectFiles(root);

  const parts: MarkdownParts = [];

  // sort for deterministic output
  files.sort();

  for (const f of files) {
    const rel = toPosix(path.relative(root, f));
    if (!shouldInclude(rel, include, exclude)) continue;
    const section = await fileSection(f, root);
    parts.push(section);
  }

  const out = joinParts(parts);

  if (out.length > limit) {
    throw new Error(`Output exceeds limit of ${limit} characters. Length is ${out.length}`);
  }

  return out;
}
