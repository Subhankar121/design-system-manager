import { useState } from 'react';
import { AlertBanner } from '@/components/AlertBanner';
import { PageHeader } from '@/components/PageHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { HelpBox } from '@/components/HelpBox';

export function IntegrationsPage() {
  const [syncFailed, setSyncFailed] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const handleRetry = () => {
    setSyncFailed(false);
    setTimeout(() => setSyncFailed(true), 2500);
  };

  const cards = [
    {
      id: 'figma',
      badge: { label: 'Design', color: 'text-indigo-600' },
      title: 'Figma Tokens',
      summary:
        'Keep DSM in lock-step with Figma Variables so designers and engineers always reference the same values.',
      body: (
        <>
          <p className="text-sm text-gray-600">
            We pull raw tokens, map them to semantic slots, and surface conflicts before they reach
            production.
          </p>
          <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
            <li>Install the DSM plugin in Figma &gt; Plugins &gt; DSM Tokens.</li>
            <li>Authorize with your DSM API key and pick the target project/library.</li>
            <li>Run “Pull variables” for read-only sync or “Push overrides” to publish back.</li>
          </ul>
          <p className="text-xs text-gray-400">
            Benefits: zero-copy handoff, instant drift detection, and shared naming conventions.
          </p>
        </>
      ),
      cta: {
        label: 'Trigger mock sync',
        primary: true,
        onClick: handleRetry,
      },
      span: false,
    },
    {
      id: 'github',
      badge: { label: 'Dev', color: 'text-emerald-600' },
      title: 'GitHub Actions',
      summary: 'Automate snapshot publishing and smoke tests every time a preset PR lands.',
      body: (
        <>
          <p className="text-sm text-gray-600">
            DSM exposes a simple CLI so your pipeline can validate tokens, generate diffs, and
            publish approved snapshots without leaving GitHub.
          </p>
          <ol className="text-sm text-gray-500 list-decimal pl-5 space-y-1">
            <li>
              Add <code>dsm publish --preset brand_x</code> to your workflow.
            </li>
            <li>
              Store the DSM API key as <code>DSM_TOKEN</code> secret.
            </li>
            <li>Emit artifacts (JSON snapshots) so downstream apps can pick them up.</li>
          </ol>
          <p className="text-xs text-gray-400">
            Why: guarantees previews match the shipped tokens and keeps audit trails in your repo.
          </p>
        </>
      ),
      cta: {
        label: 'View workflow example',
      },
      span: false,
    },
    {
      id: 'storybook',
      badge: { label: 'Documentation', color: 'text-orange-500' },
      title: 'Storybook',
      summary:
        'Feed published presets into Storybook so component documentation always reflects the latest tokens.',
      body: (
        <>
          <p className="text-sm text-gray-600">
            DSM emits immutable snapshots that Storybook decorators can read at runtime or during
            build. Designers, QA, and engineers can flip themes with a single control.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-800">How to set up</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Install the <code>@dsm/storybook-bridge</code> addon.</li>
                <li>Point it at the snapshot URL or local file.</li>
                <li>Wrap stories with the provided theme decorator.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Why it matters</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Design reviews see the real theme, not mocked values.</li>
                <li>QA can switch presets on the fly.</li>
                <li>Docs stay consistent with production builds.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Need help?</h3>
              <p className="text-gray-500">
                Email <a className="text-indigo-600" href="mailto:dsm@local">dsm@local</a> for addon
                examples or grab the “storybook-integration” starter repo.
              </p>
            </div>
          </div>
        </>
      ),
      cta: {
        label: 'Configure webhooks',
      },
      span: true,
    },
  ];

  const toggleCard = (id: string) => {
    setExpandedCard((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-8">
      <PageHeader
        badge="Ecosystem"
        title="Integrations"
        description="Connect your design system to your tools and workflows. Automate synchronization, publishing, and distribution across your organization."
      />

      <HelpBox title="Why integrate?" variant="tip">
        <p className="mb-2">Integrations keep your design system synchronized across tools:</p>
        <ul className="space-y-1 text-sm list-disc list-inside">
          <li><strong>Figma:</strong> Pull design variables directly from your Figma libraries</li>
          <li><strong>GitHub Actions:</strong> Automate publishing and validation in your CI/CD pipeline</li>
          <li><strong>Storybook:</strong> Showcase components with live theme switching</li>
        </ul>
        <p className="mt-2 text-sm">💡 Click any integration card below to see setup instructions and benefits.</p>
      </HelpBox>

      {syncFailed ? (
        <AlertBanner
          type="error"
          title="Figma sync failed"
          message="Unable to synchronize design tokens from Figma. Check your API credentials and network connection."
          actionLabel="Retry sync"
          onAction={handleRetry}
        />
      ) : (
        <AlertBanner 
          type="success" 
          title="Sync successful"
          message="All integrations are up to date. Design tokens are synchronized across platforms." 
        />
      )}

      <section>
        <SectionHeader
          title="Available Integrations"
          description="Click to expand and configure each integration"
          badge={`${cards.length}`}
        />
        <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const isExpanded = expandedCard === card.id;
          return (
            <article
              key={card.id}
              className={`border border-gray-200 rounded-xl p-4 space-y-3 transition-colors ${
                card.span ? 'md:col-span-2' : ''
              } ${isExpanded ? 'bg-white shadow-sm' : 'bg-white'}`}
            >
              <button
                onClick={() => toggleCard(card.id)}
                className="w-full text-left space-y-2 focus:outline-none"
                aria-expanded={isExpanded}
              >
                <div>
                  <p className={`text-xs uppercase font-semibold ${card.badge.color}`}>
                    {card.badge.label}
                  </p>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">{card.title}</h2>
                    <span className="text-gray-400 text-xl" aria-hidden="true">
                      {isExpanded ? '−' : '+'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{card.summary}</p>
              </button>
              {isExpanded && (
                <div className="space-y-3 border-t border-gray-100 pt-3">{card.body}</div>
              )}
              <div className="pt-2">
                {card.cta ? (
                  card.cta.primary ? (
                    <button
                      onClick={card.cta.onClick}
                      className="mt-2 px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {card.cta.label}
                    </button>
                  ) : (
                    <button className="mt-2 px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {card.cta.label}
                    </button>
                  )
                ) : null}
              </div>
            </article>
          );
        })}
        </div>
      </section>
    </div>
  );
}

