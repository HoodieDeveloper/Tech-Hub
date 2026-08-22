import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react';

import {
  apiGet,
  type AuthUser,
} from '../../core/api/client';

import {
  CustomerFooter,
} from '../customer/layout/CustomerFooter';

import {
  CustomerHeader,
} from '../customer/layout/CustomerHeader';

import {
  CustomerProductCard,
} from '../customer/layout/CustomerProductCard';

import type {
  Product,
} from '../products/types';

import {
  useProducts,
} from '../products/useProducts';

import {
  ScrollReveal,
} from './ScrollReveal';

import banner1 from './assets/banner-1.png';
import banner2 from './assets/banner-2.png';
import banner3 from './assets/banner-3.png';

import './Storefront.css';

/*
 * =========================================
 * PROPS
 * =========================================
 */

type Props = {
  user: AuthUser | null;

  onLogin: () => void;

  onWishlistClick?: () => void;

  onOrdersClick?: () => void;

  onAdminDashboard: () => void;

  onProductClick: (
    product: Product,
  ) => void;

  onViewAll?: () => void;

  /*
   * Keep this prop because App.tsx
   * currently passes it.
   *
   * Logout is now handled from
   * the Profile page.
   */
  onLogout: () => void;

  onProfileClick?: () => void;

  /*
   * Cart
   */
  cartCount?: number;

  onCartClick?: () => void;

  /*
   * Wishlist
   */
  wishlistCount?: number;

  isWishlisted?: (
    productId: number,
  ) => boolean;

  onToggleWishlist?: (
    productId: number,
  ) => void;
};

/*
 * =========================================
 * HERO BANNERS
 * =========================================
 */

const banners = [
  banner1,
  banner2,
  banner3,
];

/*
 * =========================================
 * BEST SELLERS
 * =========================================
 */

type BestSellerProduct =
  Product & {
    sold_quantity: number;
  };

const BEST_SELLERS_CACHE_KEY =
  'techhub_best_sellers_cache';

function readBestSellersCache():
  BestSellerProduct[] {
  try {
    const raw =
      sessionStorage.getItem(
        BEST_SELLERS_CACHE_KEY,
      );

    if (!raw) {
      return [];
    }

    return JSON.parse(
      raw,
    ) as BestSellerProduct[];
  } catch {
    return [];
  }
}

/*
 * =========================================
 * PUBLIC STOREFRONT
 * =========================================
 */

export function PublicStorefront({
  user,
  onLogin,
  onAdminDashboard,
  onProductClick,
  onViewAll,
  onWishlistClick,
  onOrdersClick,
  onProfileClick,
  cartCount = 0,
  onCartClick,
  wishlistCount = 0,
  isWishlisted,
  onToggleWishlist,
}: Props) {
  /*
   * =========================================
   * SHARED PRODUCTS
   * =========================================
   */

  const {
    products,
    loadingProducts,
    productsError,
  } = useProducts();

  /*
   * =========================================
   * BEST SELLERS
   * =========================================
   */

  const [
    bestSellers,
    setBestSellers,
  ] =
    useState<BestSellerProduct[]>(
      readBestSellersCache,
    );

  const [
    loadingBestSellers,
    setLoadingBestSellers,
  ] =
    useState(false);

  const [
    bestSellersError,
    setBestSellersError,
  ] =
    useState('');

  /*
   * =========================================
   * SEARCH
   * =========================================
   */

  const [
    search,
    setSearch,
  ] =
    useState('');

  /*
   * =========================================
   * HERO SLIDER
   * =========================================
   */

  const [
    currentBanner,
    setCurrentBanner,
  ] =
    useState(0);

  const [
    sliderPaused,
    setSliderPaused,
  ] =
    useState(false);

  /*
   * =========================================
   * START HOME AT TOP
   * =========================================
   */

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }, []);

  /*
   * =========================================
   * LOAD BEST SELLERS
   * =========================================
   */

  useEffect(() => {
    const cached =
      readBestSellersCache();

    if (
      cached.length > 0
    ) {
      setBestSellers(
        cached,
      );

      return;
    }

    setLoadingBestSellers(
      true,
    );

    setBestSellersError(
      '',
    );

    apiGet<BestSellerProduct[]>(
      '/products/best-sellers',
    )
      .then((data) => {
        setBestSellers(
          data,
        );

        sessionStorage.setItem(
          BEST_SELLERS_CACHE_KEY,
          JSON.stringify(
            data,
          ),
        );
      })
      .catch(
        (err: unknown) => {
          setBestSellersError(
            err instanceof Error
              ? err.message
              : 'Unable to load best sellers.',
          );
        },
      )
      .finally(() => {
        setLoadingBestSellers(
          false,
        );
      });
  }, []);

  /*
   * =========================================
   * HERO AUTO SLIDER
   * =========================================
   */

  useEffect(() => {
    if (
      sliderPaused
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setCurrentBanner(
            (current) =>
              current ===
              banners.length - 1
                ? 0
                : current + 1,
          );
        },
        4000,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [
    sliderPaused,
  ]);

  /*
   * =========================================
   * SEARCH NORMAL PRODUCTS
   * =========================================
   */

  const filteredProducts =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return products;
      }

      return products.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(keyword) ||
          (
            product.description ??
            ''
          )
            .toLowerCase()
            .includes(keyword),
      );
    }, [
      products,
      search,
    ]);

  /*
   * =========================================
   * SEARCH BEST SELLERS
   * =========================================
   */

  const filteredBestSellers =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return bestSellers;
      }

      return bestSellers.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(keyword) ||
          (
            product.description ??
            ''
          )
            .toLowerCase()
            .includes(keyword),
      );
    }, [
      bestSellers,
      search,
    ]);

  /*
   * =========================================
   * NEWEST 4 PRODUCTS
   * =========================================
   */

  const visibleProducts =
    filteredProducts.slice(
      0,
      4,
    );

  /*
   * =========================================
   * HERO CONTROLS
   * =========================================
   */

  function previousBanner() {
    setCurrentBanner(
      (current) =>
        current === 0
          ? banners.length - 1
          : current - 1,
    );
  }

  function nextBanner() {
    setCurrentBanner(
      (current) =>
        current ===
        banners.length - 1
          ? 0
          : current + 1,
    );
  }

  /*
   * =========================================
   * WISHLIST
   * =========================================
   */

  function handleWishlistClick(
    productId: number,
  ) {
    if (!user) {
      onLogin();

      return;
    }

    if (
      user.role !==
      'customer'
    ) {
      return;
    }

    onToggleWishlist?.(
      productId,
    );
  }

  return (
    <div className="storefront-page techhub-page-enter">

      {/* =====================================
          REUSABLE CUSTOMER HEADER
      ====================================== */}

      <CustomerHeader
        user={
          user
        }

        search={
          search
        }

        onSearchChange={
          setSearch
        }

        wishlistCount={
          wishlistCount
        }

        cartCount={
          cartCount
        }

        onHomeClick={() => {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth',
          });
        }}

        onViewAll={
          onViewAll
        }

        onWishlistClick={
          onWishlistClick
        }

        onOrdersClick={
          onOrdersClick
        }

        onProfileClick={
          onProfileClick
        }

        onCartClick={
          onCartClick
        }

        onLogin={
          onLogin
        }

        onAdminDashboard={
          onAdminDashboard
        }
      />

      {/* =====================================
          MAIN CONTENT
      ====================================== */}

      <main className="storefront-container storefront-main">

        {/* =====================================
            HERO
        ====================================== */}

        <ScrollReveal>
          <section
            className="hero-slider"
            onMouseEnter={() =>
              setSliderPaused(
                true,
              )
            }
            onMouseLeave={() =>
              setSliderPaused(
                false,
              )
            }
          >
            <div className="hero-slider-images">
              {banners.map(
                (
                  banner,
                  index,
                ) => (
                  <img
                    key={
                      banner
                    }
                    src={
                      banner
                    }
                    alt={`TechHub promotion ${
                      index + 1
                    }`}
                    className={`hero-slide ${
                      index ===
                      currentBanner
                        ? 'active'
                        : ''
                    }`}
                  />
                ),
              )}
            </div>

            <button
              type="button"
              className="hero-arrow hero-arrow-left"
              onClick={
                previousBanner
              }
              aria-label="Previous banner"
            >
              <ChevronLeft
                size={22}
              />
            </button>

            <button
              type="button"
              className="hero-arrow hero-arrow-right"
              onClick={
                nextBanner
              }
              aria-label="Next banner"
            >
              <ChevronRight
                size={22}
              />
            </button>

            <div className="hero-dots">
              {banners.map(
                (
                  _,
                  index,
                ) => (
                  <button
                    key={
                      index
                    }
                    type="button"
                    className={
                      index ===
                      currentBanner
                        ? 'hero-dot active'
                        : 'hero-dot'
                    }
                    onClick={() =>
                      setCurrentBanner(
                        index,
                      )
                    }
                    aria-label={`Banner ${
                      index + 1
                    }`}
                  />
                ),
              )}
            </div>
          </section>
        </ScrollReveal>

        {/* =====================================
            BEST SELLERS
        ====================================== */}

        <section className="best-sales-section">

          <ScrollReveal>
            <div className="best-sales-heading">
              <h2>
                Best Sellers
              </h2>
            </div>
          </ScrollReveal>

          {/* ERROR */}

          {bestSellersError && (
            <ScrollReveal>
              <div className="alert error">
                {
                  bestSellersError
                }
              </div>
            </ScrollReveal>
          )}

          {/* LOADING */}

          {loadingBestSellers && (
            <ScrollReveal>
              <div className="loading-card">
                Loading best sellers...
              </div>
            </ScrollReveal>
          )}

          {/* EMPTY */}

          {!loadingBestSellers &&
            !bestSellersError &&
            filteredBestSellers
              .length === 0 && (
              <ScrollReveal>
                <div className="empty-state">
                  No best sellers found.
                </div>
              </ScrollReveal>
            )}

          {/* PRODUCTS */}

          {!loadingBestSellers &&
            filteredBestSellers.length >
              0 && (
              <div className="public-product-grid">

                {filteredBestSellers.map(
                  (
                    product,
                    index,
                  ) => {
                    const wishlisted =
                      isWishlisted?.(
                        product.id,
                      ) ?? false;

                    return (
                      <ScrollReveal
                        key={
                          product.id
                        }
                        delay={
                          index * 120
                        }
                      >
                        <CustomerProductCard
                          product={
                            product
                          }
                          onProductClick={
                            onProductClick
                          }
                          isWishlisted={
                            wishlisted
                          }
                          onToggleWishlist={
                            handleWishlistClick
                          }
                          showCategoryLabel
                          imageHeight={225}
                          cardClassName="storefront-product-card"
                        />
                      </ScrollReveal>
                    );
                  },
                )}
              </div>
            )}
        </section>

        {/* =====================================
            NEW PRODUCTS
        ====================================== */}

        <section className="best-sales-section">

          <ScrollReveal>
            <div className="best-sales-heading">
              <h2>
                New Products
              </h2>
            </div>
          </ScrollReveal>

          {/* ERROR */}

          {productsError && (
            <ScrollReveal>
              <div className="alert error">
                {
                  productsError
                }
              </div>
            </ScrollReveal>
          )}

          {/* LOADING */}

          {loadingProducts && (
            <ScrollReveal>
              <div className="loading-card">
                Loading products...
              </div>
            </ScrollReveal>
          )}

          {/* EMPTY */}

          {!loadingProducts &&
            filteredProducts
              .length === 0 && (
              <ScrollReveal>
                <div className="empty-state">
                  No products found.
                </div>
              </ScrollReveal>
            )}

          {/* PRODUCTS */}

          {!loadingProducts &&
            visibleProducts.length >
              0 && (
              <div className="public-product-grid">

                {visibleProducts.map(
                  (
                    product,
                    index,
                  ) => {
                    const wishlisted =
                      isWishlisted?.(
                        product.id,
                      ) ?? false;

                    return (
                      <ScrollReveal
                        key={
                          product.id
                        }
                        delay={
                          index * 120
                        }
                      >
                        <CustomerProductCard
                          product={
                            product
                          }
                          onProductClick={
                            onProductClick
                          }
                          isWishlisted={
                            wishlisted
                          }
                          onToggleWishlist={
                            handleWishlistClick
                          }
                          showCategoryLabel
                          imageHeight={225}
                          cardClassName="storefront-product-card"
                        />
                      </ScrollReveal>
                    );
                  },
                )}
              </div>
            )}
        </section>

        {/* =====================================
            BENEFITS
        ====================================== */}

        <ScrollReveal
          className="store-benefits"
        >

          {/* FREE SHIPPING */}

          <div className="benefit-item">
            <Truck
              size={25}
            />

            <div>
              <strong>
                Free Shipping
              </strong>

              <span>
                On orders over $49
              </span>
            </div>
          </div>

          {/* SECURE PAYMENT */}

          <div className="benefit-item">
            <ShieldCheck
              size={25}
            />

            <div>
              <strong>
                Secure Payment
              </strong>

              <span>
                100% encrypted checkout
              </span>
            </div>
          </div>

          {/* RETURNS */}

          <div className="benefit-item">
            <RotateCcw
              size={25}
            />

            <div>
              <strong>
                Easy Returns
              </strong>

              <span>
                30-day return policy
              </span>
            </div>
          </div>

          {/* SUPPORT */}

          <div className="benefit-item">
            <Clock3
              size={25}
            />

            <div>
              <strong>
                24/7 Support
              </strong>

              <span>
                We're here to help
              </span>
            </div>
          </div>

        </ScrollReveal>
      </main>

      {/* =====================================
          REUSABLE CUSTOMER FOOTER
      ====================================== */}

      <CustomerFooter
        onViewAll={
          onViewAll
        }
      />

    </div>
  );
}