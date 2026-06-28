import { useEffect, useMemo, useState } from 'react';
import { ComponentDef, Theme, Token } from '@/types';
import { MuiPreview } from './MuiPreview';
import { resolveComponentTokens, tokenToCSSVar } from '@/lib/resolver';
import { ColorTokenSelect } from './ColorTokenSelect';

interface ThemeEditorProps {
  theme: Theme;
  tokens: Token[];
  components: ComponentDef[];
  resolvedTokens: Record<string, string>;
  selectedComponentId: string | null;
  onSelectComponent: (componentId: string | null) => void;
  onComponentOverrideChange: (componentId: string, tokenKey: string, value: string) => void;
  previewTokens: Record<string, string>;
  previewTheme: Theme | null;
  previewOptions: { id: string; name: string }[];
  previewThemeId: string;
  onPreviewThemeChange: (id: string) => void;
  onOpenGlobalOverrides: () => void;
}

export function ThemeEditor({
  theme,
  tokens,
  components,
  resolvedTokens,
  selectedComponentId,
  onSelectComponent,
  onComponentOverrideChange,
  previewTokens,
  previewTheme,
  previewOptions,
  previewThemeId,
  onPreviewThemeChange,
  onOpenGlobalOverrides,
}: ThemeEditorProps) {
  const [componentVariantMap, setComponentVariantMap] = useState<Record<string, string | null>>({});
  const [activeTokenTab, setActiveTokenTab] = useState<'all'|'color'|'size'|'spacing'|'shadow'|'font'>('all');
  const tokenMap = useMemo(
    () =>
      tokens.reduce<Record<string, Token>>((acc, token) => {
        acc[token.key] = token;
        return acc;
      }, {}),
    [tokens]
  );

  const selectedComponent =
    components.find((component) => component.id === selectedComponentId) ?? components[0] ?? null;
  const selectedVariantId =
    selectedComponent && selectedComponent.variants?.length
      ? componentVariantMap[selectedComponent.id] ?? selectedComponent.variants[0].id
      : null;

  useEffect(() => {
    setComponentVariantMap((prev) => {
      const next = { ...prev };
      let changed = false;
      components.forEach((component) => {
        if (next[component.id] === undefined) {
          next[component.id] = component.variants?.[0]?.id ?? null;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [components]);

  const compatibleTokensByType = useMemo(() => {
    return tokens.reduce<Record<Token['type'], Token[]>>((acc, token) => {
      acc[token.type] = acc[token.type] || [];
      acc[token.type].push(token);
      return acc;
    }, {} as Record<Token['type'], Token[]>);
  }, [tokens]);

  const applyTokenPreset = (
    componentId: string,
    tokenKey: string,
    presetTokenKey: string
  ) => {
    const presetToken = tokens.find((t) => t.key === presetTokenKey);
    if (!presetToken) return;
    onComponentOverrideChange(componentId, tokenKey, presetToken.value);
  };

  const handleVariantSelect = (componentId: string, variantId: string | null) => {
    setComponentVariantMap((prev) => ({
      ...prev,
      [componentId]: variantId,
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Components</h2>
          {theme.id === 'default' && (
            <button
              onClick={onOpenGlobalOverrides}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Edit global overrides
            </button>
          )}
        </div>
        <div className="space-y-3">
          {components.map((component) => {
            const isSelected = selectedComponent?.id === component.id;

            return (
              <article
                key={component.id}
                className={`border rounded-xl px-3 py-2 transition-colors ${
                  isSelected ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-white'
                }`}
              >
                <button
                  onClick={() => onSelectComponent(component.id)}
                  className="w-full text-left"
                  aria-expanded={isSelected}
                >
                  <p className="font-semibold text-gray-900">{component.name}</p>
                  <p className="text-xs text-gray-500">
                    {component.structure.join(', ')} · {component.tokensUsed.length} tokens
                  </p>
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Live preview</h2>
          <select
            value={previewThemeId}
            onChange={(event) => onPreviewThemeChange(event.target.value)}
            className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {previewOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        {selectedComponent ? (
          <div className="space-y-4">
            {selectedComponent.variants && selectedComponent.variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 tracking-wide">Variants</p>
                <div className="flex flex-wrap gap-2">
                  {selectedComponent.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() =>
                        handleVariantSelect(selectedComponent.id, variant.id)
                      }
                      className={`px-2 py-1 rounded-full border text-xs ${
                        selectedVariantId === variant.id
                          ? 'border-indigo-400 bg-indigo-100 text-indigo-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {variant.name}
                    </button>
                  ))}
                </div>
                {selectedVariantId && (
                  <p className="text-[11px] text-gray-500">
                    {
                      selectedComponent.variants?.find((v) => v.id === selectedVariantId)
                        ?.description
                    }
                  </p>
                )}
              </div>
            )}

            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <MuiPreview
                tokens={previewTokens}
                component={selectedComponent}
                overrides={selectedComponent ? previewTheme?.components?.[selectedComponent.id] : undefined}
                variantId={selectedVariantId}
              />
            </div>

        <div className="text-xs text-gray-500">
          Tokens applied as CSS variables on the preview container (ex.{' '}
          <code>{tokenToCSSVar('semantic.color.primary')}</code>).
        </div>

            {/* Token grouping tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex gap-2" aria-label="Token groups">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'color', label: 'Color' },
                  { id: 'size', label: 'Size' },
                  { id: 'spacing', label: 'Spacing' },
                  { id: 'shadow', label: 'Shadow' },
                  { id: 'font', label: 'Font' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTokenTab(tab.id as typeof activeTokenTab)}
                    className={`px-3 py-1.5 text-xs border-b-2 -mb-px ${
                      activeTokenTab === (tab.id as typeof activeTokenTab)
                        ? 'border-indigo-500 text-indigo-700'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                    aria-current={activeTokenTab === (tab.id as typeof activeTokenTab) ? 'page' : undefined}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="space-y-3">
              {selectedComponent.tokensUsed
                .filter((tokenKey) => {
                  if (activeTokenTab === 'all') return true;
                  const meta = tokenMap[tokenKey];
                  return meta?.type === activeTokenTab;
                })
                .map((tokenKey) => {
                const meta = tokenMap[tokenKey];
                const componentDraftTokens = resolveComponentTokens(
                  selectedComponent,
                  resolvedTokens,
                  theme || undefined
                );
                const overrideValue =
                  theme.components[selectedComponent.id]?.[tokenKey] ?? '';
                const baseValue = componentDraftTokens[tokenKey] ?? '';
                const compatibleTokens = meta ? compatibleTokensByType[meta.type] || [] : [];
                return (
                  <div
                    key={tokenKey}
                    className="text-sm space-y-2 border border-gray-100 rounded-lg p-3 bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-800 font-medium">{tokenKey}</span>
                      <div className="flex items-center gap-2">
                        {theme.components[selectedComponent.id]?.[tokenKey] && (
                          <button
                            onClick={() =>
                              onComponentOverrideChange(selectedComponent.id, tokenKey, '')
                            }
                            className="text-xs text-red-600"
                          >
                            Reset
                          </button>
                        )}
                        <button
                          onClick={() =>
                            onComponentOverrideChange(selectedComponent.id, tokenKey, baseValue)
                          }
                          className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50"
                        >
                          Use base
                        </button>
                      </div>
                    </div>
                    {meta?.description && (
                      <p className="text-xs text-gray-500">{meta.description}</p>
                    )}
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={baseValue}
                      value={overrideValue}
                      onChange={(event) =>
                        onComponentOverrideChange(
                          selectedComponent.id,
                          tokenKey,
                          event.target.value
                        )
                      }
                    />
                    {meta?.type === 'color' && meta.contrastAgainst && (
                      <p className="text-[11px] text-gray-400">
                        Contrast ≥ {meta.contrastMin ?? 4.5}:1 vs {meta.contrastAgainst}
                      </p>
                    )}
                    {compatibleTokens.length > 0 && (
                      meta?.type === 'color' ? (
                        <ColorTokenSelect
                          value=""
                          onChange={(presetTokenKey) => {
                            if (presetTokenKey) {
                              applyTokenPreset(selectedComponent.id, tokenKey, presetTokenKey);
                            }
                          }}
                          options={compatibleTokens}
                          placeholder="Apply from token…"
                        />
                      ) : (
                        <select
                          defaultValue=""
                          className="w-full border border-dashed border-gray-300 rounded-md px-3 py-2 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          onChange={(event) => {
                            const presetTokenKey = event.target.value;
                            if (!presetTokenKey) return;
                            applyTokenPreset(selectedComponent.id, tokenKey, presetTokenKey);
                            event.target.selectedIndex = 0;
                          }}
                        >
                          <option value="">Apply from token…</option>
                          {compatibleTokens.map((tokenOption) => (
                            <option key={tokenOption.key} value={tokenOption.key}>
                              {tokenOption.key} ({tokenOption.value})
                            </option>
                          ))}
                        </select>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-6">
            Select a component to view its variants, preview, and override tokens.
          </div>
        )}
      </section>
    </div>
  );
}

