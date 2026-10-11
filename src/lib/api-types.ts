/**
 * Wire types shared by the API routes, the server-side client and the UI
 * components. Every endpoint returns exactly one of these shapes.
 */

export type SpecDto = { label: string; value: string };
export type GalleryImageDto = { src: string; alt: string };

export type ProductSummaryDto = {
  id: string;
  brand: string;
  name: string;
  image: string;
  alt: string;
  price: string;
  /** Numeric price — components do maths with this, never with `price`. */
  priceValue: number;
  oldPrice?: string;
  originalPrice?: number;
  discount?: string;
  discountRate?: number;
  rating?: number;
  reviewCount?: number;
  sold?: number;
  total?: number;
  inStock?: boolean;
  category?: string;
  sku?: string;
  unit?: string;
};

export type ProductDetailDto = ProductSummaryDto & {
  description?: string;
  highlights?: string[];
  specs?: SpecDto[];
  gallery: GalleryImageDto[];
};

export type CategoryDto = {
  name: string;
  label: string;
  /** Authored line break for the tile, e.g. `["Fruits &", "Vegetables"]`. */
  lines: string[];
  icon: string;
  productCount: number;
};

export type BrandDto = {
  id: string;
  tag: string;
  title: string;
  image: string;
  alt: string;
  background: string;
};

export type PageMetaDto = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type FacetCount = { value: string; label: string; count: number };

export type ProductPageDto = {
  items: ProductSummaryDto[];
  meta: PageMetaDto;
  facets?: {
    categories: FacetCount[];
    brands: FacetCount[];
  };
};

export type ShelfDto = {
  shelf: string;
  filters?: string[];
  items: ProductSummaryDto[];
};

export type ErrorDto = {
  error: { code: string; message: string };
};
