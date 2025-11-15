import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PresetVersion } from '@/types';
import { getPresetVersions, revertPresetVersion, getPreset, downloadSnapshot } from '@/lib/mockApi';
import { VersionList } from '@/components/VersionList';
import { useToast } from '@/hooks/useToast';
import { Preset } from '@/types';

export function VersionsPage() {
  const { id } = useParams<{ id: string }>();
  const [versions, setVersions] = useState<PresetVersion[]>([]);
  const [preset, setPreset] = useState<Preset | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    const [versionsData, presetData] = await Promise.all([
      getPresetVersions(id),
      getPreset(id),
    ]);
    setVersions(versionsData);
    setPreset(presetData);
  };

  const handleRevert = async (versionId: string) => {
    if (!id) return;

    try {
      await revertPresetVersion(id, versionId, { createdBy: 'demo@local', notes: 'Revert from UI' });
      addToast('Preset reverted successfully', 'success');
      loadData();
    } catch (error) {
      addToast('Failed to revert preset', 'error');
    }
  };

  const handleDownload = async (version: PresetVersion) => {
    const json = await downloadSnapshot(version.snapshotId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preset-${preset?.name || id}-v${version.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Snapshot downloaded', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/presets"
            className="text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
          >
            ← Back to Presets
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            Versions: {preset?.name || id}
          </h1>
          <p className="mt-2 text-gray-600">View and manage published versions</p>
        </div>
      </div>

      <VersionList
        versions={versions}
        onRevert={handleRevert}
        onDownload={handleDownload}
      />
    </div>
  );
}

