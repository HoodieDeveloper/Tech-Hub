import {
  useEffect,
  useState,
} from 'react';

import {
  apiGet,
} from '../../core/api/client';

import type {
  Product,
} from './types';

/*
 * =========================================
 * SHARED PRODUCT CACHE
 * =========================================
 *
 * These variables live outside React
 * components.
 *
 * That means they are NOT destroyed when
 * Home or Catalog is unmounted.
 */
let cachedProducts:
  Product[] | null = null;

let productRequest:
  Promise<Product[]> | null =
    null;

/*
 * =========================================
 * LOAD PRODUCTS ONCE
 * =========================================
 */
async function fetchProducts() {
  /*
   * Products already loaded.
   *
   * Return immediately without
   * calling the API again.
   */
  if (cachedProducts) {
    return cachedProducts;
  }

  /*
   * If another page is already
   * fetching products, reuse the
   * same request instead of sending
   * another GET /products.
   */
  if (productRequest) {
    return productRequest;
  }

  productRequest =
    apiGet<Product[]>(
      '/products',
      false,
    )
      .then((products) => {
        cachedProducts =
          products;

        return products;
      })
      .finally(() => {
        productRequest =
          null;
      });

  return productRequest;
}

/*
 * =========================================
 * SHARED PRODUCTS HOOK
 * =========================================
 */
export function useProducts() {
  const [
    products,
    setProducts,
  ] = useState<Product[]>(
    () =>
      cachedProducts ?? [],
  );

  const [
    loadingProducts,
    setLoadingProducts,
  ] = useState(
    () =>
      cachedProducts === null,
  );

  const [
    productsError,
    setProductsError,
  ] = useState('');

  useEffect(() => {
    /*
     * Already cached.
     *
     * No network request needed.
     */
    if (cachedProducts) {
      setProducts(
        cachedProducts,
      );

      setLoadingProducts(
        false,
      );

      return;
    }

    let active = true;

    async function loadProducts() {
      setLoadingProducts(
        true,
      );

      setProductsError(
        '',
      );

      try {
        const data =
          await fetchProducts();

        if (!active) {
          return;
        }

        setProducts(
          data,
        );
      } catch (err) {
        if (!active) {
          return;
        }

        setProductsError(
          err instanceof Error
            ? err.message
            : 'Unable to load products.',
        );
      } finally {
        if (active) {
          setLoadingProducts(
            false,
          );
        }
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, []);

  return {
    products,
    loadingProducts,
    productsError,
  };
}