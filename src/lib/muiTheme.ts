import { createTheme, type Theme as MuiTheme } from '@mui/material/styles';
import type { TokenValueMap } from '@/types';

// THE BRIDGE: maps the resolved DSM token map (semantic.* keys) into a real MUI
// theme. The Tokens page, themes, and overrides keep editing these same keys;
// this just translates them into what real MUI components actually read.

const px = (v: string | undefined, fallback: number): number => {
  if (!v) return fallback;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

export function tokensToMuiTheme(t: TokenValueMap): MuiTheme {
  const c = (k: string, fb: string) => t[k] || fb;
  // spacing.sm (~8px) maps to MUI's base spacing unit
  const spacingUnit = px(t['semantic.spacing.sm'] || t['spacing.sm'], 8);

  return createTheme({
    palette: {
      primary: { main: c('semantic.color.primary', '#2563eb') },
      secondary: { main: c('semantic.color.secondary', '#7c3aed') },
      success: { main: c('semantic.color.success', '#10b981') },
      warning: { main: c('semantic.color.warning', '#f59e0b') },
      error: { main: c('semantic.color.danger', '#ef4444') },
      info: { main: c('semantic.color.info', '#0ea5e9') },
      background: {
        paper: c('semantic.color.surface', '#ffffff'),
        default: c('semantic.color.surface.alt', '#f8fafc'),
      },
      text: {
        primary: c('semantic.color.text', '#0f172a'),
        secondary: c('semantic.color.text.muted', '#475569'),
      },
      divider: c('semantic.color.border', '#e2e8f0'),
    },
    shape: { borderRadius: px(t['semantic.radius.md'] || t['radius.medium'], 8) },
    spacing: spacingUnit,
    typography: {
      fontFamily: c('semantic.font.base', t['font.base'] || "'Inter', system-ui, sans-serif"),
    },
  });
}

// Applies this component's token overrides onto the matching MUI component slot.
// Keeps the DSM per-component override concept, routed into MUI's components API.
// Human-readable "this maps to" label for documentation.
export const MUI_MAPPING: Record<string, string> = {
  'card.primary': 'MUI Card',
  'stat.card': 'MUI Card',
  'button.primary': 'MUI Button (contained)',
  'button.secondary': 'MUI Button (outlined / text)',
  'input.field': 'MUI TextField (OutlinedInput)',
  'badge.status': 'MUI Chip',
  'modal.dialog': 'MUI Paper / Dialog',
  'navbar.global': 'MUI AppBar + Toolbar',
  'hero.banner': 'MUI Paper + Typography',
  'list.item': 'MUI List / ListItem',
  'table.simple': 'MUI Table',
  'table.row': 'MUI Table (TableRow)',
  'avatar.cluster': 'MUI AvatarGroup',
  'timeline.entry': 'MUI Stack (custom timeline)',
  'toast.notification': 'MUI Alert',
  'chart.sparkline': 'MUI Paper + SVG',
};

const SLOT_BY_COMPONENT: Record<string, string> = {
  'card.primary': 'MuiCard',
  'stat.card': 'MuiCard',
  'button.primary': 'MuiButton',
  'button.secondary': 'MuiButton',
  'input.field': 'MuiOutlinedInput',
  'badge.status': 'MuiChip',
  'modal.dialog': 'MuiPaper',
  'navbar.global': 'MuiAppBar',
  'table.simple': 'MuiTableCell',
  'table.row': 'MuiTableCell',
  'toast.notification': 'MuiAlert',
};

export function applyComponentOverrides(
  base: MuiTheme,
  componentId: string,
  overrides?: Record<string, string>,
): MuiTheme {
  if (!overrides || !Object.keys(overrides).length) return base;
  const slot = SLOT_BY_COMPONENT[componentId];
  if (!slot) return base;

  const root: Record<string, any> = {};
  for (const [key, value] of Object.entries(overrides)) {
    if (key.startsWith('radius') || key.endsWith('radius.md') || key.endsWith('radius.sm') || key.endsWith('radius.lg')) {
      root.borderRadius = px(value, 8);
    } else if (key.startsWith('shadow') || key.includes('shadow')) {
      root.boxShadow = value;
    } else if (key.includes('color.border')) {
      root.borderColor = value;
    } else if (key.startsWith('spacing') || key.includes('spacing')) {
      root.padding = value;
    }
  }
  if (!Object.keys(root).length) return base;

  return createTheme(base, { components: { [slot]: { styleOverrides: { root } } } });
}
