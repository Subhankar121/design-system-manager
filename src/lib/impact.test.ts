import { describe, it, expect } from 'vitest';
import { computeImpact } from './impact';
import { ComponentDef, Preset, Token } from '@/types';

const tokens: Token[] = [
  { key: 'color.primary', type: 'color', value: '#0057D9' },
  { key: 'color.surface', type: 'color', value: '#ffffff' },
];

const components: ComponentDef[] = [
  {
    id: 'button.primary',
    name: 'Button',
    tokensUsed: ['color.primary'],
    structure: ['button'],
  },
];

describe('computeImpact', () => {
  it('detects changed tokens and affected components', () => {
    const preset: Preset = {
      id: 'demo',
      name: 'Demo',
      globalOverrides: { 'color.primary': '#FF0000' },
      componentOverrides: {},
      publishedVersions: [],
    };

    const report = computeImpact(preset, tokens, components);
    expect(report.changedTokens).toHaveLength(1);
    expect(report.changedTokens[0].key).toBe('color.primary');
    expect(report.affectedComponents).toContain('Button');
  });
});

