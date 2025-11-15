import { useEffect, useState } from 'react';
import { fetchSnapshot } from '@/lib/sdk';
import { getPresetVersions, getPresets, getComponents } from '@/lib/mockApi';
import { ComponentDef, Preset } from '@/types';
import { PreviewCanvas } from '@/components/PreviewCanvas';

export function SdkDemoPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [versions, setVersions] = useState<Record<string, string[]>>({});
  const [components, setComponents] = useState<ComponentDef[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('default');
  const [selectedVersion, setSelectedVersion] = useState<string>('latest');
  const [tokens, setTokens] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const [presetList, componentData] = await Promise.all([getPresets(), getComponents()]);
      setPresets(presetList);
      setComponents(componentData);
      const versionEntries = await Promise.all(
        presetList.map(async (preset) => {
          const presetVersions = await getPresetVersions(preset.id);
          return [preset.id, presetVersions.map((version) => version.version)] as const;
        })
      );
      setVersions(Object.fromEntries(versionEntries));
    };
    load();
  }, []);

  const loadSnapshot = async () => {
    const snapshot = await fetchSnapshot(selectedPreset, selectedVersion === 'latest' ? undefined : selectedVersion);
    if (snapshot) {
      setTokens(snapshot.tokens);
    }
  };

  useEffect(() => {
    loadSnapshot();
  }, [selectedPreset, selectedVersion]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase text-gray-500">SDK</p>
        <h1 className="text-3xl font-bold text-gray-900">Snapshot consumer demo</h1>
        <p className="text-sm text-gray-500">
          Simulate a downstream consumer fetching published presets via the DSM SDK.
        </p>
      </header>

      <div className="flex flex-wrap gap-4">
        <label className="text-sm text-gray-600">
          Preset
          <select
            value={selectedPreset}
            onChange={(event) => setSelectedPreset(event.target.value)}
            className="mt-1 block border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-gray-600">
          Version
          <select
            value={selectedVersion}
            onChange={(event) => setSelectedVersion(event.target.value)}
            className="mt-1 block border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="latest">Latest</option>
            {(versions[selectedPreset] || []).map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={loadSnapshot}
          className="self-end px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Reload snapshot
        </button>
      </div>

      <PreviewCanvas tokens={tokens} component={components[0]} />

      <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
        {JSON.stringify(tokens, null, 2)}
      </pre>
    </div>
  );
}

