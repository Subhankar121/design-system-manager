import { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import {
  Box, Card, CardContent, CardActions, CardHeader, Button, CircularProgress,
  AppBar, Toolbar, Typography, IconButton, List, ListItem, ListItemText,
  ListItemIcon, ListItemButton, Checkbox, Chip, Paper, TextField,
  Table, TableBody, TableCell, TableHead, TableRow, Avatar, AvatarGroup,
  Alert, Stack, Divider,
} from '@mui/material';
import { Menu as MenuIcon, Notifications, Search, Inbox, TrendingUp, TrendingDown } from '@mui/icons-material';
import type { ComponentDef, TokenValueMap } from '@/types';
import { tokensToMuiTheme, applyComponentOverrides } from '@/lib/muiTheme';

interface Props {
  component?: ComponentDef | null;
  tokens: TokenValueMap;               // FULL resolved token map (base + global overrides)
  overrides?: Record<string, string>;  // this component's per-component overrides (incl. drafts)
  variantId?: string | null;
  viewport?: 'desktop' | 'tablet' | 'mobile';
  mode?: 'light' | 'dark';
}

const widths: Record<string, string> = { desktop: '100%', tablet: '768px', mobile: '375px' };

function render(id: string, v: string | null | undefined) {
  switch (id) {
    case 'card.primary':
      return (
        <Card variant={v === 'highlight' ? 'elevation' : 'outlined'} sx={{ maxWidth: 360, borderColor: v === 'highlight' ? 'primary.main' : undefined }}>
          <CardHeader title="KPI performance" subheader="+12% week over week" />
          <CardContent><Typography variant="body2" color="text.secondary">Tokens drive this card. Adjust the theme to see surface, shadow and radius update live.</Typography></CardContent>
          <CardActions><Button size="small" variant="contained">View report</Button></CardActions>
        </Card>
      );
    case 'button.primary':
      return v === 'loading'
        ? <Button variant="contained" startIcon={<CircularProgress size={16} color="inherit" />}>Preparing…</Button>
        : <Button variant="contained">Primary CTA</Button>;
    case 'button.secondary':
      return v === 'ghost'
        ? <Button variant="text">Ghost</Button>
        : <Button variant="outlined">Secondary CTA</Button>;
    case 'hero.banner':
      return (
        <Paper sx={{ p: 4, display: 'flex', flexDirection: v === 'stacked' ? 'column' : 'row', gap: 3, alignItems: 'center', bgcolor: 'background.default' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom>Ship faster with tokens</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>One theme, every component, instantly restyled.</Typography>
            <Stack direction="row" spacing={1}><Button variant="contained">Get started</Button><Button variant="outlined">Docs</Button></Stack>
          </Box>
          <Box sx={{ flex: 1, minHeight: 120, width: '100%', borderRadius: 1, bgcolor: 'primary.main', opacity: 0.12 }} />
        </Paper>
      );
    case 'navbar.global':
      return (
        <AppBar position="static">
          <Toolbar>
            {v === 'mobile' && <IconButton edge="start" color="inherit"><MenuIcon /></IconButton>}
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Acme</Typography>
            {v !== 'mobile' && <Stack direction="row" spacing={2} sx={{ mr: 2 }}><Button color="inherit">Home</Button><Button color="inherit">Themes</Button><Button color="inherit">Docs</Button></Stack>}
            <IconButton color="inherit"><Search /></IconButton>
            <IconButton color="inherit"><Notifications /></IconButton>
          </Toolbar>
        </AppBar>
      );
    case 'list.item':
      return (
        <List sx={{ maxWidth: 320, bgcolor: 'background.paper' }}>
          <ListItem disablePadding secondaryAction={v === 'selection' ? <Checkbox edge="end" defaultChecked /> : undefined}>
            <ListItemButton><ListItemIcon><Inbox /></ListItemIcon><ListItemText primary="Inbox" secondary="12 new messages" /></ListItemButton>
          </ListItem>
          <Divider />
          <ListItem disablePadding secondaryAction={v === 'selection' ? <Checkbox edge="end" /> : undefined}>
            <ListItemButton><ListItemIcon><Notifications /></ListItemIcon><ListItemText primary="Alerts" /></ListItemButton>
          </ListItem>
        </List>
      );
    case 'badge.status':
      return (
        <Stack direction="row" spacing={1}>
          <Chip label="Active" color={v === 'warning' ? 'warning' : 'success'} />
          <Chip label="Outlined" variant="outlined" color={v === 'warning' ? 'warning' : 'success'} />
        </Stack>
      );
    case 'modal.dialog':
      return (
        <Paper elevation={8} sx={{ p: 3, maxWidth: v === 'wide' ? 560 : 400 }}>
          <Typography variant="h6" gutterBottom>Confirm action</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>This will publish the current theme version. Continue?</Typography>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}><Button variant="text">Cancel</Button><Button variant="contained">Publish</Button></Stack>
        </Paper>
      );
    case 'input.field':
      return (
        <Stack spacing={2} sx={{ maxWidth: 360 }}>
          <TextField label="Email" defaultValue="you@acme.com" size="small" error={v === 'error'} helperText={v === 'error' ? 'Enter a valid email' : ' '} fullWidth />
        </Stack>
      );
    case 'table.row':
    case 'table.simple':
      return (
        <Table size={v === 'comfortable' ? 'medium' : 'small'}>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell align="right">Tokens</TableCell><TableCell align="right">Status</TableCell></TableRow></TableHead>
          <TableBody>
            <TableRow hover={id === 'table.row' && v === 'hoverable'}><TableCell>Primary</TableCell><TableCell align="right">12</TableCell><TableCell align="right"><Chip label="Active" color="success" size="small" /></TableCell></TableRow>
            <TableRow hover={id === 'table.row' && v === 'hoverable'}><TableCell>Secondary</TableCell><TableCell align="right">8</TableCell><TableCell align="right"><Chip label="Draft" size="small" /></TableCell></TableRow>
          </TableBody>
        </Table>
      );
    case 'avatar.cluster':
      return v === 'grid'
        ? <Stack direction="row" spacing={1}>{['AA', 'BB', 'CC', 'DD'].map((n) => <Avatar key={n}>{n}</Avatar>)}</Stack>
        : <AvatarGroup max={4}>{['AA', 'BB', 'CC', 'DD', 'EE'].map((n) => <Avatar key={n}>{n}</Avatar>)}</AvatarGroup>;
    case 'timeline.entry':
      return (
        <Stack direction={v === 'horizontal' ? 'row' : 'column'} spacing={2}>
          {['Created', 'Reviewed', 'Published'].map((s, i) => (
            <Stack key={s} direction={v === 'horizontal' ? 'column' : 'row'} spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: i === 2 ? 'primary.main' : 'divider' }} />
              <Typography variant="body2">{s}</Typography>
            </Stack>
          ))}
        </Stack>
      );
    case 'toast.notification':
      return <Alert severity={v === 'error' ? 'error' : 'success'}>{v === 'error' ? 'Something went wrong.' : 'Changes saved successfully.'}</Alert>;
    case 'stat.card': {
      const up = v !== 'negative';
      return (
        <Card sx={{ maxWidth: 240 }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">Revenue</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>$48.2k</Typography>
            <Chip size="small" color={up ? 'success' : 'error'} icon={up ? <TrendingUp /> : <TrendingDown />} label={up ? '+12.4%' : '-4.1%'} sx={{ mt: 1 }} />
          </CardContent>
        </Card>
      );
    }
    case 'chart.sparkline': {
      const pts = v === 'trend-down' ? '0,10 20,14 40,12 60,20 80,26 100,30' : '0,30 20,22 40,26 60,14 80,18 100,4';
      return (
        <Paper sx={{ p: 2, width: 220 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>Weekly trend</Typography>
          <Box component="svg" viewBox="0 0 100 34" sx={{ width: '100%', height: 60 }}>
            <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--mui-trend)' }} className="spark" />
          </Box>
        </Paper>
      );
    }
    default:
      return <Typography color="text.secondary">No preview for {id}</Typography>;
  }
}

export function MuiPreview({ component, tokens, overrides, variantId, viewport = 'desktop', mode = 'light' }: Props) {
  const theme = useMemo(() => {
    const base = tokensToMuiTheme(tokens, mode);
    return component ? applyComponentOverrides(base, component.id, overrides) : base;
  }, [tokens, overrides, component, mode]);

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          maxWidth: widths[viewport], mx: 'auto', p: 3, borderRadius: 2,
          bgcolor: 'background.default', color: 'text.primary',
          display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160,
          transition: 'background-color .2s',
        }}
      >
        {component ? render(component.id, variantId) : null}
      </Box>
    </ThemeProvider>
  );
}
