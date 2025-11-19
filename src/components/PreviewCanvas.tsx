import { useEffect, useRef } from 'react';
import { ComponentDef, TokenValueMap } from '@/types';
import { applyTokensToElement, tokenToCSSVar } from '@/lib/resolver';

interface PreviewCanvasProps {
  tokens: TokenValueMap;
  component?: ComponentDef | null;
  variantId?: string | null;
  viewport?: 'desktop' | 'tablet' | 'mobile';
  slotSelections?: Record<number, string>;
}

export function PreviewCanvas({ 
  tokens, 
  component, 
  variantId, 
  viewport = 'desktop',
  slotSelections = {}
}: PreviewCanvasProps) {
  const ref = useRef<HTMLDivElement>(null);

  const viewportWidths: Record<'desktop' | 'tablet' | 'mobile', string> = {
    desktop: 'max-w-full',
    tablet: 'max-w-[768px]',
    mobile: 'max-w-[375px]'
  };

  const currentWidth = viewportWidths[viewport] || viewportWidths.desktop;

  useEffect(() => {
    if (ref.current) {
      applyTokensToElement(ref.current, tokens);
    }
  }, [tokens]);

  const token = (key: string, fallback?: string) =>
    fallback ? `var(${tokenToCSSVar(key)}, ${fallback})` : `var(${tokenToCSSVar(key)})`;

  const renderCard = () => (
    <div
      className="space-y-4 rounded-lg border shadow-sm p-6 transition-all"
      style={{
        backgroundColor: token('semantic.color.surface'),
        color: token('semantic.color.text'),
        borderRadius: token('radius.medium'),
        boxShadow: token('shadow.medium'),
        fontFamily: token('font.base', 'Inter, sans-serif'),
      }}
    >
      <div className="font-semibold text-lg flex items-center justify-between">
        KPI performance
        <span className="text-sm font-normal text-gray-500">+12% WoW</span>
      </div>
      <p className="text-sm opacity-80">
        Tokens drive this card. Adjust presets to see surfaces, shadows, and radius update in real time.
      </p>
      <button
        className="px-4 py-2 font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: token('semantic.color.primary'),
          borderRadius: token('radius.medium'),
        }}
      >
        View report
      </button>
    </div>
  );

  const renderButton = (variant: 'primary' | 'secondary' | 'loading' = 'primary') => {
    const isPrimary = variant === 'primary' || variant === 'loading';
    return (
      <button
        className="px-5 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm w-full sm:w-auto"
        style={{
          backgroundColor: isPrimary ? token('semantic.color.primary') : token('semantic.color.surface'),
          color: isPrimary ? token('semantic.color.surface', '#fff') : token('semantic.color.primary'),
          borderRadius: token('radius.medium'),
          border: isPrimary ? 'none' : `1px solid ${token('semantic.color.border')}`,
          boxShadow: isPrimary ? token('shadow.medium') : 'none',
          fontFamily: token('font.base', 'Inter, sans-serif'),
          opacity: variant === 'loading' ? 0.65 : 1,
        }}
      >
        {variant === 'loading' ? 'Preparing…' : isPrimary ? 'Primary CTA' : 'Secondary CTA'}
      </button>
    );
  };

  const renderBadge = () => (
    <div className="flex flex-wrap gap-2">
      {['positive', 'warning'].map((state) => (
        <span
          key={state}
          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full"
          style={{
            backgroundColor: state === 'positive' ? token('semantic.color.success') : token('semantic.color.warning'),
            color: '#0f172a',
            borderRadius: token('radius.sm'),
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: state === 'positive' ? '#15803d' : '#ea580c' }} />
          {state === 'positive' ? 'Operational' : 'Needs attention'}
        </span>
      ))}
    </div>
  );

  const renderListItem = () => (
    <div
      className="rounded-lg border px-4 py-3 flex items-center justify-between"
      style={{
        backgroundColor: token('semantic.color.surface'),
        borderColor: token('semantic.color.border'),
        fontFamily: token('font.base', 'Inter, sans-serif'),
      }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: token('semantic.color.text') }}>
          Billing integration
        </p>
        <p className="text-xs" style={{ color: token('semantic.color.text.muted') }}>
          Updated 4 minutes ago
        </p>
      </div>
      {renderBadge()}
    </div>
  );

  const renderHero = (variant?: string) => (
    <div
      className={`rounded-2xl p-6 lg:p-10 grid gap-6 ${variant === 'stacked' ? 'grid-cols-1' : 'lg:grid-cols-2'} items-center shadow-lg`}
      style={{
        background: `linear-gradient(135deg, ${token('semantic.color.primary')} 0%, ${token('semantic.color.secondary')} 100%)`,
        color: token('semantic.color.surface'),
        fontFamily: token('font.display', token('font.base', 'Inter, sans-serif')),
      }}
    >
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-widest opacity-80">Design System</p>
        <h3 className="text-3xl font-semibold leading-tight">
          Ship cohesive experiences 5× faster.
        </h3>
        <p className="text-sm opacity-80">
          Manage tokens, themes, and component variants with a single source of truth.
        </p>
        <div className="flex flex-wrap gap-3">
          {renderButton('primary')}
          {renderButton('secondary')}
        </div>
      </div>
      <div className="bg-white/15 rounded-xl p-4 backdrop-blur flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span>Tokens</span>
          <strong>124</strong>
        </div>
        <div className="flex items-center justify-between">
          <span>Components</span>
          <strong>68</strong>
        </div>
        <div className="flex items-center justify-between">
          <span>Presets</span>
          <strong>5</strong>
        </div>
      </div>
    </div>
  );

  const renderNavbar = (variant?: string) => (
    <div
      className="rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm"
      style={{
        backgroundColor: token('semantic.color.surface'),
        color: token('semantic.color.text'),
        fontFamily: token('font.base', 'Inter, sans-serif'),
      }}
    >
      <div className="font-semibold">Nimbus UI</div>
      {variant === 'mobile' ? (
        <button
          className="px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{ borderColor: token('semantic.color.border') }}
        >
          Menu
        </button>
      ) : (
        <div className="flex flex-wrap gap-3 text-sm">
          {['Overview', 'Components', 'Guidelines', 'Integrations'].map((item) => (
            <button
              key={item}
              className="px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              style={{
                backgroundColor: item === 'Components' ? token('semantic.color.accent') : 'transparent',
                color: item === 'Components' ? '#0f172a' : token('semantic.color.text'),
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderModal = () => (
    <div
      className="rounded-2xl p-6 lg:w-3/4 bg-white shadow-2xl border border-gray-200 relative overflow-hidden"
      style={{
        boxShadow: token('shadow.deep'),
        borderRadius: token('radius.large'),
        fontFamily: token('font.base', 'Inter, sans-serif'),
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(120deg, ${token('semantic.color.accent')}12 0%, transparent 55%, ${token(
            'semantic.color.accent'
          )}08 100%)`,
        }}
      />
      <h3 className="text-lg font-semibold mb-2 relative" style={{ color: token('semantic.color.text') }}>
        Publish preset
      </h3>
      <p className="text-sm text-gray-500 mb-4 relative">
        Finalize your theme snapshot and create an immutable version.
      </p>
      <div className="flex gap-3 relative">
        {renderButton('primary')}
        {renderButton('secondary')}
      </div>
    </div>
  );

  const renderInput = (variant?: string) => (
    <label className="flex flex-col gap-1 text-sm" style={{ fontFamily: token('font.base', 'Inter') }}>
      <span style={{ color: token('semantic.color.text') }}>API key</span>
      <input
        className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        style={{
          borderColor: variant === 'error' ? token('semantic.color.danger') : token('semantic.color.border'),
          backgroundColor: token('semantic.color.surface'),
          color: token('semantic.color.text'),
          borderRadius: token('radius.sm'),
        }}
        placeholder="•••••-•••••-•••••"
      />
      <span
        className="text-xs"
        style={{ color: variant === 'error' ? token('semantic.color.danger') : token('semantic.color.text.muted') }}
      >
        {variant === 'error' ? 'This key has expired. Generate a new one.' : 'Stored securely — rotate keys any time.'}
      </span>
    </label>
  );

  const renderTable = (variant?: string) => (
    <div className="space-y-2 text-sm" style={{ fontFamily: token('font.base', 'Inter') }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold" style={{ color: token('semantic.color.text') }}>
            API usage
          </p>
          <p className="text-xs" style={{ color: token('semantic.color.text.muted') }}>
            Last 24 hours
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {variant === 'comfortable' ? 'Comfortable' : 'Compact'}
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: token('semantic.color.border') }}>
        <div
          className="grid grid-cols-3 gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide"
          style={{
            backgroundColor: token('semantic.color.surface.alt'),
            color: token('semantic.color.text.muted'),
          }}
        >
          <span>Service</span>
          <span>Requests</span>
          <span className="text-right">Latency</span>
        </div>
        {[
          { name: 'Payments API', requests: '48k', latency: '320 ms' },
          { name: 'Billing API', requests: '15k', latency: '210 ms' },
          { name: 'Identity API', requests: '9k', latency: '185 ms' },
        ].map((row) => (
          <div
            key={row.name}
            className={`grid grid-cols-3 gap-2 px-4 ${variant === 'comfortable' ? 'py-3' : 'py-2'} items-center`}
            style={{
              color: token('semantic.color.text'),
              backgroundColor: token('semantic.color.surface'),
            }}
          >
            <span>{row.name}</span>
            <span className="text-gray-600">{row.requests}</span>
            <span className="text-right font-mono">{row.latency}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAvatarCluster = (variant?: string) => (
    <div className="space-y-2" style={{ fontFamily: token('font.base', 'Inter') }}>
      <p className="text-sm font-semibold" style={{ color: token('semantic.color.text') }}>
        Product team
      </p>
      <div className={`flex ${variant === 'grid' ? 'flex-wrap gap-2' : '-space-x-3 items-center'}`}>
        {['AN', 'BL', 'CM', 'DW', 'ES'].map((initials, index) => (
          <span
            key={initials}
            className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold shadow-sm"
            style={{
              backgroundColor: index % 2 === 0 ? token('semantic.color.primary') : token('semantic.color.secondary'),
              color: token('semantic.color.surface'),
              marginLeft: variant === 'grid' ? 0 : undefined,
            }}
          >
            {initials}
          </span>
        ))}
        <span
          className="w-10 h-10 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-500"
          style={{ marginLeft: variant === 'grid' ? 0 : undefined }}
        >
          +3
        </span>
      </div>
    </div>
  );

  const renderTimeline = (variant?: string) => (
    <div className={`space-y-4 ${variant === 'horizontal' ? 'md:flex md:space-y-0 md:space-x-6' : ''}`}>
      {[
        { title: 'Tokens published', time: '12:24 PM', status: 'success' },
        { title: 'Brand review', time: '09:10 AM', status: 'info' },
      ].map((event) => (
        <div key={event.title} className="flex items-start gap-3">
          <span
            className="w-2 h-2 rounded-full mt-2"
            style={{
              backgroundColor:
                event.status === 'success'
                  ? token('semantic.color.success')
                  : event.status === 'info'
                  ? token('semantic.color.info')
                  : token('semantic.color.warning'),
            }}
          />
          <div style={{ fontFamily: token('font.base', 'Inter') }}>
            <p className="text-sm font-semibold" style={{ color: token('semantic.color.text') }}>
              {event.title}
            </p>
            <p className="text-xs" style={{ color: token('semantic.color.text.muted') }}>
              {event.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderToast = (variant?: string) => {
    const tone =
      variant === 'error'
        ? token('semantic.color.danger')
        : variant === 'success'
        ? token('semantic.color.success')
        : token('semantic.color.info');
    const label =
      variant === 'error' ? 'Publish failed' : variant === 'success' ? 'Snapshot saved' : 'Information';
    return (
      <div
        className="rounded-xl p-4 shadow-lg flex items-start gap-3 text-sm max-w-sm"
        style={{
          backgroundColor: token('semantic.color.surface'),
          borderLeft: `4px solid ${tone}`,
          fontFamily: token('font.base', 'Inter'),
        }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
          style={{ backgroundColor: tone }}
          aria-hidden="true"
        >
          {variant === 'error' ? '!' : '✓'}
        </div>
        <div>
          <p className="font-semibold" style={{ color: token('semantic.color.text') }}>
            {label}
          </p>
          <p className="text-xs" style={{ color: token('semantic.color.text.muted') }}>
            {variant === 'error'
              ? 'Resolve validation issues before retrying.'
              : 'Share this preset snapshot with consumers.'}
          </p>
        </div>
      </div>
    );
  };

  const renderSparkline = (variant?: string) => {
    const points =
      variant === 'trend-down'
        ? [40, 44, 38, 35, 32, 28, 30]
        : [24, 30, 28, 32, 36, 40, 45];
    return (
      <div className="space-y-2" style={{ fontFamily: token('font.base', 'Inter') }}>
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: token('semantic.color.text.muted') }}>Conversion</span>
          <span className="font-semibold" style={{ color: token('semantic.color.text') }}>
            {variant === 'trend-down' ? '48%' : '62%'}
          </span>
        </div>
        <svg viewBox="0 0 120 40" className="w-full h-16">
          <polyline
            fill="none"
            stroke={variant === 'trend-down' ? token('semantic.color.warning') : token('semantic.color.success')}
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points.map((value, index) => `${(index / (points.length - 1)) * 120},${40 - value * 0.6}`).join(' ')}
          />
        </svg>
        <p className="text-xs" style={{ color: token('semantic.color.text.muted') }}>
          {variant === 'trend-down' ? '−4.1% vs last week' : '+6.8% vs last week'}
        </p>
      </div>
    );
  };

  const renderStatCard = (variant?: string) => (
    <div
      className="rounded-2xl p-5 shadow-md space-y-2"
      style={{
        backgroundColor: token('semantic.color.surface'),
        boxShadow: token('shadow.medium'),
        fontFamily: token('font.display', token('font.base', 'Inter')),
      }}
    >
      <p className="text-xs uppercase tracking-wide" style={{ color: token('semantic.color.text.muted') }}>
        Active users
      </p>
      <p className="text-3xl font-semibold" style={{ color: token('semantic.color.text') }}>
        184,290
      </p>
      <span
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
        style={{
          backgroundColor: variant === 'negative' ? token('semantic.color.danger') : token('semantic.color.success'),
          color: token('semantic.color.surface'),
        }}
      >
        {variant === 'negative' ? '−3.6%' : '+8.2%'} week over week
      </span>
    </div>
  );

  const componentRenderer: Record<string, (variant?: string) => JSX.Element> = {
    'card.primary': () => renderCard(),
    'button.primary': (variant) => renderButton(variant === 'loading' ? 'loading' : 'primary'),
    'button.secondary': () => renderButton('secondary'),
    'hero.banner': (variant) => renderHero(variant),
    'navbar.global': (variant) => renderNavbar(variant),
    'list.item': () => renderListItem(),
    'badge.status': () => renderBadge(),
    'modal.dialog': () => renderModal(),
    'input.field': (variant) => renderInput(variant),
    'table.row': () => renderTable(),
    'table.simple': (variant) => renderTable(variant),
    'avatar.cluster': (variant) => renderAvatarCluster(variant),
    'timeline.entry': (variant) => renderTimeline(variant),
    'toast.notification': (variant) => renderToast(variant),
    'chart.sparkline': (variant) => renderSparkline(variant),
    'stat.card': (variant) => renderStatCard(variant),
  };

  // Dynamic slot content renderers
  const renderSlotContent = (slotType: string): JSX.Element => {
    const slotRenderers: Record<string, () => JSX.Element> = {
      'image': () => (
        <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded flex items-center justify-center">
          <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
            <path d="M21 15l-5-5L5 21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      ),
      'video': () => (
        <div className="w-full h-32 bg-gradient-to-br from-gray-700 to-gray-900 rounded flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      ),
      'text': () => (
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-full"></div>
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
        </div>
      ),
      'heading': () => (
        <h3 className="text-lg font-bold text-gray-900">Sample Heading</h3>
      ),
      'paragraph': () => (
        <p className="text-sm text-gray-600 leading-relaxed">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.
        </p>
      ),
      'icon': () => (
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      'svg icon': () => (
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      'badge': () => (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
          Active
        </span>
      ),
      'avatar': () => (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-semibold">
          JD
        </div>
      ),
      'buttons': () => (
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
            Primary
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
            Secondary
          </button>
        </div>
      ),
      'button': () => (
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
          Action
        </button>
      ),
      'links': () => (
        <div className="flex gap-4">
          <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Home</a>
          <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">About</a>
          <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Contact</a>
        </div>
      ),
      'nav links': () => (
        <div className="flex gap-4">
          <a href="#" className="text-gray-700 hover:text-gray-900 text-sm font-medium">Dashboard</a>
          <a href="#" className="text-gray-700 hover:text-gray-900 text-sm font-medium">Projects</a>
          <a href="#" className="text-gray-700 hover:text-gray-900 text-sm font-medium">Team</a>
        </div>
      ),
      'menu items': () => (
        <div className="flex flex-col gap-1">
          <a href="#" className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">Profile</a>
          <a href="#" className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">Settings</a>
        </div>
      ),
      'list': () => (
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm text-gray-700">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
            List item one
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-700">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
            List item two
          </li>
        </ul>
      ),
      'form fields': () => (
        <div className="space-y-3">
          <input type="text" placeholder="Enter text..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          <input type="email" placeholder="Email..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </div>
      ),
      'text field': () => (
        <input type="text" placeholder="Enter text..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
      ),
      'textarea': () => (
        <textarea placeholder="Enter message..." rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none" />
      ),
      'select': () => (
        <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option>Choose option</option>
          <option>Option 1</option>
          <option>Option 2</option>
        </select>
      ),
      'chart': () => (
        <div className="h-20 flex items-end gap-1">
          <div className="w-full bg-indigo-500 rounded-t" style={{height: '60%'}}></div>
          <div className="w-full bg-indigo-500 rounded-t" style={{height: '80%'}}></div>
          <div className="w-full bg-indigo-500 rounded-t" style={{height: '40%'}}></div>
          <div className="w-full bg-indigo-500 rounded-t" style={{height: '100%'}}></div>
        </div>
      ),
      'line': () => (
        <svg className="w-full h-16" viewBox="0 0 100 40">
          <polyline points="0,30 25,20 50,25 75,10 100,15" fill="none" stroke="rgb(99, 102, 241)" strokeWidth="2"/>
        </svg>
      ),
      'bar': () => (
        <div className="h-16 flex items-end gap-1">
          <div className="w-full bg-blue-500 rounded-t" style={{height: '70%'}}></div>
          <div className="w-full bg-blue-500 rounded-t" style={{height: '50%'}}></div>
          <div className="w-full bg-blue-500 rounded-t" style={{height: '90%'}}></div>
        </div>
      ),
      'area': () => (
        <svg className="w-full h-16" viewBox="0 0 100 40">
          <path d="M0,30 L25,20 L50,25 L75,10 L100,15 L100,40 L0,40 Z" fill="rgba(99, 102, 241, 0.2)" stroke="rgb(99, 102, 241)" strokeWidth="2"/>
        </svg>
      ),
      'number': () => (
        <span className="text-2xl font-bold text-gray-900">1,234</span>
      ),
      'timestamp': () => (
        <span className="text-xs text-gray-500">2 hours ago</span>
      ),
      'author': () => (
        <span className="text-xs text-gray-600">John Doe</span>
      ),
      'tags': () => (
        <div className="flex gap-1 flex-wrap">
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">React</span>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">TypeScript</span>
        </div>
      ),
      'actions': () => (
        <div className="flex gap-1">
          <button className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
      'table': () => (
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="px-3 py-2">Item 1</td>
                <td className="px-3 py-2"><span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">Active</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
      'rows': () => (
        <div className="space-y-1">
          <div className="flex gap-3 px-3 py-2 border-b border-gray-200">
            <span className="flex-1 text-sm text-gray-700">Row 1</span>
            <span className="text-sm text-gray-500">Value 1</span>
          </div>
          <div className="flex gap-3 px-3 py-2 border-b border-gray-200">
            <span className="flex-1 text-sm text-gray-700">Row 2</span>
            <span className="text-sm text-gray-500">Value 2</span>
          </div>
        </div>
      ),
      'cells': () => (
        <div className="flex gap-3">
          <span className="flex-1 text-sm text-gray-700">Cell 1</span>
          <span className="flex-1 text-sm text-gray-700">Cell 2</span>
          <span className="flex-1 text-sm text-gray-700">Cell 3</span>
        </div>
      ),
      'checkbox': () => (
        <input type="checkbox" className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
      ),
      'pagination': () => (
        <div className="flex gap-2 items-center">
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Previous</button>
          <span className="text-sm text-gray-600">Page 1 of 10</span>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Next</button>
        </div>
      ),
      'logo': () => (
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-sm">
          DS
        </div>
      ),
      'navigation items': () => (
        <div className="flex gap-4">
          <a href="#" className="text-sm font-medium text-gray-700 hover:text-gray-900">Home</a>
          <a href="#" className="text-sm font-medium text-gray-700 hover:text-gray-900">Products</a>
          <a href="#" className="text-sm font-medium text-gray-700 hover:text-gray-900">About</a>
        </div>
      ),
      'dropdown': () => (
        <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-1">
          Options
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ),
      'chip': () => (
        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">Tag</span>
      ),
      'spinner': () => (
        <svg className="w-5 h-5 animate-spin text-gray-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ),
      'emoji': () => (
        <span className="text-xl">😊</span>
      ),
      'illustration': () => (
        <div className="w-full h-40 bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-400 rounded-lg flex items-center justify-center">
          <svg className="w-16 h-16 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </div>
      ),
      'button group': () => (
        <div className="inline-flex rounded-md shadow-sm">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50">
            Left
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-t border-b border-gray-300 hover:bg-gray-50">
            Middle
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50">
            Right
          </button>
        </div>
      ),
      'content blocks': () => (
        <div className="space-y-3">
          <div className="p-3 bg-white border border-gray-200 rounded">Content Block 1</div>
          <div className="p-3 bg-white border border-gray-200 rounded">Content Block 2</div>
        </div>
      ),
      'cards': () => (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white border border-gray-200 rounded shadow-sm">Card 1</div>
          <div className="p-3 bg-white border border-gray-200 rounded shadow-sm">Card 2</div>
        </div>
      ),
      'media': () => (
        <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ),
      'stat cards': () => (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white border border-gray-200 rounded">
            <div className="text-xs text-gray-500">Metric</div>
            <div className="text-xl font-bold text-gray-900">1,234</div>
          </div>
          <div className="p-3 bg-white border border-gray-200 rounded">
            <div className="text-xs text-gray-500">Growth</div>
            <div className="text-xl font-bold text-green-600">+12%</div>
          </div>
        </div>
      ),
      'backdrop': () => (
        <div className="w-full h-full bg-black/40 rounded"></div>
      ),
      'content': () => (
        <div className="p-4 bg-white rounded">
          <p className="text-sm text-gray-700">Content goes here...</p>
        </div>
      ),
      'help text': () => (
        <p className="text-xs text-gray-500">This is a helpful hint or description.</p>
      ),
      'error message': () => (
        <p className="text-xs text-red-600">This field is required.</p>
      ),
      'header row': () => (
        <div className="flex gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-700">
          <span className="flex-1">Column 1</span>
          <span className="flex-1">Column 2</span>
          <span className="flex-1">Column 3</span>
        </div>
      ),
      'data rows': () => (
        <div className="space-y-1">
          <div className="flex gap-3 px-3 py-2 border-b border-gray-200 text-sm">
            <span className="flex-1">Data 1</span>
            <span className="flex-1">Data 2</span>
            <span className="flex-1">Data 3</span>
          </div>
          <div className="flex gap-3 px-3 py-2 border-b border-gray-200 text-sm">
            <span className="flex-1">Data 4</span>
            <span className="flex-1">Data 5</span>
            <span className="flex-1">Data 6</span>
          </div>
        </div>
      ),
      'avatars': () => (
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white"></div>
          <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-white"></div>
          <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white"></div>
        </div>
      ),
      'initials': () => (
        <span className="text-sm font-semibold text-gray-700">JD</span>
      ),
      'counter': () => (
        <span className="text-xs text-gray-600 font-medium">+5</span>
      ),
      'dot': () => (
        <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
      ),
      'percentage': () => (
        <span className="text-sm font-semibold text-green-600">+12.5%</span>
      ),
      'arrow': () => (
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ),
      'indicator': () => (
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="text-xs text-gray-600">Live</span>
        </div>
      ),
      'any content': () => (
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center text-sm text-gray-500">
          Content container
        </div>
      )
    };
    
    return slotRenderers[slotType] ? slotRenderers[slotType]() : (
      <div className="p-2 bg-gray-100 rounded text-xs text-gray-600 text-center">
        {slotType}
      </div>
    );
  };

  // Helper to get slot content by structure part name
  const getSlotContent = (partName: string): JSX.Element | null => {
    const index = component?.structure.indexOf(partName) ?? -1;
    if (index === -1) return null;
    const slotType = slotSelections[index];
    return slotType ? renderSlotContent(slotType) : null;
  };

  // Component-specific renderers
  const renderCardPreview = (): JSX.Element => {
    const header = getSlotContent('header');
    const body = getSlotContent('body');
    const footer = getSlotContent('footer');
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 max-w-md mx-auto">
        {header && <div className="mb-3 pb-3 border-b border-gray-200">{header}</div>}
        {body && <div className="py-3">{body}</div>}
        {footer && <div className="mt-3 pt-3 border-t border-gray-200">{footer}</div>}
      </div>
    );
  };

  const renderButtonPreview = (): JSX.Element => {
    const content = getSlotContent('button');
    return (
      <div className="flex items-center justify-center">
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          {content}
        </button>
      </div>
    );
  };

  const renderHeroPreview = (): JSX.Element => {
    const media = getSlotContent('media');
    const copy = getSlotContent('copy');
    const cta = getSlotContent('cta');
    
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 max-w-2xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            {copy}
            {cta && <div className="mt-4">{cta}</div>}
          </div>
          {media && <div>{media}</div>}
        </div>
      </div>
    );
  };

  const renderNavbarPreview = (): JSX.Element => {
    const brand = getSlotContent('brand');
    const links = getSlotContent('links');
    const actions = getSlotContent('actions');
    
    return (
      <nav className="bg-white border-b border-gray-200 px-4 py-3 max-w-4xl mx-auto rounded-lg">
        <div className="flex items-center justify-between">
          {brand}
          {links && <div className="flex-1 mx-6">{links}</div>}
          {actions}
        </div>
      </nav>
    );
  };

  const renderListItemPreview = (): JSX.Element => {
    const icon = getSlotContent('icon');
    const label = getSlotContent('label');
    const metadata = getSlotContent('metadata');
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          {icon}
          <div className="flex-1">
            {label}
            {metadata && <div className="mt-1">{metadata}</div>}
          </div>
        </div>
      </div>
    );
  };

  const renderBadgePreview = (): JSX.Element => {
    const icon = getSlotContent('icon');
    const label = getSlotContent('label');
    
    return (
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          {icon}
          {label}
        </span>
      </div>
    );
  };

  const renderModalPreview = (): JSX.Element => {
    const header = getSlotContent('header');
    const body = getSlotContent('body');
    const footer = getSlotContent('footer');
    
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-black/40 rounded-lg"></div>
        <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md mx-auto mt-8">
          {header && <div className="mb-4 text-lg font-semibold">{header}</div>}
          {body && <div className="mb-4">{body}</div>}
          {footer && <div className="flex gap-2 justify-end">{footer}</div>}
        </div>
      </div>
    );
  };

  const renderInputPreview = (): JSX.Element => {
    const label = getSlotContent('label');
    const input = getSlotContent('input');
    const hint = getSlotContent('hint');
    const error = getSlotContent('error');
    
    return (
      <div className="bg-white rounded-lg p-4 max-w-md mx-auto">
        {label && <div className="mb-2 text-sm font-medium text-gray-700">{label}</div>}
        {input}
        {hint && <div className="mt-1">{hint}</div>}
        {error && <div className="mt-1">{error}</div>}
      </div>
    );
  };

  const renderTableRowPreview = (): JSX.Element => {
    const cells = component?.structure
      .map((part) => part === 'cell' ? getSlotContent('cell') || renderSlotContent('text') : null)
      .filter(Boolean);
    const actions = getSlotContent('actions');
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-2xl mx-auto">
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
          {cells?.map((cell, i) => (
            <div key={i} className="flex-1">{cell}</div>
          ))}
          {actions && <div>{actions}</div>}
        </div>
      </div>
    );
  };

  const renderTablePreview = (): JSX.Element => {
    const cellContent = getSlotContent('cell') || renderSlotContent('text');
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-2xl mx-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Column 1</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Column 2</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Column 3</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-3">{cellContent}</td>
              <td className="px-4 py-3">{cellContent}</td>
              <td className="px-4 py-3">{cellContent}</td>
            </tr>
            <tr>
              <td className="px-4 py-3">{cellContent}</td>
              <td className="px-4 py-3">{cellContent}</td>
              <td className="px-4 py-3">{cellContent}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderAvatarClusterPreview = (): JSX.Element => {
    const avatar = getSlotContent('avatar') || renderSlotContent('avatar');
    const counter = getSlotContent('counter');
    
    return (
      <div className="flex items-center justify-center">
        <div className="flex items-center -space-x-2">
          {avatar}
          <div className="border-2 border-white">{renderSlotContent('avatar')}</div>
          <div className="border-2 border-white">{renderSlotContent('avatar')}</div>
          {counter && <div className="ml-3">{counter}</div>}
        </div>
      </div>
    );
  };

  const renderTimelinePreview = (): JSX.Element => {
    const indicator = getSlotContent('indicator');
    const content = getSlotContent('content');
    const meta = getSlotContent('meta');
    const actions = getSlotContent('actions');
    
    return (
      <div className="bg-white rounded-lg p-4 max-w-md mx-auto">
        <div className="flex gap-4">
          {indicator && <div className="flex-shrink-0 mt-1">{indicator}</div>}
          <div className="flex-1">
            {content}
            {meta && <div className="mt-2">{meta}</div>}
            {actions && <div className="mt-3">{actions}</div>}
          </div>
        </div>
      </div>
    );
  };

  const renderToastPreview = (): JSX.Element => {
    const icon = getSlotContent('icon');
    const body = getSlotContent('body');
    const actions = getSlotContent('actions');
    
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          {icon}
          <div className="flex-1">{body}</div>
          {actions}
        </div>
      </div>
    );
  };

  const renderSparklinePreview = (): JSX.Element => {
    const label = getSlotContent('label');
    const value = getSlotContent('value');
    const chart = getSlotContent('chart');
    const delta = getSlotContent('delta');
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-sm mx-auto">
        {label && <div className="text-sm text-gray-600 mb-1">{label}</div>}
        <div className="flex items-end justify-between gap-4">
          <div>
            {value}
            {delta && <div className="mt-1">{delta}</div>}
          </div>
          {chart && <div className="flex-1">{chart}</div>}
        </div>
      </div>
    );
  };

  const renderStatCardPreview = (): JSX.Element => {
    const label = getSlotContent('label');
    const value = getSlotContent('value');
    const delta = getSlotContent('delta');
    const trend = getSlotContent('trend');
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-xs mx-auto">
        {label && <div className="text-sm text-gray-600 mb-2">{label}</div>}
        {value}
        <div className="flex items-center gap-2 mt-2">
          {delta}
          {trend}
        </div>
      </div>
    );
  };

  const renderGenericPreview = (): JSX.Element => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 max-w-md mx-auto">
        {component?.structure.map((part, index) => {
          const content = getSlotContent(part);
          if (!content) return null;
          return <div key={index} className="mb-3 last:mb-0">{content}</div>;
        })}
      </div>
    );
  };

  // Build dynamic component based on structure and slot selections
  const renderDynamicComponent = (): JSX.Element => {
    if (!component || !component.structure) return <></>;
    
    const hasContentSlots = slotSelections && 
      Object.keys(slotSelections).length > 0 && 
      Object.values(slotSelections).some(val => val);
    
    if (!hasContentSlots) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
          <p className="text-sm text-gray-500 text-center">
            Select content for slots to preview
          </p>
        </div>
      );
    }
    
    // Component-specific rendering logic
    switch (component.id) {
      case 'card.primary':
        return renderCardPreview();
      case 'button.primary':
      case 'button.secondary':
        return renderButtonPreview();
      case 'hero.banner':
        return renderHeroPreview();
      case 'navbar.global':
        return renderNavbarPreview();
      case 'list.item':
        return renderListItemPreview();
      case 'badge.status':
        return renderBadgePreview();
      case 'modal.dialog':
        return renderModalPreview();
      case 'input.field':
        return renderInputPreview();
      case 'table.row':
        return renderTableRowPreview();
      case 'table.simple':
        return renderTablePreview();
      case 'avatar.cluster':
        return renderAvatarClusterPreview();
      case 'timeline.entry':
        return renderTimelinePreview();
      case 'toast.notification':
        return renderToastPreview();
      case 'chart.sparkline':
        return renderSparklinePreview();
      case 'stat.card':
        return renderStatCardPreview();
      default:
        return renderGenericPreview();
    }
  };

  return (
    <div ref={ref} className={`bg-slate-50 rounded-xl border border-slate-200 p-6 min-h-[260px] mx-auto transition-all ${currentWidth}`}>
      {!component && (
        <div className="grid gap-6 md:grid-cols-2">
          {renderHero()}
          <div className="space-y-4">
            {renderNavbar()}
            {renderCard()}
            {renderListItem()}
          </div>
          {renderModal()}
          <div className="space-y-4">
            {renderButton('primary')}
            {renderButton('secondary')}
            {renderBadge()}
            {renderInput()}
          </div>
        </div>
      )}
      {component && (
        <div className="flex items-center justify-center min-h-[200px]">
          {slotSelections && Object.keys(slotSelections).length > 0 ? (
            renderDynamicComponent()
          ) : (
            (componentRenderer[component.id] || (() => renderCard()))(variantId ?? undefined)
          )}
        </div>
      )}
    </div>
  );
}
