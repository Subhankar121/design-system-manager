import { describe, it, expect } from 'vitest';
import { resolveTokens } from './resolver';
import { Token, Preset } from '@/types';

describe('Token Resolution', () => {
  const baseTokens: Token[] = [
    { key: 'color.primary', type: 'color', value: '#0057D9' },
    { key: 'color.surface', type: 'color', value: '#ffffff' },
    { key: 'radius.medium', type: 'size', value: '8px' },
  ];

  it('should return base tokens when no preset is provided', () => {
    const result = resolveTokens(baseTokens, null);
    expect(result['color.primary']).toBe('#0057D9');
  });

  it('should apply global overrides from preset', () => {
    const preset: Preset = {
      id: 'test',
      name: 'Test',
      globalOverrides: {
        'color.primary': '#FF0000',
      },
      componentOverrides: {},
      publishedVersions: [],
    };

    const result = resolveTokens(baseTokens, preset);
    expect(result['color.primary']).toBe('#FF0000');
  });

  it('should preserve non-overridden tokens', () => {
    const preset: Preset = {
      id: 'test',
      name: 'Test',
      globalOverrides: {
        'color.primary': '#FF0000',
      },
      componentOverrides: {},
      publishedVersions: [],
    };

    const result = resolveTokens(baseTokens, preset);
    expect(result['color.surface']).toBe('#ffffff');
  });
});

