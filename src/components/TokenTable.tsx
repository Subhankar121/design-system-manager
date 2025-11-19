import { Token, TokenValueMap } from '@/types';
import { getContrastRatio, aaAARating, validateTokenValue, findBaseAliasForValue } from '@/lib/resolver';
import { useEffect, useState } from 'react';
import { TokenContrastModal } from '@/components/TokenContrastModal';

interface TokenTableProps {
  tokens: Token[];
  resolvedTokens: TokenValueMap;
  baseTokens?: Token[];
  readOnly?: boolean;
  onSave: (token: Token) => Promise<void>;
  onDelete: (token: Token) => Promise<void>;
  onEditMetadata: (tokenKey: string) => void;
}

export function TokenTable({
  tokens,
  resolvedTokens,
  baseTokens = [],
  readOnly = false,
  onSave,
  onDelete,
  onEditMetadata,
}: TokenTableProps) {
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [contrastDetails, setContrastDetails] = useState<{
    token: Token;
    value: string;
    backgroundKey: string;
    backgroundValue: string;
    ratio: number;
    required: number;
  } | null>(null);

  useEffect(() => {
    setDraftValues({});
  }, [tokens]);

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
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {tokens.map((token) => {
            const value = draftValues[token.key] ?? token.value;
            const contrastTargetKey = token.contrastAgainst || 'semantic.color.surface';
            const fallbackSurface = resolvedTokens['semantic.color.surface'] ?? '#ffffff';
            const backgroundValue = resolvedTokens[contrastTargetKey] ?? fallbackSurface;
            const contrastRatio =
              token.type === 'color' ? getContrastRatio(value, backgroundValue) : 0;
            const hasContrast = token.type === 'color' && contrastRatio > 0;
            const rating = hasContrast ? aaAARating(contrastRatio) : null;
            const requiredRatio = token.type === 'color' ? token.contrastMin ?? 4.5 : 0;
            const passesRequirement = hasContrast ? contrastRatio >= requiredRatio : null;
            const invalid = !readOnly && !token.locked && Boolean(validateTokenValue({ ...token, value }));
            const isSemantic = token.key.startsWith('semantic.');
            const resolvedValue = resolvedTokens[token.key] ?? token.value;
            const aliasKey =
              readOnly && isSemantic ? findBaseAliasForValue(resolvedValue, baseTokens) : null;

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
                  {readOnly ? (
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {aliasKey ?? resolvedValue}
                      </p>
                      {aliasKey && (
                        <p className="text-xs text-gray-500">base: {resolvedValue}</p>
                      )}
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  {hasContrast ? (
                    <button
                      type="button"
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        passesRequirement
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-700'
                      }`}
                      onClick={() =>
                        setContrastDetails({
                          token,
                          value,
                          backgroundKey: contrastTargetKey,
                          backgroundValue,
                          ratio: contrastRatio,
                          required: requiredRatio,
                        })
                      }
                      title={`Contrast vs ${contrastTargetKey}: ${contrastRatio}:1`}
                    >
                      {rating} ({contrastRatio}:1)
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500">n/a</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEditMetadata(token.key)}
                      className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Details
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
      {contrastDetails && (
        <TokenContrastModal
          token={contrastDetails.token}
          foregroundValue={contrastDetails.value}
          backgroundKey={contrastDetails.backgroundKey}
          backgroundValue={contrastDetails.backgroundValue}
          ratio={contrastDetails.ratio}
          requiredRatio={contrastDetails.required}
          onClose={() => setContrastDetails(null)}
        />
      )}
    </div>
  );
}

