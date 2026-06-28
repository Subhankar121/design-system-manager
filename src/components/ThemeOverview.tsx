import { useMemo } from 'react';
import { ComponentDef, Token, TokenValueMap } from '@/types';
import { MuiPreview } from '@/components/MuiPreview';
import { ThemedStage } from '@/components/ThemedStage';
import {
  AppBar, Toolbar, Typography, IconButton, Avatar, Box, Card, CardContent, Chip,
  Paper, Stack, TextField, Button, Checkbox, FormControlLabel,
} from '@mui/material';
import { Menu as MenuIcon, Notifications } from '@mui/icons-material';

// Phase C — the whole theme seen as one coherent system: token summary, every
// component rendered, and sample pages. Live MUI against the selected theme.

interface Props {
  components: ComponentDef[];
  tokens: Token[];
  resolved: TokenValueMap;
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 h-8 rounded-lg border border-gray-200 flex-shrink-0" style={{ backgroundColor: value }} />
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{name.replace('semantic.color.', '')}</p>
        <code className="text-[11px] text-gray-400">{value}</code>
      </div>
    </div>
  );
}

export function ThemeOverview({ components, tokens, resolved }: Props) {
  const colorKeys = useMemo(
    () => tokens.map((t) => t.key).filter((k) => k.startsWith('semantic.color.')),
    [tokens]
  );
  const scaleRow = (prefix: string) =>
    tokens.filter((t) => t.key.startsWith(prefix)).map((t) => ({ key: t.key.replace(prefix, ''), value: resolved[t.key] ?? t.value }));

  const byCategory = useMemo(() => {
    const cats: Record<string, ComponentDef[]> = {};
    components.forEach((c) => { (cats[c.category || 'Uncategorized'] ||= []).push(c); });
    return cats;
  }, [components]);

  return (
    <div className="space-y-10">
      {/* Token summary */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Tokens</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {colorKeys.map((k) => <Swatch key={k} name={k} value={resolved[k]} />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
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

      {/* Component gallery */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Components</h3>
        {Object.entries(byCategory).map(([cat, list]) => (
          <div key={cat} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{cat}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {list.map((c) => (
                <div key={c.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="border-b border-gray-100 px-4 py-2 bg-gray-50">
                    <p className="text-sm font-medium text-gray-800">{c.name}</p>
                  </div>
                  <MuiPreview component={c} tokens={resolved} variantId={c.variants?.[0]?.id} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Sample pages */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Sample pages</h3>
        <p className="text-xs text-gray-500">The theme applied to full layouts.</p>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <ThemedStage tokens={resolved}>
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
          <ThemedStage tokens={resolved}>
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
