import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Preset, PresetVersion } from '@/types';
import {
  deletePreset,
  downloadSnapshot,
  getPresets,
  getPresetVersions,
  savePresetDraft,
} from '@/lib/mockApi';
import { useToast } from '@/hooks/useToast';
import { AlertBanner } from '@/components/AlertBanner';

export function PresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [versions, setVersions] = useState<Record<string, PresetVersion | null>>({});
  const navigate = useNavigate();
  const { addToast } = useToast();

  const loadPresets = async () => {
    const data = await getPresets();
    setPresets(data);
    const versionEntries = await Promise.all(
      data.map(async (preset) => {
        const presetVersions = await getPresetVersions(preset.id);
        return [preset.id, presetVersions[0] ?? null] as const;
      })
    );
    setVersions(Object.fromEntries(versionEntries));
  };

  useEffect(() => {
    loadPresets();
  }, []);

  const handleDuplicate = async (preset: Preset) => {
    const duplicate: Preset = {
      ...preset,
      id: `${preset.id}_copy_${Date.now()}`,
      name: `${preset.name} Copy`,
      publishedVersions: [],
    };
    await savePresetDraft(duplicate);
    addToast('Preset duplicated', 'success');
    loadPresets();
  };

  const handleDelete = async (preset: Preset) => {
    if (!window.confirm(`Delete preset "${preset.name}"?`)) return;
    await deletePreset(preset.id);
    addToast('Preset deleted', 'success');
    loadPresets();
  };

  const handleExport = async (preset: Preset) => {
    const latest = versions[preset.id];
    if (!latest) {
      addToast('Publish preset before exporting a snapshot', 'info');
      return;
    }
    const json = await downloadSnapshot(latest.snapshotId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${preset.id}-v${latest.version}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('Snapshot downloaded', 'success');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-gray-500">Themes</p>
          <h1 className="text-3xl font-bold text-gray-900">Presets</h1>
          <p className="text-sm text-gray-500">Manage theme drafts, publishing, and version history.</p>
        </div>
        <Link
          to="/presets/default/edit"
          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Open default preset
        </Link>
      </header>

      <AlertBanner
        type="info"
        title="Publishing workflow"
        message="Edit presets, analyze impact, publish to create immutable versions, and revert anytime."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {presets.map((preset) => {
          const latest = versions[preset.id];
          const status = latest ? 'Published' : 'Draft';
          return (
            <article
              key={preset.id}
              className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{preset.name}</h2>
                  <p className="text-xs text-gray-500">{preset.id}</p>
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
                {Object.keys(preset.globalOverrides).length} global overrides ·{' '}
                {Object.keys(preset.componentOverrides).length} component overrides
              </p>

              <div className="flex flex-wrap gap-2 mt-auto">
                <button
                  onClick={() => navigate(`/presets/${preset.id}/edit`)}
                  className="flex-1 text-center text-sm border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDuplicate(preset)}
                  className="text-sm border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => handleExport(preset)}
                  className="text-sm border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Export
                </button>
                <button
                  onClick={() => handleDelete(preset)}
                  className="text-sm border border-red-200 text-red-600 rounded-md px-3 py-2 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  Delete
                </button>
                <Link
                  to={`/presets/${preset.id}/versions`}
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
