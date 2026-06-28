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

// Phase A — per-component documentation, generated live from the same engine
// that renders the previews. Always true to the selected theme: real component,
// its token decisions (intent, not just value), variants, and a11y.

export function DocsPage() {
  const [components, setComponents] = useState<ComponentDef[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<'components' | 'overview'>('components');

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
  const resolved = useMemo(() => resolveTokens(tokens, theme || undefined), [tokens, theme]);
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

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Documentation"
        title="Design System Docs"
        description="Live, generated reference for every component — its real rendering, token decisions, variants, and accessibility notes."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
          {(['components', 'overview'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                mode === m ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'overview' ? 'Theme overview' : 'Components'}
            </button>
          ))}
        </div>

        <label className="text-sm text-gray-600 ml-2">Theme</label>
        <select
          value={selectedTheme}
          onChange={(e) => setSelectedTheme(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <button
          onClick={() => {
            if (!theme) return;
            const md = generateThemeMarkdown(theme, components, tokens, resolved);
            const blob = new Blob([md], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${theme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-design-system.md`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Export docs (.md)
        </button>
      </div>

      {mode === 'overview' ? (
        <ThemeOverview components={components} tokens={tokens} resolved={resolved} />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar */}
        <nav className="lg:sticky lg:top-4 self-start space-y-5" aria-label="Component list">
          {Object.entries(byCategory).map(([cat, list]) => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{cat}</p>
              <ul className="space-y-0.5">
                {list.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                        c.id === activeId ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Documentation body */}
        {active && (
          <article className="space-y-8 min-w-0">
            <header>
              <p className="text-xs uppercase tracking-wide text-gray-400">{active.category}</p>
              <h2 className="text-2xl font-semibold text-gray-900">{active.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs text-gray-500">{active.id}</code>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-500">Renders as {MUI_MAPPING[active.id] || 'MUI component'}</span>
              </div>
            </header>

            {/* Live preview */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Live preview</h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <MuiPreview component={active} tokens={resolved} overrides={overrides} variantId={active.variants?.[0]?.id} />
              </div>
            </section>

            {/* Variants */}
            {active.variants && active.variants.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Variants</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {active.variants.map((v) => (
                    <div key={v.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="border-b border-gray-100 px-4 py-2 bg-gray-50">
                        <p className="text-sm font-medium text-gray-800">{v.name}</p>
                        {v.description && <p className="text-xs text-gray-500">{v.description}</p>}
                      </div>
                      <MuiPreview component={active} tokens={resolved} overrides={overrides} variantId={v.id} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Token decisions */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Token decisions</h3>
              <p className="text-xs text-gray-500">The decisions this component encodes — what each token is <em>for</em>, not just its value.</p>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Token</th>
                      <th className="text-left font-medium px-4 py-2">Intent</th>
                      <th className="text-left font-medium px-4 py-2">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {active.tokensUsed.map((key) => {
                      const tok = tokenMap[key];
                      const value = resolved[key] ?? tok?.value ?? '—';
                      const isColor = tok?.type === 'color';
                      return (
                        <tr key={key}>
                          <td className="px-4 py-2"><code className="text-xs text-gray-700">{key}</code></td>
                          <td className="px-4 py-2 text-gray-600">{tok?.description || '—'}</td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center gap-2">
                              {isColor && <span className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: value }} />}
                              <code className="text-xs text-gray-700">{value}</code>
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
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Usage</h3>
                  <p className="text-xs text-gray-500">How and when to use this component, in real compositions.</p>
                </div>

                <div className="space-y-5">
                  {USE_CASES[active.id].cases.map((uc) => (
                    <div key={uc.title} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="border-b border-gray-100 px-4 py-2 bg-gray-50">
                        <p className="text-sm font-medium text-gray-800">{uc.title}</p>
                        <p className="text-xs text-gray-500">{uc.description}</p>
                      </div>
                      <ThemedStage tokens={resolved}>{uc.node}</ThemedStage>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-2">Do</p>
                    <ul className="space-y-1.5">
                      {USE_CASES[active.id].guidance.do.map((d) => (
                        <li key={d} className="flex gap-2 text-sm text-emerald-900"><span aria-hidden>✓</span><span>{d}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 mb-2">Don't</p>
                    <ul className="space-y-1.5">
                      {USE_CASES[active.id].guidance.dont.map((d) => (
                        <li key={d} className="flex gap-2 text-sm text-rose-900"><span aria-hidden>✗</span><span>{d}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Accessibility */}
            {active.a11y?.description && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Accessibility</h3>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  {active.a11y.description}
                </div>
              </section>
            )}
          </article>
        )}
      </div>
      )}
    </div>
  );
}
