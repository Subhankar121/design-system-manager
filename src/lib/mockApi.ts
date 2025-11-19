import tokensSeed from '../../seed/tokens.json';
import componentsSeed from '../../seed/components.json';
import themesSeed from '../../seed/themes.json';
import {
  Token,
  ComponentDef,
  Theme,
  ThemeVersion,
  ThemeSnapshot,
  PublishMetadata,
} from '@/types';

const STORAGE_KEYS = {
  tokens: 'dsm:tokens',
  components: 'dsm:components',
  themes: 'dsm:themes',
};

const SEED_VERSION = '2025-semantic-palette-v1';

const VERSION_PREFIX = 'dsm:versions:';
export const SNAPSHOT_STORAGE_PREFIX = 'dsm:snapshots:';

const LATENCY_MS = 100;

type ChangeType = 'tokens' | 'components' | 'themes';

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

const snapshotKey = (themeId: string) => `${VERSION_PREFIX}${themeId}`;

const needsPaletteUpgrade = (): boolean => {
  if (typeof window === 'undefined') return false;
  const existing = readJSON<Token[] | null>(STORAGE_KEYS.tokens, null);
  if (!Array.isArray(existing) || existing.length === 0) {
    return true;
  }
  const hasFamilyPalette = existing.some((token) => token.key.startsWith('color.') && token.key.split('.').length >= 3);
  const hasSemanticCore = existing.some((token) => token.key.startsWith('semantic.color.surface'));
  return !(hasFamilyPalette && hasSemanticCore);
};

export async function initSeedDataIfNeeded(force = false) {
  if (typeof window === 'undefined') return;
  const currentVersion = window.localStorage.getItem('dsm:seed-version');
  const paletteUpgradeNeeded = needsPaletteUpgrade();
  if (!force && currentVersion === SEED_VERSION && !paletteUpgradeNeeded) {
    return;
  }

  writeJSON(STORAGE_KEYS.tokens, tokensSeed);
  writeJSON(STORAGE_KEYS.components, componentsSeed);
  writeJSON(STORAGE_KEYS.themes, themesSeed);
  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(VERSION_PREFIX) || key.startsWith(SNAPSHOT_STORAGE_PREFIX))
    .forEach((key) => window.localStorage.removeItem(key));
  window.localStorage.setItem('dsm:seed-version', SEED_VERSION);
  window.localStorage.setItem('dsm:seeded', new Date().toISOString());
  dispatchChange('tokens');
  dispatchChange('components');
  dispatchChange('themes');
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

// Theme API
export async function getThemes(): Promise<Theme[]> {
  await ensureSeeded();
  await delay();
  return readJSON<Theme[]>(STORAGE_KEYS.themes, []);
}

export async function getTheme(id: string): Promise<Theme | null> {
  const themes = await getThemes();
  return themes.find((t) => t.id === id) ?? null;
}

export async function saveThemeDraft(theme: Theme): Promise<void> {
  await ensureSeeded();
  const themes = await getThemes();
  const idx = themes.findIndex((t) => t.id === theme.id);
  if (idx >= 0) {
    themes[idx] = theme;
  } else {
    themes.push(theme);
  }
  writeJSON(STORAGE_KEYS.themes, themes);
  dispatchChange('themes', theme.id);
}

export async function deleteTheme(id: string): Promise<void> {
  await ensureSeeded();
  const themes = await getThemes();
  writeJSON(
    STORAGE_KEYS.themes,
    themes.filter((t) => t.id !== id)
  );
  dispatchChange('themes', id);
}

// Legacy aliases for backward compatibility
export const getPresets = getThemes;
export const getPreset = getTheme;
export const savePresetDraft = saveThemeDraft;
export const deletePreset = deleteTheme;

const getVersionCollection = async (themeId: string): Promise<ThemeVersion[]> => {
  return readJSON<ThemeVersion[]>(snapshotKey(themeId), []);
};

const saveVersionCollection = (themeId: string, versions: ThemeVersion[]) => {
  writeJSON(snapshotKey(themeId), versions);
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

const persistSnapshot = (snapshotId: string, snapshot: ThemeSnapshot) => {
  writeJSON(`${SNAPSHOT_STORAGE_PREFIX}${snapshotId}`, snapshot);
};

export async function publishTheme(
  themeId: string,
  metadata: PublishMetadata
): Promise<ThemeVersion> {
  await ensureSeeded();
  const theme = await getTheme(themeId);
  if (!theme) {
    throw new Error(`Theme ${themeId} not found`);
  }
  const [tokens, versions] = await Promise.all([getTokens(), getVersionCollection(themeId)]);
  const latest = versions[0];
  const tokenMap = buildTokenMap(tokens);
  Object.entries(theme.globalOverrides || {}).forEach(([key, value]) => {
    tokenMap[key] = value;
  });

  const snapshot: ThemeSnapshot = {
    tokens: tokenMap,
    components: { ...theme.components },
  };

  const version: ThemeVersion = {
    snapshotId: `snapshot-${Date.now()}`,
    themeId,
    version: bumpPatch(latest?.version),
    createdBy: metadata.createdBy,
    createdAt: new Date().toISOString(),
    snapshot,
    changelog: metadata.notes ? { notes: metadata.notes } : undefined,
  };

  const nextVersions = [version, ...versions];
  saveVersionCollection(themeId, nextVersions);
  persistSnapshot(version.snapshotId, snapshot);

  theme.publishedVersions = [...(theme.publishedVersions || []), version.snapshotId];
  await saveThemeDraft(theme);
  dispatchChange('themes', themeId);
  return version;
}

// Legacy alias
export const publishPreset = publishTheme;

export async function getThemeVersions(themeId: string): Promise<ThemeVersion[]> {
  await ensureSeeded();
  await delay();
  return getVersionCollection(themeId);
}

export async function getThemeVersion(
  themeId: string,
  versionOrSnapshotId: string
): Promise<ThemeVersion | null> {
  const versions = await getVersionCollection(themeId);
  return (
    versions.find(
      (v) => v.version === versionOrSnapshotId || v.snapshotId === versionOrSnapshotId
    ) ?? null
  );
}

export async function revertThemeVersion(
  themeId: string,
  snapshotId: string,
  metadata: PublishMetadata
): Promise<ThemeVersion> {
  const version = await getThemeVersion(themeId, snapshotId);
  if (!version) {
    throw new Error(`Snapshot ${snapshotId} not found`);
  }

  const theme = await getTheme(themeId);
  if (!theme) {
    throw new Error(`Theme ${themeId} not found`);
  }

  const baseTokens = await getTokens();
  const baseMap = buildTokenMap(baseTokens);
  const newOverrides: Record<string, string> = {};
  Object.entries(version.snapshot.tokens).forEach(([key, value]) => {
    if (baseMap[key] !== value) {
      newOverrides[key] = value;
    }
  });

  theme.globalOverrides = newOverrides;
  theme.components = { ...version.snapshot.components };
  await saveThemeDraft(theme);
  return publishTheme(themeId, metadata);
}

export async function downloadSnapshot(snapshotId: string): Promise<string> {
  await ensureSeeded();
  await delay();
  const snapshot = readJSON<ThemeSnapshot | null>(`${SNAPSHOT_STORAGE_PREFIX}${snapshotId}`, null);
  if (!snapshot) {
    throw new Error('Snapshot not found');
  }
  return JSON.stringify(snapshot, null, 2);
}

// Legacy aliases
export const getPresetVersions = getThemeVersions;
export const getPresetVersion = getThemeVersion;
export const revertPresetVersion = revertThemeVersion;

export async function resetSeedData() {
  await initSeedDataIfNeeded(true);
}

