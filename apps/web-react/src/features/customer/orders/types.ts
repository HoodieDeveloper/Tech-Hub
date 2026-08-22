export type CustomerOrderProduct = {
  id: number;
  image_url: string | null;
};

export type CustomerOrderItem = {
  id: number;
  product_id: number | null;
  product_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
  product?: CustomerOrderProduct | null;
};

export type CustomerOrderResult = {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method?: string | null;
  shipping_address?: string;
  shipping_latitude?: string | number | null;
  shipping_longitude?: string | number | null;
  subtotal: string;
  delivery_fee: string;
  total: string;
  currency: string;
  created_at?: string;
  items: CustomerOrderItem[];
};
