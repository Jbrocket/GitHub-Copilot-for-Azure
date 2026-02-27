/**
 * Integration tests for count command - actual command execution
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'node:path';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { count } from '../../commands/count.js';

const TEST_DIR = join(process.cwd(), '__integration_count__');

describe('count command integration', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    // Clean and create test directory structure
    try {
      rmSync(TEST_DIR, { recursive: true, force: true });
    } catch {}
    mkdirSync(join(TEST_DIR, '.github', 'skills'), { recursive: true });
    mkdirSync(join(TEST_DIR, 'plugin', 'skills'), { recursive: true });
    
    // Spy on console.log to capture output
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

  it('counts tokens in default directories', () => {
    // Create test files
    writeFileSync(join(TEST_DIR, '.github', 'skills', 'test.md'), 'a'.repeat(400)); // 100 tokens
    writeFileSync(join(TEST_DIR, 'plugin', 'skills', 'another.md'), 'b'.repeat(800)); // 200 tokens
    
    count(TEST_DIR, []);
    
    // Verify console output
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Token Count Summary'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Files'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Tokens'));
  });

  it('generates JSON output when --json flag is provided', () => {
    writeFileSync(join(TEST_DIR, '.github', 'skills', 'test.md'), 'test content');
    
    count(TEST_DIR, ['--json']);
    
    // Should output JSON
    const output = consoleSpy.mock.calls.map((call: any) => call[0]).join('');
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('writes to output file when --output is specified', () => {
    writeFileSync(join(TEST_DIR, '.github', 'skills', 'test.md'), 'test');
    const outputPath = join(TEST_DIR, 'output.json');
    
    count(TEST_DIR, ['--output', outputPath]);
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Token metadata written'));
  });

  it('rejects output paths outside repository', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalExitCode = process.exitCode;
    
    count(TEST_DIR, ['--output', '/etc/passwd']);
    
    expect(process.exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('must be within the repository'));
    
    process.exitCode = originalExitCode;
    errorSpy.mockRestore();
  });

  it('handles empty directories gracefully', () => {
    count(TEST_DIR, []);
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Token Count Summary'));
  });

  it('counts tokens in a specific directory', () => {
    const targetDir = join(TEST_DIR, 'custom');
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(targetDir, 'file1.md'), 'a'.repeat(400)); // 100 tokens
    writeFileSync(join(targetDir, 'file2.md'), 'b'.repeat(200)); // 50 tokens

    count(TEST_DIR, [targetDir]);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Token Count Summary'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Files: 2'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Tokens: 150'));
  });

  it('counts tokens for a single file target', () => {
    const targetFile = join(TEST_DIR, 'plugin', 'skills', 'single.md');
    writeFileSync(targetFile, 'a'.repeat(800)); // 200 tokens

    count(TEST_DIR, [targetFile]);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Token Count Summary'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Files: 1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Tokens: 200'));
  });

  it('counts tokens in a specific directory with --json flag', () => {
    const targetDir = join(TEST_DIR, 'custom-json');
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(targetDir, 'doc.md'), 'a'.repeat(400));

    count(TEST_DIR, [targetDir, '--json']);

    const output = consoleSpy.mock.calls.map((call: any) => call[0]).join('');
    const parsed = JSON.parse(output);
    expect(parsed.totalFiles).toBe(1);
    expect(parsed.totalTokens).toBe(100);
  });

  it('errors when target path does not exist', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalExitCode = process.exitCode;

    count(TEST_DIR, [join(TEST_DIR, 'nonexistent')]);

    expect(process.exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Path not found'));

    process.exitCode = originalExitCode;
    errorSpy.mockRestore();
  });

  it('counts tokens recursively in nested directories', () => {
    const targetDir = join(TEST_DIR, 'nested-skill');
    mkdirSync(join(targetDir, 'references'), { recursive: true });
    writeFileSync(join(targetDir, 'SKILL.md'), 'a'.repeat(400)); // 100 tokens
    writeFileSync(join(targetDir, 'references', 'detail.md'), 'b'.repeat(200)); // 50 tokens

    count(TEST_DIR, [targetDir]);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Files: 2'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Tokens: 150'));
  });

  it('handles directory with no markdown files', () => {
    const targetDir = join(TEST_DIR, 'no-md');
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(targetDir, 'script.ts'), 'console.log("test")');

    count(TEST_DIR, [targetDir]);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Files: 0'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Tokens: 0'));
  });
});
