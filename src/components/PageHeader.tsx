interface PageHeaderProps {
  badge?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function PageHeader({ badge, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div className="flex-1">
        {badge && (
          <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-1">
            {badge}
          </p>
        )}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-base text-gray-600 max-w-2xl">{description}</p>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  );
}

