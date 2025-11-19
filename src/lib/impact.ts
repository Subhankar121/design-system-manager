import { ComponentDef, ImpactComponentSummary, ImpactReport, Theme, Token, TokenValueMap } from '@/types';
import { resolveTokens } from './resolver';

const mapTokens = (tokens: Token[]): TokenValueMap =>
  tokens.reduce<TokenValueMap>((acc, token) => {
    acc[token.key] = token.value;
    return acc;
  }, {});

export const computeImpact = (
  themeDraft: Theme,
  baseTokens: Token[],
  components: ComponentDef[]
): ImpactReport => {
  const baseMap = mapTokens(baseTokens);
  const resolved = resolveTokens(baseTokens, themeDraft);

  const changedTokens = Object.keys({ ...baseMap, ...resolved })
    .map((key) => {
      const from = baseMap[key];
      const to = resolved[key];
      if (from === to) return null;
      const impactedComponents = components
        .filter((component) => component.tokensUsed.includes(key))
        .map((component) => component.name);
      return impactedComponents.length
        ? { key, from, to, components: impactedComponents }
        : null;
    })
    .filter(Boolean) as ImpactReport['changedTokens'];

  const affectedComponents = Array.from(new Set(changedTokens.flatMap((change) => change.components)));

  const changedKeySet = new Set(changedTokens.map((c) => c.key));
  const componentSummaries: ImpactComponentSummary[] = components
    .filter((c) => c.tokensUsed.some((t) => changedKeySet.has(t)))
    .map((c) => {
      const tokensImpacted = c.tokensUsed.filter((t) => changedKeySet.has(t));
      const variantCount = c.variants?.length ?? 1;
      const severity =
        tokensImpacted.length >= 3 ? 'high' : tokensImpacted.length === 2 ? 'medium' : 'low';
      return {
        id: c.id,
        name: c.name,
        structure: c.structure,
        tokensImpacted,
        variantCount,
        severity,
      };
    });

  const severity =
    affectedComponents.length > 8 ? 'high' : affectedComponents.length > 3 ? 'medium' : 'low';

  return {
    changedTokens,
    affectedComponents,
    severity,
    componentSummaries,
  };
};

