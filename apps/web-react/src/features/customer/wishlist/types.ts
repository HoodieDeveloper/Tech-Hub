import type { Product } from '../../products/types';

export type WishlistItem = {
  id: number;
  user_id: number;
  product_id: number;
  product: Product;
  created_at: string;
  updated_at: string;
};

export type WishlistResponse = {
  wishlist: WishlistItem[];
};

export type WishlistAddResponse = {
  message: string;
  wishlist_item: WishlistItem;
};