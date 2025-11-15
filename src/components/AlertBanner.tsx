interface AlertBannerProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const styles: Record<Required<AlertBannerProps>['type'], string> = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  success: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  error: 'bg-red-50 text-red-800 border-red-200',
};

export function AlertBanner({
  type = 'info',
  title,
  message,
  actionLabel,
  onAction,
}: AlertBannerProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 border rounded-lg px-4 py-3 ${styles[type]}`}
      role="status"
      aria-live="polite"
    >
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <p className="text-sm">{message}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-sm font-semibold underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

