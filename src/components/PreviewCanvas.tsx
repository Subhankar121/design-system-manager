import { useEffect, useRef } from 'react';
import { ComponentDef, TokenValueMap } from '@/types';
import { applyTokensToElement, tokenToCSSVar } from '@/lib/resolver';

interface PreviewCanvasProps {
  tokens: TokenValueMap;
  component?: ComponentDef | null;
}

export function PreviewCanvas({ tokens, component }: PreviewCanvasProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      applyTokensToElement(ref.current, tokens);
    }
  }, [tokens]);

  const renderCard = () => (
    <div
      className="space-y-4 rounded-lg border shadow-sm p-6 transition-all"
      style={{
        backgroundColor: `var(${tokenToCSSVar('color.surface')})`,
        color: `var(${tokenToCSSVar('color.text')})`,
        borderRadius: `var(${tokenToCSSVar('radius.medium')})`,
        boxShadow: `var(${tokenToCSSVar('shadow.medium')})`,
      }}
    >
      <div className="font-semibold text-lg">Sample Card</div>
      <p className="text-sm opacity-80">
        Tokens drive this card. Adjust values in presets to see changes reflected immediately.
      </p>
      <button
        className="px-4 py-2 font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: `var(${tokenToCSSVar('color.primary')})`,
          borderRadius: `var(${tokenToCSSVar('radius.medium')})`,
        }}
      >
        Primary action
      </button>
    </div>
  );

  const renderButton = () => (
    <button
      className="px-5 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm"
      style={{
        backgroundColor: `var(${tokenToCSSVar('color.primary')})`,
        color: `var(${tokenToCSSVar('color.text')})`,
        borderRadius: `var(${tokenToCSSVar('radius.medium')})`,
        boxShadow: `var(${tokenToCSSVar('shadow.medium')})`,
      }}
    >
      Button preview
    </button>
  );

  return (
    <div ref={ref} className="bg-slate-50 rounded-xl border border-slate-200 p-6 min-h-[260px]">
      {!component && (
        <div className="space-y-6">
          {renderCard()}
          {renderButton()}
        </div>
      )}
      {component && (
        <div className="flex items-center justify-center min-h-[200px]">
          {component.id.includes('card') ? renderCard() : renderButton()}
        </div>
      )}
    </div>
  );
}

