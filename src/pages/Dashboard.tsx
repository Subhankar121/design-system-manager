import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  getComponents,
  getThemes,
  getTokens,
  initSeedDataIfNeeded,
  saveThemeDraft,
} from '@/lib/mockApi';
import { ComponentDef, ImpactReport, Theme, Token } from '@/types';
import { AlertBanner } from '@/components/AlertBanner';
import { computeImpact } from '@/lib/impact';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/PageHeader';
import { StatsCard } from '@/components/StatsCard';
import { SectionHeader } from '@/components/SectionHeader';
import { HelpBox } from '@/components/HelpBox';

interface Stats {
  tokens: number;
  components: number;
  themes: number;
  lastPublished?: { theme: string; version: string };
}

export function Dashboard() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [components, setComponents] = useState<ComponentDef[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [impact, setImpact] = useState<ImpactReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const navigate = useNavigate();
  const { addToast } = useToast();

  const loadData = async () => {
    const [tokenData, componentData, themeData] = await Promise.all([
      getTokens(),
      getComponents(),
      getThemes(),
    ]);
    setTokens(tokenData);
    setComponents(componentData);
    setThemes(themeData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats: Stats = useMemo(() => {
    const base: Stats = {
      tokens: tokens.length,
      components: components.length,
      themes: themes.length,
    };
    return base;
  }, [tokens, components, themes]);

  const conflictingTokens = useMemo(() => {
    const conflicts: Record<string, Set<string>> = {};
    themes.forEach((theme) => {
      Object.entries(theme.globalOverrides).forEach(([key, value]) => {
        if (!conflicts[key]) conflicts[key] = new Set();
        conflicts[key].add(value);
      });
    });
    return Object.entries(conflicts).filter(([, values]) => values.size > 1).length;
  }, [themes]);

  const missingA11y = components.filter((component) => !component.a11y?.description).length;

  const handleImpactAnalysis = async () => {
    if (themes.length === 0) return;
    setIsAnalyzing(true);
    const report = computeImpact(themes[0], tokens, components);
    setImpact(report);
    setIsAnalyzing(false);
  };

  const handleCreateTheme = async () => {
    if (!newThemeName.trim()) return;
    const newTheme: Theme = {
      id: newThemeName.toLowerCase().replace(/\s+/g, '_'),
      name: newThemeName.trim(),
      globalOverrides: {},
      components: {},
      publishedVersions: [],
    };
    await saveThemeDraft(newTheme);
    setShowCreate(false);
    setNewThemeName('');
    await loadData();
    navigate(`/themes/${newTheme.id}/edit`);
  };

  const handleImportSeeds = async () => {
    await initSeedDataIfNeeded(true);
    await loadData();
    addToast('Seed data reloaded', 'success');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        badge="Design System Operations"
        title="Dashboard"
        description="Monitor your design system health, track changes, and manage governance workflows."
        actions={
          <>
            <button
              onClick={handleImportSeeds}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              title="Reset to demo data"
            >
              Reset demo
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Create theme
            </button>
          </>
        }
      />

      <section>
        <SectionHeader
          title="System Overview"
          description="Key metrics about your design system"
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            label="Design Tokens"
            value={stats.tokens}
            description="Colors, spacing, typography"
            onClick={() => navigate('/tokens')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            }
          />
          <StatsCard
            label="Components"
            value={stats.components}
            description="UI patterns in registry"
            onClick={() => navigate('/components')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
            }
          />
          <StatsCard
            label="Themes"
            value={stats.themes}
            description="Brand variations"
            onClick={() => navigate('/themes')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            }
          />
          <StatsCard
            label="Issues"
            value={conflictingTokens + missingA11y}
            description={conflictingTokens > 0 || missingA11y > 0 ? 'Needs attention' : 'All clear'}
            trend={conflictingTokens > 0 || missingA11y > 0 ? {value: 'Action required', direction: 'down'} : undefined}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
        </div>
      </section>

      {(conflictingTokens > 0 || missingA11y > 0 || impact) && (
        <section>
          <SectionHeader
            title="Alerts & Notifications"
            description="Issues that need your attention"
          />
          <div className="space-y-3">
            {conflictingTokens > 0 && (
              <AlertBanner
                type="warning"
                title="Token conflicts detected"
                message={`${conflictingTokens} tokens have conflicting values across themes. This may cause inconsistent styling.`}
                actionLabel="Review conflicts"
                onAction={() => navigate('/tokens')}
              />
            )}
            {missingA11y > 0 && (
              <AlertBanner
                type="error"
                title="Accessibility descriptions missing"
                message={`${missingA11y} components lack proper a11y documentation. Add descriptions to improve usability.`}
                actionLabel="Fix accessibility"
                onAction={() => navigate('/components')}
              />
            )}
            {impact && (
              <AlertBanner
                type={impact.severity === 'high' ? 'error' : impact.severity === 'medium' ? 'warning' : 'info'}
                title="Impact analysis complete"
                message={`Changes affect ${impact.changedTokens.length} tokens and ${impact.affectedComponents.length} components. ${impact.severity === 'high' ? 'Review carefully before publishing.' : 'Ready to review.'}`}
                actionLabel="View impact report"
                onAction={() => navigate('/themes')}
              />
            )}
          </div>
        </section>
      )}

      {stats.tokens === 0 && stats.components === 0 && stats.themes === 0 ? (
        <section className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="text-gray-400">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Design System Manager</h3>
              <p className="text-gray-600">Get started by loading demo data to explore the platform's features.</p>
            </div>
            <button
              onClick={handleImportSeeds}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Load demo data
            </button>
          </div>
        </section>
      ) : (
        <>
          <section>
            <SectionHeader
              title="Quick Actions"
              description="Common workflows to manage your design system"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/themes"
                className="group bg-white border border-gray-200 rounded-lg p-5 hover:border-indigo-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Manage themes</h3>
                    <p className="text-sm text-gray-600">Create, edit, and publish brand variations</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/tokens"
                className="group bg-white border border-gray-200 rounded-lg p-5 hover:border-indigo-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Review tokens</h3>
                    <p className="text-sm text-gray-600">Check contrast, conflicts, and validation</p>
                  </div>
                </div>
              </Link>
              <button
                onClick={handleImpactAnalysis}
                disabled={isAnalyzing || themes.length === 0}
                className="group bg-white border border-gray-200 rounded-lg p-5 hover:border-indigo-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {isAnalyzing ? 'Analyzing...' : 'Impact analysis'}
                    </h3>
                    <p className="text-sm text-gray-600">Preview effects of token changes</p>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <HelpBox title="What's next?" variant="tip">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span><strong>Customize themes:</strong> Override semantic tokens to match your brand guidelines</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span><strong>Validate accessibility:</strong> Ensure all color combinations meet WCAG standards</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span><strong>Publish changes:</strong> Version and distribute your design tokens to development teams</span>
              </li>
            </ul>
          </HelpBox>
        </>
      )}

      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCreate(false)} aria-hidden="true" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-5">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Create new theme</h3>
                <p className="text-sm text-gray-600">
                  Themes inherit base design tokens and let you override them for different brands or products.
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="theme-name" className="block text-sm font-medium text-gray-700">
                  Theme name
                </label>
                <input
                  id="theme-name"
                  type="text"
                  value={newThemeName}
                  onChange={(event) => setNewThemeName(event.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Brand X, Dark Mode, Mobile App"
                  autoFocus
                />
                <p className="text-xs text-gray-500">
                  Choose a descriptive name that identifies the brand or use case
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCreate(false);
                    setNewThemeName('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTheme}
                  disabled={!newThemeName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Create theme
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

