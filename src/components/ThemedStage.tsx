import { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/material';
import type { TokenValueMap } from '@/types';
import { tokensToMuiTheme } from '@/lib/muiTheme';

// Wraps arbitrary real-MUI composition JSX in the live theme, so use-case
// compositions restyle with the selected theme just like single previews do.
export function ThemedStage({ tokens, children }: { tokens: TokenValueMap; children: React.ReactNode }) {
  const theme = useMemo(() => tokensToMuiTheme(tokens), [tokens]);
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, bgcolor: 'background.default', color: 'text.primary', borderRadius: 2 }}>
        {children}
      </Box>
    </ThemeProvider>
  );
}
