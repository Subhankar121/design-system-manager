import { useState, useMemo } from 'react';
import { Theme, Token } from '@/types';
import { resolveTokens } from '@/lib/resolver';

interface GlobalOverridesModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  tokens: Token[];
  onSave: (overrides: Record<string, string>) => void;
}

const SEMANTIC_KEYS: { key: string; type: Token['type']; label: string }[] = [
  { key: 'semantic.color.surface', type: 'color', label: 'Surface' },
  { key: 'semantic.color.surface.alt', type: 'color', label: 'Surface (Alt)' },
  { key: 'semantic.color.text', type: 'color', label: 'Text' },
  { key: 'semantic.color.text.muted', type: 'color', label: 'Text (Muted)' },
  { key: 'semantic.color.border', type: 'color', label: 'Border' },
  { key: 'semantic.color.primary', type: 'color', label: 'Primary accent' },
  { key: 'semantic.color.secondary', type: 'color', label: 'Secondary accent' },
  { key: 'semantic.color.accent', type: 'color', label: 'Interactive accent' },
  { key: 'semantic.color.success', type: 'color', label: 'Success' },
  { key: 'semantic.color.warning', type: 'color', label: 'Warning' },
  { key: 'semantic.color.danger', type: 'color', label: 'Danger' },
  { key: 'semantic.color.info', type: 'color', label: 'Info' },
  { key: 'semantic.radius.sm', type: 'size', label: 'Radius / small' },
  { key: 'semantic.radius.md', type: 'size', label: 'Radius / medium' },
  { key: 'semantic.radius.lg', type: 'size', label: 'Radius / large' },
  { key: 'semantic.spacing.xs', type: 'spacing', label: 'Spacing / xs' },
  { key: 'semantic.spacing.sm', type: 'spacing', label: 'Spacing / sm' },
  { key: 'semantic.spacing.md', type: 'spacing', label: 'Spacing / md' },
  { key: 'semantic.spacing.lg', type: 'spacing', label: 'Spacing / lg' },
  { key: 'semantic.spacing.xl', type: 'spacing', label: 'Spacing / xl' },
  { key: 'semantic.shadow.xs', type: 'shadow', label: 'Shadow / xs' },
  { key: 'semantic.shadow.medium', type: 'shadow', label: 'Shadow / medium' },
  { key: 'semantic.shadow.deep', type: 'shadow', label: 'Shadow / deep' },
  { key: 'semantic.shadow.large', type: 'shadow', label: 'Shadow / large' },
  { key: 'semantic.font.base', type: 'font', label: 'Body font' },
  { key: 'semantic.font.display', type: 'font', label: 'Display font' },
];

export function GlobalOverridesModal({
  isOpen,
  onClose,
  theme,
  tokens,
  onSave,
}: GlobalOverridesModalProps) {
  const [localOverrides, setLocalOverrides] = useState<Record<string, string>>(
    theme.globalOverrides || {}
  );
  const [activeTab, setActiveTab] = useState<Token['type'] | 'all'>('all');

  const tokenMap = useMemo(() => {
    return tokens.reduce<Record<string, Token>>((acc, t) => {
      acc[t.key] = t;
      return acc;
    }, {});
  }, [tokens]);

  const resolvedTokens = useMemo(() => {
    return resolveTokens(tokens, theme);
  }, [tokens, theme]);

  const filteredKeys = useMemo(() => {
    if (activeTab === 'all') return SEMANTIC_KEYS;
    return SEMANTIC_KEYS.filter((k) => k.type === activeTab);
  }, [activeTab]);

  const handleChange = (key: string, value: string) => {
    setLocalOverrides((prev) => {
      const next = { ...prev };
      if (value) {
        next[key] = value;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const handleSave = () => {
    onSave(localOverrides);
    onClose();
  };

  const handleCancel = () => {
    setLocalOverrides(theme.globalOverrides || {});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={handleCancel} aria-hidden="true" />
      <aside
        className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[520px] bg-white border-l border-gray-200 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Edit global overrides"
      >
        <div className="h-full flex flex-col">
          <header className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-gray-500">Theme</p>
              <h2 className="text-lg font-semibold text-gray-900">Edit global overrides</h2>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Close modal"
            >
              Close
            </button>
          </header>

          {/* Type filter tabs */}
          <div className="px-5 py-3 border-b border-gray-100">
            <nav className="flex gap-2" aria-label="Token type filter">
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
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-3 py-1.5 text-xs border-b-2 -mb-px ${
                    activeTab === (tab.id as typeof activeTab)
                      ? 'border-indigo-500 text-indigo-700'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                  aria-current={activeTab === (tab.id as typeof activeTab) ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {filteredKeys.map(({ key, label }) => {
              const token = tokenMap[key];
              const baseValue = resolvedTokens[key] ?? '';
              const overrideValue = localOverrides[key] ?? '';
              const hasOverride = !!localOverrides[key];

              return (
                <div
                  key={key}
                  className="border border-gray-200 rounded-lg p-3 bg-white space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 font-mono">{key}</p>
                      {token?.description && (
                        <p className="text-xs text-gray-500 mt-1">{token.description}</p>
                      )}
                      {token?.type === 'color' && token.contrastAgainst && (
                        <p className="text-[11px] text-gray-400 mt-1">
                          Contrast ≥ {token.contrastMin ?? 4.5}:1 vs {token.contrastAgainst}
                        </p>
                      )}
                    </div>
                    {hasOverride && (
                      <button
                        onClick={() => handleChange(key, '')}
                        className="text-xs text-red-600 hover:text-red-800 ml-2"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={overrideValue}
                    placeholder={baseValue}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500">Base: {baseValue}</p>
                </div>
              );
            })}
          </div>

          <footer className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Save changes
            </button>
          </footer>
        </div>
      </aside>
    </>
  );
}

