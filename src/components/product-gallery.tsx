"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * `gallery` — the detail page photo block. Flat white card, 1px hairline,
 * rounded `{rounded.md}`; the photo is `object-contain` inside a fixed box so
 * it never crops. Thumbnails are a vertical rail of 64px squares, hairline
 * bordered, with the selected one lifting to `{colors.primary}`.
 */
export function ProductGallery({
  images,
  discount,
  name,
}: {
  images: { src: string; alt: string }[];
  discount?: string;
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="relative flex min-h-[360px] flex-1 items-center justify-center rounded-md border border-border bg-white p-6 max-md:min-h-[280px]">
        {discount ? (
          <span className="absolute left-3 top-3 rounded-sm bg-badge-red px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {discount}
          </span>
        ) : null}
        {current ? (
          <Image
            src={current.src}
            alt={current.alt}
            width={420}
            height={420}
            className="max-h-[380px] max-w-full object-contain"
            preload
          />
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="flex list-none gap-2 max-md:order-first">
          {images.map((image, index) => (
            // Index-keyed: the rail is static and position-ordered, and a src is
            // not guaranteed unique.
            <li key={index}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`${name} view ${index + 1}`}
                aria-current={index === active}
                className={`flex h-16 w-16 cursor-pointer items-center justify-center rounded border bg-white p-1 transition-colors ${
                  index === active
                    ? "border-primary"
                    : "border-border hover:border-primary"
                }`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={56}
                  height={56}
                  className="max-h-full max-w-full object-contain"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}