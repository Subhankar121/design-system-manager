import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ToastProvider } from '@/hooks/useToast';
import { Dashboard } from '@/pages/Dashboard';
import { TokensPage } from '@/pages/TokensPage';
import { ComponentsPage } from '@/pages/ComponentsPage';
import { PresetsPage } from '@/pages/PresetsPage';
import { PresetEditorPage } from '@/pages/PresetEditorPage';
import { VersionsPage } from '@/pages/VersionsPage';
import { IntegrationsPage } from '@/pages/IntegrationsPage';
import { SdkDemoPage } from '@/pages/SdkDemoPage';
import { useEffect } from 'react';
import { applyTokensToElement, resolveTokens } from '@/lib/resolver';
import { getTokens, getPresets, initSeedDataIfNeeded } from '@/lib/mockApi';

function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/tokens', label: 'Tokens' },
    { path: '/components', label: 'Components' },
    { path: '/presets', label: 'Presets' },
    { path: '/integrations', label: 'Integrations' },
    { path: '/sdk-demo', label: 'SDK Demo' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">DSM</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                      ${
                        isActive
                          ? 'border-indigo-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-t
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  useEffect(() => {
    const syncSeeds = async () => {
      try {
        const response = await fetch('/reset-flag.json', { cache: 'no-store' });
        if (response.ok) {
          const { lastReset } = await response.json();
          const stored = window.localStorage.getItem('dsm:last-reset-flag');
          if (stored !== String(lastReset)) {
            await initSeedDataIfNeeded(true);
            window.localStorage.setItem('dsm:last-reset-flag', String(lastReset));
          }
        } else {
          await initSeedDataIfNeeded();
        }
      } catch {
        await initSeedDataIfNeeded();
      }
      const tokens = await getTokens();
      const presets = await getPresets();
      const defaultPreset = presets.find((preset) => preset.id === 'default') || null;
      const resolved = resolveTokens(tokens, defaultPreset || undefined);
      applyTokensToElement(document.documentElement, resolved);
    };
    syncSeeds();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tokens" element={<TokensPage />} />
          <Route path="/components" element={<ComponentsPage />} />
          <Route path="/presets" element={<PresetsPage />} />
          <Route path="/presets/:id/edit" element={<PresetEditorPage />} />
          <Route path="/presets/:id/versions" element={<VersionsPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/sdk-demo" element={<SdkDemoPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ToastProvider>
  );
}

