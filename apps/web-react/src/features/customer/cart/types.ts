import type { Product } from '../../products/types';

export type CartItem = {
  product: Product;
  quantity: number;
};