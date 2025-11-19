import { describe, expect, it } from 'vitest';
import { aaAARating, getContrastRatio } from './resolver';

describe('contrast helpers', () => {
  it('computes WCAG contrast ratios', () => {
    const ratio = getContrastRatio('#ffffff', '#000000');
    expect(ratio).toBe(21);
    expect(aaAARating(ratio)).toBe('AAA');
  });

  it('returns 0 for invalid values', () => {
    const ratio = getContrastRatio('not-a-color', '#000000');
    expect(ratio).toBe(0);
  });
});


