import {
  useState,
} from 'react';

import type {
  CartItem,
} from './features/customer/cart/types';

import {
  apiPost,
  clearAuthSession,
  getStoredUser,
  type AuthUser,
} from './core/api/client';

import {
  AdminDashboard,
} from './features/admin/AdminDashboard';

import {
  LoginPage,
} from './features/auth/LoginPage';

import {
  CustomerCartPage,
} from './features/customer/cart/CustomerCartPage';

import {
  useCart,
} from './features/customer/cart/useCart';

import {
  CustomerCatalogPage,
} from './features/customer/catalog/CustomerCatalogPage';

import {
  CustomerCheckoutPage,
} from './features/customer/checkout/CustomerCheckoutPage';

import {
  CustomerOrdersPage,
} from './features/customer/orders/CustomerOrdersPage';

import {
  CustomerProfilePage,
} from './features/customer/profile/CustomerProfilePage';

import {
  CustomerProductDetailsPage,
} from './features/customer/CustomerProductDetailsPage';

import {
  CustomerWishlistPage,
} from './features/customer/wishlist/CustomerWishlistPage';

import {
  useWishlist,
} from './features/customer/wishlist/useWishlist';

import {
  PublicStorefront,
} from './features/storefront/PublicStorefront';

import type {
  Product,
} from './features/products/types';

/*
 * =========================================
 * APP VIEWS
 * =========================================
 */

type View =
  | 'storefront'
  | 'catalog'
  | 'cart'
  | 'checkout'
  | 'wishlist'
  | 'orders'
  | 'profile'
  | 'login'
  | 'product-details'
  | 'admin';

type LoginReturnView =
  | 'storefront'
  | 'checkout'
  | 'wishlist'
  | 'product-details';

export default function App() {
  /*
   * =========================================
   * LOGGED-IN USER
   * =========================================
   */

  const [
    user,
    setUser,
  ] =
    useState<AuthUser | null>(
      () => getStoredUser(),
    );

  /*
   * =========================================
   * CURRENT PAGE
   * =========================================
   */

  const [
    view,
    setView,
  ] =
    useState<View>(() =>
      getStoredUser()?.role ===
      'admin'
        ? 'admin'
        : 'storefront',
    );

  const [
    loginReturnView,
    setLoginReturnView,
  ] =
    useState<LoginReturnView>(
      'storefront',
    );

  const [
    pendingProductId,
    setPendingProductId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    buyNowItems,
    setBuyNowItems,
  ] =
    useState<CartItem[] | null>(
      null,
    );

  /*
   * =========================================
   * DATABASE CART
   * =========================================
   */

  const {
    cartItems,
    cartCount,
    cartError,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
  } = useCart(
    user,
  );

  /*
   * =========================================
   * WISHLIST
   * =========================================
   */

  const {
    wishlistProducts,
    wishlistCount,
    loadingWishlist,
    wishlistError,
    isWishlisted,
    toggleWishlist,
  } = useWishlist(
    user,
  );

  /*
   * =========================================
   * PRODUCT DETAILS
   * =========================================
   */

  function handleProductClick(
    product: Product,
  ) {
    setPendingProductId(
      product.id,
    );

    if (!user) {
      setLoginReturnView(
        'product-details',
      );

      setView(
        'login',
      );

      return;
    }

    if (
      user.role ===
      'admin'
    ) {
      setView(
        'admin',
      );

      return;
    }

    setView(
      'product-details',
    );
  }

  /*
   * =========================================
   * ADD TO DATABASE CART
   * =========================================
   */

  async function handleAddToCart(
    product: Product,
    quantity = 1,
  ) {
    if (
      product.stock <= 0
    ) {
      return;
    }

    if (!user) {
      setLoginReturnView(
        'storefront',
      );

      setView(
        'login',
      );

      return;
    }

    if (
      user.role !==
      'customer'
    ) {
      setView(
        'admin',
      );

      return;
    }

    await addToCart(
      product,
      quantity,
    );
  }

  /*
   * =========================================
   * INCREASE CART QUANTITY
   * =========================================
   */

  async function handleIncreaseCartItem(
    productId: number,
  ) {
    const item =
      cartItems.find(
        (cartItem) =>
          cartItem.product.id ===
          productId,
      );

    if (!item) {
      return;
    }

    if (
      item.quantity >=
      item.product.stock
    ) {
      return;
    }

    await updateCartQuantity(
      productId,
      item.quantity + 1,
    );
  }

  /*
   * =========================================
   * DECREASE CART QUANTITY
   * =========================================
   */

  async function handleDecreaseCartItem(
    productId: number,
  ) {
    const item =
      cartItems.find(
        (cartItem) =>
          cartItem.product.id ===
          productId,
      );

    if (!item) {
      return;
    }

    if (
      item.quantity <= 1
    ) {
      await removeFromCart(
        productId,
      );

      return;
    }

    await updateCartQuantity(
      productId,
      item.quantity - 1,
    );
  }

  /*
   * =========================================
   * REMOVE FROM CART
   * =========================================
   */

  async function handleRemoveCartItem(
    productId: number,
  ) {
    await removeFromCart(
      productId,
    );
  }

  /*
   * =========================================
   * CHECKOUT
   * =========================================
   */

  function handleCheckout() {
    if (
      cartItems.length === 0
    ) {
      return;
    }

    if (!user) {
      setLoginReturnView(
        'checkout',
      );

      setView(
        'login',
      );

      return;
    }

    if (
      user.role ===
      'admin'
    ) {
      setView(
        'admin',
      );

      return;
    }

    setView(
      'checkout',
    );
  }

  /*
   * =========================================
   * WISHLIST
   * =========================================
   */

  async function handleToggleWishlist(
    productId: number,
  ) {
    if (
      !user ||
      user.role !==
        'customer'
    ) {
      return;
    }

    await toggleWishlist(
      productId,
    );
  }

  function handleOpenWishlist() {
    if (!user) {
      setLoginReturnView(
        'wishlist',
      );

      setView(
        'login',
      );

      return;
    }

    if (
      user.role ===
      'admin'
    ) {
      setView(
        'admin',
      );

      return;
    }

    setView(
      'wishlist',
    );
  }

  /*
   * =========================================
   * BUY NOW
   * =========================================
   */

  function handleBuyNow(
    product: Product,
    quantity: number,
  ) {
    if (
      !user ||
      user.role !==
        'customer'
    ) {
      return;
    }

    setBuyNowItems([
      {
        product,
        quantity,
      },
    ]);

    setView(
      'checkout',
    );
  }

  /*
   * =========================================
   * LOGIN SUCCESS
   * =========================================
   */

  function handleLoginSuccess(
    authenticatedUser: AuthUser,
  ) {
    setUser(
      authenticatedUser,
    );

    if (
      authenticatedUser.role ===
      'admin'
    ) {
      setPendingProductId(
        null,
      );

      setLoginReturnView(
        'storefront',
      );

      setView(
        'admin',
      );

      return;
    }

    if (
      loginReturnView ===
      'wishlist'
    ) {
      setLoginReturnView(
        'storefront',
      );

      setView(
        'wishlist',
      );

      return;
    }

    if (
      loginReturnView ===
        'product-details' &&
      pendingProductId
    ) {
      setLoginReturnView(
        'storefront',
      );

      setView(
        'product-details',
      );

      return;
    }

    setLoginReturnView(
      'storefront',
    );

    setView(
      'storefront',
    );
  }

  /*
   * =========================================
   * LOGOUT
   * =========================================
   */

  async function handleLogout() {
    try {
      await apiPost(
        '/logout',
        {},
      );
    } catch {
      /*
       * Even if API logout fails,
       * local session is cleared.
       */
    }

    clearAuthSession();

    setUser(
      null,
    );

    setPendingProductId(
      null,
    );

    setLoginReturnView(
      'storefront',
    );

    setView(
      'storefront',
    );
  }

  /*
   * =========================================
   * LOGIN PAGE
   * =========================================
   */

  if (
    view ===
    'login'
  ) {
    return (
      <LoginPage
        onSuccess={
          handleLoginSuccess
        }

        onBack={() =>
          setView(
            'storefront',
          )
        }
      />
    );
  }

  /*
   * =========================================
   * ADMIN
   * =========================================
   */

  if (
    view ===
      'admin' &&
    user?.role ===
      'admin'
  ) {
    return (
      <AdminDashboard
        user={
          user
        }

        onStorefront={() =>
          setView(
            'storefront',
          )
        }

        onLogout={() =>
          void handleLogout()
        }
      />
    );
  }

  /*
   * =========================================
   * CUSTOMER PROFILE
   * =========================================
   */

  if (
    view ===
      'profile' &&
    user?.role ===
      'customer'
  ) {
    return (
      <CustomerProfilePage
        user={
          user
        }

        onBack={() =>
          setView(
            'storefront',
          )
        }

        onUserUpdated={(
          updatedUser,
        ) => {
          setUser(
            updatedUser,
          );
        }}

        onLogout={() =>
          void handleLogout()
        }
      />
    );
  }

  /*
   * =========================================
   * CUSTOMER ORDERS
   * =========================================
   */

  if (
    view ===
      'orders' &&
    user?.role ===
      'customer'
  ) {
    return (
      <CustomerOrdersPage
        onBack={() =>
          setView(
            'storefront',
          )
        }
      />
    );
  }

  /*
   * =========================================
   * WISHLIST PAGE
   * =========================================
   */

  if (
    view ===
      'wishlist' &&
    user?.role ===
      'customer'
  ) {
    return (
      <CustomerWishlistPage
        products={
          wishlistProducts
        }

        onBack={() =>
          setView(
            'storefront',
          )
        }

        onProductClick={
          handleProductClick
        }

        onAddToCart={(
          product,
        ) =>
          void handleAddToCart(
            product,
          )
        }

        onRemove={(
          productId,
        ) =>
          void handleToggleWishlist(
            productId,
          )
        }
      />
    );
  }

  /*
   * =========================================
   * CART PAGE
   * =========================================
   */

  if (
    view ===
    'cart'
  ) {
    return (
      <CustomerCartPage
        cartItems={
          cartItems
        }

        onBack={() =>
          setView(
            'storefront',
          )
        }

        onIncrease={(
          productId,
        ) =>
          void handleIncreaseCartItem(
            productId,
          )
        }

        onDecrease={(
          productId,
        ) =>
          void handleDecreaseCartItem(
            productId,
          )
        }

        onRemove={(
          productId,
        ) =>
          void handleRemoveCartItem(
            productId,
          )
        }

        onCheckout={
          handleCheckout
        }
      />
    );
  }

  /*
   * =========================================
   * CHECKOUT
   * =========================================
   */

  if (
    view ===
      'checkout' &&
    user &&
    user.role ===
      'customer'
  ) {
    return (
      <CustomerCheckoutPage
        user={
          user
        }

        cartItems={
          buyNowItems ??
          cartItems
        }

        onBack={() => {
          if (
            buyNowItems
          ) {
            setBuyNowItems(
              null,
            );

            setView(
              'product-details',
            );

            return;
          }

          setView(
            'cart',
          );
        }}

        onOrderSuccess={(
          order,
        ) => {
          if (
            buyNowItems
          ) {
            setBuyNowItems(
              null,
            );
          } else {
            void clearCart();
          }

          window.alert(
            `Order ${order.order_number} placed successfully!`,
          );

          setView(
            'storefront',
          );
        }}
      />
    );
  }

  /*
   * =========================================
   * CATALOG
   * =========================================
   */

  if (
    view ===
    'catalog'
  ) {
    return (
      <CustomerCatalogPage
        onBack={() =>
          setView(
            'storefront',
          )
        }

        onProductClick={
          handleProductClick
        }

        onAddToCart={(
          product,
        ) =>
          void handleAddToCart(
            product,
          )
        }

        isWishlisted={
          isWishlisted
        }

        onToggleWishlist={(
          productId,
        ) => {
          if (!user) {
            setLoginReturnView(
              'storefront',
            );

            setView(
              'login',
            );

            return;
          }

          void handleToggleWishlist(
            productId,
          );
        }}
      />
    );
  }

  /*
   * =========================================
   * PRODUCT DETAILS
   * =========================================
   */

  if (
    view ===
      'product-details' &&
    user &&
    pendingProductId
  ) {
    return (
      <CustomerProductDetailsPage
        productId={
          pendingProductId
        }

        user={
          user
        }

        onBack={() =>
          setView(
            'storefront',
          )
        }

        onAddToCart={(
          product,
          quantity,
        ) =>
          void handleAddToCart(
            product,
            quantity,
          )
        }

        onBuyNow={(
          product,
          quantity,
        ) =>
          handleBuyNow(
            product,
            quantity,
          )
        }
      />
    );
  }

  /*
   * =========================================
   * CUSTOMER HOME
   * =========================================
   */

  return (
    <>
      {cartError && (
        <div className="alert error">
          {
            cartError
          }
        </div>
      )}

      {wishlistError && (
        <div className="alert error">
          {
            wishlistError
          }
        </div>
      )}

      <PublicStorefront
        user={
          user
        }

        /*
         * =================================
         * PROFILE
         * =================================
         */

        onProfileClick={() => {
          if (!user) {
            setLoginReturnView(
              'storefront',
            );

            setView(
              'login',
            );

            return;
          }

          if (
            user.role ===
            'admin'
          ) {
            setView(
              'admin',
            );

            return;
          }

          setView(
            'profile',
          );
        }}

        /*
         * =================================
         * CART
         * =================================
         */

        cartCount={
          cartCount
        }

        onCartClick={() => {
          if (!user) {
            setLoginReturnView(
              'storefront',
            );

            setView(
              'login',
            );

            return;
          }

          setView(
            'cart',
          );
        }}

        /*
         * =================================
         * WISHLIST
         * =================================
         */

        wishlistCount={
          wishlistCount
        }

        isWishlisted={
          isWishlisted
        }

        onToggleWishlist={(
          productId,
        ) => {
          if (!user) {
            setLoginReturnView(
              'storefront',
            );

            setView(
              'login',
            );

            return;
          }

          void handleToggleWishlist(
            productId,
          );
        }}

        onWishlistClick={
          handleOpenWishlist
        }

        /*
         * =================================
         * ORDERS
         * =================================
         */

        onOrdersClick={() =>
          setView(
            'orders',
          )
        }

        /*
         * =================================
         * LOGIN
         * =================================
         */

        onLogin={() => {
          setPendingProductId(
            null,
          );

          setLoginReturnView(
            'storefront',
          );

          setView(
            'login',
          );
        }}

        /*
         * =================================
         * ADMIN
         * =================================
         */

        onAdminDashboard={() =>
          setView(
            'admin',
          )
        }

        /*
         * =================================
         * PRODUCT
         * =================================
         */

        onProductClick={
          handleProductClick
        }

        /*
         * =================================
         * LOGOUT
         * =================================
         */

        onLogout={() =>
          void handleLogout()
        }

        /*
         * =================================
         * CATALOG
         * =================================
         */

        onViewAll={() =>
          setView(
            'catalog',
          )
        }
      />

      {loadingWishlist && (
        <div
          style={{
            display:
              'none',
          }}
        >
          Loading wishlist...
        </div>
      )}
    </>
  );
}