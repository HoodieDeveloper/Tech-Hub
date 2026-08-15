import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe2,
  Heart,
  LogIn,
  LogOut,
  MessageCircle,
  RefreshCw,
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

import banner1 from './assets/banner-1.png';
import banner2 from './assets/banner-2.png';
import banner3 from './assets/banner-3.png';

import './Storefront.css';

type Props = {
  user: AuthUser | null;

  onLogin: () => void;
  onWishlistClick?: () => void;
  onAdminDashboard: () => void;

  onProductClick: (
    product: Product,
  ) => void;

  onViewAll?: () => void;

  onLogout: () => void;

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

const banners = [
  banner1,
  banner2,
  banner3,
];

export function PublicStorefront({
  user,
  onLogin,
  onAdminDashboard,
  onProductClick,
  onLogout,
  onViewAll,
  onWishlistClick,
  cartCount = 0,
  onCartClick,

  wishlistCount = 0,
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
    search,
    setSearch,
  ] =
    useState('');

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

  const [
    showAll,
    setShowAll,
  ] =
    useState(false);

  async function loadProducts() {
    setLoading(true);
    setError('');

    try {
      const data =
        await apiGet<Product[]>(
          '/products',
          false,
        );

      setProducts(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load products.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  useEffect(() => {
    if (sliderPaused) {
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

  const visibleProducts =
    showAll
      ? filteredProducts
      : filteredProducts.slice(
          0,
          4,
        );

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

  function handleWishlistClick(
    productId: number,
  ) {
    if (!user) {
      onLogin();
      return;
    }

    if (
      user.role !== 'customer'
    ) {
      return;
    }

    onToggleWishlist?.(
      productId,
    );
  }

  return (
    <div className="storefront-page">
      {/* =========================
          TOP INFORMATION BAR
      ========================== */}

      <div className="storefront-topbar">
        <div className="storefront-container storefront-topbar-inner">
          <span>
            <Truck size={13} />

            Free shipping on
            orders over $49
          </span>

          <div className="topbar-links">
            <span>
              Need help?
            </span>

            <span>
              +855 12 23 38 56
            </span>

            <button
              type="button"
            >
              Support
            </button>

            <button
              type="button"
            >
              Track Order
            </button>

            <button
              type="button"
            >
              English | USD
            </button>
          </div>
        </div>
      </div>

      {/* =========================
          BLUE MAIN HEADER
      ========================== */}

      <header className="storefront-main-header">
        <div className="storefront-container main-header-inner">
          <button
            type="button"
            className="store-brand"
          >
            <strong>
              TechHub Computer Shop
            </strong>
          </button>

          <div className="store-search">
            {/* CLICKABLE ALL CATEGORIES */}

            <button
              type="button"
              className="category-button"
              onClick={onViewAll}
            >
              All Categories

              <ChevronDown
                size={15}
              />
            </button>

            <div className="search-input-wrap">
              <input
                type="search"
                placeholder="Search for product, brands or categories..."
                value={search}
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

          <div className="store-header-actions">
            {/* WISHLIST */}

          <button
            type="button"
            className="header-icon-button wishlist-header-button"
            title="Wishlist"
            onClick={onWishlistClick}
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

            {wishlistCount > 0 && (
              <span className="wishlist-count">
                {wishlistCount}
              </span>
            )}
          </button>

            {/* ACCOUNT */}

            {user ? (
              <button
                type="button"
                className="header-icon-button"
                title={
                  user.name
                }
              >
                <UserRound
                  size={19}
                />

                <span>
                  {user.name}
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
                <LogIn
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
                {cartCount}
              </span>

              <span>
                Cart
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================
          NAVIGATION
      ========================== */}

      <nav className="store-navigation">
        <div className="storefront-container store-navigation-inner">
          <button
            type="button"
            className="active"
          >
            Home
          </button>

          {/* CLICKABLE SHOP BY CATEGORY */}

          <button
            type="button"
            onClick={onViewAll}
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

          {user && (
            <button
              type="button"
              className="nav-logout"
              onClick={
                onLogout
              }
            >
              <LogOut
                size={15}
              />

              Logout
            </button>
          )}
        </div>
      </nav>

      {/* =========================
          MAIN
      ========================== */}

      <main className="storefront-container storefront-main">
        {/* HERO */}

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

        {/* =========================
            BEST SALES
        ========================== */}

        <section className="best-sales-section">
          <div className="best-sales-heading">
            <h2>
              Best Sales
            </h2>

            <button
              type="button"
              className="view-all-button"
              onClick={() => {
                if (
                  onViewAll
                ) {
                  onViewAll();
                  return;
                }

                setShowAll(
                  (current) =>
                    !current,
                );
              }}
            >
              {showAll
                ? 'Show Less'
                : 'View All'}

              <ArrowRight
                size={16}
              />
            </button>
          </div>

          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          {loading && (
            <div className="loading-card">
              <RefreshCw
                size={18}
                className="spin"
              />

              Loading products...
            </div>
          )}

          {!loading &&
            filteredProducts
              .length ===
              0 && (
              <div className="empty-state">
                No products found.
              </div>
            )}

          <div className="public-product-grid">
            {visibleProducts.map(
              (product) => {
                const wishlisted =
                  isWishlisted?.(
                    product.id,
                  ) ?? false;

                return (
                  <article
                    className="public-product-card"
                    key={
                      product.id
                    }
                  >
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
                );
              },
            )}
          </div>
        </section>

        {/* =========================
            BENEFITS
        ========================== */}

        <section className="store-benefits">
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
        </section>
      </main>

      {/* =========================
          FOOTER
      ========================== */}

      <footer className="store-footer">
        <div className="storefront-container footer-grid">
          <div className="footer-brand">
            <h3>
              TechHub Computer Shop
            </h3>

            <p>
              Your trusted destination
              for the latest tech,
              quality products and
              better experiences.
            </p>

            <div className="social-links">
              <button
                type="button"
              >
                <Globe2
                  size={17}
                />
              </button>

              <button
                type="button"
              >
                <MessageCircle
                  size={17}
                />
              </button>
            </div>
          </div>

          <div className="footer-column">
            <h4>
              Shop
            </h4>

            <button
              type="button"
              onClick={onViewAll}
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

          <div className="footer-column">
            <h4>
              Company
            </h4>

            <button
              type="button"
            >
              About TechHub
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
              TechHub Rewards
            </button>
          </div>

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

            <div className="payment-methods">
              <span>
                VISA
              </span>

              <span>
                Mastercard
              </span>

              <span>
                PayPal
              </span>
            </div>
          </div>
        </div>

        <div className="storefront-container footer-bottom">
          © 2026 TechHub. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
}