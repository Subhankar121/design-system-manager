import { ComponentDef, Preset, Token } from '@/types';

interface Props {
  token: Token | null;
  components: ComponentDef[];
  presets: Preset[];
  isOpen: boolean;
  onClose: () => void;
}

export function TokenUsageDrawer({ token, components, presets, isOpen, onClose }: Props) {
  if (!isOpen || !token) return null;

  const componentUses = components.filter((component) => component.tokensUsed.includes(token.key));
  const presetOverrides = presets.filter(
    (preset) =>
      preset.globalOverrides[token.key] ||
      Object.values(preset.componentOverrides || {}).some((map) => map[token.key])
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />
      <aside
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-usage-title"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-gray-500 mb-1">Token</p>
              <h2 id="token-usage-title" className="text-xl font-semibold text-gray-900">
                {token.key}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
              aria-label="Close token usage drawer"
            >
              ×
            </button>
          </div>

          <section>
            <h3 className="text-sm font-semibold text-gray-700">Components using this token</h3>
            {componentUses.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">No components reference this token.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {componentUses.map((component) => (
                  <li
                    key={component.id}
                    className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{component.name}</p>
                      <p className="text-xs text-gray-500">{component.id}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {component.structure.length} regions · {component.tokensUsed.length} tokens
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-700">Presets overriding this token</h3>
            {presetOverrides.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">No presets override this token.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {presetOverrides.map((preset) => (
                  <li
                    key={preset.id}
                    className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{preset.name}</p>
                      <p className="text-xs text-gray-500">{preset.id}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {preset.globalOverrides[token.key] ? 'Global override' : 'Component override'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}

