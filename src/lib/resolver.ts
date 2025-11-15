import { ComponentDef, Preset, Token, TokenValueMap } from '@/types';

const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const sizeRegex = /^\d+(\.\d+)?(px|rem|em|%)$/;

export const tokenToCSSVar = (key: string) => `--token-${key.replace(/\./g, '-')}`;

export const isValidColor = (value: string) => {
  if (!value) return false;
  if (hexRegex.test(value.trim())) return true;
  if (typeof window !== 'undefined' && window.CSS?.supports?.('color', value)) {
    return true;
  }
  return false;
};

export const isValidSize = (value: string) => sizeRegex.test(value.trim());

export const validateTokenValue = (token: Token): string | null => {
  if (!token.value) {
    return 'Value is required';
  }

  if (token.locked) {
    return null;
  }

  switch (token.type) {
    case 'color':
      return isValidColor(token.value) ? null : 'Invalid color value';
    case 'size':
    case 'spacing':
      return isValidSize(token.value) ? null : 'Invalid size (ex: 8px, 1rem)';
    default:
      return null;
  }
};

export const resolveTokens = (baseTokens: Token[], preset?: Preset): TokenValueMap => {
  const resolved = baseTokens.reduce<Record<string, string>>((acc, token) => {
    acc[token.key] = token.value;
    return acc;
  }, {});

  if (preset) {
    Object.entries(preset.globalOverrides || {}).forEach(([key, value]) => {
      resolved[key] = value;
    });
  }

  return resolved;
};

export const resolveComponentTokens = (
  component: ComponentDef,
  resolvedTokens: TokenValueMap,
  preset?: Preset
): TokenValueMap => {
  const componentMap: TokenValueMap = {};
  component.tokensUsed.forEach((key) => {
    componentMap[key] = resolvedTokens[key];
  });

  const overrides = preset?.componentOverrides?.[component.id];
  if (overrides) {
    Object.entries(overrides).forEach(([key, value]) => {
      componentMap[key] = value;
    });
  }

  return componentMap;
};

const normalizeHex = (value: string) => {
  if (!value) return value;
  if (value.startsWith('#') && value.length === 4) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return value.toUpperCase();
};

const channel = (hex: string, start: number) => parseInt(hex.substr(start, 2), 16) / 255;

const luminance = (hex: string) => {
  const norm = normalizeHex(hex).replace('#', '');
  const r = channel(norm, 0);
  const g = channel(norm, 2);
  const b = channel(norm, 4);

  const transform = (val: number) =>
    val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);

  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
};

export const getContrastRatio = (foreground: string, background: string): number => {
  if (!isValidColor(foreground) || !isValidColor(background)) return 0;
  const L1 = luminance(foreground);
  const L2 = luminance(background);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
};

export const aaAARating = (ratio: number): 'AAA' | 'AA' | 'Fail' => {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'Fail';
};

export const applyTokensToElement = (node: HTMLElement, tokens: TokenValueMap) => {
  Object.entries(tokens).forEach(([key, value]) => {
    node.style.setProperty(tokenToCSSVar(key), value);
  });
};

