import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  PackageSearch,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRound,
} from 'lucide-react';

import {
  apiGet,
  type AuthUser,
} from '../../core/api/client';

import {
  ProductImage,
} from '../products/ProductImage';

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
  onLogout,
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
  }, [sliderPaused]);

  /*
   * =========================================
   * SEARCH PRODUCTS
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
   * BANNER CONTROLS
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
    <div className="storefront-page">

      {/* =====================================
          STICKY HEADER
      ====================================== */}

      <div className="storefront-header-stack">

        {/* =====================================
            BLUE HEADER
        ====================================== */}

        <header className="storefront-main-header">
          <div className="storefront-container main-header-inner">

            {/* BRAND */}

            <button
              type="button"
              className="store-brand"
            >
              <strong>
                DCS Computer Shop
              </strong>
            </button>

            {/* SEARCH */}

            <div className="store-search">
              <div className="search-input-wrap">
                <input
                  type="search"
                  placeholder="Search for product, brands or categories..."
                  value={
                    search
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                />

                <Search
                  size={18}
                />
              </div>
            </div>

            {/* =====================================
                HEADER ACTIONS
            ====================================== */}

            <div className="store-header-actions">

              {/* WISHLIST */}

              <button
                type="button"
                className="header-icon-button wishlist-header-button"
                title="Wishlist"
                onClick={
                  onWishlistClick
                }
              >
                <Heart
                  size={19}
                  fill={
                    wishlistCount > 0
                      ? 'currentColor'
                      : 'none'
                  }
                />

                <span>
                  Wishlist
                </span>

                {wishlistCount >
                  0 && (
                  <span className="wishlist-count">
                    {
                      wishlistCount
                    }
                  </span>
                )}
              </button>

              {/* MY ORDERS */}

              {user?.role ===
                'customer' && (
                <button
                  type="button"
                  className="header-icon-button"
                  title="My Orders"
                  onClick={
                    onOrdersClick
                  }
                >
                  <PackageSearch
                    size={19}
                  />

                  <span>
                    My Orders
                  </span>
                </button>
              )}

              {/* =====================================
                  ACCOUNT
              ====================================== */}

              {user ? (
                <button
                  type="button"
                  className="header-icon-button account-page-button"
                  title="My Profile"
                  onClick={
                    onProfileClick
                  }
                >
                  {user.avatar_url ? (
                    <img
                      src={
                        user.avatar_url
                      }
                      alt={
                        user.name
                      }
                      className="header-account-avatar"
                    />
                  ) : (
                    <UserRound
                      size={19}
                    />
                  )}

                  <span>
                    {
                      user.name
                    }
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="header-icon-button"
                  onClick={
                    onLogin
                  }
                >
                  <UserRound
                    size={19}
                  />

                  <span>
                    Account
                  </span>
                </button>
              )}

              {/* CART */}

              <button
                type="button"
                className="header-icon-button cart-header-button"
                title="Cart"
                onClick={
                  onCartClick
                }
              >
                <ShoppingCart
                  size={20}
                />

                <span className="cart-count">
                  {
                    cartCount
                  }
                </span>

                <span>
                  Cart
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* =====================================
            WHITE NAVBAR
        ====================================== */}

        <nav className="store-navigation">
          <div className="storefront-container store-navigation-inner">

            <button
              type="button"
              className="active"
            >
              Home
            </button>

            <button
              type="button"
              onClick={
                onViewAll
              }
            >
              Shop by Category

              <ChevronDown
                size={14}
              />
            </button>

            <button
              type="button"
            >
              About
            </button>

            <button
              type="button"
            >
              Partnership
            </button>

            {user?.role ===
              'admin' && (
                <button
                  type="button"
                  onClick={
                    onAdminDashboard
                  }
                >
                  <ShieldCheck
                    size={15}
                  />

                  Admin Dashboard
                </button>
              )}
          </div>
        </nav>
      </div>

      {/* =====================================
          MAIN
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

          {bestSellersError && (
            <ScrollReveal>
              <div className="alert error">
                {
                  bestSellersError
                }
              </div>
            </ScrollReveal>
          )}

          {loadingBestSellers && (
            <ScrollReveal>
              <div className="loading-card">
                Loading best sellers...
              </div>
            </ScrollReveal>
          )}

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
                        <article className="public-product-card">
                          <button
                            type="button"
                            className="product-click-area"
                            onClick={() =>
                              onProductClick(
                                product,
                              )
                            }
                          >
                            <div className="product-image-area">
                              <span className="product-badge">
                                BEST
                              </span>

                              <ProductImage
                                imageUrl={
                                  product.image_url
                                }
                                alt={
                                  product.name
                                }
                              />
                            </div>

                            <div className="public-product-body">
                              <h3>
                                {
                                  product.name
                                }
                              </h3>

                              <div className="product-stars">
                                {
                                  product.sold_quantity
                                }{' '}
                                sold
                              </div>

                              <div className="product-price-row">
                                <strong>
                                  $
                                  {Number(
                                    product.price,
                                  ).toFixed(
                                    2,
                                  )}
                                </strong>

                                <Heart
                                  size={20}
                                  className={
                                    wishlisted
                                      ? 'product-heart wishlisted'
                                      : 'product-heart'
                                  }
                                  fill={
                                    wishlisted
                                      ? 'currentColor'
                                      : 'none'
                                  }
                                  onClick={(
                                    event,
                                  ) => {
                                    event.stopPropagation();

                                    handleWishlistClick(
                                      product.id,
                                    );
                                  }}
                                />
                              </div>
                            </div>
                          </button>
                        </article>
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

          {productsError && (
            <ScrollReveal>
              <div className="alert error">
                {
                  productsError
                }
              </div>
            </ScrollReveal>
          )}

          {loadingProducts && (
            <ScrollReveal>
              <div className="loading-card">
                Loading products...
              </div>
            </ScrollReveal>
          )}

          {!loadingProducts &&
            filteredProducts
              .length === 0 && (
              <ScrollReveal>
                <div className="empty-state">
                  No products found.
                </div>
              </ScrollReveal>
            )}

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
                        <article className="public-product-card">
                          <button
                            type="button"
                            className="product-click-area"
                            onClick={() =>
                              onProductClick(
                                product,
                              )
                            }
                          >
                            <div className="product-image-area">
                              <span className="product-badge">
                                NEW
                              </span>

                              <ProductImage
                                imageUrl={
                                  product.image_url
                                }
                                alt={
                                  product.name
                                }
                              />
                            </div>

                        <div className="public-product-body">
                          <h3>
                            {
                              product.name
                            }
                          </h3>

                          <div className="product-stars">
                            ☆☆☆☆☆
                          </div>

                              <div className="product-price-row">
                                <strong>
                                  $
                                  {Number(
                                    product.price,
                                  ).toFixed(
                                    2,
                                  )}
                                </strong>

                                <Heart
                                  size={20}
                                  className={
                                    wishlisted
                                      ? 'product-heart wishlisted'
                                      : 'product-heart'
                                  }
                                  fill={
                                    wishlisted
                                      ? 'currentColor'
                                      : 'none'
                                  }
                                  onClick={(
                                    event,
                                  ) => {
                                    event.stopPropagation();

                                    handleWishlistClick(
                                      product.id,
                                    );
                                  }}
                                />
                              </div>
                            </div>
                          </button>
                        </article>
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
          FOOTER
      ====================================== */}

      <footer className="store-footer">
        <div className="storefront-container footer-grid">

          {/* DCS */}

          <div className="footer-brand">
            <h3>
              DCS Computer shop
            </h3>

            <p>
              Your trusted destination
              for the latest tech.
            </p>

            <p>
              Great products, Better
              experiences.
            </p>

            {/* SOCIAL */}

            <div className="social-links">
              <button
                type="button"
                aria-label="Instagram"
              >
                <img
                  src="/images/footer/Instagram.png"
                  alt="Instagram"
                />
              </button>

              <button
                type="button"
                aria-label="Telegram"
              >
                <img
                  src="/images/footer/Telegram.png"
                  alt="Telegram"
                />
              </button>

              <button
                type="button"
                aria-label="Facebook"
                onClick={() =>
                  window.open(
                    'https://www.facebook.com/dcscomputershop',
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
              >
                <img
                  src="/images/footer/Facebook.png"
                  alt="Facebook"
                />
              </button>

              <button
                type="button"
                aria-label="X"
              >
                <img
                  src="/images/footer/x.png"
                  alt="X"
                />
              </button>
            </div>
          </div>

          {/* SHOP */}

          <div className="footer-column">
            <h4>
              Shop
            </h4>

            <button
              type="button"
              onClick={
                onViewAll
              }
            >
              All Categories
            </button>

            <button
              type="button"
            >
              Best Sellers
            </button>

            <button
              type="button"
            >
              New Arrivals
            </button>

            <button
              type="button"
            >
              Deals
            </button>
          </div>

          {/* CUSTOMER CARE */}

          <div className="footer-column">
            <h4>
              Customer Care
            </h4>

            <button
              type="button"
            >
              Contact Us
            </button>

            <button
              type="button"
            >
              Track Order
            </button>

            <button
              type="button"
            >
              Return & Refunds
            </button>

            <button
              type="button"
            >
              Shipping Info
            </button>

            <button
              type="button"
            >
              FAQ
            </button>
          </div>

          {/* COMPANY */}

          <div className="footer-column">
            <h4>
              Company
            </h4>

            <button
              type="button"
            >
              About DCS
            </button>

            <button
              type="button"
            >
              Careers
            </button>

            <button
              type="button"
            >
              Press
            </button>

            <button
              type="button"
            >
              DCS Rewards
            </button>

            <button
              type="button"
            >
              Sustainability
            </button>
          </div>

          {/* NEWSLETTER */}

          <div className="footer-newsletter">
            <h4>
              Stay in the loop
            </h4>

            <p>
              Subscribe for exclusive
              deals and updates.
            </p>

            <div className="newsletter-form">
              <input
                type="email"
                placeholder="Enter Your Email"
              />

              <button
                type="button"
              >
                Subscribe
              </button>
            </div>

            {/* PAYMENT */}

            <div className="payment-methods">
              <img
                src="/images/footer/visa.png"
                alt="Visa"
              />

              <img
                src="/images/footer/MasterCard.png"
                alt="Mastercard"
              />

              <img
                src="/images/footer/PayPal.png"
                alt="PayPal"
              />

              <img
                src="/images/footer/wing.png"
                alt="Wing Bank"
              />

              <img
                src="/images/footer/ABA.png"
                alt="ABA Bank"
              />
            </div>
          </div>
        </div>

        {/* COPYRIGHT */}

        <div className="storefront-container footer-bottom">
          © 2026 DCS, All rights
          reserved.
        </div>
      </footer>
    </div>
  );
}