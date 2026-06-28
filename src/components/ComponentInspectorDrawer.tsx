import { useEffect, useMemo, useState } from 'react';
import { ComponentDef, Token, TokenValueMap } from '@/types';
import { MuiPreview } from '@/components/MuiPreview';
import { resolveComponentTokens } from '@/lib/resolver';

interface Props {
  component: ComponentDef | null;
  isOpen: boolean;
  onClose: () => void;
  tokens: Token[];
  resolvedTokens: TokenValueMap;
  presetName: string;
}

const structureGuidance: Record<string, string> = {
  header: 'Use semantic <header> tags or role="heading" for section titles.',
  body: 'Ensure copy is grouped inside <section>/<article> for screen readers.',
  footer: 'Provide clear affordances for secondary actions.',
  container: 'Wrap in landmarks (main/region) when appropriate.',
  icon: 'Icons conveying meaning must include aria-label or title text.',
  label: 'Associate labels with controls via for/id.',
  metadata: 'Expose additional data via aria-describedby when necessary.',
  row: 'Use role="row" within tables/lists and announce order.',
  button: 'Maintain 4.5:1 contrast with background and provide focus states.',
};

const structureComponents: Record<string, string[]> = {
  header: ['badge.status', 'button.secondary'],
  footer: ['button.secondary', 'button.primary'],
  body: ['list.item', 'stat.card'],
  row: ['table.simple', 'table.row'],
  icon: ['avatar.cluster', 'badge.status'],
  metadata: ['timeline.entry', 'toast.notification'],
};

// Component-specific slot configurations
// Only include structure parts that need content selection (not structural wrappers)
const componentSlotConfig: Record<string, Record<string, string[]>> = {
  'card.primary': {
    header: ['text', 'image', 'video', 'badge', 'icon'],
    body: ['text', 'list', 'form fields', 'stat cards', 'chart', 'table', 'media'],
    footer: ['buttons', 'links', 'pagination']
  },
  'button.primary': {
    button: ['text', 'icon', 'spinner']
  },
  'button.secondary': {
    button: ['text', 'icon', 'spinner']
  },
  'hero.banner': {
    media: ['image', 'video', 'illustration'],
    copy: ['heading', 'paragraph', 'list'],
    cta: ['button', 'button group', 'links']
  },
  'navbar.global': {
    brand: ['logo', 'text', 'image'],
    links: ['nav links', 'menu items'],
    actions: ['buttons', 'icons', 'dropdown']
  },
  'list.item': {
    icon: ['svg icon', 'emoji', 'avatar', 'badge'],
    label: ['text', 'heading'],
    metadata: ['timestamp', 'author', 'tags']
  },
  'badge.status': {
    icon: ['svg icon', 'emoji', 'dot'],
    label: ['text', 'number']
  },
  'modal.dialog': {
    header: ['text', 'heading'],
    body: ['text', 'form fields', 'list', 'media'],
    footer: ['buttons', 'links']
  },
  'input.field': {
    label: ['text'],
    input: ['text field', 'textarea', 'select'],
    hint: ['help text'],
    error: ['error message']
  },
  'table.row': {
    cell: ['text', 'number', 'badge', 'avatar'],
    actions: ['buttons', 'icons']
  },
  'table.simple': {
    cell: ['text', 'number', 'badge', 'avatar']
  },
  'avatar.cluster': {
    avatar: ['image', 'initials', 'icon'],
    counter: ['number', 'text']
  },
  'timeline.entry': {
    indicator: ['dot', 'icon', 'number'],
    content: ['text', 'heading', 'paragraph'],
    meta: ['timestamp', 'author', 'tags'],
    actions: ['buttons', 'links']
  },
  'toast.notification': {
    icon: ['svg icon', 'badge'],
    body: ['text', 'heading'],
    actions: ['buttons', 'links']
  },
  'chart.sparkline': {
    label: ['text'],
    value: ['number'],
    chart: ['line', 'bar', 'area'],
    delta: ['percentage', 'arrow', 'indicator']
  },
  'stat.card': {
    label: ['text'],
    value: ['number'],
    delta: ['percentage', 'arrow'],
    trend: ['indicator', 'icon', 'chart']
  }
};

// Helper to get slot options for a specific component and structure part
const getSlotOptionsForPart = (componentId: string, structurePart: string): string[] => {
  return componentSlotConfig[componentId]?.[structurePart] || [];
};

export function ComponentInspectorDrawer({
  component,
  isOpen,
  onClose,
  tokens,
  resolvedTokens,
  presetName,
}: Props) {
  const [currentVariant, setCurrentVariant] = useState<string | null>(null);
  const [currentViewport, setCurrentViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [slotSelections, setSlotSelections] = useState<Record<string, Record<number, string>>>({});

  // Smart defaults based on component type
  const getSmartDefault = (componentId: string, structurePart: string): string => {
    const slotOptions = getSlotOptionsForPart(componentId, structurePart);
    if (!slotOptions || slotOptions.length === 0) return '';
    
    // Component-specific smart defaults
    const defaults: Record<string, Record<string, string>> = {
      'card.primary': { header: 'text', body: 'text', footer: 'buttons' },
      'button.primary': { button: 'text' },
      'button.secondary': { button: 'text' },
      'hero.banner': { media: 'image', copy: 'heading', cta: 'button' },
      'navbar.global': { brand: 'logo', links: 'nav links', actions: 'buttons' },
      'list.item': { icon: 'svg icon', label: 'text', metadata: 'timestamp' },
      'badge.status': { icon: 'svg icon', label: 'text' },
      'modal.dialog': { header: 'text', body: 'text', footer: 'buttons' },
      'input.field': { label: 'text', input: 'text field', hint: 'help text', error: 'error message' },
      'table.row': { cell: 'text', actions: 'buttons' },
      'table.simple': { cell: 'text' },
      'avatar.cluster': { avatar: 'image', counter: 'number' },
      'timeline.entry': { indicator: 'icon', content: 'text', meta: 'timestamp', actions: 'buttons' },
      'toast.notification': { icon: 'svg icon', body: 'text', actions: 'buttons' },
      'chart.sparkline': { label: 'text', value: 'number', chart: 'line', delta: 'percentage' },
      'stat.card': { label: 'text', value: 'number', delta: 'percentage', trend: 'indicator' }
    };
    
    return defaults[componentId]?.[structurePart] || slotOptions[0];
  };

  // Handle slot selection change
  const handleSlotChange = (index: number, value: string) => {
    if (!component) return;
    
    setSlotSelections((prev) => ({
      ...prev,
      [component.id]: {
        ...(prev[component.id] || {}),
        [index]: value
      }
    }));
  };

  useEffect(() => {
    setCurrentVariant(component?.variants?.[0]?.id ?? null);
    setCurrentViewport('desktop');
  }, [component]);

  // Initialize selections when component changes
  useEffect(() => {
    if (!component) return;
    
    setSlotSelections((prev) => {
      if (prev[component.id]) return prev; // Persist existing selections
      
      const selections: Record<number, string> = {};
      component.structure.forEach((part, index) => {
        selections[index] = getSmartDefault(component.id, part);
      });
      
      return { ...prev, [component.id]: selections };
    });
  }, [component]);

  const previewTokens = useMemo(() => {
    if (!component) return resolvedTokens;
    return resolveComponentTokens(component, resolvedTokens, undefined);
  }, [component, resolvedTokens]);

  const tokenMap = useMemo(
    () =>
      tokens.reduce<Record<string, Token>>((acc, token) => {
        acc[token.key] = token;
        return acc;
      }, {}),
    [tokens]
  );

  if (!component || !isOpen) return null;

  const composableElements = component.structure.flatMap((part) => structureComponents[part] || []);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />
      <aside
        className="fixed right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase text-gray-500 mb-1">Component detail</p>
              <h2 className="text-2xl font-semibold text-gray-900">{component.name}</h2>
              <p className="text-xs text-gray-500">{component.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
              aria-label="Close component drawer"
            >
              ×
            </button>
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Live preview</h3>
                <p className="text-xs text-gray-500">Tokens from preset: {presetName}</p>
              </div>
              <div className="flex items-center gap-3">
                {component.variants && component.variants.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {component.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setCurrentVariant(variant.id)}
                        className={`px-2 py-1 rounded-full border text-xs ${
                          currentVariant === variant.id
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {variant.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-white">
                  <button
                    onClick={() => setCurrentViewport('desktop')}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
                      currentViewport === 'desktop'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Desktop view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentViewport('tablet')}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
                      currentViewport === 'tablet'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Tablet view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="18" r="1" fill="currentColor"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentViewport('mobile')}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
                      currentViewport === 'mobile'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Mobile view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="7" y="2" width="10" height="20" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <MuiPreview
              tokens={resolvedTokens}
              component={component}
              variantId={currentVariant}
              viewport={currentViewport}
            />
            {currentVariant && (
              <p className="text-xs text-gray-500">
                {component.variants?.find((variant) => variant.id === currentVariant)?.description}
              </p>
            )}
          </section>
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Atom structure</h3>
            <ul className="space-y-2">
              {component.structure.map((part, index) => {
                const slotOptions = getSlotOptionsForPart(component.id, part);
                const selectedSlot = slotSelections[component.id]?.[index];
                const isStructural = slotOptions.length === 0;
                
                return (
                  <li
                    key={`${part}-${index}`}
                    className={`rounded-lg border px-3 py-2 text-xs text-gray-600 space-y-2 ${
                      isStructural 
                        ? 'border-gray-200 bg-gray-50/50' 
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="uppercase tracking-wide text-[10px] text-gray-400 font-medium">{part}</p>
                          {isStructural && (
                            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded text-[9px] font-medium">
                              structural
                            </span>
                          )}
                        </div>
                        <p>{structureGuidance[part] ?? 'Represent this region with proper semantics and grouping.'}</p>
                      </div>
                      {!isStructural && slotOptions.length > 0 && (
                        <div className="relative">
                          <select 
                            value={selectedSlot || ''}
                            onChange={(e) => handleSlotChange(index, e.target.value)}
                            className="px-2 py-1 text-[11px] border border-gray-200 rounded bg-white text-gray-600 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            title="Select content type for this slot"
                          >
                            <option value="">Choose content...</option>
                            {slotOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    {!isStructural && slotOptions.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {slotOptions.map((option) => (
                          <span
                            key={option}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              selectedSlot === option
                                ? 'bg-indigo-600 text-white'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Tokens in use</h3>
            <div className="space-y-2 text-xs">
              {component.tokensUsed.map((tokenKey) => (
                <div key={tokenKey} className="rounded-lg border border-gray-100 bg-white px-3 py-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">{tokenKey}</span>
                    <code className="text-[11px] text-gray-500">{previewTokens[tokenKey] ?? 'inherit'}</code>
                  </div>
                  {tokenMap[tokenKey]?.description && (
                    <p className="text-[11px] text-gray-500">{tokenMap[tokenKey]?.description}</p>
                  )}
                  {tokenMap[tokenKey]?.type === 'color' && tokenMap[tokenKey]?.contrastAgainst && (
                    <p className="text-[10px] text-gray-400">
                      Requires ≥ {tokenMap[tokenKey]?.contrastMin ?? 4.5}:1 vs{' '}
                      {tokenMap[tokenKey]?.contrastAgainst}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Composable elements</h3>
            {composableElements.length > 0 ? (
              <div className="flex flex-wrap gap-2 text-xs">
                {composableElements.map((item) => (
                  <span key={`${component.id}-${item}`} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No suggested nested components for this structure.</p>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Accessibility</h3>
            <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700">
              {component.a11y?.description || (
                <span className="text-gray-400 italic">No accessibility description provided</span>
              )}
            </div>
            <ul className="mt-3 space-y-2 text-xs text-gray-600">
              {component.structure.map((part) => (
                <li key={`a11y-${part}`} className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>{structureGuidance[part] ?? 'Ensure semantic markup and descriptive labelling.'}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Responsive behavior</h3>
            <p className="text-xs text-gray-600">
              {component.variants?.some((variant) => variant.id === 'stacked')
                ? 'Includes stacked variant for narrow viewports. Switch to column layout below 640px and allow CTAs to wrap.'
                : 'Ensure layout wraps at 640px, spacing tokens scale with clamp(), and tap targets remain 44px.'}
            </p>
          </section>
        </div>
      </aside>
    </>
  );
}

