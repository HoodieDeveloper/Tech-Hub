import {
  useEffect,
  useMemo,
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
    loadingWishlist,
    setLoadingWishlist,
  ] =
    useState(false);

  const [
    wishlistError,
    setWishlistError,
  ] =
    useState('');

  /*
   * Load saved wishlist
   * whenever customer logs in.
   */
  useEffect(() => {
    if (
      !user ||
      user.role !== 'customer'
    ) {
      setWishlistItems(
        [],
      );

      return;
    }

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

        setWishlistItems(
          response.wishlist,
        );
      } catch (err) {
        setWishlistError(
          err instanceof Error
            ? err.message
            : 'Unable to load wishlist.',
        );
      } finally {
        setLoadingWishlist(
          false,
        );
      }
    }

    void loadWishlist();
  }, [user]);

  /*
   * Product IDs.
   */
  const wishlistProductIds =
    useMemo(
      () =>
        wishlistItems.map(
          (item) =>
            item.product_id,
        ),
      [wishlistItems],
    );

  /*
   * Actual products used
   * by Wishlist page.
   */
  const wishlistProducts =
    useMemo(
      () =>
        wishlistItems
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
      [wishlistItems],
    );

  function isWishlisted(
    productId: number,
  ) {
    return wishlistProductIds.includes(
      productId,
    );
  }

  /*
   * Add/remove wishlist.
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

    setWishlistError(
      '',
    );

    const alreadyWishlisted =
      isWishlisted(
        productId,
      );

    try {
      /*
       * REMOVE
       */
      if (
        alreadyWishlisted
      ) {
        await apiDelete(
          `/wishlist/${productId}`,
        );

        setWishlistItems(
          (current) =>
            current.filter(
              (item) =>
                item.product_id !==
                productId,
            ),
        );

        return true;
      }

      /*
       * ADD
       */
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
      setWishlistError(
        err instanceof Error
          ? err.message
          : 'Unable to update wishlist.',
      );

      return false;
    }
  }

  return {
    /*
     * Full data
     */
    wishlistItems,
    wishlistProducts,

    /*
     * IDs / count
     */
    wishlistProductIds,

    wishlistCount:
      wishlistItems.length,

    /*
     * Status
     */
    loadingWishlist,
    wishlistError,

    /*
     * Actions
     */
    isWishlisted,
    toggleWishlist,
  };
}