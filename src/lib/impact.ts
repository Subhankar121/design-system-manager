import { ComponentDef, ImpactReport, Preset, Token, TokenValueMap } from '@/types';
import { resolveTokens } from './resolver';

const mapTokens = (tokens: Token[]): TokenValueMap =>
  tokens.reduce<TokenValueMap>((acc, token) => {
    acc[token.key] = token.value;
    return acc;
  }, {});

export const computeImpact = (
  presetDraft: Preset,
  baseTokens: Token[],
  components: ComponentDef[]
): ImpactReport => {
  const baseMap = mapTokens(baseTokens);
  const resolved = resolveTokens(baseTokens, presetDraft);

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

  const affectedComponents = Array.from(
    new Set(changedTokens.flatMap((change) => change.components))
  );

  const severity =
    affectedComponents.length > 4
      ? 'high'
      : affectedComponents.length > 1
      ? 'medium'
      : 'low';

  return {
    changedTokens,
    affectedComponents,
    severity,
  };
};

