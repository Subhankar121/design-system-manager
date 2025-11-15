import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  getComponents,
  getPresets,
  getTokens,
  getPresetVersions,
  initSeedDataIfNeeded,
  savePresetDraft,
} from '@/lib/mockApi';
import { ComponentDef, ImpactReport, Preset, Token } from '@/types';
import { AlertBanner } from '@/components/AlertBanner';
import { computeImpact } from '@/lib/impact';
import { useToast } from '@/hooks/useToast';

interface Stats {
  tokens: number;
  components: number;
  presets: number;
  lastPublished?: { preset: string; version: string };
}

export function Dashboard() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [components, setComponents] = useState<ComponentDef[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [impact, setImpact] = useState<ImpactReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const navigate = useNavigate();
  const { addToast } = useToast();

  const loadData = async () => {
    const [tokenData, componentData, presetData] = await Promise.all([
      getTokens(),
      getComponents(),
      getPresets(),
    ]);
    setTokens(tokenData);
    setComponents(componentData);
    setPresets(presetData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats: Stats = useMemo(() => {
    const base: Stats = {
      tokens: tokens.length,
      components: components.length,
      presets: presets.length,
    };
    return base;
  }, [tokens, components, presets]);

  const conflictingTokens = useMemo(() => {
    const conflicts: Record<string, Set<string>> = {};
    presets.forEach((preset) => {
      Object.entries(preset.globalOverrides).forEach(([key, value]) => {
        if (!conflicts[key]) conflicts[key] = new Set();
        conflicts[key].add(value);
      });
    });
    return Object.entries(conflicts).filter(([, values]) => values.size > 1).length;
  }, [presets]);

  const missingA11y = components.filter((component) => !component.a11y?.description).length;

  const handleImpactAnalysis = async () => {
    if (presets.length === 0) return;
    setIsAnalyzing(true);
    const report = computeImpact(presets[0], tokens, components);
    setImpact(report);
    setIsAnalyzing(false);
  };

  const handleCreatePreset = async () => {
    if (!newPresetName.trim()) return;
    const newPreset: Preset = {
      id: newPresetName.toLowerCase().replace(/\s+/g, '_'),
      name: newPresetName.trim(),
      globalOverrides: {},
      componentOverrides: {},
      publishedVersions: [],
    };
    await savePresetDraft(newPreset);
    setShowCreate(false);
    setNewPresetName('');
    await loadData();
    navigate(`/presets/${newPreset.id}/edit`);
  };

  const handleImportSeeds = async () => {
    await initSeedDataIfNeeded(true);
    await loadData();
    addToast('Seed data reloaded', 'success');
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase text-gray-500">Overview</p>
          <h1 className="text-3xl font-bold text-gray-900">Design System Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage tokens, components, and themes.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            New preset
          </button>
          <button
            onClick={handleImpactAnalysis}
            className="px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {isAnalyzing ? 'Analyzing…' : 'Run impact analysis'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/tokens"
          className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <p className="text-sm text-gray-500">Tokens</p>
          <p className="text-3xl font-bold text-gray-900">{stats.tokens}</p>
          <p className="text-xs text-gray-500 mt-1">Design tokens defined</p>
        </Link>
        <Link
          to="/components"
          className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <p className="text-sm text-gray-500">Components</p>
          <p className="text-3xl font-bold text-gray-900">{stats.components}</p>
          <p className="text-xs text-gray-500 mt-1">In registry</p>
        </Link>
        <Link
          to="/presets"
          className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <p className="text-sm text-gray-500">Presets</p>
          <p className="text-3xl font-bold text-gray-900">{stats.presets}</p>
          <p className="text-xs text-gray-500 mt-1">Theme variations</p>
        </Link>
      </div>

      <div className="space-y-3">
        {conflictingTokens > 0 && (
          <AlertBanner
            type="warning"
            title="Token conflicts detected"
            message={`${conflictingTokens} tokens have conflicting values across themes.`}
            actionLabel="Review tokens"
            onAction={() => navigate('/tokens')}
          />
        )}
        {missingA11y > 0 && (
          <AlertBanner
            type="error"
            title="Accessibility gaps"
            message={`${missingA11y} components are missing accessibility descriptions.`}
            actionLabel="Review components"
            onAction={() => navigate('/components')}
          />
        )}
        {impact && (
          <AlertBanner
            type={impact.severity === 'high' ? 'error' : impact.severity === 'medium' ? 'warning' : 'info'}
            title="Impact analysis ready"
            message={`${impact.changedTokens.length} tokens touched · ${impact.affectedComponents.length} components affected.`}
            actionLabel="View details"
            onAction={() => navigate('/presets')}
          />
        )}
      </div>

      <section className="bg-white rounded-xl border border-gray-200 px-6 py-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
            <p className="text-sm text-gray-500">Common admin tasks for design system managers.</p>
          </div>
          <button
            onClick={handleImportSeeds}
            className="text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Re-import seeds
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/presets/brand_x/edit"
            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-200 focus:ring-2 focus:ring-indigo-500"
          >
            <p className="text-sm font-semibold text-gray-900">Edit Brand X</p>
            <p className="text-xs text-gray-500 mt-1">Tweak overrides and preview live.</p>
          </Link>
          <Link
            to="/sdk-demo"
            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-200 focus:ring-2 focus:ring-indigo-500"
          >
            <p className="text-sm font-semibold text-gray-900">SDK demo</p>
            <p className="text-xs text-gray-500 mt-1">See how consumers fetch snapshots.</p>
          </Link>
          <Link
            to="/presets"
            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-200 focus:ring-2 focus:ring-indigo-500"
          >
            <p className="text-sm font-semibold text-gray-900">Version history</p>
            <p className="text-xs text-gray-500 mt-1">Audit published presets & rollbacks.</p>
          </Link>
        </div>
      </section>

      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowCreate(false)} aria-hidden="true" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create preset</h3>
                <p className="text-sm text-gray-500">
                  Start from base tokens and customize overrides later.
                </p>
              </div>
              <label className="text-sm font-medium text-gray-700">
                Name
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(event) => setNewPresetName(event.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Team Alpha"
                />
              </label>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePreset}
                  disabled={!newPresetName.trim()}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Create & edit
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

