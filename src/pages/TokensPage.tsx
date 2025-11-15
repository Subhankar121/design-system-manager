import { useEffect, useMemo, useState } from 'react';
import { ComponentDef, Preset, Token } from '@/types';
import {
  deleteToken,
  getComponents,
  getPresets,
  getTokens,
  saveToken,
} from '@/lib/mockApi';
import { TokenTable } from '@/components/TokenTable';
import { useToast } from '@/hooks/useToast';
import { resolveTokens, validateTokenValue } from '@/lib/resolver';
import { TokenUsageDrawer } from '@/components/TokenUsageDrawer';
import { AlertBanner } from '@/components/AlertBanner';

export function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [components, setComponents] = useState<ComponentDef[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState('default');
  const [usageToken, setUsageToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    const [tokenData, componentData, presetData] = await Promise.all([
      getTokens(),
      getComponents(),
      getPresets(),
    ]);
    setTokens(tokenData);
    setComponents(componentData);
    setPresets(presetData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('dsm:change', handler);
    return () => window.removeEventListener('dsm:change', handler);
  }, []);

  const activePreset = presets.find((preset) => preset.id === selectedPresetId) ?? null;
  const resolved = useMemo(
    () => resolveTokens(tokens, activePreset || undefined),
    [tokens, activePreset]
  );

  const displayTokens = useMemo(
    () =>
      tokens.map((token) => ({
        ...token,
        value: resolved[token.key] ?? token.value,
      })),
    [tokens, resolved]
  );
  const surfaceColor = resolved['color.surface'] ?? '#ffffff';

  const invalidTokens = useMemo(
    () => displayTokens.filter((token) => validateTokenValue(token) !== null),
    [displayTokens]
  );

  const handleSaveToken = async (token: Token) => {
    await saveToken(token);
    addToast('Token saved', 'success');
    loadData();
  };

  const handleDelete = async (token: Token) => {
    const usage = components.filter((component) => component.tokensUsed.includes(token.key)).length;
    const confirmed = window.confirm(
      `Delete token "${token.key}"?${usage ? ` ${usage} components reference this token.` : ''}`
    );
    if (!confirmed) return;
    await deleteToken(token.key);
    addToast('Token deleted', 'success');
    loadData();
  };

  const presetOptions = presets.length ? presets : [{ id: 'default', name: 'Default' } as Preset];

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-gray-500">Inventory</p>
          <h1 className="text-3xl font-bold text-gray-900">Tokens</h1>
          <p className="text-sm text-gray-500">Edit design tokens inline and track where they are used.</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="preset-select" className="text-sm text-gray-600">
            Preview preset
          </label>
          <select
            id="preset-select"
            value={selectedPresetId}
            onChange={(event) => setSelectedPresetId(event.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {presetOptions.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {invalidTokens.length > 0 && (
        <AlertBanner
          type="error"
          title="Invalid tokens"
          message={`${invalidTokens.length} token(s) have invalid values. Publishing will be blocked until they are fixed.`}
          actionLabel="Review"
          onAction={() => {
            const invalid = invalidTokens[0];
            document.getElementById(`token-input-${invalid.key}`)?.focus();
          }}
        />
      )}

      <TokenTable
        tokens={displayTokens}
        surfaceColor={surfaceColor}
        components={components}
        presets={presets}
        onSave={handleSaveToken}
        onDelete={handleDelete}
        onWhereUsed={setUsageToken}
      />

      <TokenUsageDrawer
        token={usageToken}
        components={components}
        presets={presets}
        isOpen={Boolean(usageToken)}
        onClose={() => setUsageToken(null)}
      />

      {loading && <p className="text-sm text-gray-500">Loading tokens…</p>}
    </div>
  );
}

