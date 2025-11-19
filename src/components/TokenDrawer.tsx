import { Token, TokenType } from '@/types';
import { validateTokenValue } from '@/lib/resolver';
import { useState, useEffect, useMemo } from 'react';

interface TokenDrawerProps {
  token: Token | null;
  tokens: Token[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (token: Token) => void | Promise<void>;
}

const DEFAULT_COLOR_TARGET = 'semantic.color.surface';
const DEFAULT_CONTRAST_MIN = 4.5;

export function TokenDrawer({ token, tokens, isOpen, onClose, onSave }: TokenDrawerProps) {
  const [formData, setFormData] = useState<Token>({
    key: '',
    type: 'color',
    value: '',
    contrastAgainst: DEFAULT_COLOR_TARGET,
    contrastMin: DEFAULT_CONTRAST_MIN,
  });
  const [error, setError] = useState<string | null>(null);

  const colorOptions = useMemo(
    () => tokens.filter((t) => t.type === 'color').map((t) => t.key),
    [tokens]
  );
  const contrastOptions = useMemo(
    () =>
      Array.from(new Set([DEFAULT_COLOR_TARGET, 'semantic.color.surface.alt', ...colorOptions])),
    [colorOptions]
  );

  useEffect(() => {
    if (token) {
      setFormData(token);
      setError(null);
    } else {
      setFormData({
        key: '',
        type: 'color',
        value: '',
        contrastAgainst: DEFAULT_COLOR_TARGET,
        contrastMin: DEFAULT_CONTRAST_MIN,
      });
      setError(null);
    }
  }, [token]);

  const handleTypeChange = (nextType: TokenType) => {
    setFormData((prev) => ({
      ...prev,
      type: nextType,
      ...(nextType === 'color'
        ? {
            contrastAgainst: prev.contrastAgainst ?? DEFAULT_COLOR_TARGET,
            contrastMin: prev.contrastMin ?? DEFAULT_CONTRAST_MIN,
          }
        : {
            contrastAgainst: undefined,
            contrastMin: undefined,
          }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateTokenValue(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!formData.key.trim()) {
      setError('Key is required');
      return;
    }

    await onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 id="drawer-title" className="text-xl font-semibold text-gray-900">
              {token ? 'Edit Token' : 'Create Token'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
              aria-label="Close drawer"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
                Key
              </label>
              <input
                id="key"
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value as TokenType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                aria-required="true"
              >
                <option value="color">Color</option>
                <option value="size">Size</option>
                <option value="shadow">Shadow</option>
                <option value="font">Font</option>
                <option value="spacing">Spacing</option>
              </select>
            </div>

            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                Value
              </label>
              <input
                id="value"
                type="text"
                value={formData.value}
                onChange={(e) => {
                  setFormData({ ...formData, value: e.target.value });
                  setError(null);
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
                required
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'value-error' : undefined}
              />
              {error && (
                <p id="value-error" className="mt-1 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description ?? ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Explain how this token is used."
              />
            </div>

            {formData.type === 'color' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="contrast-against"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Contrast against
                  </label>
                  <select
                    id="contrast-against"
                    value={formData.contrastAgainst ?? DEFAULT_COLOR_TARGET}
                    onChange={(e) => setFormData({ ...formData, contrastAgainst: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {contrastOptions.map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Background token for contrast checks.</p>
                </div>
                <div>
                  <label
                    htmlFor="contrast-min"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Minimum ratio
                  </label>
                  <input
                    id="contrast-min"
                    type="number"
                    step="0.1"
                    min="1"
                    value={formData.contrastMin ?? DEFAULT_CONTRAST_MIN}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contrastMin: Number(e.target.value) || DEFAULT_CONTRAST_MIN,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Target WCAG ratio (ex: 4.5, 7).</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

