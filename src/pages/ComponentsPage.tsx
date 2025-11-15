import { useEffect, useMemo, useState } from 'react';
import { ComponentDef, Preset, Token } from '@/types';
import { getComponents, getPresets, getTokens } from '@/lib/mockApi';
import { resolveComponentTokens, resolveTokens } from '@/lib/resolver';
import { ComponentInspectorDrawer } from '@/components/ComponentInspectorDrawer';
import { PreviewCanvas } from '@/components/PreviewCanvas';
import { AlertBanner } from '@/components/AlertBanner';

export function ComponentsPage() {
  const [components, setComponents] = useState<ComponentDef[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('default');
  const [selectedComponent, setSelectedComponent] = useState<ComponentDef | null>(null);

  const loadData = async () => {
    const [componentData, tokenData, presetData] = await Promise.all([
      getComponents(),
      getTokens(),
      getPresets(),
    ]);
    setComponents(componentData);
    setTokens(tokenData);
    setPresets(presetData);
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('dsm:change', handler);
    return () => window.removeEventListener('dsm:change', handler);
  }, []);

  const preset = presets.find((p) => p.id === selectedPreset) ?? null;
  const resolvedTokens = useMemo(() => resolveTokens(tokens, preset || undefined), [tokens, preset]);

  const highlightComponent = selectedComponent ?? components[0] ?? null;
  const componentTokens = highlightComponent
    ? resolveComponentTokens(highlightComponent, resolvedTokens, preset || undefined)
    : resolvedTokens;

  const missingA11y = components.filter((component) => !component.a11y?.description).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-gray-500">Registry</p>
          <h1 className="text-3xl font-bold text-gray-900">Components</h1>
          <p className="text-sm text-gray-500">Preview components with any preset and edit accessibility metadata.</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="component-preset" className="text-sm text-gray-600">
            Preview preset
          </label>
          <select
            id="component-preset"
            value={selectedPreset}
            onChange={(event) => setSelectedPreset(event.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {presets.map((presetOption) => (
              <option key={presetOption.id} value={presetOption.id}>
                {presetOption.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {missingA11y > 0 && (
        <AlertBanner
          type="warning"
          title="Accessibility descriptions missing"
          message={`${missingA11y} components need descriptions.`}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Component library</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {components.map((component) => (
              <button
                key={component.id}
                onClick={() => setSelectedComponent(component)}
                className={`text-left border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  selectedComponent?.id === component.id
                    ? 'border-indigo-200 bg-indigo-50/60'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{component.name}</p>
                    <p className="text-xs text-gray-500">{component.id}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      component.a11y?.description ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {component.a11y?.description ? 'A11y ready' : 'Missing a11y'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">{component.tokensUsed.length} tokens ·{' '}
                  {component.structure.join(', ')}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Live preview</h2>
            <p className="text-sm text-gray-500">
              Tokens applied via CSS variables scoped to this preview.
            </p>
          </div>
          <PreviewCanvas tokens={componentTokens} component={highlightComponent} />
          {highlightComponent && (
            <button
              onClick={() => setSelectedComponent(highlightComponent)}
              className="w-full text-center text-sm text-indigo-600 border border-indigo-200 rounded-md px-3 py-2 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Edit accessibility
            </button>
          )}
        </section>
      </div>

      <ComponentInspectorDrawer
        component={selectedComponent}
        isOpen={Boolean(selectedComponent)}
        onClose={() => setSelectedComponent(null)}
      />
    </div>
  );
}

