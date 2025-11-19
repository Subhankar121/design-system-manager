import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ThemeVersion } from '@/types';
import { getThemeVersions, revertThemeVersion, getTheme, downloadSnapshot } from '@/lib/mockApi';
import { VersionList } from '@/components/VersionList';
import { useToast } from '@/hooks/useToast';
import { Theme } from '@/types';

export function VersionsPage() {
  const { id } = useParams<{ id: string }>();
  const [versions, setVersions] = useState<ThemeVersion[]>([]);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [diffFor, setDiffFor] = useState<ThemeVersion | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    const [versionsData, themeData] = await Promise.all([
      getThemeVersions(id),
      getTheme(id),
    ]);
    setVersions(versionsData);
    setTheme(themeData);
  };

  const handleRevert = async (versionId: string) => {
    if (!id) return;

    try {
      await revertThemeVersion(id, versionId, { createdBy: 'demo@local', notes: 'Revert from UI' });
      addToast('Theme reverted successfully', 'success');
      loadData();
    } catch (error) {
      addToast('Failed to revert theme', 'error');
    }
  };

  const handleDownload = async (version: ThemeVersion) => {
    const json = await downloadSnapshot(version.snapshotId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${theme?.name || id}-v${version.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Snapshot downloaded', 'success');
  };

  const handleViewDiff = (target: ThemeVersion) => {
    setDiffFor(target);
  };

  const closeDiff = () => setDiffFor(null);

  const computeDiff = (current: ThemeVersion) => {
    // Compare with previous version if exists
    const index = versions.findIndex(v => v.snapshotId === current.snapshotId);
    const prev = index > 0 ? versions[index - 1] : null;
    const currentTokens = current.snapshot.tokens || {};
    const prevTokens = prev?.snapshot.tokens || {};
    const tokenKeys = Array.from(new Set([...Object.keys(currentTokens), ...Object.keys(prevTokens)]));
    const tokenDiff = tokenKeys
      .map((k) => ({ key: k, from: prevTokens[k], to: currentTokens[k] }))
      .filter((d) => d.from !== d.to);

    const currentComp = current.snapshot.components || {};
    const prevComp = prev?.snapshot.components || {};
    const compIds = Array.from(new Set([...Object.keys(currentComp), ...Object.keys(prevComp)]));
    const compDiff = compIds.map((cid) => {
      const a = prevComp[cid] || {};
      const b = currentComp[cid] || {};
      const fields = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
      const changes = fields
        .map((f) => ({ field: f, from: a[f], to: b[f] }))
        .filter((c) => c.from !== c.to);
      return { componentId: cid, changes };
    }).filter((c) => c.changes.length > 0);

    return { prevVersion: prev?.version || null, tokenDiff, compDiff };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/themes"
            className="text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
          >
            ← Back to Themes
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            Versions: {theme?.name || id}
          </h1>
          <p className="mt-2 text-gray-600">View and manage published versions</p>
        </div>
      </div>

      <VersionList
        versions={versions}
        onRevert={handleRevert}
        onDownload={handleDownload}
        onViewDiff={handleViewDiff}
      />

      {diffFor && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={closeDiff} aria-hidden="true" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Diff for v{diffFor.version}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Compared to previous version
                  </p>
                </div>
                <button
                  onClick={closeDiff}
                  aria-label="Close diff"
                  className="text-sm border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Close
                </button>
              </div>

              {(() => {
                const diff = computeDiff(diffFor);
                return (
                  <div className="space-y-6">
                    <section>
                      <h4 className="text-sm font-semibold text-gray-800">
                        Global token changes ({diff.tokenDiff.length})
                      </h4>
                      {diff.tokenDiff.length === 0 ? (
                        <p className="text-sm text-gray-500 mt-1">No changes.</p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {diff.tokenDiff.map((d) => (
                            <li key={d.key} className="text-sm">
                              <span className="font-mono text-gray-800">{d.key}</span>{' '}
                              <span className="text-gray-500">from</span>{' '}
                              <span className="font-mono">{String(d.from ?? '—')}</span>{' '}
                              <span className="text-gray-500">to</span>{' '}
                              <span className="font-mono">{String(d.to ?? '—')}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                    <section>
                      <h4 className="text-sm font-semibold text-gray-800">
                        Component override changes ({diff.compDiff.length})
                      </h4>
                      {diff.compDiff.length === 0 ? (
                        <p className="text-sm text-gray-500 mt-1">No changes.</p>
                      ) : (
                        <div className="mt-2 space-y-3">
                          {diff.compDiff.map((c) => (
                            <div key={c.componentId} className="border border-gray-200 rounded-lg p-3">
                              <p className="text-sm font-medium text-gray-900">{c.componentId}</p>
                              <ul className="mt-2 space-y-1">
                                {c.changes.map((ch) => (
                                  <li key={ch.field} className="text-sm">
                                    <span className="font-mono text-gray-800">{ch.field}</span>{' '}
                                    <span className="text-gray-500">from</span>{' '}
                                    <span className="font-mono">{String(ch.from ?? '—')}</span>{' '}
                                    <span className="text-gray-500">to</span>{' '}
                                    <span className="font-mono">{String(ch.to ?? '—')}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

