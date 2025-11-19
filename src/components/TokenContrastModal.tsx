import { Token } from '@/types';
import { aaAARating } from '@/lib/resolver';

interface TokenContrastModalProps {
  token: Token;
  foregroundValue: string;
  backgroundKey: string;
  backgroundValue: string;
  ratio: number;
  requiredRatio: number;
  onClose: () => void;
}

export function TokenContrastModal({
  token,
  foregroundValue,
  backgroundKey,
  backgroundValue,
  ratio,
  requiredRatio,
  onClose,
}: TokenContrastModalProps) {
  const rating = aaAARating(ratio);
  const passesRequirement = ratio >= requiredRatio;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contrast-modal-title"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase text-gray-400 tracking-wide">Contrast</p>
              <h2 id="contrast-modal-title" className="text-2xl font-semibold text-gray-900">
                {token.key}
              </h2>
              {token.description && <p className="text-sm text-gray-500">{token.description}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close contrast modal"
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
            >
              ×
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 p-4 space-y-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500">Actual ratio</p>
                <p className="text-3xl font-semibold text-gray-900">{ratio}:1</p>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  passesRequirement ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                }`}
              >
                {rating} · {passesRequirement ? 'Pass' : 'Fail'}
              </span>
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Foreground value</span>
                <span className="font-mono text-gray-900">{foregroundValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Background token</span>
                <span className="font-mono text-gray-900">{backgroundKey}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Background value</span>
                <span className="font-mono text-gray-900">{backgroundValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Required ratio</span>
                <span className="font-semibold text-gray-900">{requiredRatio}:1</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-4">
            <span
              className="w-12 h-12 rounded border border-gray-300"
              style={{ backgroundColor: foregroundValue }}
              aria-hidden="true"
            />
            <span className="text-sm text-gray-500">
              Compared against <span className="font-semibold text-gray-900">{backgroundKey}</span> (
              {backgroundValue}). Adjust either value to meet the required minimum contrast.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}


