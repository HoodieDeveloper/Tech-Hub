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
  type AuthUser,
} from '../../../core/api/client';

import type {
  WishlistAddResponse,
  WishlistItem,
  WishlistResponse,
} from './types';

export function useWishlist(
  user: AuthUser | null,
) {
  const [
    wishlistItems,
    setWishlistItems,
  ] =
    useState<WishlistItem[]>([]);

  const [
    wishlistProductIds,
    setWishlistProductIds,
  ] =
    useState<number[]>([]);

  const [
    loadingWishlist,
    setLoadingWishlist,
  ] =
    useState(false);

  const [
    wishlistError,
    setWishlistError,
  ] =
    useState('');

  const pendingProductIds =
    useRef<Set<number>>(
      new Set(),
    );

  /*
   * =========================================
   * LOAD SAVED WISHLIST
   * =========================================
   *
   * Wishlist is NOT critical for the
   * first screen.
   *
   * Let the Home page start first,
   * then fetch Wishlist quietly.
   */
  useEffect(() => {
    if (
      !user ||
      user.role !== 'customer'
    ) {
      setWishlistItems(
        [],
      );

      setWishlistProductIds(
        [],
      );

      return;
    }

    let active = true;

    async function loadWishlist() {
      setLoadingWishlist(
        true,
      );

      setWishlistError(
        '',
      );

      try {
        const response =
          await apiGet<WishlistResponse>(
            '/wishlist',
          );

        if (!active) {
          return;
        }

        setWishlistItems(
          response.wishlist,
        );

        setWishlistProductIds(
          response.wishlist.map(
            (item) =>
              item.product_id,
          ),
        );
      } catch (err) {
        if (!active) {
          return;
        }

        setWishlistError(
          err instanceof Error
            ? err.message
            : 'Unable to load wishlist.',
        );
      } finally {
        if (active) {
          setLoadingWishlist(
            false,
          );
        }
      }
    }

    /*
     * Give the Home page/product request
     * a head start before Wishlist begins.
     */
    const timer =
      window.setTimeout(
        () => {
          void loadWishlist();
        },
        500,
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
   * PRODUCTS USED BY WISHLIST PAGE
   * =========================================
   */
  const wishlistProducts =
    useMemo(
      () =>
        wishlistItems
          .filter(
            (item) =>
              wishlistProductIds.includes(
                item.product_id,
              ),
          )
          .map(
            (item) =>
              item.product,
          )
          .filter(
            (product) =>
              Boolean(
                product,
              ),
          ),
      [
        wishlistItems,
        wishlistProductIds,
      ],
    );

  /*
   * =========================================
   * CHECK WISHLIST
   * =========================================
   */
  function isWishlisted(
    productId: number,
  ) {
    return wishlistProductIds.includes(
      productId,
    );
  }

  /*
   * =========================================
   * ADD / REMOVE WISHLIST
   * =========================================
   */
  async function toggleWishlist(
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

    pendingProductIds.current.add(
      productId,
    );

    setWishlistError(
      '',
    );

    const alreadyWishlisted =
      wishlistProductIds.includes(
        productId,
      );

    /*
     * =========================================
     * REMOVE
     * =========================================
     */
    if (
      alreadyWishlisted
    ) {
      const removedItem =
        wishlistItems.find(
          (item) =>
            item.product_id ===
            productId,
        );

      /*
       * UI changes immediately.
       */
      setWishlistProductIds(
        (current) =>
          current.filter(
            (id) =>
              id !== productId,
          ),
      );

      setWishlistItems(
        (current) =>
          current.filter(
            (item) =>
              item.product_id !==
              productId,
          ),
      );

      try {
        await apiDelete(
          `/wishlist/${productId}`,
        );

        return true;
      } catch (err) {
        /*
         * Rollback.
         */
        setWishlistProductIds(
          (current) =>
            current.includes(
              productId,
            )
              ? current
              : [
                  ...current,
                  productId,
                ],
        );

        if (
          removedItem
        ) {
          setWishlistItems(
            (current) => {
              const exists =
                current.some(
                  (item) =>
                    item.product_id ===
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
        }

        setWishlistError(
          err instanceof Error
            ? err.message
            : 'Unable to remove product from wishlist.',
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
     * ADD
     * =========================================
     */

    /*
     * Heart/count changes immediately.
     */
    setWishlistProductIds(
      (current) =>
        current.includes(
          productId,
        )
          ? current
          : [
              ...current,
              productId,
            ],
    );

    try {
      const response =
        await apiPost<WishlistAddResponse>(
          `/wishlist/${productId}`,
          {},
        );

      setWishlistItems(
        (current) => {
          const exists =
            current.some(
              (item) =>
                item.product_id ===
                productId,
            );

          if (exists) {
            return current;
          }

          return [
            ...current,
            response.wishlist_item,
          ];
        },
      );

      return true;
    } catch (err) {
      /*
       * Rollback.
       */
      setWishlistProductIds(
        (current) =>
          current.filter(
            (id) =>
              id !== productId,
          ),
      );

      setWishlistError(
        err instanceof Error
          ? err.message
          : 'Unable to add product to wishlist.',
      );

      return false;
    } finally {
      pendingProductIds.current.delete(
        productId,
      );
    }
  }

  return {
    wishlistItems,
    wishlistProducts,

    wishlistProductIds,

    wishlistCount:
      wishlistProductIds.length,

    loadingWishlist,
    wishlistError,

    isWishlisted,
    toggleWishlist,
  };
}