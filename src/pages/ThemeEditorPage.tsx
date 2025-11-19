import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ComponentDef, ImpactReport, Theme, ThemeVersion, Token, ValidationIssue } from '@/types';
import {
  getComponents,
  getTheme,
  getThemeVersions,
  getThemes,
  getTokens,
  publishTheme,
  saveThemeDraft,
} from '@/lib/mockApi';
import { useToast } from '@/hooks/useToast';
import { computeImpact } from '@/lib/impact';
import { ThemeEditor } from '@/components/ThemeEditor';
import { PublishModal } from '@/components/PublishModal';
import { ImpactModal } from '@/components/ImpactModal';
import { SemanticMappingDrawer } from '@/components/SemanticMappingDrawer';
import { GlobalOverridesModal } from '@/components/GlobalOverridesModal';
import { getContrastRatio, resolveTokens } from '@/lib/resolver';

export function ThemeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [components, setComponents] = useState<ComponentDef[]>([]);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [draft, setDraft] = useState<Theme | null>(null);
  const [versions, setVersions] = useState<ThemeVersion[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [previewThemeId, setPreviewThemeId] = useState<string>('draft');
  const [themeOptions, setThemeOptions] = useState<Theme[]>([]);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [impactModalOpen, setImpactModalOpen] = useState(false);
  const [impactReport, setImpactReport] = useState<ImpactReport | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [mappingOpen, setMappingOpen] = useState(false);
  const [globalOverridesOpen, setGlobalOverridesOpen] = useState(false);

  const loadData = async () => {
    if (!id) return;
    const [tokenData, componentData, themeData, themeList] = await Promise.all([
      getTokens(),
      getComponents(),
      getTheme(id),
      getThemes(),
    ]);
    setTokens(tokenData);
    setComponents(componentData);
    if (!themeData) {
      navigate('/themes');
      return;
    }
    setTheme(themeData);
    setDraft(JSON.parse(JSON.stringify(themeData)));
    const versionData = await getThemeVersions(id);
    setVersions(versionData);
    setThemeOptions(themeList);
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

  const previewTheme =
    previewThemeId === 'draft'
      ? draft
      : previewThemeId === 'base'
      ? null
      : themeOptions.find((option) => option.id === previewThemeId) ?? null;

  const previewTokens = useMemo(() => {
    if (!tokens.length) return {};
    return resolveTokens(tokens, previewTheme || undefined);
  }, [previewTheme, tokens]);

  const previewDropdownOptions = useMemo(
    () => [
      { id: 'draft', name: 'Current draft' },
      { id: 'base', name: 'Base tokens' },
      ...themeOptions
        .filter((option) => option.id !== draft?.id)
        .map((option) => ({ id: option.id, name: option.name })),
    ],
    [themeOptions, draft?.id]
  );

  // Validation: Only check semantic tokens in globalOverrides, only 2 critical checks, limit to 2 issues max
  const validationIssues: ValidationIssue[] = useMemo(() => {
    if (!draft) return [];
    const issues: ValidationIssue[] = [];
    
    // Only check semantic tokens that are actually in globalOverrides
    Object.entries(draft.globalOverrides || {}).forEach(([semanticKey, overrideValue]) => {
      // Only validate semantic tokens
      if (!semanticKey.startsWith('semantic.')) return;
      
      // Find the token definition
      const token = tokens.find((t) => t.key === semanticKey);
      if (!token) return;
      
      // Check 1: Locked token override (priority 1)
      if (token.locked) {
        issues.push({
          id: `locked-${semanticKey}`,
          message: `${semanticKey} is locked and cannot be overridden.`,
          severity: 'error',
          field: semanticKey,
        });
      }
      
      // Check 2: Critical contrast failures only (< 4.5:1) (priority 2)
      if (token.type === 'color' && token.contrastAgainst) {
        const foreground = overrideValue;
        const background =
          resolvedTokens[token.contrastAgainst] ??
          resolvedTokens['semantic.color.surface'] ??
          '#ffffff';
        const ratio = getContrastRatio(foreground, background);
        const required = token.contrastMin ?? 4.5;
        // Only error if below AA (4.5:1), ignore AAA failures (7:1)
        if (ratio < 4.5) {
          issues.push({
            id: `contrast-${semanticKey}`,
            message: `Contrast ${ratio.toFixed(2)}:1 vs ${token.contrastAgainst} is below AA (${required}:1).`,
            severity: 'error',
            field: semanticKey,
          });
        }
      }
    });

    // Limit to 2 issues max: prioritize locked tokens first, then contrast failures
    const lockedIssues = issues.filter((issue) => issue.id.startsWith('locked-'));
    const contrastIssues = issues.filter((issue) => issue.id.startsWith('contrast-'));
    
    // Return max 2: locked issues first, then contrast issues
    if (lockedIssues.length >= 2) {
      return lockedIssues.slice(0, 2);
    } else if (lockedIssues.length === 1) {
      return [...lockedIssues, ...contrastIssues.slice(0, 1)];
    } else {
      return contrastIssues.slice(0, 2);
    }
  }, [draft, tokens, resolvedTokens]);

  const handleGlobalOverridesSave = (overrides: Record<string, string>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      globalOverrides: overrides,
    });
  };

  const handleComponentOverrideChange = (componentId: string, tokenKey: string, value: string) => {
    if (!draft) return;
    const componentOverrides = { ...draft.components };
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
    setDraft({ ...draft, components: componentOverrides });
  };

  const handleSaveDraft = async () => {
    if (!draft) return;
    await saveThemeDraft(draft);
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
      await saveThemeDraft(draft);
      await publishTheme(draft.id, { createdBy: 'demo@local', notes });
      addToast('Theme published', 'success');
      setPublishModalOpen(false);
      loadData();
    } catch (error) {
      addToast('Failed to publish theme', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (!draft || !theme) {
    return <p className="text-gray-500">Loading theme…</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/themes" className="text-xs text-indigo-600 hover:text-indigo-800">
            ← Back to themes
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
            onClick={() => setMappingOpen(true)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Map semantic tokens
          </button>
          <button
            onClick={openPublishModal}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {publishing ? 'Publishing…' : 'Publish draft'}
          </button>
        </div>
      </header>


      <ThemeEditor
        theme={draft}
        tokens={tokens}
        components={components}
        resolvedTokens={resolvedTokens}
        selectedComponentId={selectedComponentId}
        onSelectComponent={setSelectedComponentId}
        onComponentOverrideChange={handleComponentOverrideChange}
        previewTokens={previewTokens}
        previewTheme={previewTheme}
        previewThemeId={previewThemeId}
        previewOptions={previewDropdownOptions}
        onPreviewThemeChange={setPreviewThemeId}
        onOpenGlobalOverrides={() => setGlobalOverridesOpen(true)}
      />

      <ImpactModal isOpen={impactModalOpen} onClose={() => setImpactModalOpen(false)} report={impactReport} />
      <PublishModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        theme={draft}
        tokens={tokens}
        components={components}
        latestVersion={latestVersion}
        validations={validationIssues}
        impact={impactReport}
        onConfirm={handlePublish}
      />
      <SemanticMappingDrawer
        isOpen={mappingOpen}
        onClose={() => setMappingOpen(false)}
        theme={draft}
        baseTokens={tokens}
        resolvedTokens={resolvedTokens}
        validationIssues={validationIssues}
        onSave={(semanticMappings) => {
          if (!draft) return;
          // Merge semantic token mappings with existing non-semantic overrides
          const nonSemanticOverrides: Record<string, string> = {};
          Object.entries(draft.globalOverrides || {}).forEach(([key, value]) => {
            if (!key.startsWith('semantic.')) {
              nonSemanticOverrides[key] = value;
            }
          });
          setDraft({
            ...draft,
            globalOverrides: {
              ...nonSemanticOverrides,
              ...semanticMappings,
            },
          });
        }}
      />
      <GlobalOverridesModal
        isOpen={globalOverridesOpen}
        onClose={() => setGlobalOverridesOpen(false)}
        theme={draft}
        tokens={tokens}
        onSave={handleGlobalOverridesSave}
      />
    </div>
  );
}

