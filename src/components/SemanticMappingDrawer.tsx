import { useState, useMemo, useEffect } from 'react';
import { Theme, Token, ValidationIssue } from '@/types';
import { findBaseAliasForValue, getContrastRatio } from '@/lib/resolver';
import { ColorTokenSelect } from './ColorTokenSelect';

interface SemanticMappingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  baseTokens: Token[];
  resolvedTokens: Record<string, string>;
  validationIssues?: ValidationIssue[];
  onSave: (mappings: Record<string, string>) => void;
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

export function SemanticMappingDrawer({
  isOpen,
  onClose,
  theme: _theme,
  baseTokens,
  resolvedTokens,
  validationIssues = [],
  onSave,
}: SemanticMappingDrawerProps) {
  // Local state to track mapping changes before saving
  const [localMappings, setLocalMappings] = useState<Record<string, string>>({});
  const [initialMappings, setInitialMappings] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'errors'>('all');

  const tokensByType = useMemo(() => {
    return baseTokens.reduce<Record<Token['type'], Token[]>>((acc, t) => {
      if (!t.key.startsWith('semantic.')) {
        acc[t.type] = acc[t.type] || [];
        acc[t.type].push(t);
      }
      return acc;
    }, {} as Record<Token['type'], Token[]>);
  }, [baseTokens]);

  // Initialize local mappings from current resolved values when drawer opens
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string> = {};
      SEMANTIC_KEYS.forEach(({ key }) => {
        const resolvedValue = resolvedTokens[key] ?? '';
        const baseAlias = findBaseAliasForValue(resolvedValue, baseTokens);
        if (baseAlias) {
          initial[key] = baseAlias;
        }
      });
      setInitialMappings(initial);
      setLocalMappings(initial);
    }
  }, [isOpen, resolvedTokens, baseTokens]);

  // Check if there are changes compared to initial state
  const hasChanges = useMemo(() => {
    const initialKeys = Object.keys(initialMappings);
    const localKeys = Object.keys(localMappings);
    
    // Check if keys differ
    if (initialKeys.length !== localKeys.length) return true;
    
    // Check if any values differ
    for (const key of initialKeys) {
      if (initialMappings[key] !== localMappings[key]) return true;
    }
    
    // Check if any new keys were added
    for (const key of localKeys) {
      if (!(key in initialMappings)) return true;
    }
    
    return false;
  }, [localMappings, initialMappings]);

  // Recalculate validation issues based on local mappings
  const localValidationIssues = useMemo(() => {
    const issues: ValidationIssue[] = [];
    
    Object.entries(localMappings).forEach(([semanticKey, baseTokenKey]) => {
      const tokenDef = baseTokens.find((t) => t.key === semanticKey);
      if (!tokenDef || !tokenDef.key.startsWith('semantic.')) return;
      
      const baseToken = baseTokens.find((t) => t.key === baseTokenKey);
      if (!baseToken) return;
      
      const resolvedValue = baseToken.value;
      
      // Check 1: Locked token override
      if (tokenDef.locked) {
        issues.push({
          id: `locked-${semanticKey}`,
          message: `${semanticKey} is locked and cannot be overridden.`,
          severity: 'error',
          field: semanticKey,
        });
      }
      
      // Check 2: Critical contrast failures only (< 4.5:1)
      if (tokenDef.type === 'color' && tokenDef.contrastAgainst) {
        const foreground = resolvedValue;
        const backgroundKey = tokenDef.contrastAgainst;
        // Get background from local mappings or resolved tokens
        let background = '';
        const bgMapping = localMappings[backgroundKey];
        if (bgMapping) {
          const bgBaseToken = baseTokens.find((t) => t.key === bgMapping);
          background = bgBaseToken?.value || resolvedTokens[backgroundKey] || '#ffffff';
        } else {
          background = resolvedTokens[backgroundKey] || resolvedTokens['semantic.color.surface'] || '#ffffff';
        }
        
        const ratio = getContrastRatio(foreground, background);
        const required = tokenDef.contrastMin ?? 4.5;
        if (ratio < 4.5) {
          issues.push({
            id: `contrast-${semanticKey}`,
            message: `Contrast ${ratio.toFixed(2)}:1 vs ${tokenDef.contrastAgainst} is below AA (${required}:1).`,
            severity: 'error',
            field: semanticKey,
          });
        }
      }
    });
    
    // Limit to 2 issues max
    const lockedIssues = issues.filter((issue) => issue.id.startsWith('locked-'));
    const contrastIssues = issues.filter((issue) => issue.id.startsWith('contrast-'));
    
    if (lockedIssues.length >= 2) {
      return lockedIssues.slice(0, 2);
    } else if (lockedIssues.length === 1) {
      return [...lockedIssues, ...contrastIssues.slice(0, 1)];
    } else {
      return contrastIssues.slice(0, 2);
    }
  }, [localMappings, baseTokens, resolvedTokens]);

  // Get tokens with errors (use local validation issues for live updates)
  const activeValidationIssues = localMappings && Object.keys(localMappings).length > 0 
    ? localValidationIssues 
    : validationIssues;
  
  const tokensWithErrors = useMemo(() => {
    return new Set(activeValidationIssues.map((issue) => issue.field).filter(Boolean) as string[]);
  }, [activeValidationIssues]);

  // Filter keys based on active tab
  const filteredKeys = useMemo(() => {
    if (activeTab === 'errors') {
      return SEMANTIC_KEYS.filter(({ key }) => tokensWithErrors.has(key));
    }
    return SEMANTIC_KEYS;
  }, [activeTab, tokensWithErrors]);

  // Get validation issue for a token (use local validation for live updates)
  const getTokenIssue = (tokenKey: string): ValidationIssue | undefined => {
    return activeValidationIssues.find((issue) => issue.field === tokenKey);
  };

  // Get token definition for a semantic key
  const getTokenDef = (tokenKey: string): Token | undefined => {
    return baseTokens.find((t) => t.key === tokenKey);
  };

  // Get color value for display (for swatches)
  const getColorValue = (tokenKey: string): string | null => {
    const value = resolvedTokens[tokenKey] ?? '';
    if (!value) return null;
    // Check if it's a valid color (hex or rgb)
    if (value.startsWith('#') || value.startsWith('rgb')) return value;
    return null;
  };

  // Calculate resolved value based on local mappings (for live preview)
  const getResolvedValueForToken = (semanticKey: string): string => {
    // If there's a local mapping, use that base token's value
    const localMapping = localMappings[semanticKey];
    if (localMapping) {
      const baseToken = baseTokens.find((t) => t.key === localMapping);
      if (baseToken) return baseToken.value;
    }
    // Otherwise use the original resolved value
    return resolvedTokens[semanticKey] ?? '';
  };

  const handleMappingChange = (semanticKey: string, baseTokenKey: string) => {
    const newMappings = { ...localMappings };
    if (baseTokenKey) {
      newMappings[semanticKey] = baseTokenKey;
    } else {
      delete newMappings[semanticKey];
    }
    setLocalMappings(newMappings);
  };

  const handleSave = () => {
    // Build the globalOverrides object from mappings
    const newOverrides: Record<string, string> = {};
    Object.entries(localMappings).forEach(([semanticKey, baseTokenKey]) => {
      const baseToken = baseTokens.find((t) => t.key === baseTokenKey);
      if (baseToken) {
        newOverrides[semanticKey] = baseToken.value;
      }
    });
    onSave(newOverrides);
    onClose();
  };

  const handleCancel = () => {
    setLocalMappings(initialMappings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />
      <aside
        className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[420px] bg-white border-l border-gray-200 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Semantic token mapping"
      >
        <div className="h-full flex flex-col">
          <header className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-gray-500">Theme</p>
              <h2 className="text-lg font-semibold text-gray-900">
                Map semantic tokens
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Close mapping drawer"
            >
              Close
            </button>
          </header>

          {/* Tabs: All / Errors */}
          <div className="px-5 py-3 border-b border-gray-100">
            <nav className="flex gap-2" aria-label="Token filter tabs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-sm border-b-2 -mb-px ${
                  activeTab === 'all'
                    ? 'border-indigo-500 text-indigo-700 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
                aria-current={activeTab === 'all' ? 'page' : undefined}
              >
                All tokens
              </button>
              <button
                onClick={() => setActiveTab('errors')}
                className={`px-3 py-1.5 text-sm border-b-2 -mb-px ${
                  activeTab === 'errors'
                    ? 'border-red-500 text-red-700 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
                aria-current={activeTab === 'errors' ? 'page' : undefined}
              >
                Errors ({activeValidationIssues.length})
              </button>
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {filteredKeys.length === 0 && activeTab === 'errors' ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No validation errors found.</p>
              </div>
            ) : (
              filteredKeys.map(({ key, type, label }) => {
                // Use resolved value based on local mappings for live preview
                const resolvedValue = getResolvedValueForToken(key);
                const currentAlias = findBaseAliasForValue(resolvedValue, baseTokens);
                const localMapping = localMappings[key] ?? currentAlias ?? '';
                const options = tokensByType[type] || [];
                const isChanged = localMapping !== (currentAlias ?? '');
                const issue = getTokenIssue(key);
                const hasError = !!issue;
                const tokenDef = getTokenDef(key);
                const colorValue = type === 'color' ? (resolvedValue && (resolvedValue.startsWith('#') || resolvedValue.startsWith('rgb')) ? resolvedValue : null) : null;
                
                // Extract contrast info from error message if it's a contrast error
                let foregroundColor: string | null = null;
                let backgroundColor: string | null = null;
                if (hasError && issue && issue.id.startsWith('contrast-') && tokenDef?.contrastAgainst) {
                  foregroundColor = resolvedValue || null;
                  // Get background from local mappings or resolved tokens
                  const bgKey = tokenDef.contrastAgainst;
                  const bgMapping = localMappings[bgKey];
                  if (bgMapping) {
                    const bgBaseToken = baseTokens.find((t) => t.key === bgMapping);
                    backgroundColor = bgBaseToken?.value || getColorValue(bgKey) || '#ffffff';
                  } else {
                    backgroundColor = getColorValue(bgKey) || getColorValue('semantic.color.surface') || '#ffffff';
                  }
                }
              
                return (
                  <div
                    key={key}
                    className={`border rounded-lg p-3 bg-white space-y-2 ${
                      hasError
                        ? 'border-red-300 bg-red-50/30'
                        : isChanged
                        ? 'border-indigo-300 bg-indigo-50/30'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {colorValue && (
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: colorValue }}
                              title={colorValue}
                              aria-label={`Color: ${colorValue}`}
                            />
                          )}
                          <p className="text-sm font-semibold text-gray-900">{label}</p>
                          {hasError && (
                            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                              Error
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-mono">{key}</p>
                        {hasError && issue && (
                          <div className="text-xs text-red-600 mt-1">
                            <p>{issue.message}</p>
                            {foregroundColor && backgroundColor && (
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-gray-500">Foreground:</span>
                                <div className="flex items-center gap-1">
                                  <div
                                    className="w-3 h-3 rounded border border-gray-300"
                                    style={{ backgroundColor: foregroundColor }}
                                    title={foregroundColor}
                                    aria-label={`Foreground color: ${foregroundColor}`}
                                  />
                                  <span className="text-[10px] font-mono text-gray-600">{foregroundColor}</span>
                                </div>
                                <span className="text-[10px] text-gray-500 mx-1">vs</span>
                                <span className="text-[10px] text-gray-500">Background:</span>
                                <div className="flex items-center gap-1">
                                  <div
                                    className="w-3 h-3 rounded border border-gray-300"
                                    style={{ backgroundColor: backgroundColor }}
                                    title={backgroundColor}
                                    aria-label={`Background color: ${backgroundColor}`}
                                  />
                                  <span className="text-[10px] font-mono text-gray-600">{backgroundColor}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-2">
                        {localMapping ? (
                          <span className="text-xs text-gray-600">
                            base: {localMapping}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Not mapped</span>
                        )}
                        {isChanged && (
                          <span className="ml-2 text-xs text-indigo-600 font-medium">(changed)</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {type === 'color' ? (
                        <ColorTokenSelect
                          value={localMapping}
                          onChange={(baseKey) => handleMappingChange(key, baseKey)}
                          options={options}
                          placeholder="Choose base token…"
                          error={hasError}
                        />
                      ) : (
                        <select
                          value={localMapping}
                          onChange={(e) => {
                            const baseKey = e.target.value;
                            handleMappingChange(key, baseKey);
                          }}
                          className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            hasError ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Choose base token…</option>
                          {options.map((t) => (
                            <option key={t.key} value={t.key}>
                              {t.key} ({t.value})
                            </option>
                          ))}
                        </select>
                      )}
                      {resolvedValue && (
                        <p className="text-[11px] text-gray-500">
                          Current value: <span className="font-mono">{resolvedValue}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {hasChanges && (
            <div className="px-5 py-3 border-t border-gray-100 bg-yellow-50/50">
              <p className="text-xs text-yellow-800 mb-2">
                You have unsaved changes. Click "Save changes" to apply them.
              </p>
            </div>
          )}
          
          <footer className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Save changes
            </button>
          </footer>
        </div>
      </aside>
    </>
  );
}


