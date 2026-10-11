"use client";

import { useRef } from "react";

type CarouselProps = {
  /** header content rendered on the left (title, filters, countdown, ...) */
  header?: React.ReactNode;
  /** pass an id when the controls live outside the carousel (e.g. in the section header) */
  trackId?: string;
  children: React.ReactNode;
};

export function Carousel({ header, trackId, children }: CarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);

  return (
    <>
      {header}

      <ul
        id={trackId}
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>
    </>
  );
}

/** Standalone controls for a carousel identified by `trackId`. */
export function CarouselControls({ trackId }: { trackId: string }) {
  const trackRef = useRef<HTMLUListElement | null>(null);

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current ?? document.getElementById(trackId);
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="flex shrink-0 self-center items-center gap-1 max-md:hidden">
      <CarouselButton trackRef={trackRef} direction="prev" onClick={() => scrollByPage(-1)} />
      <CarouselButton trackRef={trackRef} direction="next" onClick={() => scrollByPage(1)} />
    </div>
  );
}

function CarouselButton({
  direction,
  trackRef,
  onClick,
}: {
  direction: "prev" | "next";
  trackRef: React.RefObject<HTMLUListElement | null>;
  onClick?: () => void;
}) {
  const isPrev = direction === "prev";

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: (isPrev ? -1 : 1) * track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isPrev ? "Previous" : "Next"}
      className="flex h-6 w-6 cursor-pointer items-center justify-center border border-border bg-white p-0 text-[9px] leading-none text-[#555] transition-colors hover:border-primary hover:text-primary"
    >
      <i className={isPrev ? "fa-solid fa-chevron-left" : "fa-solid fa-chevron-right"} />
    </button>
  );
}

export function CarouselItem({
  itemClassName,
  children,
}: {
  itemClassName: string;
  children: React.ReactNode;
}) {
  return <li className={`shrink-0 snap-start ${itemClassName}`}>{children}</li>;
}