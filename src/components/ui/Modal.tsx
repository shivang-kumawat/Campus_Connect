import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, description, wide = false, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm animate-fade-up" onClick={onClose} aria-label="Close dialog" />
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`relative max-h-[90vh] w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} animate-fade-up overflow-y-auto rounded-3xl bg-white p-6 shadow-lift sm:p-8`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-navy-900">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-navy-600">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-navy-400 transition hover:bg-navy-50 hover:text-navy-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
