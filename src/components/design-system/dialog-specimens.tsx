"use client";

import { useState } from "react";
import { Dialog, DialogPrimaryButton, DialogSecondaryButton } from "@/components/dialog";
import { Panel } from "@/components/design-system/shell";

const triggers = [
  { id: "sm", label: "Confirm (sm)", hint: "420px · single question, no body copy rows" },
  { id: "cart", label: "Cart line item (md)", hint: "480px · product row + price in alert red" },
  { id: "form", label: "Signup form (md)", hint: "480px · input-form fields, amber confirm" },
] as const;

type TriggerId = (typeof triggers)[number]["id"];

export function DialogSpecimens() {
  const [open, setOpen] = useState<TriggerId | null>(null);

  return (
    <>
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          {triggers.map((trigger) => (
            <button
              key={trigger.id}
              type="button"
              onClick={() => setOpen(trigger.id)}
              className="cursor-pointer rounded border-none bg-primary px-5 py-[7px] text-[11px] font-semibold text-white hover:bg-primary-hover"
            >
              Open {trigger.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10px] leading-[1.5] text-[#71717a]">
          <code>dialog-overlay</code> is a flat <code>rgba(17,17,17,0.45)</code> scrim with no blur. Esc and scrim
          clicks close every variant. <code>dialog-panel</code> takes the only Level 5 shadow in the system — it is the
          one surface that floats.
        </p>
        <ul className="mt-3 border-t border-[#f0f0f0] pt-3">
          {triggers.map((trigger) => (
            <li key={trigger.id} className="flex gap-2 py-1 text-[11px] leading-[1.5] text-[#333]">
              <i className="fa-solid fa-check mt-[3px] text-[9px] text-primary" />
              <span className="font-semibold text-[#222]">{trigger.label}</span>
              <span className="text-[#71717a]">— {trigger.hint}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {/* sm — confirmation */}
      <Dialog
        open={open === "sm"}
        onClose={() => setOpen(null)}
        title="Remove this item?"
        description="This only clears the line from your cart. The stock stays unreserved."
        size="sm"
        actions={
          <>
            <DialogSecondaryButton onClick={() => setOpen(null)}>Keep it</DialogSecondaryButton>
            <DialogPrimaryButton onClick={() => setOpen(null)}>Remove</DialogPrimaryButton>
          </>
        }
      />

      {/* md — cart line item, reuses the card conventions inside the body */}
      <Dialog
        open={open === "cart"}
        onClose={() => setOpen(null)}
        title="Add to cart"
        description="Frozen Seafood · 350ml x 24"
        actions={
          <>
            <DialogSecondaryButton onClick={() => setOpen(null)}>Continue shopping</DialogSecondaryButton>
            <DialogPrimaryButton onClick={() => setOpen(null)}>Add To Cart</DialogPrimaryButton>
          </>
        }
      >
        <div className="flex items-center justify-between gap-4 border-t border-[#f0f0f0] py-3 first:border-t-0">
          <div className="min-w-0">
            <span className="mb-1 block text-[10px] text-[#999] uppercase">Ice Best Cream</span>
            <div className="clamp-2 h-[34px] text-xs font-semibold leading-[1.4] text-[#333]">
              Ice Best Cream 350ml x 24 Original Flavour
            </div>
            <div className="mt-1.5 text-[10px] text-[#ffc107]">
              <i className="fa-solid fa-star" />
              <i className="fa-solid fa-star" />
              <i className="fa-solid fa-star" />
              <i className="fa-solid fa-star" />
              <span className="ml-1 text-[#999]">(12)</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-sm font-bold text-badge-red">$8.90</div>
            <div className="text-[11px] text-[#aaa] line-through">$11.20</div>
          </div>
        </div>
      </Dialog>

      {/* md — signup form, input-form fields */}
      <Dialog
        open={open === "form"}
        onClose={() => setOpen(null)}
        title="Register for 15% OFF"
        description="New members get 15% off their first order."
        actions={
          <>
            <DialogSecondaryButton onClick={() => setOpen(null)}>Cancel</DialogSecondaryButton>
            <DialogPrimaryButton onClick={() => setOpen(null)}>Register Now</DialogPrimaryButton>
          </>
        }
      >
        <div className="relative mb-2.5">
          <i className="fa-regular fa-envelope absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#999]" />
          <input
            type="email"
            placeholder="yourdetail@gmail.com"
            className="w-full rounded border border-[#ddd] bg-white py-2 pl-8 pr-3 text-[11px] outline-none"
          />
        </div>
        <div className="relative">
          <i className="fa-solid fa-lock absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#999]" />
          <input
            type="password"
            placeholder="Set Your Password"
            className="w-full rounded border border-[#ddd] bg-white py-2 pl-8 pr-3 text-[11px] outline-none"
          />
        </div>
      </Dialog>
    </>
  );
}
