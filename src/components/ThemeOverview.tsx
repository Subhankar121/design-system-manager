import { useMemo } from 'react';
import { ComponentDef, Token, TokenValueMap } from '@/types';
import { MuiPreview } from '@/components/MuiPreview';
import { ThemedStage } from '@/components/ThemedStage';
import { getContrastRatio, aaAARating } from '@/lib/resolver';
import {
  AppBar, Toolbar, Typography, IconButton, Avatar, Box, Card, CardContent, Chip,
  Paper, Stack, TextField, Button, Checkbox, FormControlLabel,
} from '@mui/material';
import { Menu as MenuIcon, Notifications } from '@mui/icons-material';

// Phase C + dark mode — the whole theme as one system, shown in the active mode,
// with the token section surfacing BOTH light and dark resolutions side by side
// plus a contrast flag, so weak mappings show up the moment you compare modes.

interface Props {
  components: ComponentDef[];
  tokens: Token[];
  resolvedLight: TokenValueMap;
  resolvedDark: TokenValueMap;
  colorMode: 'light' | 'dark';
}

// foreground keys are checked against the surface of their mode
const FG_KEYS = new Set([
  'semantic.color.text', 'semantic.color.text.muted', 'semantic.color.border',
  'semantic.color.primary', 'semantic.color.secondary',
]);

function ContrastBadge({ fg, bg }: { fg: string; bg: string }) {
  const ratio = getContrastRatio(fg, bg);
  const rating = aaAARating(ratio);
  const color = rating === 'Fail' ? 'bg-rose-100 text-rose-700 border-rose-200'
    : rating === 'AA' ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border ${color}`} title={`Contrast ${ratio}:1 vs surface`}>{rating} {ratio}</span>;
}

function ModeSwatch({ value, bg }: { value: string; bg: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5" style={{ backgroundColor: bg }}>
      <span className="w-5 h-5 rounded border border-black/10 flex-shrink-0" style={{ backgroundColor: value }} />
      <code className="text-[11px]" style={{ color: getContrastRatio('#000000', bg) > getContrastRatio('#ffffff', bg) ? '#000' : '#fff' }}>{value}</code>
    </div>
  );
}

export function ThemeOverview({ components, tokens, resolvedLight, resolvedDark, colorMode }: Props) {
  const resolved = colorMode === 'dark' ? resolvedDark : resolvedLight;

  const colorKeys = useMemo(
    () => tokens.map((t) => t.key).filter((k) => k.startsWith('semantic.color.')),
    [tokens]
  );
  const tokenMap = useMemo(() => Object.fromEntries(tokens.map((t) => [t.key, t])), [tokens]);
  const scaleRow = (prefix: string) =>
    tokens.filter((t) => t.key.startsWith(prefix)).map((t) => ({ key: t.key.replace(prefix, ''), value: resolved[t.key] ?? t.value }));

  const byCategory = useMemo(() => {
    const cats: Record<string, ComponentDef[]> = {};
    components.forEach((c) => { (cats[c.category || 'Uncategorized'] ||= []).push(c); });
    return cats;
  }, [components]);

  const lightSurface = resolvedLight['semantic.color.surface'] || '#ffffff';
  const darkSurface = resolvedDark['semantic.color.surface'] || '#1e1e1e';

  return (
    <div className="space-y-10">
      {/* Token summary — light + dark side by side */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Tokens — light &amp; dark</h3>
          <p className="text-xs text-gray-500">Each semantic color shown in both modes against its own surface, with contrast rating. Watch for <span className="text-rose-600 font-medium">Fail</span> badges.</p>
        </div>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left font-medium px-4 py-2">Token</th>
                <th className="text-left font-medium px-4 py-2">Intent</th>
                <th className="text-left font-medium px-4 py-2">Light</th>
                <th className="text-left font-medium px-4 py-2">Dark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {colorKeys.map((k) => {
                const lv = resolvedLight[k]; const dv = resolvedDark[k];
                const checkable = FG_KEYS.has(k);
                return (
                  <tr key={k}>
                    <td className="px-4 py-2"><code className="text-xs text-gray-700">{k.replace('semantic.color.', '')}</code></td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{tokenMap[k]?.description || '—'}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <ModeSwatch value={lv} bg={lightSurface} />
                        {checkable && <ContrastBadge fg={lv} bg={lightSurface} />}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <ModeSwatch value={dv} bg={darkSurface} />
                        {checkable && <ContrastBadge fg={dv} bg={darkSurface} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[['Radius', 'semantic.radius.'], ['Spacing', 'semantic.spacing.']].map(([label, prefix]) => (
            <div key={label} className="border border-gray-200 rounded-lg p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{label}</p>
              <ul className="space-y-1">
                {scaleRow(prefix).map((r) => (
                  <li key={r.key} className="flex justify-between text-sm"><span className="text-gray-600">{r.key}</span><code className="text-xs text-gray-500">{r.value}</code></li>
                ))}
              </ul>
            </div>
          ))}
          <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Type</p>
            <p className="text-sm text-gray-600" style={{ fontFamily: resolved['semantic.font.base'] }}>
              {(resolved['semantic.font.base'] || 'Inter').split(',')[0].replace(/['"]/g, '')}
            </p>
            <p className="text-xs text-gray-400 mt-1">Aa Bb Cc 123</p>
          </div>
        </div>
      </section>

      {/* Component gallery — active mode */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Components <span className="text-xs font-normal text-gray-400">({colorMode})</span></h3>
        {Object.entries(byCategory).map(([cat, list]) => (
          <div key={cat} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{cat}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {list.map((c) => (
                <div key={c.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="border-b border-gray-100 px-4 py-2 bg-gray-50">
                    <p className="text-sm font-medium text-gray-800">{c.name}</p>
                  </div>
                  <MuiPreview component={c} tokens={resolved} variantId={c.variants?.[0]?.id} mode={colorMode} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Sample pages — active mode */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Sample pages <span className="text-xs font-normal text-gray-400">({colorMode})</span></h3>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <ThemedStage tokens={resolved} mode={colorMode}>
            <AppBar position="static" sx={{ mb: 3 }}>
              <Toolbar>
                <IconButton edge="start" color="inherit"><MenuIcon /></IconButton>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>Dashboard</Typography>
                <IconButton color="inherit"><Notifications /></IconButton>
                <Avatar sx={{ ml: 2, width: 32, height: 32, bgcolor: 'secondary.main' }}>SP</Avatar>
              </Toolbar>
            </AppBar>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3,1fr)' }, gap: 2, px: 1 }}>
              {[['Revenue', '$48.2k'], ['Users', '12,840'], ['Churn', '2.1%']].map(([t, v]) => (
                <Card key={t}><CardContent>
                  <Typography variant="overline" color="text.secondary">{t}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{v}</Typography>
                  <Chip label="this month" size="small" color="success" sx={{ mt: 1 }} />
                </CardContent></Card>
              ))}
            </Box>
          </ThemedStage>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <ThemedStage tokens={resolved} mode={colorMode}>
            <Paper sx={{ p: 3, maxWidth: 380, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom>Sign in</Typography>
              <Stack spacing={2.5} sx={{ mt: 1 }}>
                <TextField label="Email" defaultValue="you@acme.com" size="small" fullWidth />
                <TextField label="Password" type="password" defaultValue="secret" size="small" fullWidth />
                <FormControlLabel control={<Checkbox defaultChecked />} label="Remember me" />
                <Button variant="contained" fullWidth>Sign in</Button>
              </Stack>
            </Paper>
          </ThemedStage>
        </div>
      </section>
    </div>
  );
}
