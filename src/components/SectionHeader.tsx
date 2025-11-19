interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: string;
}

export function SectionHeader({ title, description, action, badge }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {badge && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
      {action && (
        <div className="ml-4">
          {action}
        </div>
      )}
    </div>
  );
}

