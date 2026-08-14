import {
  useMemo,
  useState,
} from 'react';

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

import type {
  CartItem,
} from './features/customer/cart/types';

import {
  CustomerCatalogPage,
} from './features/customer/catalog/CustomerCatalogPage';

import {
  CustomerCheckoutPage,
} from './features/customer/checkout/CustomerCheckoutPage';

import {
  CustomerProductDetailsPage,
} from './features/customer/CustomerProductDetailsPage';

import {
  PublicStorefront,
} from './features/storefront/PublicStorefront';

import type {
  Product,
} from './features/products/types';

type View =
  | 'storefront'
  | 'catalog'
  | 'cart'
  | 'checkout'
  | 'login'
  | 'product-details'
  | 'admin';

type LoginReturnView =
  | 'storefront'
  | 'checkout'
  | 'product-details';

export default function App() {
  const [user, setUser] =
    useState<AuthUser | null>(
      () => getStoredUser(),
    );

  const [view, setView] =
    useState<View>(() =>
      getStoredUser()?.role === 'admin'
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
    cartItems,
    setCartItems,
  ] =
    useState<CartItem[]>(
      [],
    );

  /*
   * Total quantity shown
   * in the cart badge.
   */
  const cartCount =
    useMemo(
      () =>
        cartItems.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.quantity,
          0,
        ),
      [cartItems],
    );

  /*
   * Open product details.
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
      user.role === 'admin'
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
   * Add product to cart.
   */
  function handleAddToCart(
    product: Product,
  ) {
    if (
      product.stock <= 0
    ) {
      return;
    }

    setCartItems(
      (
        currentItems,
      ) => {
        const existingItem =
          currentItems.find(
            (item) =>
              item.product.id ===
              product.id,
          );

        /*
         * Product not yet
         * in the cart.
         */
        if (
          !existingItem
        ) {
          return [
            ...currentItems,
            {
              product,
              quantity: 1,
            },
          ];
        }

        /*
         * Prevent quantity
         * higher than stock.
         */
        if (
          existingItem.quantity >=
          product.stock
        ) {
          return currentItems;
        }

        return currentItems.map(
          (item) =>
            item.product.id ===
            product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity +
                    1,
                }
              : item,
        );
      },
    );
  }

  /*
   * Increase quantity
   * from cart.
   */
  function handleIncreaseCartItem(
    productId: number,
  ) {
    setCartItems(
      (
        currentItems,
      ) =>
        currentItems.map(
          (item) => {
            if (
              item.product.id !==
              productId
            ) {
              return item;
            }

            if (
              item.quantity >=
              item.product.stock
            ) {
              return item;
            }

            return {
              ...item,
              quantity:
                item.quantity +
                1,
            };
          },
        ),
    );
  }

  /*
   * Decrease quantity.
   *
   * Quantity 1 → 0 removes
   * the product completely.
   */
  function handleDecreaseCartItem(
    productId: number,
  ) {
    setCartItems(
      (
        currentItems,
      ) =>
        currentItems
          .map(
            (item) => {
              if (
                item.product.id !==
                productId
              ) {
                return item;
              }

              return {
                ...item,
                quantity:
                  item.quantity -
                  1,
              };
            },
          )
          .filter(
            (item) =>
              item.quantity >
              0,
          ),
    );
  }

  /*
   * Remove product from cart.
   */
  function handleRemoveCartItem(
    productId: number,
  ) {
    setCartItems(
      (
        currentItems,
      ) =>
        currentItems.filter(
          (item) =>
            item.product.id !==
            productId,
        ),
    );
  }

  /*
   * Proceed from Cart
   * to Checkout.
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
      user.role === 'admin'
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
   * After login, return customer
   * to the page they were trying
   * to access.
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
        'checkout' &&
      cartItems.length > 0
    ) {
      setLoginReturnView(
        'storefront',
      );

      setView(
        'checkout',
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

  async function handleLogout() {
    try {
      await apiPost(
        '/logout',
        {},
      );
    } catch {
      // Clear local session even
      // if API token is invalid.
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
   * Login
   */
  if (
    view === 'login'
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
   * Admin
   */
  if (
    view === 'admin' &&
    user?.role ===
      'admin'
  ) {
    return (
      <AdminDashboard
        user={user}
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
   * Customer Cart
   */
  if (
    view === 'cart'
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
        onIncrease={
          handleIncreaseCartItem
        }
        onDecrease={
          handleDecreaseCartItem
        }
        onRemove={
          handleRemoveCartItem
        }
        onCheckout={
          handleCheckout
        }
      />
    );
  }

  /*
   * Customer Checkout
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
        user={user}
        cartItems={
          cartItems
        }
        onBack={() =>
          setView(
            'cart',
          )
        }
        onOrderSuccess={(
          order,
        ) => {
          /*
           * Order has already
           * been saved by Laravel.
           *
           * Now clear the cart.
           */
          setCartItems(
            [],
          );

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
   * Catalog
   */
  if (
    view === 'catalog'
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
        onAddToCart={
          handleAddToCart
        }
      />
    );
  }

  /*
   * Product Details
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
        user={user}
        onBack={() =>
          setView(
            'storefront',
          )
        }
      />
    );
  }

  /*
   * Customer Home
   */
  return (
    <PublicStorefront
      user={user}
      cartCount={
        cartCount
      }
      onCartClick={() =>
        setView(
          'cart',
        )
      }
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
      onAdminDashboard={() =>
        setView(
          'admin',
        )
      }
      onProductClick={
        handleProductClick
      }
      onLogout={() =>
        void handleLogout()
      }
      onViewAll={() =>
        setView(
          'catalog',
        )
      }
    />
  );
}