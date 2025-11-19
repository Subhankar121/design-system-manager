import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ComponentDef, Theme, ThemeVersion } from '@/types';
import {
  deleteTheme,
  downloadSnapshot,
  getComponents,
  getThemes,
  getThemeVersions,
  saveThemeDraft,
} from '@/lib/mockApi';
import { useToast } from '@/hooks/useToast';
import { AlertBanner } from '@/components/AlertBanner';

export function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [versions, setVersions] = useState<Record<string, ThemeVersion | null>>({});
  const [componentsList, setComponentsList] = useState<ComponentDef[]>([]);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const loadThemes = async () => {
    const [data, componentData] = await Promise.all([getThemes(), getComponents()]);
    setThemes(data);
    setComponentsList(componentData);
    const versionEntries = await Promise.all(
      data.map(async (theme) => {
        const themeVersions = await getThemeVersions(theme.id);
        return [theme.id, themeVersions[0] ?? null] as const;
      })
    );
    setVersions(Object.fromEntries(versionEntries));
  };

  useEffect(() => {
    loadThemes();
    const handler = () => loadThemes();
    window.addEventListener('dsm:change', handler);
    return () => window.removeEventListener('dsm:change', handler);
  }, []);

  const handleDuplicate = async (theme: Theme) => {
    const duplicate: Theme = {
      ...theme,
      id: `${theme.id}_copy_${Date.now()}`,
      name: `${theme.name} Copy`,
      publishedVersions: [],
    };
    await saveThemeDraft(duplicate);
    addToast('Theme duplicated', 'success');
    loadThemes();
  };

  const handleDelete = async (theme: Theme) => {
    if (!window.confirm(`Delete theme "${theme.name}"?`)) return;
    await deleteTheme(theme.id);
    addToast('Theme deleted', 'success');
    loadThemes();
  };

  const handleExport = async (theme: Theme) => {
    const latest = versions[theme.id];
    if (!latest) {
      addToast('Publish theme before exporting a snapshot', 'info');
      return;
    }
    const json = await downloadSnapshot(latest.snapshotId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${theme.id}-v${latest.version}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('Snapshot downloaded', 'success');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-gray-500">Themes</p>
          <h1 className="text-3xl font-bold text-gray-900">Themes</h1>
          <p className="text-sm text-gray-500">Manage theme drafts, publishing, and version history.</p>
        </div>
        <Link
          to="/themes/default/edit"
          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Open default theme
        </Link>
      </header>

      <AlertBanner
        type="info"
        title="Publishing workflow"
        message="Edit themes, analyze impact, publish to create immutable versions, and revert anytime."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {themes.map((theme) => {
          const latest = versions[theme.id];
          const status = latest ? 'Published' : 'Draft';
          return (
            <article
              key={theme.id}
              className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{theme.name}</h2>
                  <p className="text-xs text-gray-500">{theme.id}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    latest ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {status} {latest ? `· v${latest.version}` : ''}
                </span>
              </div>

              <p className="text-sm text-gray-500">
                {Object.keys(theme.globalOverrides).length} global overrides ·{' '}
                {Object.keys(theme.components).length} component overrides
              </p>

              <details className="border border-gray-100 rounded-lg p-3 text-sm bg-gray-50/70">
                <summary className="cursor-pointer text-gray-700 font-medium">
                  Component coverage
                </summary>
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {componentsList.map((component) => {
                    const overrides = theme.components?.[component.id] || {};
                    const overrideCount = Object.keys(overrides).length;
                    return (
                      <div
                        key={`${theme.id}-${component.id}`}
                        className="flex items-start justify-between gap-3 rounded-md border border-gray-100 bg-white px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{component.name}</p>
                          <p className="text-[11px] text-gray-500">
                            {component.variants?.length ?? 1} variants · {component.tokensUsed.length} tokens
                          </p>
                          {overrideCount > 0 && (
                            <p className="text-[11px] text-indigo-600 mt-1">
                              Overrides:{' '}
                              {Object.entries(overrides)
                                .map(([key, value]) => `${key} → ${value}`)
                                .join(', ')}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                            overrideCount > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {overrideCount} overrides
                        </span>
                      </div>
                    );
                  })}
                </div>
              </details>

              <div className="flex flex-wrap gap-2 mt-auto">
                <button
                  onClick={() => navigate(`/themes/${theme.id}/edit`)}
                  className="flex-1 text-center text-sm border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDuplicate(theme)}
                  className="text-sm border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => handleExport(theme)}
                  className="text-sm border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Export
                </button>
                <button
                  onClick={() => handleDelete(theme)}
                  className="text-sm border border-red-200 text-red-600 rounded-md px-3 py-2 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  Delete
                </button>
                <Link
                  to={`/themes/${theme.id}/versions`}
                  className="text-sm border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Versions
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
