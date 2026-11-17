import { useEffect, useRef, type ReactNode } from 'react';

/** Native <dialog> modal: the browser handles focus, Esc and the backdrop. */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog ref={ref} onClose={onClose} className="m-auto w-full max-w-lg rounded-lg p-5 backdrop:bg-black/40">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </dialog>
  );
}
