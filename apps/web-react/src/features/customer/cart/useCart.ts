import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  type AuthUser,
} from '../../../core/api/client';

import type {
  Product,
} from '../../products/types';

import type {
  CartItem,
} from './types';

type ApiCartItem = {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  product: Product;
};

type CartResponse = {
  cart_items: ApiCartItem[];
};

type CartItemResponse = {
  message: string;
  cart_item: ApiCartItem;
};

export function useCart(
  user: AuthUser | null,
) {
  const [
    cartItems,
    setCartItems,
  ] = useState<CartItem[]>([]);

  const [
    loadingCart,
    setLoadingCart,
  ] = useState(false);

  const [
    cartError,
    setCartError,
  ] = useState('');

  /*
   * Load customer's saved cart
   * after login.
   */
  useEffect(() => {
    if (
      !user ||
      user.role !== 'customer'
    ) {
      setCartItems([]);
      return;
    }

    async function loadCart() {
      setLoadingCart(true);
      setCartError('');

      try {
        const response =
          await apiGet<CartResponse>(
            '/cart',
          );

        setCartItems(
          response.cart_items.map(
            (item) => ({
              product:
                item.product,

              quantity:
                item.quantity,
            }),
          ),
        );
      } catch (err) {
        setCartError(
          err instanceof Error
            ? err.message
            : 'Unable to load cart.',
        );
      } finally {
        setLoadingCart(false);
      }
    }

    void loadCart();
  }, [user]);

  /*
   * Total quantity for badge.
   */
  const cartCount =
    useMemo(
      () =>
        cartItems.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.quantity,
          0,
        ),
      [cartItems],
    );

  /*
   * Add product.
   */
async function addToCart(
  product: Product,
  quantity = 1,
) {
  if (
    !user ||
    user.role !== 'customer'
  ) {
    return false;
  }

  setCartError('');

  try {
    const response =
      await apiPost<CartItemResponse>(
        `/cart/${product.id}`,
        {
          quantity,
        },
      );

    const saved =
      response.cart_item;

    setCartItems(
      (current) => {
        const exists =
          current.some(
            (item) =>
              item.product.id ===
              product.id,
          );

        if (!exists) {
          return [
            ...current,
            {
              product:
                saved.product,

              quantity:
                saved.quantity,
            },
          ];
        }

        return current.map(
          (item) =>
            item.product.id ===
            product.id
              ? {
                  product:
                    saved.product,

                  quantity:
                    saved.quantity,
                }
              : item,
        );
      },
    );

    return true;
  } catch (err) {
    setCartError(
      err instanceof Error
        ? err.message
        : 'Unable to add product to cart.',
    );

    return false;
  }
}

  /*
   * Set exact quantity.
   */
  async function updateCartQuantity(
    productId: number,
    quantity: number,
  ) {
    if (
      !user ||
      user.role !== 'customer'
    ) {
      return false;
    }

    setCartError('');

    try {
      const response =
        await apiPut<CartItemResponse>(
          `/cart/${productId}`,
          {
            quantity,
          },
        );

      const saved =
        response.cart_item;

      setCartItems(
        (current) =>
          current.map(
            (item) =>
              item.product.id ===
              productId
                ? {
                    product:
                      saved.product,

                    quantity:
                      saved.quantity,
                  }
                : item,
          ),
      );

      return true;
    } catch (err) {
      setCartError(
        err instanceof Error
          ? err.message
          : 'Unable to update cart.',
      );

      return false;
    }
  }

  /*
   * Remove one product.
   */
  async function removeFromCart(
    productId: number,
  ) {
    if (
      !user ||
      user.role !== 'customer'
    ) {
      return false;
    }

    setCartError('');

    try {
      await apiDelete(
        `/cart/${productId}`,
      );

      setCartItems(
        (current) =>
          current.filter(
            (item) =>
              item.product.id !==
              productId,
          ),
      );

      return true;
    } catch (err) {
      setCartError(
        err instanceof Error
          ? err.message
          : 'Unable to remove product from cart.',
      );

      return false;
    }
  }

  /*
   * Clear whole cart.
   */
  async function clearCart() {
    if (
      !user ||
      user.role !== 'customer'
    ) {
      setCartItems([]);
      return false;
    }

    setCartError('');

    try {
      await apiDelete(
        '/cart',
      );

      setCartItems([]);

      return true;
    } catch (err) {
      setCartError(
        err instanceof Error
          ? err.message
          : 'Unable to clear cart.',
      );

      return false;
    }
  }

  return {
    cartItems,
    cartCount,
    loadingCart,
    cartError,

    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
  };
}