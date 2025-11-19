interface StatsCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  onClick?: () => void;
}

export function StatsCard({ label, value, description, icon, trend, onClick }: StatsCardProps) {
  const Component = onClick ? 'button' : 'div';
  const clickableClasses = onClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all' : '';

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <Component
      onClick={onClick}
      className={`bg-white rounded-lg border border-gray-200 p-6 ${clickableClasses}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {trend && (
          <span className={`text-sm font-medium ${trendColors[trend.direction]}`}>
            {trend.value}
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
    </Component>
  );
}

