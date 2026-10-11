"use client";

import { useEffect, useId, useRef } from "react";

type DialogProps = {
  open: boolean;
  /** fired on Esc, scrim click, or the close control */
  onClose: () => void;
  title: string;
  /** short supporting line under the title, `dialog-body` styling */
  description?: string;
  /** dialog body — product rows, `input-form` fields, anything dense */
  children?: React.ReactNode;
  /** footer actions; default renders a single secondary Cancel */
  actions?: React.ReactNode;
  /** `sm` for confirmations, `md` for cart/forms */
  size?: "sm" | "md";
};

/**
 * `dialog-overlay` + `dialog-panel` from DESIGN.md.
 * Built on the native `<dialog>` element so focus trapping, inert background,
 * Esc handling and the top layer come from the platform rather than JS.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  size = "md",
}: DialogProps) {
  const panelRef = useRef<HTMLDialogElement>(null);
  // Per-instance id: several dialogs can be mounted at once, and a fixed id
  // would make every `aria-labelledby` resolve to the first heading.
  const titleId = `${useId()}-title`;

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (open && !panel.open) panel.showModal();
    if (!open && panel.open) panel.close();
  }, [open]);

  return (
    <dialog
      ref={panelRef}
      aria-labelledby={titleId}
      // A click landing on the panel element itself is a scrim click.
      onClick={(event) => {
        if (event.target === panelRef.current) onClose();
      }}
      onClose={onClose}
      className={`dialog-panel m-auto w-[min(480px,calc(100vw-32px))] max-w-none border border-border bg-white p-6 text-xs text-[#333] shadow-[0_20px_40px_rgba(0,0,0,0.18)] ${
        size === "sm" ? "sm:w-[min(420px,calc(100vw-32px))]" : ""
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg leading-7 font-bold text-[#1a1a1a]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-gray-text">{description}</p>
          ) : null}
        </div>
        <DialogClose onClick={onClose} />
      </div>

      {children ? <div className="text-xs leading-5 text-gray-text">{children}</div> : null}

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#f0f0f0] pt-4">
        {actions ?? <DialogSecondaryButton onClick={onClose}>Cancel</DialogSecondaryButton>}
      </div>
    </dialog>
  );
}

/** `dialog-close` — same geometry as the carousel controls: 24×24, zero radius. */
function DialogClose({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClick}
      className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center border border-border bg-white p-0 text-[9px] leading-none text-[#555] transition-colors hover:border-primary hover:text-primary"
    >
      <i className="fa-solid fa-xmark" />
    </button>
  );
}

/** `button-primary` — the one amber action a dialog is allowed. */
export function DialogPrimaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded border-none bg-primary px-5 py-2 text-[11px] font-semibold text-white hover:bg-primary-hover"
    >
      {children}
    </button>
  );
}

/** `button-secondary` — the dismissing action. Never red. */
export function DialogSecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded border border-border bg-white px-5 py-2 text-[11px] font-semibold text-[#222] transition-colors hover:bg-[#f7f7f7]"
    >
      {children}
    </button>
  );
}
