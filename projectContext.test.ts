import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { projectContext } from './projectContext';

describe('projectContext', () => {
  it('returns markdown listing structure and file contents', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'projctx-'));
    fs.writeFileSync(path.join(tmp, 'a.txt'), 'hello');
    fs.mkdirSync(path.join(tmp, 'sub'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'sub', 'b.txt'), 'world');

    const res = await projectContext(tmp);

    expect(typeof res).toBe('string');
    expect(res).toContain('a.txt');
    expect(res).toContain('hello');
    expect(res).toContain('sub/b.txt');
    expect(res).toContain('world');
  });

  it('excludes node_modules by default', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'projctx-'));
    fs.mkdirSync(path.join(tmp, 'node_modules', 'pkg'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'node_modules', 'pkg', 'index.js'), 'pkg');
    fs.writeFileSync(path.join(tmp, 'main.ts'), 'main');

    const res = await projectContext(tmp);

    expect(res).toContain('main.ts');
    expect(res).toContain('main');
    expect(res).not.toContain('node_modules');
    expect(res).not.toContain('pkg');
  });

  it('allows overriding include/exclude via options', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'projctx-'));
    fs.mkdirSync(path.join(tmp, 'node_modules', 'pkg'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'node_modules', 'pkg', 'index.js'), 'pkg');
    fs.writeFileSync(path.join(tmp, 'readme.md'), 'readme');

    // override to include everything and clear excludes
    const res = await projectContext(tmp, { include: ['**/*'], exclude: [] });

    expect(res).toContain('readme.md');
    expect(res).toContain('node_modules/pkg/index.js');
    expect(res).toContain('pkg');
  });
});
