import { useEffect, useMemo, useState } from 'react';
import { ComponentDef, Theme, Token } from '@/types';
import {
  deleteToken,
  getComponents,
  getThemes,
  getTokens,
  saveToken,
  initSeedDataIfNeeded,
} from '@/lib/mockApi';
import { TokenTable } from '@/components/TokenTable';
import { useToast } from '@/hooks/useToast';
import { resolveTokens, validateTokenValue } from '@/lib/resolver';
import { AlertBanner } from '@/components/AlertBanner';
import { TokenDrawer } from '@/components/TokenDrawer';

export function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [components, setComponents] = useState<ComponentDef[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState('default');
  const [viewMode, setViewMode] = useState<'base' | 'themes'>('base');
  const [metadataToken, setMetadataToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    const [tokenData, componentData, themeData] = await Promise.all([
      getTokens(),
      getComponents(),
      getThemes(),
    ]);
    setTokens(tokenData);
    setComponents(componentData);
    setThemes(themeData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('dsm:change', handler);
    return () => window.removeEventListener('dsm:change', handler);
  }, []);

  const activeTheme = themes.find((theme) => theme.id === selectedThemeId) ?? null;
  const resolved = useMemo(
    () => resolveTokens(tokens, activeTheme || undefined),
    [tokens, activeTheme]
  );

  const displayTokens = useMemo(() => {
    const baseList = tokens.filter((t) => !t.key.startsWith('semantic.'));
    const semanticList = tokens.filter((t) => t.key.startsWith('semantic.'));
    const source = viewMode === 'base' ? baseList : (semanticList.length ? semanticList : baseList);
    return source.map((token) => ({
      ...token,
      value: resolved[token.key] ?? token.value,
    }));
  }, [tokens, resolved, viewMode]);

  const [typeTab, setTypeTab] = useState<'all' | 'color' | 'size' | 'spacing' | 'shadow' | 'font'>('all');
  const [colorFamilyTab, setColorFamilyTab] = useState<'all' | string>('all');

  const baseColorFamilies = useMemo(() => {
    const families = new Set<string>();
    tokens.forEach((token) => {
      if (token.type === 'color' && token.key.startsWith('color.') && token.key.split('.').length >= 3) {
        families.add(token.key.split('.')[1]);
      }
    });
    return Array.from(families).sort((a, b) => a.localeCompare(b));
  }, [tokens]);

  useEffect(() => {
    if (viewMode !== 'base' || typeTab !== 'color') {
      setColorFamilyTab('all');
    }
  }, [viewMode, typeTab]);

  const groupedByType = useMemo(() => {
    let filtered =
      typeTab === 'all' ? displayTokens : displayTokens.filter((t) => t.type === typeTab);
    if (typeTab === 'color' && viewMode === 'base' && colorFamilyTab !== 'all') {
      filtered = filtered.filter((token) => {
        if (!token.key.startsWith('color.') || token.key.split('.').length < 3) {
          return false;
        }
        const [, family] = token.key.split('.');
        return family === colorFamilyTab;
      });
    }
    const groups: Record<string, Token[]> = {};
    filtered.forEach((t) => {
      groups[t.type] = groups[t.type] || [];
      groups[t.type].push(t);
    });
    const order = ['color', 'size', 'spacing', 'shadow', 'font'] as const;
    return order
      .filter((k) => groups[k]?.length)
      .map((k) => ({ type: k, tokens: groups[k]! }));
  }, [displayTokens, typeTab, viewMode, colorFamilyTab]);
  const tokenMap = useMemo(
    () =>
      tokens.reduce<Record<string, Token>>((acc, token) => {
        acc[token.key] = token;
        return acc;
      }, {}),
    [tokens]
  );

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

  const handleEditMetadata = (tokenKey: string) => {
    const canonical = tokenMap[tokenKey];
    if (!canonical) return;
    setMetadataToken(canonical);
  };

  const handleResetTokens = async () => {
    await initSeedDataIfNeeded(true);
    await loadData();
    addToast('Tokens reset to latest seed.', 'success');
  };

  const themeOptions = themes.length ? themes : [{ id: 'default', name: 'Default' } as Theme];

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-gray-500">Inventory</p>
          <h1 className="text-3xl font-bold text-gray-900">Tokens</h1>
          <p className="text-sm text-gray-500">Edit design tokens inline and track where they are used.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <button
            onClick={handleResetTokens}
            className="text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Reset tokens
          </button>
          <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('base')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'base' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
              aria-pressed={viewMode === 'base'}
            >
              Base tokens
            </button>
            <button
              onClick={() => setViewMode('themes')}
              className={`px-3 py-1.5 text-sm border-l border-gray-200 ${viewMode === 'themes' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
              aria-pressed={viewMode === 'themes'}
            >
              Themes (semantic)
            </button>
          </div>
          {viewMode === 'themes' && (
            <nav className="flex gap-2" aria-label="Themes">
              {themeOptions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedThemeId(t.id)}
                  className={`px-3 py-1.5 text-sm rounded-md border ${
                    selectedThemeId === t.id
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-current={selectedThemeId === t.id ? 'page' : undefined}
                >
                  {t.name}
                </button>
              ))}
            </nav>
          )}
          </div>
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

      <div className="border-b border-gray-200 mb-2">
        <nav className="flex gap-2" aria-label="Token types">
          {['all','color','size','spacing','shadow','font'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeTab(t as typeof typeTab)}
              className={`px-3 py-1.5 text-sm border-b-2 -mb-px capitalize ${
                typeTab === t ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
              aria-current={typeTab === t ? 'page' : undefined}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {typeTab === 'color' && viewMode === 'base' && baseColorFamilies.length > 0 && (
        <div className="border-b border-gray-100 mb-3">
          <nav className="flex flex-wrap gap-2" aria-label="Color families">
            <button
              onClick={() => setColorFamilyTab('all')}
              className={`px-2 py-1 text-xs rounded-full border ${
                colorFamilyTab === 'all'
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {baseColorFamilies.map((family) => (
              <button
                key={family}
                onClick={() => setColorFamilyTab(family)}
                className={`px-2 py-1 text-xs rounded-full capitalize border ${
                  colorFamilyTab === family
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {family}
              </button>
            ))}
          </nav>
        </div>
      )}

      <div className="space-y-8">
        {groupedByType.map((group) => (
          <section key={group.type} className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700 capitalize">{group.type}</h2>
            <TokenTable
              tokens={group.tokens}
              resolvedTokens={resolved}
              baseTokens={tokens}
              readOnly={viewMode === 'themes'}
              onSave={handleSaveToken}
              onDelete={handleDelete}
              onEditMetadata={handleEditMetadata}
            />
          </section>
        ))}
      </div>

      <TokenDrawer
        token={metadataToken}
        tokens={tokens}
        isOpen={Boolean(metadataToken)}
        onClose={() => setMetadataToken(null)}
        onSave={handleSaveToken}
      />

      {loading && <p className="text-sm text-gray-500">Loading tokens…</p>}
    </div>
  );
}

