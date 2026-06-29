import { useEffect, useMemo, useState } from 'react';
import { ComponentDef, Theme, Token } from '@/types';
import { getComponents, getThemes, getTokens } from '@/lib/mockApi';
import { resolveTokens } from '@/lib/resolver';
import { MuiPreview } from '@/components/MuiPreview';
import { ThemedStage } from '@/components/ThemedStage';
import { ThemeOverview } from '@/components/ThemeOverview';
import { USE_CASES } from '@/lib/useCases';
import { MUI_MAPPING } from '@/lib/muiTheme';
import { generateThemeMarkdown } from '@/lib/exportDocs';
import { PageHeader } from '@/components/PageHeader';

// Live, generated documentation. Layout composed from the .ds-* primitive layer
// (token scale + roles), so spacing/structure stay consistent without per-element
// pixel tuning. MUI previews remain the real product surface.

export function DocsPage() {
  const [components, setComponents] = useState<ComponentDef[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<'components' | 'overview'>('components');
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');

  const load = async () => {
    const [c, t, th] = await Promise.all([getComponents(), getTokens(), getThemes()]);
    setComponents(c);
    setTokens(t);
    setThemes(th);
    setActiveId((prev) => prev ?? c[0]?.id ?? null);
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('dsm:change', handler);
    return () => window.removeEventListener('dsm:change', handler);
  }, []);

  const theme = themes.find((t) => t.id === selectedTheme) ?? null;
  const resolvedLight = useMemo(() => resolveTokens(tokens, theme || undefined, 'light'), [tokens, theme]);
  const resolvedDark = useMemo(() => resolveTokens(tokens, theme || undefined, 'dark'), [tokens, theme]);
  const resolved = colorMode === 'dark' ? resolvedDark : resolvedLight;
  const tokenMap = useMemo(() => {
    const m: Record<string, Token> = {};
    tokens.forEach((t) => { m[t.key] = t; });
    return m;
  }, [tokens]);

  const byCategory = useMemo(() => {
    const cats: Record<string, ComponentDef[]> = {};
    components.forEach((c) => {
      const cat = c.category || 'Uncategorized';
      (cats[cat] ||= []).push(c);
    });
    return cats;
  }, [components]);

  const active = components.find((c) => c.id === activeId) || null;
  const overrides = active ? theme?.components?.[active.id] : undefined;

  const exportDocs = () => {
    if (!theme) return;
    const md = generateThemeMarkdown(theme, components, tokens, resolved);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-design-system.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ds-stack-lg">
      <PageHeader
        badge="Documentation"
        title="Design System Docs"
        description="Live, generated reference for every component — its real rendering, token decisions, variants, and accessibility notes."
      />

      {/* Toolbar */}
      <div className="ds-card ds-card-pad-sm">
        <div className="ds-row">
          <div className="ds-seg">
            {(['components', 'overview'] as const).map((m) => (
              <button key={m} className={mode === m ? 'is-active' : ''} onClick={() => setMode(m)}>
                {m === 'overview' ? 'Theme overview' : 'Components'}
              </button>
            ))}
          </div>

          <label className="ds-muted" style={{ fontSize: 13, marginLeft: 4 }}>Theme</label>
          <select className="ds-select" value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
            {themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <div className="ds-seg" role="group" aria-label="Color mode">
            {(['light', 'dark'] as const).map((m) => (
              <button key={m} className={colorMode === m ? 'is-active' : ''} onClick={() => setColorMode(m)}>
                {m}
              </button>
            ))}
          </div>

          <span className="ds-spacer" />
          <button className="ds-btn" onClick={exportDocs}>Export docs (.md)</button>
        </div>
      </div>

      {mode === 'overview' ? (
        <ThemeOverview components={components} tokens={tokens} resolvedLight={resolvedLight} resolvedDark={resolvedDark} colorMode={colorMode} />
      ) : (
        <div className="ds-docs-layout">
          {/* Sidebar */}
          <nav className="ds-stack-md" style={{ position: 'sticky', top: 16, alignSelf: 'start' }} aria-label="Component list">
            {Object.entries(byCategory).map(([cat, list]) => (
              <div key={cat} className="ds-stack-sm">
                <p className="ds-navgroup-title">{cat}</p>
                {list.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`ds-navlink ${c.id === activeId ? 'is-active' : ''}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* Documentation body */}
          {active && (
            <article className="ds-stack-lg" style={{ minWidth: 0 }}>
              <header className="ds-stack-sm">
                <p className="ds-eyebrow">{active.category}</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: 'var(--ds-fg)' }}>{active.name}</h2>
                <div className="ds-row" style={{ gap: 8 }}>
                  <code className="ds-mono ds-muted">{active.id}</code>
                  <span className="ds-faint">•</span>
                  <span className="ds-muted" style={{ fontSize: 12 }}>Renders as {MUI_MAPPING[active.id] || 'MUI component'}</span>
                </div>
              </header>

              {/* Live preview */}
              <section className="ds-stack-sm">
                <h3 className="ds-section-title">Live preview</h3>
                <div className="ds-frame">
                  <MuiPreview component={active} tokens={resolved} overrides={overrides} variantId={active.variants?.[0]?.id} mode={colorMode} />
                </div>
              </section>

              {/* Variants */}
              {active.variants && active.variants.length > 0 && (
                <section className="ds-stack-md">
                  <h3 className="ds-section-title">Variants</h3>
                  <div className="ds-grid-2">
                    {active.variants.map((v) => (
                      <div key={v.id} className="ds-frame">
                        <div className="ds-frame-head">
                          <p className="ds-frame-title">{v.name}</p>
                          {v.description && <p className="ds-frame-sub">{v.description}</p>}
                        </div>
                        <MuiPreview component={active} tokens={resolved} overrides={overrides} variantId={v.id} mode={colorMode} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Token decisions */}
              <section className="ds-stack-sm">
                <h3 className="ds-section-title">Token decisions</h3>
                <p className="ds-section-sub">The decisions this component encodes — what each token is <em>for</em>, not just its value.</p>
                <div className="ds-frame ds-table-wrap">
                  <table className="ds-table">
                    <thead>
                      <tr><th>Token</th><th>Intent</th><th>Value</th></tr>
                    </thead>
                    <tbody>
                      {active.tokensUsed.map((key) => {
                        const tok = tokenMap[key];
                        const value = resolved[key] ?? tok?.value ?? '—';
                        const isColor = tok?.type === 'color';
                        return (
                          <tr key={key}>
                            <td><code className="ds-mono">{key}</code></td>
                            <td className="ds-muted">{tok?.description || '—'}</td>
                            <td>
                              <span className="ds-row" style={{ gap: 8 }}>
                                {isColor && <span className="ds-swatch" style={{ backgroundColor: value }} />}
                                <code className="ds-mono">{value}</code>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Usage / use cases */}
              {USE_CASES[active.id] && (
                <section className="ds-stack-md">
                  <div>
                    <h3 className="ds-section-title">Usage</h3>
                    <p className="ds-section-sub">How and when to use this component, in real compositions.</p>
                  </div>

                  <div className="ds-stack-md">
                    {USE_CASES[active.id].cases.map((uc) => (
                      <div key={uc.title} className="ds-frame">
                        <div className="ds-frame-head">
                          <p className="ds-frame-title">{uc.title}</p>
                          <p className="ds-frame-sub">{uc.description}</p>
                        </div>
                        <ThemedStage tokens={resolved} mode={colorMode}>{uc.node}</ThemedStage>
                      </div>
                    ))}
                  </div>

                  <div className="ds-grid-2">
                    <div className="ds-note good">
                      <p className="ds-note-title">Do</p>
                      <ul>
                        {USE_CASES[active.id].guidance.do.map((d) => (
                          <li key={d}><span aria-hidden>✓</span><span>{d}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="ds-note bad">
                      <p className="ds-note-title">Don't</p>
                      <ul>
                        {USE_CASES[active.id].guidance.dont.map((d) => (
                          <li key={d}><span aria-hidden>✗</span><span>{d}</span></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              {/* Accessibility */}
              {active.a11y?.description && (
                <section className="ds-stack-sm">
                  <h3 className="ds-section-title">Accessibility</h3>
                  <div className="ds-note good">{active.a11y.description}</div>
                </section>
              )}
            </article>
          )}
        </div>
      )}
    </div>
  );
}
