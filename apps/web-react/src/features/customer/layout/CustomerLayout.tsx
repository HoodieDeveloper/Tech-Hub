import {
  useState,
  type ReactNode,
} from 'react';

import type {
  AuthUser,
} from '../../../core/api/client';

import {
  CustomerFooter,
} from './CustomerFooter';

import {
  CustomerHeader,
} from './CustomerHeader';

import './CustomerLayout.css';

type Props = {
  user: AuthUser | null;

  children: ReactNode;

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

export function CustomerLayout({
  user,
  children,
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
  const [localSearch, setLocalSearch] = useState('');

  const effectiveSearch = onSearchChange
    ? search
    : localSearch;

  function handleSearchChange(value: string) {
    if (onSearchChange) {
      onSearchChange(value);
      return;
    }

    setLocalSearch(value);
  }

  return (
    <div className="customer-layout-page">

      {/*
       * storefront-page is used ONLY
       * around the shared header.
       *
       * It will NOT wrap the customer
       * page content anymore.
       */}
      <div className="storefront-page customer-layout-header-shell">
        <CustomerHeader
          user={user}
          search={effectiveSearch}
          onSearchChange={
            handleSearchChange
          }
          wishlistCount={
            wishlistCount
          }
          cartCount={
            cartCount
          }
          onHomeClick={
            onHomeClick
          }
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
      </div>

      {/*
       * Customer page content is OUTSIDE
       * storefront-page.
       *
       * Wishlist CSS remains Wishlist CSS.
       * Profile CSS remains Profile CSS.
       * Cart CSS remains Cart CSS.
       */}
      <main className="customer-layout-content">
        {children}
      </main>

      {/*
       * storefront-page is used ONLY
       * around the reusable footer.
       */}
      <div className="storefront-page customer-layout-footer-shell">
        <CustomerFooter
          onViewAll={
            onViewAll
          }
        />
      </div>

    </div>
  );
}