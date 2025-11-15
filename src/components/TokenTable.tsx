import { ComponentDef, Preset, Token } from '@/types';
import { getContrastRatio, aaAARating, validateTokenValue } from '@/lib/resolver';
import { useEffect, useMemo, useState } from 'react';

interface TokenTableProps {
  tokens: Token[];
  surfaceColor: string;
  components: ComponentDef[];
  presets: Preset[];
  onSave: (token: Token) => Promise<void>;
  onDelete: (token: Token) => Promise<void>;
  onWhereUsed: (token: Token) => void;
}

export function TokenTable({
  tokens,
  surfaceColor,
  components,
  presets,
  onSave,
  onDelete,
  onWhereUsed,
}: TokenTableProps) {
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    setDraftValues({});
  }, [tokens]);

  const componentUsage = useMemo(() => {
    const usage: Record<string, number> = {};
    components.forEach((component) => {
      component.tokensUsed.forEach((tokenKey) => {
        usage[tokenKey] = (usage[tokenKey] || 0) + 1;
      });
    });
    return usage;
  }, [components]);

  const presetUsage = useMemo(() => {
    const usage: Record<string, number> = {};
    presets.forEach((preset) => {
      Object.keys(preset.globalOverrides || {}).forEach((key) => {
        usage[key] = (usage[key] || 0) + 1;
      });
      Object.values(preset.componentOverrides || {}).forEach((overrideMap) => {
        Object.keys(overrideMap).forEach((key) => {
          usage[key] = (usage[key] || 0) + 1;
        });
      });
    });
    return usage;
  }, [presets]);

  const handleBlur = async (token: Token) => {
    const draftValue = draftValues[token.key];
    if (draftValue === undefined || draftValue === token.value) return;
    setSavingKey(token.key);
    await onSave({ ...token, value: draftValue });
    setSavingKey(null);
  };

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl">
      <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Design tokens">
        <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">Token</th>
            <th className="px-4 py-3 text-left">Value</th>
            <th className="px-4 py-3 text-left">Contrast</th>
            <th className="px-4 py-3 text-left">Usage</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {tokens.map((token) => {
            const value = draftValues[token.key] ?? token.value;
            const ratio = token.type === 'color' ? getContrastRatio(value, surfaceColor) : null;
            const rating = ratio ? aaAARating(ratio) : null;
            const invalid = !token.locked && Boolean(validateTokenValue({ ...token, value }));
            const usageCount = componentUsage[token.key] || 0;
            const overrideCount = presetUsage[token.key] || 0;

            return (
              <tr key={token.key} className={invalid ? 'bg-red-50/40' : undefined}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10">
                      {token.type === 'color' && (
                        <span
                          className="inline-block w-8 h-8 rounded border border-gray-200"
                          style={{ backgroundColor: value }}
                          aria-label={`${token.key} color preview`}
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{token.key}</p>
                      <p className="text-xs text-gray-500">{token.type}</p>
                    </div>
                    {token.locked && (
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        locked
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    type="text"
                    id={`token-input-${token.key}`}
                    value={value}
                    disabled={token.locked}
                    onChange={(event) =>
                      setDraftValues((prev) => ({
                        ...prev,
                        [token.key]: event.target.value,
                      }))
                    }
                    onBlur={() => handleBlur(token)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      invalid ? 'border-red-300' : 'border-gray-200'
                    }`}
                    aria-invalid={invalid}
                  />
                  {invalid && (
                    <p className="text-xs text-red-600 mt-1">Invalid {token.type} value</p>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  {ratio ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        rating === 'AAA'
                          ? 'bg-green-100 text-green-800'
                          : rating === 'AA'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                      title={`Contrast vs surface: ${ratio}:1`}
                    >
                      {rating} ({ratio}:1)
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">n/a</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 align-top">
                  <div className="flex items-center gap-3">
                    <span>{usageCount} components</span>
                    <span>{overrideCount} presets</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onWhereUsed(token)}
                      className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Where used
                    </button>
                    <button
                      onClick={() => onDelete(token)}
                      disabled={token.locked || savingKey === token.key}
                      className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

