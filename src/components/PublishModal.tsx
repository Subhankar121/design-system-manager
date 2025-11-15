import { ComponentDef, ImpactReport, Preset, PresetVersion, Token, ValidationIssue } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import { resolveTokens } from '@/lib/resolver';

interface PublishModalProps {
  isOpen: boolean;
  preset: Preset;
  tokens: Token[];
  components: ComponentDef[];
  latestVersion: PresetVersion | null;
  validations: ValidationIssue[];
  impact: ImpactReport | null;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
}

export function PublishModal({
  isOpen,
  preset,
  tokens,
  components,
  latestVersion,
  validations,
  impact,
  onClose,
  onConfirm,
}: PublishModalProps) {
  const [notes, setNotes] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setNotes('');
      setIsPublishing(false);
    }
  }, [isOpen]);

  const nextVersion = useMemo(() => {
    if (!latestVersion) return '1.0.0';
    const [major = '1', minor = '0', patch = '0'] = latestVersion.version.split('.');
    return `${major}.${minor}.${Number(patch) + 1}`;
  }, [latestVersion]);

  const { changedTokens, changedOverrides } = useMemo(() => {
    const previous = latestVersion?.snapshot?.tokens || {};
    const current = resolveTokens(tokens, preset);

    const tokenChanges = Object.keys({ ...current, ...previous })
      .map((key) => {
        const from = previous[key];
        const to = current[key];
        if (from === to) return null;
        return { key, from, to };
      })
      .filter(Boolean) as { key: string; from?: string; to?: string }[];

    const previousOverrides = latestVersion?.snapshot?.componentOverrides ?? {};
    const overrideChanges = Object.keys({
      ...previousOverrides,
      ...preset.componentOverrides,
    })
      .map((componentId) => {
        const before = previousOverrides[componentId] || {};
        const after = preset.componentOverrides[componentId] || {};
        const diffs = Object.keys({ ...before, ...after }).filter((tokenKey) => before[tokenKey] !== after[tokenKey]);
        if (diffs.length === 0) return null;
        const componentName = components.find((c) => c.id === componentId)?.name || componentId;
        return {
          componentId,
          componentName,
          changes: diffs.map((tokenKey) => ({
            tokenKey,
            from: before[tokenKey],
            to: after[tokenKey],
          })),
        };
      })
      .filter(Boolean) as {
      componentId: string;
      componentName: string;
      changes: { tokenKey: string; from?: string; to?: string }[];
    }[];

    return { changedTokens: tokenChanges, changedOverrides: overrideChanges };
  }, [latestVersion, preset, components, tokens]);

  if (!isOpen) return null;

  const blockingIssues = validations.filter((issue) => issue.severity === 'error');
  const hasBlockingIssues = blockingIssues.length > 0;

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onConfirm(notes);
      onClose();
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-6">
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase text-gray-500">Publish preset</p>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {preset.name} · v{nextVersion}
                </h2>
                <p className="text-sm text-gray-500">
                  Latest published version: {latestVersion?.version ?? 'none'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                aria-label="Close publish modal"
              >
                ×
              </button>
            </header>

            {impact && (
              <section className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Impact summary</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Changed tokens</p>
                    <p className="text-lg font-semibold">{impact.changedTokens.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Affected components</p>
                    <p className="text-lg font-semibold">{impact.affectedComponents.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Severity</p>
                    <p className="text-lg font-semibold capitalize">{impact.severity}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Overrides</p>
                    <p className="text-lg font-semibold">
                      {Object.keys(preset.componentOverrides).length} components
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Token changes</h3>
                {changedTokens.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">No token changes detected.</p>
                )}
                {changedTokens.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {changedTokens.map((change) => (
                      <li
                        key={change.key}
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{change.key}</p>
                          <p className="text-xs text-gray-500">from {change.from ?? 'n/a'}</p>
                        </div>
                        <span className="text-indigo-600 font-semibold">{change.to}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700">Component overrides</h3>
                {changedOverrides.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">No component override changes.</p>
                )}
                {changedOverrides.length > 0 && (
                  <div className="space-y-3 mt-2">
                    {changedOverrides.map((override) => (
                      <div key={override.componentId} className="border border-gray-200 rounded-lg p-3">
                        <p className="font-semibold text-gray-900 text-sm">{override.componentName}</p>
                        <ul className="mt-2 space-y-1 text-sm">
                          {override.changes.map((change) => (
                            <li key={`${override.componentId}-${change.tokenKey}`} className="flex justify-between">
                              <span className="text-gray-500">{change.tokenKey}</span>
                              <span className="font-medium text-indigo-600">{change.to}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {validations.length > 0 && (
              <section className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-800 mb-2">Validation issues</h3>
                <ul className="space-y-1 text-sm text-red-700">
                  {validations.map((issue) => (
                    <li key={issue.id}>
                      <strong className="uppercase text-xs mr-2">{issue.severity}</strong>
                      {issue.message}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <label htmlFor="release-notes" className="text-sm font-medium text-gray-700 mb-1 block">
                Release notes
              </label>
              <textarea
                id="release-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="Describe what changed in this release"
              />
            </section>
          </div>

          <footer className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={hasBlockingIssues || isPublishing}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {hasBlockingIssues
                ? 'Resolve issues to publish'
                : isPublishing
                ? 'Publishing…'
                : `Publish v${nextVersion}`}
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}

