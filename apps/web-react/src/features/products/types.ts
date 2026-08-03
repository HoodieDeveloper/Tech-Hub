export type Category = {
  id: number;
  name: string;
};

export type Product = {
  id: number;
  category_id?: number | null;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number;
  image_url?: string | null;
  is_active?: boolean;
  category?: Category | null;
};
