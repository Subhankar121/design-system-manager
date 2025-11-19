import { ThemeVersion } from '@/types';
import { useState } from 'react';

interface VersionListProps {
  versions: ThemeVersion[];
  onRevert: (snapshotId: string) => void;
  onDownload: (version: ThemeVersion) => void;
  onViewDiff?: (version: ThemeVersion) => void;
}

export function VersionList({ versions, onRevert, onDownload, onViewDiff }: VersionListProps) {
  const [confirming, setConfirming] = useState<string | null>(null);

  if (versions.length === 0) {
    return <p className="text-center text-gray-500 py-10">No published versions yet.</p>;
  }

  return (
    <div className="space-y-4">
      {versions.map((version) => {
        const createdAt = new Date(version.createdAt).toLocaleString();
        const globalCount = Object.keys(version.snapshot.tokens || {}).length;
        const componentOverrideCount = Object.values(version.snapshot.components || {}).reduce(
          (sum, overrides: any) => sum + Object.keys(overrides || {}).length,
          0
        );
        return (
          <article
            key={version.snapshotId}
            className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm"
            aria-label={`Version ${version.version}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500">Version</p>
                <h3 className="text-xl font-semibold text-gray-900">v{version.version}</h3>
                <p className="text-sm text-gray-500">
                  Published by {version.createdBy} on {createdAt}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> {globalCount} global tokens
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> {componentOverrideCount} component overrides
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {onViewDiff && (
                  <button
                    onClick={() => onViewDiff(version)}
                    className="px-3 py-1 text-sm border border-slate-200 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    View diff
                  </button>
                )}
                <button
                  onClick={() => onDownload(version)}
                  className="px-3 py-1 text-sm border border-indigo-200 text-indigo-600 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Download snapshot
                </button>
                {confirming === version.snapshotId ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onRevert(version.snapshotId);
                        setConfirming(null);
                      }}
                      className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      className="px-3 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirming(version.snapshotId)}
                    className="px-3 py-1 text-sm text-orange-600 border border-orange-200 rounded-md hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    Revert
                  </button>
                )}
              </div>
            </div>

            {(() => {
              const notes =
                typeof version.changelog === 'object' &&
                version.changelog !== null &&
                'notes' in version.changelog
                  ? (version.changelog as { notes?: unknown }).notes
                  : undefined;
              return typeof notes === 'string' && notes.trim() ? (
                <p className="mt-3 text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">Notes:</span> {notes}
                </p>
              ) : null;
            })()}


            <details className="mt-4">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1">
                View snapshot JSON
              </summary>
              <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                {JSON.stringify(version.snapshot, null, 2)}
              </pre>
            </details>
          </article>
        );
      })}
    </div>
  );
}

