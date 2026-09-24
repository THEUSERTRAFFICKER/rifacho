import React, { useEffect, useState } from 'react';

interface TooltipPos {
  x: number;
  y: number;
}

export const AntiCopyOverlay: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipPos | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handlePrevent = (e: MouseEvent) => {
      // Allow inputs and textareas to work naturally
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      e.preventDefault();
      setTooltip({ x: e.clientX, y: e.clientY });

      clearTimeout(timer);
      timer = setTimeout(() => {
        setTooltip(null);
      }, 1500);
    };

    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      e.preventDefault();
      setTooltip({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      clearTimeout(timer);
      timer = setTimeout(() => {
        setTooltip(null);
      }, 1500);
    };

    window.addEventListener('contextmenu', handlePrevent);
    window.addEventListener('copy', handleCopy);

    return () => {
      window.removeEventListener('contextmenu', handlePrevent);
      window.removeEventListener('copy', handleCopy);
      clearTimeout(timer);
    };
  }, []);

  if (!tooltip) return null;

  return (
    <div
      id="ays_tooltip"
      style={{
        left: `${tooltip.x + 10}px`,
        top: `${tooltip.y + 10}px`,
      }}
    >
      <div id="ays_tooltip_block">
        <p>No puedes copiar el contenido de esta pagina.</p>
      </div>
    </div>
  );
};
