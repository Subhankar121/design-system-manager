interface HelpBoxProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'info' | 'tip' | 'warning';
}

export function HelpBox({ title, children, variant = 'info' }: HelpBoxProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    tip: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800'
  };

  const icons = {
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tip: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  };

  return (
    <div className={`border rounded-lg p-4 ${styles[variant]}`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {icons[variant]}
        </div>
        <div className="flex-1">
          {title && (
            <h4 className="font-medium mb-1 text-sm">{title}</h4>
          )}
          <div className="text-sm leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

