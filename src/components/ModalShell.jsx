import { useEffect, useState } from 'react';

export default function ModalShell({ isOpen, onClose, children, overlayClassName = '', containerClassName = '' }) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Delay para abrir com animação
      const t = setTimeout(() => setShouldAnimate(true), 10);
      return () => clearTimeout(t);
    }

    setShouldAnimate(false);
    // Delay para terminar animação antes de remover do DOM
    const t = setTimeout(() => setIsVisible(false), 500);
    return () => clearTimeout(t);
  }, [isOpen]);

  if (!isVisible) return null;

  const stop = (e) => e.stopPropagation();

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 transition-all duration-500 ease-out ${shouldAnimate ? 'opacity-100' : 'opacity-0'} ${overlayClassName}`}
    >
      {/* Center wrapper allows clicks to pass through (pointer-events-none), so overlay receives them
          and closes the modal even on the sides; animation applied to the inner content instead. */}
      <div className={`w-full flex items-center justify-center pointer-events-none`}> 
        <div onClick={stop} className={`pointer-events-auto transform transition-all duration-500 ease-out ${shouldAnimate ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8'} ${containerClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
