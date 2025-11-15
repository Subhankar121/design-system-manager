import { ComponentDef, Preset, Token } from '@/types';
import { PreviewCanvas } from './PreviewCanvas';
import { resolveComponentTokens, tokenToCSSVar } from '@/lib/resolver';

interface PresetEditorProps {
  preset: Preset;
  tokens: Token[];
  components: ComponentDef[];
  resolvedTokens: Record<string, string>;
  selectedComponentId: string | null;
  onSelectComponent: (componentId: string | null) => void;
  onGlobalChange: (key: string, value: string) => void;
  onComponentOverrideChange: (componentId: string, tokenKey: string, value: string) => void;
  previewTokens: Record<string, string>;
  previewPreset: Preset | null;
  previewOptions: { id: string; name: string }[];
  previewPresetId: string;
  onPreviewPresetChange: (id: string) => void;
}

export function PresetEditor({
  preset,
  tokens,
  components,
  resolvedTokens,
  selectedComponentId,
  onSelectComponent,
  onGlobalChange,
  onComponentOverrideChange,
  previewTokens,
  previewPreset,
  previewOptions,
  previewPresetId,
  onPreviewPresetChange,
}: PresetEditorProps) {
  const selectedComponent =
    components.find((component) => component.id === selectedComponentId) ?? components[0] ?? null;
  const previewComponentTokens = selectedComponent
    ? resolveComponentTokens(selectedComponent, previewTokens, previewPreset || undefined)
    : previewTokens;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Global overrides</h2>
        <div className="max-h-[420px] overflow-y-auto pr-2 space-y-2">
          {tokens.map((token) => (
            <div key={token.key} className="border border-gray-200 rounded-lg p-3">
              <label className="flex items-center justify-between text-sm font-medium text-gray-700">
                {token.key}
                {preset.globalOverrides[token.key] && (
                  <button
                    onClick={() => onGlobalChange(token.key, '')}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Reset
                  </button>
                )}
              </label>
              <input
                type="text"
                value={preset.globalOverrides[token.key] ?? ''}
                placeholder={token.value}
                onChange={(event) => onGlobalChange(token.key, event.target.value)}
                className="mt-2 w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Base: {token.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lg:col-span-1 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Component overrides</h2>
        <div className="space-y-2">
          {components.map((component) => (
            <button
              key={component.id}
              onClick={() => onSelectComponent(component.id)}
              className={`w-full text-left border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                selectedComponent?.id === component.id
                  ? 'border-indigo-200 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-gray-900">{component.name}</p>
              <p className="text-xs text-gray-500">{component.structure.join(', ')}</p>
            </button>
          ))}
        </div>
        {selectedComponent && (
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{selectedComponent.name}</p>
              <p className="text-xs text-gray-500">{selectedComponent.tokensUsed.length} tokens</p>
            </div>
            {selectedComponent.tokensUsed.map((tokenKey) => (
              <div key={tokenKey} className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{tokenKey}</span>
                  {preset.componentOverrides[selectedComponent.id]?.[tokenKey] && (
                    <button
                      onClick={() => onComponentOverrideChange(selectedComponent.id, tokenKey, '')}
                      className="text-xs text-red-600"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={resolvedTokens[tokenKey] ?? ''}
                  value={
                    preset.componentOverrides[selectedComponent.id]?.[tokenKey] ??
                    ''
                  }
                  onChange={(event) =>
                    onComponentOverrideChange(selectedComponent.id, tokenKey, event.target.value)
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Live preview</h2>
          <select
            value={previewPresetId}
            onChange={(event) => onPreviewPresetChange(event.target.value)}
            className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {previewOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        <PreviewCanvas tokens={previewComponentTokens} component={selectedComponent} />
        <div className="text-xs text-gray-500">
          Tokens applied as CSS variables on the preview container (ex.{' '}
          <code>{tokenToCSSVar('color.primary')}</code>).
        </div>
      </section>
    </div>
  );
}

