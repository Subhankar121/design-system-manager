import { useEffect, useMemo, useState } from 'react';
import { ComponentDef, Theme, Token } from '@/types';
import { getComponents, getThemes, getTokens } from '@/lib/mockApi';
import { resolveTokens } from '@/lib/resolver';
import { ComponentInspectorDrawer } from '@/components/ComponentInspectorDrawer';
import { ComponentCard } from '@/components/ComponentCard';
import { AlertBanner } from '@/components/AlertBanner';
import { PageHeader } from '@/components/PageHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import { HelpBox } from '@/components/HelpBox';

export function ComponentsPage() {
  const [components, setComponents] = useState<ComponentDef[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [selectedComponent, setSelectedComponent] = useState<ComponentDef | null>(null);

  const loadData = async () => {
    const [componentData, tokenData, themeData] = await Promise.all([
      getComponents(),
      getTokens(),
      getThemes(),
    ]);
    setComponents(componentData);
    setTokens(tokenData);
    setThemes(themeData);
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('dsm:change', handler);
    return () => window.removeEventListener('dsm:change', handler);
  }, []);

  const theme = themes.find((t) => t.id === selectedTheme) ?? null;
  const resolvedTokens = useMemo(() => resolveTokens(tokens, theme || undefined), [tokens, theme]);

  const missingA11y = components.filter((component) => !component.a11y?.description).length;

  const componentsByCategory = useMemo(() => {
    const categories: Record<string, ComponentDef[]> = {};
    components.forEach((component) => {
      const category = component.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(component);
    });
    return categories;
  }, [components]);

  return (
    <div className="space-y-8">
      <PageHeader
        badge="Component Registry"
        title="UI Components"
        description="Browse your component library, inspect token usage, and verify accessibility compliance."
        actions={
          themes.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="component-theme" className="text-sm font-medium text-gray-700">
                Preview with
              </label>
              <select
                id="component-theme"
                value={selectedTheme}
                onChange={(event) => setSelectedTheme(event.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {themes.map((themeOption) => (
                  <option key={themeOption.id} value={themeOption.id}>
                    {themeOption.name}
                  </option>
                ))}
              </select>
            </div>
          )
        }
      />

      {missingA11y > 0 && (
        <AlertBanner
          type="warning"
          title="Accessibility audit needed"
          message={`${missingA11y} component${missingA11y > 1 ? 's lack' : ' lacks'} accessibility descriptions. Complete documentation to ensure WCAG compliance.`}
        />
      )}

      {components.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
          }
          title="No components found"
          description="Start by importing components from your design system or create them manually."
          action={{
            label: 'Load demo components',
            onClick: loadData
          }}
        />
      ) : (
        <>
          {Object.entries(componentsByCategory).map(([category, categoryComponents]) => (
            <section key={category} className="space-y-4">
              <SectionHeader
                title={category}
                description={`${categoryComponents.length} component${categoryComponents.length > 1 ? 's' : ''} · Click to inspect details`}
                badge={categoryComponents.length.toString()}
              />
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {categoryComponents.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    onClick={() => setSelectedComponent(component)}
                  />
                ))}
              </div>
            </section>
          ))}

          <HelpBox title="Understanding components" variant="info">
            <p className="mb-2">Each component in your registry includes:</p>
            <ul className="space-y-1 text-sm list-disc list-inside">
              <li><strong>Token dependencies:</strong> Which design tokens affect its styling</li>
              <li><strong>Atomic structure:</strong> How content slots compose the component</li>
              <li><strong>Accessibility notes:</strong> Guidelines for proper implementation</li>
              <li><strong>Variants:</strong> Different states and visual options available</li>
            </ul>
          </HelpBox>
        </>
      )}

      <ComponentInspectorDrawer
        component={selectedComponent}
        isOpen={Boolean(selectedComponent)}
        onClose={() => setSelectedComponent(null)}
        tokens={tokens}
        resolvedTokens={resolvedTokens}
        presetName={theme?.name ?? 'Base tokens'}
      />
    </div>
  );
}

