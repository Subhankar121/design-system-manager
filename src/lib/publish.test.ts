import { describe, it, expect, beforeEach } from 'vitest';
import { initSeedDataIfNeeded, publishPreset, getPresetVersions } from './mockApi';

describe('publishPreset', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await initSeedDataIfNeeded(true);
  });

  it('increments patch version on each publish', async () => {
    await publishPreset('default', { createdBy: 'test' });
    let versions = await getPresetVersions('default');
    expect(versions[0].version).toBe('1.0.0');

    await publishPreset('default', { createdBy: 'test' });
    versions = await getPresetVersions('default');
    expect(versions[0].version).toBe('1.0.1');
  });
});

