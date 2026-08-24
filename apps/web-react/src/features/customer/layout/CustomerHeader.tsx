import {
  ChevronDown,
  Heart,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingCart,
  UserRound,
} from 'lucide-react';

import type {
  AuthUser,
} from '../../../core/api/client';

import {
  resolveMediaUrl,
} from '../../../core/api/client';

type Props = {
  user: AuthUser | null;

  search?: string;

  onSearchChange?: (
    value: string,
  ) => void;

  wishlistCount?: number;

  cartCount?: number;

  onHomeClick?: () => void;

  onViewAll?: () => void;

  onWishlistClick?: () => void;

  onOrdersClick?: () => void;

  onProfileClick?: () => void;

  onCartClick?: () => void;

  onLogin?: () => void;

  onAdminDashboard?: () => void;
};

export function CustomerHeader({
  user,
  search = '',
  onSearchChange,
  wishlistCount = 0,
  cartCount = 0,
  onHomeClick,
  onViewAll,
  onWishlistClick,
  onOrdersClick,
  onProfileClick,
  onCartClick,
  onLogin,
  onAdminDashboard,
}: Props) {
  const accountAvatarUrl =
    resolveMediaUrl(
      user?.avatar_url,
    );

  return (
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
            onClick={
              onHomeClick
            }
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
                  onSearchChange?.(
                    event.target.value,
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

              {wishlistCount > 0 && (
                <span className="wishlist-count">
                  {wishlistCount}
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

            {/* ACCOUNT */}

            {user ? (
              <button
                type="button"
                className="header-icon-button account-page-button"
                title="My Profile"
                onClick={
                  onProfileClick
                }
              >
                {accountAvatarUrl ? (
                  <img
                    src={
                      accountAvatarUrl
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
                {cartCount}
              </span>

              <span>
                Cart
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================
          WHITE NAVIGATION
      ====================================== */}

      <nav className="store-navigation">
        <div className="storefront-container store-navigation-inner">

          <button
            type="button"
            className="active"
            onClick={
              onHomeClick
            }
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
  );
}