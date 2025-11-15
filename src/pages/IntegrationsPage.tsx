import { useState } from 'react';
import { AlertBanner } from '@/components/AlertBanner';

export function IntegrationsPage() {
  const [syncFailed, setSyncFailed] = useState(true);

  const handleRetry = () => {
    setSyncFailed(false);
    setTimeout(() => setSyncFailed(true), 2500);
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase text-gray-500">Connections</p>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500">
          Connect DSM to design and engineering tools. Mock sync failure illustrates error handling.
        </p>
      </header>

      {syncFailed ? (
        <AlertBanner
          type="error"
          title="Sync failed"
          message="Figma design tokens could not be synchronized. Please retry."
          actionLabel="Retry sync"
          onAction={handleRetry}
        />
      ) : (
        <AlertBanner type="success" message="Integration sync completed successfully." />
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="border border-gray-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-gray-900">Figma Tokens</h2>
          <p className="text-sm text-gray-500">
            Sync tokens from Figma Variables into DSM. Track conflicts and overrides automatically.
          </p>
          <button
            onClick={handleRetry}
            className="mt-4 px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Trigger mock sync
          </button>
        </article>
        <article className="border border-gray-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-gray-900">Storybook</h2>
          <p className="text-sm text-gray-500">
            Push published presets to Storybook via the DSM SDK. Preview components with live tokens.
          </p>
          <button className="mt-4 px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            Configure webhooks
          </button>
        </article>
      </section>
    </div>
  );
}

