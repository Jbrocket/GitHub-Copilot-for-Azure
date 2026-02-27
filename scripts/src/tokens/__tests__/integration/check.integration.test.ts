/**
 * Integration tests for check command - actual command execution
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'node:path';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { check } from '../../commands/check.js';

const TEST_DIR = join(process.cwd(), '__integration_check__');

describe('check command integration', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    // Clean and create test directory structure
    try {
      rmSync(TEST_DIR, { recursive: true, force: true });
    } catch {}
    mkdirSync(join(TEST_DIR, '.github', 'skills'), { recursive: true });
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    // Small delay to allow file handles to close on Windows
    await new Promise(resolve => setTimeout(resolve, 10));
    try {
      rmSync(TEST_DIR, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch (err) {
      // Ignore cleanup errors in tests
    }
    consoleSpy.mockRestore();
  });

  it('validates files against token limits', () => {
    writeFileSync(join(TEST_DIR, '.github', 'skills', 'SKILL.md'), 'a'.repeat(100));
    
    check(TEST_DIR, []);
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Token Limit Check'));
  });

  it('detects files exceeding limits', () => {
    // Create file that exceeds 500 token SKILL.md limit
    writeFileSync(join(TEST_DIR, '.github', 'skills', 'SKILL.md'), 'a'.repeat(2500)); // 625 tokens > 500 limit
    
    check(TEST_DIR, []);
    
    const output = consoleSpy.mock.calls.map((call: any) => call[0]).join('');
    expect(output).toContain('exceeding');
  });

  it('outputs markdown format when --markdown flag is provided', () => {
    writeFileSync(join(TEST_DIR, '.github', 'skills', 'test.md'), 'test');
    
    check(TEST_DIR, ['--markdown']);
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('## 📊 Token Limit Check Report'));
  });

  it('outputs JSON when --json flag is provided', () => {
    writeFileSync(join(TEST_DIR, '.github', 'skills', 'test.md'), 'test');
    
    check(TEST_DIR, ['--json']);
    
    const output = consoleSpy.mock.calls.map((call: any) => call[0]).join('');
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('checks specific files when provided as arguments', () => {
    const testFile = join(TEST_DIR, '.github', 'skills', 'specific.md');
    writeFileSync(testFile, 'specific content');
    
    check(TEST_DIR, [testFile]);
    
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('loads custom config from .token-limits.json', () => {
    const config = {
      defaults: { '*.md': 10 },
      overrides: {}
    };
    writeFileSync(join(TEST_DIR, '.token-limits.json'), JSON.stringify(config));
    writeFileSync(join(TEST_DIR, '.github', 'skills', 'test.md'), 'a'.repeat(100)); // Will exceed 10 token limit
    
    check(TEST_DIR, []);
    
    const output = consoleSpy.mock.calls.map((call: any) => call[0]).join('');
    expect(output).toContain('exceeding');
  });

  it('checks a specific directory', () => {
    const targetDir = join(TEST_DIR, 'custom-skill');
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(targetDir, 'SKILL.md'), 'a'.repeat(100)); // small file, under limit

    check(TEST_DIR, [targetDir]);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Token Limit Check'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Files Checked: 1'));
  });

  it('checks multiple files in a target directory recursively', () => {
    const targetDir = join(TEST_DIR, 'nested-skill');
    mkdirSync(join(targetDir, 'references'), { recursive: true });
    writeFileSync(join(targetDir, 'SKILL.md'), 'a'.repeat(100));
    writeFileSync(join(targetDir, 'references', 'detail.md'), 'b'.repeat(100));

    check(TEST_DIR, [targetDir]);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Files Checked: 2'));
  });

  it('checks a single file target', () => {
    const targetFile = join(TEST_DIR, '.github', 'skills', 'target.md');
    writeFileSync(targetFile, 'single file content');

    check(TEST_DIR, [targetFile]);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Files Checked: 1'));
  });

  it('errors when target directory does not exist', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalExitCode = process.exitCode;

    check(TEST_DIR, [join(TEST_DIR, 'nonexistent')]);

    expect(process.exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Path not found'));

    process.exitCode = originalExitCode;
    errorSpy.mockRestore();
  });

  it('checks directory with --json flag', () => {
    const targetDir = join(TEST_DIR, 'json-dir');
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(targetDir, 'doc.md'), 'test content');

    check(TEST_DIR, [targetDir, '--json']);

    const output = consoleSpy.mock.calls.map((call: any) => call[0]).join('');
    const parsed = JSON.parse(output);
    expect(parsed.totalFiles).toBe(1);
  });

  it('checks directory with --markdown flag', () => {
    const targetDir = join(TEST_DIR, 'md-dir');
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(targetDir, 'doc.md'), 'test content');

    check(TEST_DIR, [targetDir, '--markdown']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('## 📊 Token Limit Check Report'));
  });

  it('handles directory with no markdown files', () => {
    const targetDir = join(TEST_DIR, 'no-md');
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(targetDir, 'script.ts'), 'console.log("test")');

    check(TEST_DIR, [targetDir]);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Files Checked: 0'));
  });
});
