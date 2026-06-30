export type Category = {
  id: number;
  name: string;
};

export type Product = {
  id: number;
  category_id?: number;
  name: string;
  description?: string;
  price: number | string;
  stock: number;
  image_url?: string;
  is_active?: boolean;
  category?: Category;
};
