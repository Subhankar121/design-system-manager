import {
  Box, Stack, Button, TextField, Card, CardContent, CardActions, CardHeader,
  Typography, Chip, Alert, IconButton,
} from '@mui/material';
import { TrendingUp, TrendingDown, MoreVert } from '@mui/icons-material';

// Phase B — focused use cases for high-value components. Each composition is
// real MUI JSX; the ThemedStage applies the live theme. Authored content, since
// "how/when to use" isn't derivable from the component definitions.

export interface UseCase {
  title: string;
  description: string;
  node: React.ReactNode;
}
export interface Guidance {
  do: string[];
  dont: string[];
}
export interface ComponentUsage {
  cases: UseCase[];
  guidance: Guidance;
}

export const USE_CASES: Record<string, ComponentUsage> = {
  'button.primary': {
    cases: [
      {
        title: 'Primary action in a form',
        description: 'One clear, high-emphasis action that completes the task.',
        node: (
          <Stack spacing={2} sx={{ maxWidth: 360 }}>
            <TextField label="Work email" defaultValue="you@acme.com" size="small" fullWidth />
            <Button variant="contained">Create account</Button>
          </Stack>
        ),
      },
      {
        title: 'One primary per view',
        description: 'Pair the primary with lower-emphasis secondary actions, never competing contained buttons.',
        node: (
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="text">Cancel</Button>
            <Button variant="contained">Publish</Button>
          </Stack>
        ),
      },
    ],
    guidance: {
      do: ['Use exactly one primary (contained) action per view', 'Label with a clear action verb ("Save changes", not "OK")', 'Pair with text/outlined buttons for secondary actions'],
      dont: ['Stack multiple contained buttons that compete for attention', 'Use a primary button for destructive actions without confirmation', 'Disable it without explaining why it is unavailable'],
    },
  },

  'button.secondary': {
    cases: [
      {
        title: 'Paired with a primary',
        description: 'Lower-emphasis alternative beside the main action.',
        node: (
          <Stack direction="row" spacing={1.5}>
            <Button variant="contained">Save</Button>
            <Button variant="outlined">Save as draft</Button>
          </Stack>
        ),
      },
      {
        title: 'Row of low-emphasis actions',
        description: 'Use text/outlined buttons for a toolbar of equal-weight options.',
        node: (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small">Duplicate</Button>
            <Button variant="outlined" size="small">Export</Button>
            <Button variant="text" size="small" color="error">Delete</Button>
          </Stack>
        ),
      },
    ],
    guidance: {
      do: ['Use outlined/text to support — not replace — the primary', 'Keep secondary actions visually quieter', 'Group related low-emphasis actions together'],
      dont: ['Make a secondary button look as loud as the primary', 'Use more emphasis than the task importance warrants'],
    },
  },

  'card.primary': {
    cases: [
      {
        title: 'Dashboard grid',
        description: 'Cards as scannable units in a responsive grid.',
        node: (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            {['Revenue', 'Active users'].map((t) => (
              <Card key={t}>
                <CardHeader title={t} action={<IconButton size="small"><MoreVert fontSize="small" /></IconButton>} />
                <CardContent><Typography variant="h5" sx={{ fontWeight: 700 }}>—</Typography></CardContent>
                <CardActions><Button size="small">Details</Button></CardActions>
              </Card>
            ))}
          </Box>
        ),
      },
      {
        title: 'Single clear action',
        description: 'Keep one primary action per card; avoid action overload.',
        node: (
          <Card sx={{ maxWidth: 340 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Upgrade to Pro</Typography>
              <Typography variant="body2" color="text.secondary">Unlock multi-theme export and version history.</Typography>
            </CardContent>
            <CardActions><Button variant="contained" size="small">Upgrade</Button></CardActions>
          </Card>
        ),
      },
    ],
    guidance: {
      do: ['Give each card a single, obvious primary action', 'Keep content scannable — title, supporting line, action', 'Use consistent padding and radius across a grid'],
      dont: ['Cram many competing actions into one card', 'Mix wildly different card heights in the same grid', 'Nest cards inside cards'],
    },
  },

  'stat.card': {
    cases: [
      {
        title: 'KPI row',
        description: 'A row of metrics with directional deltas.',
        node: (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            {[['Revenue', '$48.2k', true], ['Users', '12,840', true], ['Churn', '2.1%', false]].map(([label, val, up]) => (
              <Card key={label as string}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">{label as string}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{val as string}</Typography>
                  <Chip size="small" color={up ? 'success' : 'error'} icon={up ? <TrendingUp /> : <TrendingDown />} label={up ? '+12%' : '-4%'} sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            ))}
          </Box>
        ),
      },
    ],
    guidance: {
      do: ['Pair each number with a label and a trend', 'Use color + icon together for direction (not color alone)', 'Keep metrics in a consistent unit/format across the row'],
      dont: ['Show a delta without a baseline or timeframe', 'Rely on red/green alone to convey meaning'],
    },
  },

  'input.field': {
    cases: [
      {
        title: 'Login form',
        description: 'Labelled fields with a clear submit.',
        node: (
          <Stack spacing={2} sx={{ maxWidth: 360 }}>
            <TextField label="Email" defaultValue="you@acme.com" size="small" fullWidth />
            <TextField label="Password" type="password" defaultValue="secret" size="small" fullWidth />
            <Button variant="contained" fullWidth>Sign in</Button>
          </Stack>
        ),
      },
      {
        title: 'Inline validation',
        description: 'Show the error and how to fix it, not just a red border.',
        node: (
          <TextField label="Email" defaultValue="not-an-email" size="small" error helperText="Enter a valid email address" sx={{ maxWidth: 360 }} fullWidth />
        ),
      },
    ],
    guidance: {
      do: ['Always pair an input with a visible label', 'Put actionable guidance in helper text', 'Communicate errors with text + icon, not color alone'],
      dont: ['Use placeholder text as the only label', 'Signal errors with red border only (fails accessibility)', 'Hide validation until after submit when it could be inline'],
    },
  },

  'toast.notification': {
    cases: [
      {
        title: 'Feedback after an action',
        description: 'Confirm the result of what the user just did.',
        node: (
          <Stack spacing={1.5} sx={{ maxWidth: 420 }}>
            <Alert severity="success">Theme published as v1.2.0.</Alert>
          </Stack>
        ),
      },
      {
        title: 'Severity levels',
        description: 'Match severity to the message; reserve error for true failures.',
        node: (
          <Stack spacing={1.5} sx={{ maxWidth: 420 }}>
            <Alert severity="info">A new version is available.</Alert>
            <Alert severity="warning">Two tokens fall below AA contrast.</Alert>
            <Alert severity="error">Publish failed — check your connection.</Alert>
          </Stack>
        ),
      },
    ],
    guidance: {
      do: ['Keep the message short and specific', 'Match severity to real impact', 'Pair the icon with text for accessibility'],
      dont: ['Use a toast for critical, blocking decisions (use a dialog)', 'Stack many toasts at once', 'Auto-dismiss messages the user must act on'],
    },
  },
};
