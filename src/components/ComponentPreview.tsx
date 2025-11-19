import { ComponentDef, Theme, Token } from '@/types';
import { resolveComponentTokens, resolveTokens } from '@/lib/resolver';
import { PreviewCanvas } from './PreviewCanvas';

interface ComponentPreviewProps {
  component: ComponentDef;
  theme: Theme | null;
  tokens: Token[];
}

export function ComponentPreview({ component, theme, tokens }: ComponentPreviewProps) {
  const resolved = resolveTokens(tokens, theme || undefined);
  const componentTokens = resolveComponentTokens(component, resolved, theme || undefined);
  return <PreviewCanvas tokens={componentTokens} component={component} />;
}

