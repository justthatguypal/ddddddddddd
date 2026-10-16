import { describe, expect, it } from 'vitest';
import {
  SETTINGS_VERSION,
  applySettingsPatch,
  defaultSettings,
  migrateSettings,
} from '../src/settings.js';

describe('settings migration', () => {
  it('migrates a v1 flat file to the current version', () => {
    const report = migrateSettings({
      version: 1,
      theme: 'midnight',
      clientPath: 'C:/Games/FN/FortniteClient-Win64-Shipping.exe',
      region: 'EU',
      backendUrl: 'http://10.0.0.5:3000',
      reduceMotion: true,
    });
    expect(report.fromVersion).toBe(1);
    expect(report.migrated).toBe(true);
    expect(report.settings.version).toBe(SETTINGS_VERSION);
    expect(report.settings.appearance.themeId).toBe('midnight');
    expect(report.settings.appearance.reduceMotion).toBe(true);
    expect(report.settings.game.defaultRegion).toBe('EU');
    expect(report.settings.network.backendUrl).toBe('http://10.0.0.5:3000');
    expect(report.settings.notifications.doNotDisturb.enabled).toBe(false);
  });

  it('converts the v2 boolean DND flag into a schedule', () => {
    const report = migrateSettings({ version: 2, notifications: { dnd: true, news: false } });
    expect(report.settings.notifications.doNotDisturb).toEqual({ enabled: true, from: '23:00', to: '08:00' });
    expect(report.settings.notifications.news).toBe(false);
  });

  it('resets only the corrupt section', () => {
    const good = defaultSettings();
    const report = migrateSettings({
      ...good,
      game: { ...good.game, defaultMode: 'solo', fillWithBots: false },
      notifications: { friendOnline: 'yes please' },
    });
    expect(report.resetSections).toEqual(['notifications']);
    expect(report.settings.game.fillWithBots).toBe(false);
  });

  it('handles garbage input', () => {
    expect(migrateSettings('nope').settings).toEqual(defaultSettings());
    expect(migrateSettings(null).resetSections).toEqual(['*']);
  });

  it('applies deep-partial patches without clobbering siblings', () => {
    const next = applySettingsPatch(defaultSettings(), { game: { botDifficulty: 'elite' } });
    expect(next.game.botDifficulty).toBe('elite');
    expect(next.game.fillWithBots).toBe(true);
  });
});
