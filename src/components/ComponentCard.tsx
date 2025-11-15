import { ComponentDef } from '@/types';

interface ComponentCardProps {
  component: ComponentDef;
  onClick: () => void;
}

export function ComponentCard({ component, onClick }: ComponentCardProps) {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View component ${component.name}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{component.name}</h3>
      <p className="text-sm text-gray-600 mb-4">{component.a11y.description}</p>
      
      <div className="space-y-2">
        <div>
          <span className="text-xs font-medium text-gray-500">Tokens Used:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {component.tokensUsed.map((token) => (
              <span
                key={token}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
              >
                {token}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <span className="text-xs font-medium text-gray-500">Structure:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {component.structure.map((part) => (
              <span
                key={part}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                {part}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

