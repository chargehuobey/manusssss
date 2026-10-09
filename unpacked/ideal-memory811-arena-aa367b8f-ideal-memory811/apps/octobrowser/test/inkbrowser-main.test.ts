import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { findInkBrowser, inkbrowserInstallPath } from '../src/main/inkbrowser';

const root = path.resolve(__dirname, '..', '..', '..');

describe('InkBrowser install lookup', () => {
  const local = path.join('C:', 'Users', 'user', 'AppData', 'Local');

  it('looks for the base in the per-user install folder', () => {
    const exe = path.join(local, 'InkBrowser', 'Application', 'inkbrowser.exe');
    expect(inkbrowserInstallPath(local)).toBe(exe);
    expect(findInkBrowser(local, (file) => file === exe)).toBe(exe);
  });

  it('reports not installed when the file is missing or LOCALAPPDATA is unset', () => {
    expect(findInkBrowser(local, () => false)).toBeNull();
    expect(findInkBrowser('', () => true)).toBeNull();
  });
});

describe('launch order in the manager', () => {
  const src = readFileSync(path.join(root, 'apps', 'octobrowser', 'src', 'main', 'manager.ts'), 'utf8');

  it('the InkBrowser branch runs before the Firefox branch, and never for Tor profiles', () => {
    const ink = src.indexOf("browserEngineFor(p.engine) === 'inkbrowser' && p.kind !== 'tor'");
    const firefox = src.indexOf('// Firefox identities are never silently run inside Chromium.');
    expect(ink).toBeGreaterThan(0);
    expect(firefox).toBeGreaterThan(ink);
  });

  it('encrypted profiles open their vault through one shared gate, used by both launch paths', () => {
    expect(src.match(/this\.openVaultForLaunch\(/g)?.length).toBe(2);
  });

  it('new profiles take the Electron default from one constant, and carry it into the profile', () => {
    expect(src).toMatch(/input\.patch\?\.engine \?\? NEW_PROFILE_ENGINE/);
    expect(src).toMatch(/patch: \{ \.\.\.input\.patch, engine \}/);
  });
});
