"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { base, reducedFade } from "./motion";

type Props = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  const reduced = useReducedMotion();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  // Latest onCancel without making it an effect dependency: the parent re-renders
  // several times a second and an inline callback would re-run the focus logic.
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  });

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelRef.current();
      if (e.key === "Tab") {
        e.preventDefault();
        (document.activeElement === confirmRef.current
          ? cancelRef.current
          : confirmRef.current
        )?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener.current?.focus();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduced ? reducedFade : base}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
          onClick={onCancel}
        >
          {/* eslint-disable jsx-a11y/prefer-tag-over-role -- animated modal wrapper; a native <dialog> brings its own positioning and open semantics that fight the overlay */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            initial={{ opacity: 0, scale: reduced ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduced ? 1 : 0.96 }}
            transition={reduced ? reducedFade : base}
            className="w-full max-w-sm rounded-lg bg-sand p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="text-lg font-semibold">
              {title}
            </h2>
            <p className="mt-2 text-sm text-ink-soft">{body}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                className="rounded-md px-4 py-2 text-sm hover:bg-sand-deep"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={onConfirm}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
          {/* eslint-enable jsx-a11y/prefer-tag-over-role */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
