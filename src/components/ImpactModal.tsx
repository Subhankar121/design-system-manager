import { ImpactReport } from '@/types';

interface ImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ImpactReport | null;
}

export function ImpactModal({ isOpen, onClose, report }: ImpactModalProps) {
  if (!isOpen || !report) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" aria-hidden="true" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6 space-y-6">
            <header className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500">Analysis</p>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Impact report · {report.severity.toUpperCase()}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                aria-label="Close impact modal"
              >
                ×
              </button>
            </header>

            <section className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Changed tokens</p>
                <p className="text-2xl font-semibold text-gray-900">{report.changedTokens.length}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Affected components</p>
                <p className="text-2xl font-semibold text-gray-900">{report.affectedComponents.length}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Severity</p>
                <p className="text-2xl font-semibold text-gray-900 capitalize">{report.severity}</p>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Changed tokens</h3>
              {report.changedTokens.length === 0 && (
                <p className="text-sm text-gray-500">No token changes detected.</p>
              )}
              {report.changedTokens.length > 0 && (
                <ul className="space-y-2">
                  {report.changedTokens.map((change) => (
                    <li
                      key={change.key}
                      className="border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between text-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{change.key}</p>
                        <p className="text-xs text-gray-500">from {change.from ?? 'n/a'}</p>
                      </div>
                      <span className="text-indigo-600 font-semibold">{change.to ?? 'n/a'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Affected components</h3>
              {report.affectedComponents.length === 0 && (
                <p className="text-sm text-gray-500">No components are impacted by this change.</p>
              )}
              {report.affectedComponents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {report.affectedComponents.map((component) => (
                    <span
                      key={component}
                      className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold"
                    >
                      {component}
                    </span>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

