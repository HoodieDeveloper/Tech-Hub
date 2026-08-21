import {
  useEffect,
  useMemo,
  useRef,
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

  const cartItemsRef =
    useRef<CartItem[]>([]);

  const latestQuantities =
    useRef<Map<number, number>>(
      new Map(),
    );

  const confirmedQuantities =
    useRef<Map<number, number>>(
      new Map(),
    );

  const quantityTimers =
    useRef<Map<number, number>>(
      new Map(),
    );

  const savingProducts =
    useRef<Set<number>>(
      new Set(),
    );

  const pendingProductIds =
    useRef<Set<number>>(
      new Set(),
    );

  /*
   * =========================================
   * UPDATE LOCAL CART
   * =========================================
   */
  function updateLocalCart(
    updater: (
      current: CartItem[],
    ) => CartItem[],
  ) {
    setCartItems(
      (current) => {
        const next =
          updater(current);

        cartItemsRef.current =
          next;

        return next;
      },
    );
  }

  /*
   * =========================================
   * CLEAR QUANTITY TIMER
   * =========================================
   */
  function clearQuantityTimer(
    productId: number,
  ) {
    const timer =
      quantityTimers.current.get(
        productId,
      );

    if (
      timer !== undefined
    ) {
      window.clearTimeout(
        timer,
      );

      quantityTimers.current.delete(
        productId,
      );
    }
  }

  /*
   * =========================================
   * SAVE QUANTITY
   * =========================================
   */
  async function saveQuantity(
    productId: number,
  ) {
    if (
      savingProducts.current.has(
        productId,
      )
    ) {
      scheduleQuantitySave(
        productId,
        250,
      );

      return;
    }

    const quantityToSave =
      latestQuantities.current.get(
        productId,
      );

    if (
      quantityToSave === undefined
    ) {
      return;
    }

    savingProducts.current.add(
      productId,
    );

    try {
      const response =
        await apiPut<CartItemResponse>(
          `/cart/${productId}`,
          {
            quantity:
              quantityToSave,
          },
        );

      const saved =
        response.cart_item;

      confirmedQuantities.current.set(
        productId,
        saved.quantity,
      );

      if (
        latestQuantities.current.get(
          productId,
        ) === quantityToSave
      ) {
        updateLocalCart(
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
      }
    } catch (err) {
      const latestQuantity =
        latestQuantities.current.get(
          productId,
        );

      if (
        latestQuantity ===
        quantityToSave
      ) {
        const confirmedQuantity =
          confirmedQuantities.current.get(
            productId,
          );

        if (
          confirmedQuantity !==
          undefined
        ) {
          latestQuantities.current.set(
            productId,
            confirmedQuantity,
          );

          updateLocalCart(
            (current) =>
              current.map(
                (item) =>
                  item.product.id ===
                  productId
                    ? {
                        ...item,

                        quantity:
                          confirmedQuantity,
                      }
                    : item,
              ),
          );
        }

        setCartError(
          err instanceof Error
            ? err.message
            : 'Unable to update cart.',
        );
      }
    } finally {
      savingProducts.current.delete(
        productId,
      );

      const newestQuantity =
        latestQuantities.current.get(
          productId,
        );

      const confirmedQuantity =
        confirmedQuantities.current.get(
          productId,
        );

      if (
        newestQuantity !==
          undefined &&
        newestQuantity !==
          confirmedQuantity
      ) {
        scheduleQuantitySave(
          productId,
          250,
        );
      }
    }
  }

  /*
   * =========================================
   * DEBOUNCE QUANTITY SAVE
   * =========================================
   */
  function scheduleQuantitySave(
    productId: number,
    delay = 350,
  ) {
    clearQuantityTimer(
      productId,
    );

    const timer =
      window.setTimeout(
        () => {
          quantityTimers.current.delete(
            productId,
          );

          void saveQuantity(
            productId,
          );
        },
        delay,
      );

    quantityTimers.current.set(
      productId,
      timer,
    );
  }

  /*
   * =========================================
   * LOAD CUSTOMER CART
   * =========================================
   *
   * Cart is useful, but it does not
   * need to compete with the first
   * Home/products request.
   *
   * So we let Home start first,
   * then load Cart quietly.
   */
  useEffect(() => {
    quantityTimers.current.forEach(
      (timer) => {
        window.clearTimeout(
          timer,
        );
      },
    );

    quantityTimers.current.clear();

    latestQuantities.current.clear();

    confirmedQuantities.current.clear();

    if (
      !user ||
      user.role !== 'customer'
    ) {
      setCartItems(
        [],
      );

      cartItemsRef.current =
        [];

      return;
    }

    let active = true;

    async function loadCart() {
      if (!active) {
        return;
      }

      setLoadingCart(
        true,
      );

      setCartError(
        '',
      );

      try {
        const response =
          await apiGet<CartResponse>(
            '/cart',
          );

        if (!active) {
          return;
        }

        const loadedItems =
          response.cart_items.map(
            (item) => ({
              product:
                item.product,

              quantity:
                item.quantity,
            }),
          );

        setCartItems(
          loadedItems,
        );

        cartItemsRef.current =
          loadedItems;

        response.cart_items.forEach(
          (item) => {
            latestQuantities.current.set(
              item.product_id,
              item.quantity,
            );

            confirmedQuantities.current.set(
              item.product_id,
              item.quantity,
            );
          },
        );
      } catch (err) {
        if (!active) {
          return;
        }

        setCartError(
          err instanceof Error
            ? err.message
            : 'Unable to load cart.',
        );
      } finally {
        if (active) {
          setLoadingCart(
            false,
          );
        }
      }
    }

    /*
     * Products start immediately.
     * Wishlist starts after ~500ms.
     * Cart starts after ~900ms.
     */
    const timer =
      window.setTimeout(
        () => {
          void loadCart();
        },
        900,
      );

    return () => {
      active = false;

      window.clearTimeout(
        timer,
      );
    };
  }, [user]);

  /*
   * =========================================
   * CLEAN UP
   * =========================================
   */
  useEffect(() => {
    return () => {
      quantityTimers.current.forEach(
        (timer) => {
          window.clearTimeout(
            timer,
          );
        },
      );

      quantityTimers.current.clear();
    };
  }, []);

  /*
   * =========================================
   * CART COUNT
   * =========================================
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
   * =========================================
   * ADD TO CART
   * =========================================
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

    if (
      pendingProductIds.current.has(
        product.id,
      )
    ) {
      return false;
    }

    pendingProductIds.current.add(
      product.id,
    );

    setCartError(
      '',
    );

    const previousItems = [
      ...cartItemsRef.current,
    ];

    const existingItem =
      cartItemsRef.current.find(
        (item) =>
          item.product.id ===
          product.id,
      );

    const optimisticQuantity =
      existingItem
        ? Math.min(
            existingItem.quantity +
              quantity,
            product.stock,
          )
        : Math.min(
            quantity,
            product.stock,
          );

    updateLocalCart(
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
              product,
              quantity:
                optimisticQuantity,
            },
          ];
        }

        return current.map(
          (item) =>
            item.product.id ===
            product.id
              ? {
                  ...item,

                  quantity:
                    optimisticQuantity,
                }
              : item,
        );
      },
    );

    latestQuantities.current.set(
      product.id,
      optimisticQuantity,
    );

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

      latestQuantities.current.set(
        product.id,
        saved.quantity,
      );

      confirmedQuantities.current.set(
        product.id,
        saved.quantity,
      );

      updateLocalCart(
        (current) =>
          current.map(
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
          ),
      );

      return true;
    } catch (err) {
      setCartItems(
        previousItems,
      );

      cartItemsRef.current =
        previousItems;

      if (existingItem) {
        latestQuantities.current.set(
          product.id,
          existingItem.quantity,
        );
      } else {
        latestQuantities.current.delete(
          product.id,
        );
      }

      setCartError(
        err instanceof Error
          ? err.message
          : 'Unable to add product to cart.',
      );

      return false;
    } finally {
      pendingProductIds.current.delete(
        product.id,
      );
    }
  }

  /*
   * =========================================
   * UPDATE QUANTITY
   * =========================================
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

    const currentItem =
      cartItemsRef.current.find(
        (item) =>
          item.product.id ===
          productId,
      );

    if (!currentItem) {
      return false;
    }

    if (
      quantity < 1 ||
      quantity >
        currentItem.product.stock
    ) {
      return false;
    }

    setCartError(
      '',
    );

    /*
     * UI changes immediately.
     */
    updateLocalCart(
      (current) =>
        current.map(
          (item) =>
            item.product.id ===
            productId
              ? {
                  ...item,
                  quantity,
                }
              : item,
        ),
    );

    latestQuantities.current.set(
      productId,
      quantity,
    );

    /*
     * Save after user stops clicking.
     */
    scheduleQuantitySave(
      productId,
      350,
    );

    return true;
  }

  /*
   * =========================================
   * REMOVE PRODUCT
   * =========================================
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

    if (
      pendingProductIds.current.has(
        productId,
      )
    ) {
      return false;
    }

    const removedItem =
      cartItemsRef.current.find(
        (item) =>
          item.product.id ===
          productId,
      );

    if (!removedItem) {
      return false;
    }

    pendingProductIds.current.add(
      productId,
    );

    clearQuantityTimer(
      productId,
    );

    setCartError(
      '',
    );

    updateLocalCart(
      (current) =>
        current.filter(
          (item) =>
            item.product.id !==
            productId,
        ),
    );

    latestQuantities.current.delete(
      productId,
    );

    try {
      await apiDelete(
        `/cart/${productId}`,
      );

      confirmedQuantities.current.delete(
        productId,
      );

      return true;
    } catch (err) {
      updateLocalCart(
        (current) => {
          const exists =
            current.some(
              (item) =>
                item.product.id ===
                productId,
            );

          if (exists) {
            return current;
          }

          return [
            ...current,
            removedItem,
          ];
        },
      );

      latestQuantities.current.set(
        productId,
        removedItem.quantity,
      );

      setCartError(
        err instanceof Error
          ? err.message
          : 'Unable to remove product from cart.',
      );

      return false;
    } finally {
      pendingProductIds.current.delete(
        productId,
      );
    }
  }

  /*
   * =========================================
   * CLEAR CART
   * =========================================
   */
  async function clearCart() {
    quantityTimers.current.forEach(
      (timer) => {
        window.clearTimeout(
          timer,
        );
      },
    );

    quantityTimers.current.clear();

    if (
      !user ||
      user.role !== 'customer'
    ) {
      setCartItems(
        [],
      );

      cartItemsRef.current =
        [];

      latestQuantities.current.clear();

      confirmedQuantities.current.clear();

      return false;
    }

    setCartError(
      '',
    );

    const previousItems = [
      ...cartItemsRef.current,
    ];

    setCartItems(
      [],
    );

    cartItemsRef.current =
      [];

    latestQuantities.current.clear();

    try {
      await apiDelete(
        '/cart',
      );

      confirmedQuantities.current.clear();

      return true;
    } catch (err) {
      setCartItems(
        previousItems,
      );

      cartItemsRef.current =
        previousItems;

      previousItems.forEach(
        (item) => {
          latestQuantities.current.set(
            item.product.id,
            item.quantity,
          );
        },
      );

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