import { ComponentDef, Theme, Token } from '@/types';
import { resolveTokens } from '@/lib/resolver';
import { MuiPreview } from './MuiPreview';

interface ComponentPreviewProps {
  component: ComponentDef;
  theme: Theme | null;
  tokens: Token[];
}

export function ComponentPreview({ component, theme, tokens }: ComponentPreviewProps) {
  const resolved = resolveTokens(tokens, theme || undefined);
  const overrides = theme?.components?.[component.id];
  return <MuiPreview component={component} tokens={resolved} overrides={overrides} />;
}
