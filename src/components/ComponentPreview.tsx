import { ComponentDef, Preset, Token } from '@/types';
import { resolveComponentTokens, resolveTokens } from '@/lib/resolver';
import { PreviewCanvas } from './PreviewCanvas';

interface ComponentPreviewProps {
  component: ComponentDef;
  preset: Preset | null;
  tokens: Token[];
}

export function ComponentPreview({ component, preset, tokens }: ComponentPreviewProps) {
  const resolved = resolveTokens(tokens, preset || undefined);
  const componentTokens = resolveComponentTokens(component, resolved, preset || undefined);
  return <PreviewCanvas tokens={componentTokens} component={component} />;
}

