import tokensSeed from '../../seed/tokens.json';
import componentsSeed from '../../seed/components.json';
import presetsSeed from '../../seed/presets.json';
import {
  Token,
  ComponentDef,
  Preset,
  PresetVersion,
  PresetSnapshot,
  PublishMetadata,
} from '@/types';

const STORAGE_KEYS = {
  tokens: 'dsm:tokens',
  components: 'dsm:components',
  presets: 'dsm:presets',
};

const VERSION_PREFIX = 'dsm:versions:';
export const SNAPSHOT_STORAGE_PREFIX = 'dsm:snapshots:';

const LATENCY_MS = 100;

type ChangeType = 'tokens' | 'components' | 'presets';

const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

const dispatchChange = (type: ChangeType, id?: string) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('dsm:change', {
      detail: { type, id },
    })
  );
};

const readJSON = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback;
  }
  const raw = window.localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
};

const writeJSON = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const snapshotKey = (presetId: string) => `${VERSION_PREFIX}${presetId}`;

export async function initSeedDataIfNeeded(force = false) {
  if (typeof window === 'undefined') return;
  const alreadySeeded = window.localStorage.getItem('dsm:seeded');
  if (alreadySeeded && !force) return;

  writeJSON(STORAGE_KEYS.tokens, tokensSeed);
  writeJSON(STORAGE_KEYS.components, componentsSeed);
  writeJSON(STORAGE_KEYS.presets, presetsSeed);
  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(VERSION_PREFIX) || key.startsWith(SNAPSHOT_STORAGE_PREFIX))
    .forEach((key) => window.localStorage.removeItem(key));
  window.localStorage.setItem('dsm:seeded', new Date().toISOString());
  dispatchChange('tokens');
  dispatchChange('components');
  dispatchChange('presets');
}

const ensureSeeded = async () => {
  await initSeedDataIfNeeded();
};

// Token API
export async function getTokens(): Promise<Token[]> {
  await ensureSeeded();
  await delay();
  return readJSON<Token[]>(STORAGE_KEYS.tokens, []);
}

export async function saveToken(token: Token): Promise<void> {
  await ensureSeeded();
  const tokens = await getTokens();
  const idx = tokens.findIndex((t) => t.key === token.key);
  if (idx >= 0) {
    tokens[idx] = token;
  } else {
    tokens.push(token);
  }
  writeJSON(STORAGE_KEYS.tokens, tokens);
  dispatchChange('tokens', token.key);
}

export async function deleteToken(key: string): Promise<void> {
  await ensureSeeded();
  const tokens = await getTokens();
  writeJSON(
    STORAGE_KEYS.tokens,
    tokens.filter((t) => t.key !== key)
  );
  dispatchChange('tokens', key);
}

// Component API
export async function getComponents(): Promise<ComponentDef[]> {
  await ensureSeeded();
  await delay();
  return readJSON<ComponentDef[]>(STORAGE_KEYS.components, []);
}

export async function saveComponent(component: ComponentDef): Promise<void> {
  await ensureSeeded();
  const components = await getComponents();
  const idx = components.findIndex((c) => c.id === component.id);
  if (idx >= 0) {
    components[idx] = component;
  } else {
    components.push(component);
  }
  writeJSON(STORAGE_KEYS.components, components);
  dispatchChange('components', component.id);
}

// Preset API
export async function getPresets(): Promise<Preset[]> {
  await ensureSeeded();
  await delay();
  return readJSON<Preset[]>(STORAGE_KEYS.presets, []);
}

export async function getPreset(id: string): Promise<Preset | null> {
  const presets = await getPresets();
  return presets.find((p) => p.id === id) ?? null;
}

export async function savePresetDraft(preset: Preset): Promise<void> {
  await ensureSeeded();
  const presets = await getPresets();
  const idx = presets.findIndex((p) => p.id === preset.id);
  if (idx >= 0) {
    presets[idx] = preset;
  } else {
    presets.push(preset);
  }
  writeJSON(STORAGE_KEYS.presets, presets);
  dispatchChange('presets', preset.id);
}

export async function deletePreset(id: string): Promise<void> {
  await ensureSeeded();
  const presets = await getPresets();
  writeJSON(
    STORAGE_KEYS.presets,
    presets.filter((p) => p.id !== id)
  );
  dispatchChange('presets', id);
}

const getVersionCollection = async (presetId: string): Promise<PresetVersion[]> => {
  return readJSON<PresetVersion[]>(snapshotKey(presetId), []);
};

const saveVersionCollection = (presetId: string, versions: PresetVersion[]) => {
  writeJSON(snapshotKey(presetId), versions);
};

const buildTokenMap = (tokens: Token[]) =>
  tokens.reduce<Record<string, string>>((acc, token) => {
    acc[token.key] = token.value;
    return acc;
  }, {});

const bumpPatch = (version?: string) => {
  if (!version) return '1.0.0';
  const [major = '1', minor = '0', patch = '0'] = version.split('.');
  const nextPatch = Number(patch) + 1;
  return `${major}.${minor}.${nextPatch}`;
};

const persistSnapshot = (snapshotId: string, snapshot: PresetSnapshot) => {
  writeJSON(`${SNAPSHOT_STORAGE_PREFIX}${snapshotId}`, snapshot);
};

export async function publishPreset(
  presetId: string,
  metadata: PublishMetadata
): Promise<PresetVersion> {
  await ensureSeeded();
  const preset = await getPreset(presetId);
  if (!preset) {
    throw new Error(`Preset ${presetId} not found`);
  }
  const [tokens, versions] = await Promise.all([getTokens(), getVersionCollection(presetId)]);
  const latest = versions[0];
  const tokenMap = buildTokenMap(tokens);
  Object.entries(preset.globalOverrides || {}).forEach(([key, value]) => {
    tokenMap[key] = value;
  });

  const snapshot: PresetSnapshot = {
    tokens: tokenMap,
    componentOverrides: { ...preset.componentOverrides },
  };

  const version: PresetVersion = {
    snapshotId: `snapshot-${Date.now()}`,
    presetId,
    version: bumpPatch(latest?.version),
    createdBy: metadata.createdBy,
    createdAt: new Date().toISOString(),
    snapshot,
    changelog: metadata.notes ? { notes: metadata.notes } : undefined,
  };

  const nextVersions = [version, ...versions];
  saveVersionCollection(presetId, nextVersions);
  persistSnapshot(version.snapshotId, snapshot);

  preset.publishedVersions = [...(preset.publishedVersions || []), version.snapshotId];
  await savePresetDraft(preset);
  dispatchChange('presets', presetId);
  return version;
}

export async function getPresetVersions(presetId: string): Promise<PresetVersion[]> {
  await ensureSeeded();
  await delay();
  return getVersionCollection(presetId);
}

export async function getPresetVersion(
  presetId: string,
  versionOrSnapshotId: string
): Promise<PresetVersion | null> {
  const versions = await getVersionCollection(presetId);
  return (
    versions.find(
      (v) => v.version === versionOrSnapshotId || v.snapshotId === versionOrSnapshotId
    ) ?? null
  );
}

export async function revertPresetVersion(
  presetId: string,
  snapshotId: string,
  metadata: PublishMetadata
): Promise<PresetVersion> {
  const version = await getPresetVersion(presetId, snapshotId);
  if (!version) {
    throw new Error(`Snapshot ${snapshotId} not found`);
  }

  const preset = await getPreset(presetId);
  if (!preset) {
    throw new Error(`Preset ${presetId} not found`);
  }

  const baseTokens = await getTokens();
  const baseMap = buildTokenMap(baseTokens);
  const newOverrides: Record<string, string> = {};
  Object.entries(version.snapshot.tokens).forEach(([key, value]) => {
    if (baseMap[key] !== value) {
      newOverrides[key] = value;
    }
  });

  preset.globalOverrides = newOverrides;
  preset.componentOverrides = { ...version.snapshot.componentOverrides };
  await savePresetDraft(preset);
  return publishPreset(presetId, metadata);
}

export async function downloadSnapshot(snapshotId: string): Promise<string> {
  await ensureSeeded();
  await delay();
  const snapshot = readJSON<PresetSnapshot | null>(`${SNAPSHOT_STORAGE_PREFIX}${snapshotId}`, null);
  if (!snapshot) {
    throw new Error('Snapshot not found');
  }
  return JSON.stringify(snapshot, null, 2);
}

export async function resetSeedData() {
  await initSeedDataIfNeeded(true);
}

