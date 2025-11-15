import { ComponentDef } from '@/types';
import { useEffect, useState } from 'react';
import { saveComponent } from '@/lib/mockApi';
import { useToast } from '@/hooks/useToast';

interface Props {
  component: ComponentDef | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ComponentInspectorDrawer({ component, isOpen, onClose }: Props) {
  const [draft, setDraft] = useState<ComponentDef | null>(component);
  const { addToast } = useToast();

  useEffect(() => {
    setDraft(component);
  }, [component]);

  if (!component || !draft || !isOpen) return null;

  const handleSave = async () => {
    await saveComponent(draft);
    addToast('Component saved', 'success');
    onClose();
  };

  const missingA11y = !draft.a11y?.description;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />
      <aside
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-gray-500 mb-1">Component</p>
              <h2 className="text-xl font-semibold text-gray-900">{draft.name}</h2>
              <p className="text-xs text-gray-500">{draft.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
              aria-label="Close component drawer"
            >
              ×
            </button>
          </div>

          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Structure</h3>
            <div className="flex flex-wrap gap-2">
              {draft.structure.map((part) => (
                <span
                  key={part}
                  className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                >
                  {part}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Tokens used</h3>
            <div className="flex flex-wrap gap-2">
              {draft.tokensUsed.map((token) => (
                <span
                  key={token}
                  className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium"
                >
                  {token}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Accessibility description</h3>
            <textarea
              value={draft.a11y?.description ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  a11y: { ...(draft.a11y || {}), description: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
              placeholder="Describe how assistive tech should present this component"
            />
            {missingA11y && (
              <p className="text-xs text-orange-600 mt-1">Accessibility description is recommended</p>
            )}
          </section>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Save
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

