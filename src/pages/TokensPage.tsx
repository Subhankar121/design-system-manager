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
import { PageHeader } from '@/components/PageHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { HelpBox } from '@/components/HelpBox';
import { EmptyState } from '@/components/EmptyState';

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
    <div className="space-y-8">
      <PageHeader
        badge="Design Token System"
        title="Design Tokens"
        description="Manage your design system's foundational values. Base tokens define primitives, semantic tokens create meaningful aliases."
        actions={
          <button
            onClick={handleResetTokens}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            title="Reset to seed data"
          >
            Reset to defaults
          </button>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">View</label>
          <div className="flex items-center rounded-md border border-gray-300 bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode('base')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'base' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              aria-pressed={viewMode === 'base'}
            >
              Base tokens
            </button>
            <button
              onClick={() => setViewMode('themes')}
              className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                viewMode === 'themes' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              aria-pressed={viewMode === 'themes'}
            >
              Semantic tokens
            </button>
          </div>
        </div>
        {viewMode === 'themes' && themes.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Theme</label>
            <nav className="flex gap-2" aria-label="Select theme">
              {themeOptions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedThemeId(t.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                    selectedThemeId === t.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-current={selectedThemeId === t.id ? 'page' : undefined}
                >
                  {t.name}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {viewMode === 'base' ? (
        <HelpBox title="About base tokens" variant="info">
          <p className="mb-2">Base tokens are the foundational design values in your system:</p>
          <ul className="space-y-1 text-sm list-disc list-inside">
            <li><strong>Colors:</strong> Raw color values organized by family (e.g., gray.100, blue.500)</li>
            <li><strong>Spacing:</strong> Fixed measurements for padding, margins, and gaps</li>
            <li><strong>Typography:</strong> Font families, sizes, and weights</li>
            <li><strong>Effects:</strong> Shadows, border radius, and other visual properties</li>
          </ul>
          <p className="mt-2 text-sm">💡 Base tokens should rarely change - they're your design constants.</p>
        </HelpBox>
      ) : (
        <HelpBox title="About semantic tokens" variant="tip">
          <p className="mb-2">Semantic tokens create meaningful aliases that map to base tokens:</p>
          <ul className="space-y-1 text-sm list-disc list-inside">
            <li><strong>Purpose-driven:</strong> Names describe intent (e.g., "primary", "surface", "danger")</li>
            <li><strong>Theme-aware:</strong> Override values per theme to create brand variations</li>
            <li><strong>Context-specific:</strong> Adapt to different use cases (light/dark mode, brands)</li>
          </ul>
          <p className="mt-2 text-sm">💡 Components reference semantic tokens, making theme switching seamless.</p>
        </HelpBox>
      )}

      {invalidTokens.length > 0 && (
        <AlertBanner
          type="error"
          title="Validation errors detected"
          message={`${invalidTokens.length} token${invalidTokens.length > 1 ? 's have' : ' has'} invalid values. Fix ${invalidTokens.length > 1 ? 'these' : 'this'} before publishing to prevent breaking changes.`}
          actionLabel="Jump to first error"
          onAction={() => {
            const invalid = invalidTokens[0];
            document.getElementById(`token-input-${invalid.key}`)?.focus();
          }}
        />
      )}

      {displayTokens.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          }
          title={`No ${viewMode === 'base' ? 'base' : 'semantic'} tokens found`}
          description={`${viewMode === 'base' ? 'Base tokens define your design primitives.' : 'Semantic tokens create meaningful aliases for your UI.'} Load demo data to get started.`}
          action={{
            label: 'Load demo tokens',
            onClick: handleResetTokens
          }}
        />
      ) : (
        <>
          <section>
            <SectionHeader
              title={`Filter by type${typeTab !== 'all' ? `: ${typeTab}` : ''}`}
              description="Browse tokens by category or view all at once"
              badge={`${displayTokens.length} token${displayTokens.length !== 1 ? 's' : ''}`}
            />
            <div className="border-b border-gray-200">
              <nav className="flex gap-1" aria-label="Filter by token type">
                {(['all','color','size','spacing','shadow','font'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeTab(t)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
                      typeTab === t 
                        ? 'border-indigo-500 text-indigo-700 bg-indigo-50/50' 
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                    aria-current={typeTab === t ? 'page' : undefined}
                  >
                    {t === 'all' ? 'All types' : t}
                  </button>
                ))}
              </nav>
            </div>
          </section>

          {typeTab === 'color' && viewMode === 'base' && baseColorFamilies.length > 0 && (
            <section className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color family
              </label>
              <nav className="flex flex-wrap gap-2" aria-label="Filter by color family">
                <button
                  onClick={() => setColorFamilyTab('all')}
                  className={`px-3 py-1.5 text-sm rounded-md border font-medium transition-colors ${
                    colorFamilyTab === 'all'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All families
                </button>
                {baseColorFamilies.map((family) => (
                  <button
                    key={family}
                    onClick={() => setColorFamilyTab(family)}
                    className={`px-3 py-1.5 text-sm rounded-md border capitalize font-medium transition-colors ${
                      colorFamilyTab === family
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {family}
                  </button>
                ))}
              </nav>
            </section>
          )}

          <div className="space-y-8">
            {groupedByType.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-sm text-gray-600">
                  No {typeTab !== 'all' ? typeTab : ''} tokens found{colorFamilyTab !== 'all' ? ` in the ${colorFamilyTab} family` : ''}.
                </p>
                {(typeTab !== 'all' || colorFamilyTab !== 'all') && (
                  <button
                    onClick={() => {
                      setTypeTab('all');
                      setColorFamilyTab('all');
                    }}
                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              groupedByType.map((group) => (
                <section key={group.type} className="space-y-3">
                  <SectionHeader
                    title={group.type.charAt(0).toUpperCase() + group.type.slice(1)}
                    badge={`${group.tokens.length}`}
                    description={
                      viewMode === 'themes'
                        ? `Showing resolved values for ${activeTheme?.name ?? 'default'} theme`
                        : undefined
                    }
                  />
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
              ))
            )}
          </div>
        </>
      )}

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

