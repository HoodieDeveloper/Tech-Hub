import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ArrowLeft,
  Gamepad2,
  Headphones,
  Heart,
  Laptop,
  Monitor,
  Package,
  ShoppingCart,
  Watch,
} from 'lucide-react';

import {
  apiGet,
} from '../../../core/api/client';

import {
  ProductImage,
} from '../../products/ProductImage';

import type {
  Product,
} from '../../products/types';

import './CustomerCatalogPage.css';

type Props = {
  onBack: () => void;

  onProductClick: (
    product: Product,
  ) => void;

  onAddToCart?: (
    product: Product,
  ) => void;

  /*
   * Wishlist
   */
  isWishlisted?: (
    productId: number,
  ) => boolean;

  onToggleWishlist?: (
    productId: number,
  ) => void;
};

type CategoryItem = {
  id: number;
  name: string;
  count: number;
};

export function CustomerCatalogPage({
  onBack,
  onProductClick,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}: Props) {
  const [
    products,
    setProducts,
  ] =
    useState<Product[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState('');

  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState<number | 'all'>(
      'all',
    );

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError('');

      try {
        const data =
          await apiGet<Product[]>(
            '/products',
            false,
          );

        setProducts(
          data,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load products.',
        );
      } finally {
        setLoading(
          false,
        );
      }
    }

    void loadProducts();
  }, []);

  /*
   * Build category list
   * from products.
   */
  const categories =
    useMemo<CategoryItem[]>(
      () => {
        const map =
          new Map<
            number,
            CategoryItem
          >();

        products.forEach(
          (product) => {
            if (
              !product.category_id ||
              !product.category
            ) {
              return;
            }

            const existing =
              map.get(
                product.category_id,
              );

            if (existing) {
              existing.count += 1;
              return;
            }

            map.set(
              product.category_id,
              {
                id:
                  product.category_id,

                name:
                  product.category
                    .name,

                count: 1,
              },
            );
          },
        );

        return Array.from(
          map.values(),
        );
      },
      [products],
    );

  /*
   * Filter products by
   * selected category.
   */
  const filteredProducts =
    useMemo(() => {
      if (
        selectedCategory ===
        'all'
      ) {
        return products;
      }

      return products.filter(
        (product) =>
          product.category_id ===
          selectedCategory,
      );
    }, [
      products,
      selectedCategory,
    ]);

  return (
    <div className="customer-catalog-page">
      {/* =====================
          TOP
      ====================== */}

      <div className="catalog-page-top">
        <button
          type="button"
          className="catalog-back-button"
          onClick={
            onBack
          }
        >
          <ArrowLeft
            size={18}
          />

          Home
        </button>

        <div>
          <h1>
            Shop by Category
          </h1>

          <p>
            Browse all TechHub
            products by category.
          </p>
        </div>
      </div>

      <div className="catalog-page-layout">
        {/* =====================
            CATEGORY SIDEBAR
        ====================== */}

        <aside className="catalog-category-sidebar">
          <h2>
            Categories
          </h2>

          <button
            type="button"
            className={
              selectedCategory ===
              'all'
                ? 'category-sidebar-item active'
                : 'category-sidebar-item'
            }
            onClick={() =>
              setSelectedCategory(
                'all',
              )
            }
          >
            <span className="category-item-left">
              <Package
                size={21}
              />

              All Products
            </span>

            <span>
              ({products.length})
            </span>
          </button>

          {categories.map(
            (category) => {
              const Icon =
                getCategoryIcon(
                  category.name,
                );

              return (
                <button
                  type="button"
                  key={
                    category.id
                  }
                  className={
                    selectedCategory ===
                    category.id
                      ? 'category-sidebar-item active'
                      : 'category-sidebar-item'
                  }
                  onClick={() =>
                    setSelectedCategory(
                      category.id,
                    )
                  }
                >
                  <span className="category-item-left">
                    <Icon
                      size={21}
                    />

                    {
                      category.name
                    }
                  </span>

                  <span>
                    (
                    {
                      category.count
                    }
                    )
                  </span>
                </button>
              );
            },
          )}
        </aside>

        {/* =====================
            PRODUCTS
        ====================== */}

        <main className="catalog-products-area">
          <div className="catalog-products-heading">
            <div>
              <h2>
                {selectedCategory ===
                'all'
                  ? 'All Products'
                  : categories.find(
                      (
                        category,
                      ) =>
                        category.id ===
                        selectedCategory,
                    )?.name ??
                    'Products'}
              </h2>

              <span>
                {
                  filteredProducts.length
                }{' '}
                products
              </span>
            </div>
          </div>

          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          {loading && (
            <div className="catalog-loading">
              Loading
              products...
            </div>
          )}

          {!loading &&
            filteredProducts.length ===
              0 && (
              <div className="catalog-empty">
                No products
                found in this
                category.
              </div>
            )}

          <div className="catalog-product-grid">
            {filteredProducts.map(
              (product) => {
                const wishlisted =
                  isWishlisted?.(
                    product.id,
                  ) ?? false;

                return (
                  <article
                    key={
                      product.id
                    }
                    className="catalog-product-card"
                  >
                    <button
                      type="button"
                      className="catalog-product-main"
                      onClick={() =>
                        onProductClick(
                          product,
                        )
                      }
                    >
                      <div className="catalog-product-image">
                        <ProductImage
                          imageUrl={
                            product.image_url
                          }
                          alt={
                            product.name
                          }
                        />
                      </div>

                      <div className="catalog-product-info">
                        <h3>
                          {
                            product.name
                          }
                        </h3>

                        <div className="catalog-product-bottom">
                          <strong>
                            $
                            {Number(
                              product.price,
                            ).toFixed(
                              2,
                            )}
                          </strong>

                          {/* REAL WISHLIST HEART */}

                          <Heart
                            size={22}
                            className={
                              wishlisted
                                ? 'catalog-heart wishlisted'
                                : 'catalog-heart'
                            }
                            fill={
                              wishlisted
                                ? 'currentColor'
                                : 'none'
                            }
                            onClick={(
                              event,
                            ) => {
                              /*
                               * Do not open
                               * Product Details.
                               */
                              event.stopPropagation();

                              onToggleWishlist?.(
                                product.id,
                              );
                            }}
                          />
                        </div>
                      </div>
                    </button>

                    {/* =====================
                        ADD TO CART
                    ====================== */}

                    <button
                      type="button"
                      className="catalog-add-cart"
                      disabled={
                        product.stock <=
                        0
                      }
                      onClick={() =>
                        onAddToCart?.(
                          product,
                        )
                      }
                    >
                      <ShoppingCart
                        size={15}
                      />

                      {product.stock >
                      0
                        ? 'Add to Cart'
                        : 'Out of Stock'}
                    </button>
                  </article>
                );
              },
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function getCategoryIcon(
  name: string,
) {
  const category =
    name.toLowerCase();

  if (
    category.includes(
      'laptop',
    ) ||
    category.includes(
      'computer',
    )
  ) {
    return Laptop;
  }

  if (
    category.includes(
      'headphone',
    ) ||
    category.includes(
      'audio',
    )
  ) {
    return Headphones;
  }

  if (
    category.includes(
      'watch',
    ) ||
    category.includes(
      'smartwatch',
    )
  ) {
    return Watch;
  }

  if (
    category.includes(
      'gaming',
    ) ||
    category.includes(
      'game',
    )
  ) {
    return Gamepad2;
  }

  if (
    category.includes(
      'monitor',
    ) ||
    category.includes(
      'display',
    )
  ) {
    return Monitor;
  }

  return Package;
}