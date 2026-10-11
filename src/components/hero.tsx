import Image from "next/image";

export function Hero() {
  return (
    <section className="bg-light-gray py-6">
      <div className="container-page">
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <div className="relative flex min-h-[280px] items-center overflow-hidden rounded-lg bg-gradient-to-br from-[#eef3fb] via-[#dde7f5] to-[#c9d9ee] p-10 max-md:p-6">
            <div className="z-[2] max-w-[50%] max-md:max-w-full">
              <h2 className="mb-3 text-[28px] font-bold leading-[1.25] text-[#1a1a1a] max-md:text-2xl">
                Active Summer With Juice Milk 300ml
              </h2>
              <p className="mb-6 text-xs text-[#5b6b85]">
                New arrivals with natural fruits, juice packs, essential for summer.
              </p>
              <a
                href="#"
                className="inline-block rounded bg-white px-5 py-2 text-xs font-semibold text-[#222] shadow-[0_2px_6px_rgba(0,0,0,0.06)]"
              >
                Shop Now
              </a>
            </div>
            <div className="absolute bottom-2.5 right-10 flex h-[240px] w-[240px] items-center justify-center max-lg:right-4 max-md:hidden">
              <Image
                src="https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&q=80"
                alt="Juice Bottle"
                width={240}
                height={240}
                className="max-h-full max-w-full object-contain -rotate-6 drop-shadow-[0_15px_20px_rgba(0,0,0,0.15)]"
                preload
              />
            </div>
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden rounded-lg bg-gradient-to-br from-[#fef4e3] via-[#fde5bd] to-[#fbd597] p-[30px]">
            <div>
              <div className="mb-1.5 text-[22px] font-bold text-badge-red">20% SALE OFF</div>
              <p className="mb-4 text-xs text-[#8a6a35]">
                Synthetic seeds
                <br />
                Net 2.0 OZ
              </p>
              <a
                href="#"
                className="inline-block rounded bg-white px-5 py-2 text-xs font-semibold text-[#222] shadow-[0_2px_6px_rgba(0,0,0,0.06)]"
              >
                Shop Now
              </a>
            </div>
            <Image
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80"
              alt="Food Box"
              width={170}
              height={170}
              className="absolute -bottom-2.5 -right-2.5 w-[170px] object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.1)] max-sm:hidden"
            />
          </div>
        </div>
      </div>
    </section>
  );
}