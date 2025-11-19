import { describe, it, expect } from 'vitest';
import { resolveTokens } from './resolver';
import { Token, Theme } from '@/types';

describe('Token Resolution', () => {
  const baseTokens: Token[] = [
    { key: 'semantic.color.primary', type: 'color', value: '#2563eb' },
    { key: 'semantic.color.surface', type: 'color', value: '#ffffff' },
    { key: 'radius.medium', type: 'size', value: '8px' },
  ];

  it('should return base tokens when no theme is provided', () => {
    const result = resolveTokens(baseTokens, undefined);
    expect(result['semantic.color.primary']).toBe('#2563eb');
  });

  it('should apply global overrides from theme', () => {
    const theme: Theme = {
      id: 'test',
      name: 'Test',
      globalOverrides: {
        'semantic.color.primary': '#FF0000',
      },
      components: {},
      publishedVersions: [],
    };

    const result = resolveTokens(baseTokens, theme);
    expect(result['semantic.color.primary']).toBe('#FF0000');
  });

  it('should preserve non-overridden tokens', () => {
    const theme: Theme = {
      id: 'test',
      name: 'Test',
      globalOverrides: {
        'semantic.color.primary': '#FF0000',
      },
      components: {},
      publishedVersions: [],
    };

    const result = resolveTokens(baseTokens, theme);
    expect(result['semantic.color.surface']).toBe('#ffffff');
  });
});

