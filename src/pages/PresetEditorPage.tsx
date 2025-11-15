import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ComponentDef, ImpactReport, Preset, PresetVersion, Token, ValidationIssue } from '@/types';
import {
  getComponents,
  getPreset,
  getPresetVersions,
  getPresets,
  getTokens,
  publishPreset,
  savePresetDraft,
} from '@/lib/mockApi';
import { useToast } from '@/hooks/useToast';
import { computeImpact } from '@/lib/impact';
import { PresetEditor } from '@/components/PresetEditor';
import { PublishModal } from '@/components/PublishModal';
import { ImpactModal } from '@/components/ImpactModal';
import { resolveTokens, validateTokenValue } from '@/lib/resolver';
import { AlertBanner } from '@/components/AlertBanner';

export function PresetEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [components, setComponents] = useState<ComponentDef[]>([]);
  const [preset, setPreset] = useState<Preset | null>(null);
  const [draft, setDraft] = useState<Preset | null>(null);
  const [versions, setVersions] = useState<PresetVersion[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [previewPresetId, setPreviewPresetId] = useState<string>('draft');
  const [presetOptions, setPresetOptions] = useState<Preset[]>([]);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [impactModalOpen, setImpactModalOpen] = useState(false);
  const [impactReport, setImpactReport] = useState<ImpactReport | null>(null);
  const [publishing, setPublishing] = useState(false);

  const loadData = async () => {
    if (!id) return;
    const [tokenData, componentData, presetData, presetList] = await Promise.all([
      getTokens(),
      getComponents(),
      getPreset(id),
      getPresets(),
    ]);
    setTokens(tokenData);
    setComponents(componentData);
    if (!presetData) {
      navigate('/presets');
      return;
    }
    setPreset(presetData);
    setDraft(JSON.parse(JSON.stringify(presetData)));
    const versionData = await getPresetVersions(id);
    setVersions(versionData);
    setPresetOptions(presetList);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (!selectedComponentId && components.length) {
      setSelectedComponentId(components[0].id);
    }
  }, [components, selectedComponentId]);

  const resolvedTokens = useMemo(() => {
    if (!draft) return {};
    return resolveTokens(tokens, draft);
  }, [draft, tokens]);

  const previewPreset =
    previewPresetId === 'draft'
      ? draft
      : previewPresetId === 'base'
      ? null
      : presetOptions.find((option) => option.id === previewPresetId) ?? null;

  const previewTokens = useMemo(() => {
    if (!tokens.length) return {};
    return resolveTokens(tokens, previewPreset || undefined);
  }, [previewPreset, tokens]);

  const previewDropdownOptions = useMemo(
    () => [
      { id: 'draft', name: 'Current draft' },
      { id: 'base', name: 'Base tokens' },
      ...presetOptions
        .filter((option) => option.id !== draft?.id)
        .map((option) => ({ id: option.id, name: option.name })),
    ],
    [presetOptions, draft?.id]
  );

  const validationIssues: ValidationIssue[] = useMemo(() => {
    if (!draft) return [];
    const issues: ValidationIssue[] = [];
    tokens.forEach((token) => {
      const overrideValue = draft.globalOverrides[token.key];
      if (overrideValue) {
        const fauxToken = { ...token, value: overrideValue };
        const error = validateTokenValue(fauxToken);
        if (error) {
          issues.push({
            id: `token-${token.key}`,
            message: `${token.key}: ${error}`,
            severity: 'error',
          });
        }
        if (token.locked) {
          issues.push({
            id: `locked-${token.key}`,
            message: `${token.key} is locked and cannot be overridden.`,
            severity: 'error',
          });
        }
      }
    });
    return issues;
  }, [draft, tokens]);

  const handleGlobalChange = (key: string, value: string) => {
    if (!draft) return;
    const next = {
      ...draft,
      globalOverrides: {
        ...draft.globalOverrides,
        [key]: value,
      },
    };
    if (!value) {
      delete next.globalOverrides[key];
    }
    setDraft(next);
  };

  const handleComponentOverrideChange = (componentId: string, tokenKey: string, value: string) => {
    if (!draft) return;
    const componentOverrides = { ...draft.componentOverrides };
    const overrides = { ...(componentOverrides[componentId] || {}) };
    if (value) {
      overrides[tokenKey] = value;
    } else {
      delete overrides[tokenKey];
    }
    if (Object.keys(overrides).length === 0) {
      delete componentOverrides[componentId];
    } else {
      componentOverrides[componentId] = overrides;
    }
    setDraft({ ...draft, componentOverrides });
  };

  const handleSaveDraft = async () => {
    if (!draft) return;
    await savePresetDraft(draft);
    addToast('Draft saved', 'success');
    loadData();
  };

  const handleRunImpact = () => {
    if (!draft) return;
    const report = computeImpact(draft, tokens, components);
    setImpactReport(report);
    setImpactModalOpen(true);
  };

  const openPublishModal = () => {
    if (!draft) return;
    const report = computeImpact(draft, tokens, components);
    setImpactReport(report);
    setPublishModalOpen(true);
  };

  const latestVersion = versions[0] ?? null;

  const handlePublish = async (notes: string) => {
    if (!draft) return;
    setPublishing(true);
    try {
      await savePresetDraft(draft);
      await publishPreset(draft.id, { createdBy: 'demo@local', notes });
      addToast('Preset published', 'success');
      setPublishModalOpen(false);
      loadData();
    } catch (error) {
      addToast('Failed to publish preset', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (!draft || !preset) {
    return <p className="text-gray-500">Loading preset…</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/presets" className="text-xs text-indigo-600 hover:text-indigo-800">
            ← Back to presets
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">{draft.name}</h1>
          <p className="text-sm text-gray-500">
            Manage overrides and preview components before publishing new versions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Save draft
          </button>
          <button
            onClick={handleRunImpact}
            className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Impact analysis
          </button>
          <button
            onClick={openPublishModal}
            disabled={validationIssues.some((issue) => issue.severity === 'error')}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {publishing ? 'Publishing…' : 'Publish draft'}
          </button>
        </div>
      </header>

      {validationIssues.length > 0 && (
        <AlertBanner
          type="error"
          title="Resolve validation issues before publishing"
          message={`${validationIssues.length} issue(s) detected.`}
        />
      )}

      <PresetEditor
        preset={draft}
        tokens={tokens}
        components={components}
        resolvedTokens={resolvedTokens}
        selectedComponentId={selectedComponentId}
        onSelectComponent={setSelectedComponentId}
        onGlobalChange={handleGlobalChange}
        onComponentOverrideChange={handleComponentOverrideChange}
        previewTokens={previewTokens}
        previewPreset={previewPreset}
        previewPresetId={previewPresetId}
        previewOptions={previewDropdownOptions}
        onPreviewPresetChange={setPreviewPresetId}
      />

      <ImpactModal isOpen={impactModalOpen} onClose={() => setImpactModalOpen(false)} report={impactReport} />
      <PublishModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        preset={draft}
        tokens={tokens}
        components={components}
        latestVersion={latestVersion}
        validations={validationIssues}
        impact={impactReport}
        onConfirm={handlePublish}
      />
    </div>
  );
}

