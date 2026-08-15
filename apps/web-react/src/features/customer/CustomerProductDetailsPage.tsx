import {
  useEffect,
  useState,
} from 'react';

import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
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

type Props = {
  productId: number;

  user: AuthUser;

  onBack: () => void;

  onAddToCart?: (
    product: Product,
    quantity: number,
  ) => void;

  onBuyNow?: (
    product: Product,
    quantity: number,
  ) => void;
};

export function CustomerProductDetailsPage({
  productId,
  user,
  onBack,
  onAddToCart,
  onBuyNow,
}: Props) {
  const [
    product,
    setProduct,
  ] =
    useState<Product | null>(
      null,
    );

  const [
    quantity,
    setQuantity,
  ] =
    useState(1);

  const [
    error,
    setError,
  ] =
    useState('');

  /*
   * Load product.
   */
  useEffect(() => {
    setError('');
    setQuantity(1);

    apiGet<Product>(
      `/products/${productId}`,
    )
      .then(
        setProduct,
      )
      .catch(
        (err: unknown) => {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load product details.',
          );
        },
      );
  }, [productId]);

  /*
   * Decrease quantity.
   *
   * Minimum = 1
   */
  function decreaseQuantity() {
    setQuantity(
      (current) =>
        Math.max(
          1,
          current - 1,
        ),
    );
  }

  /*
   * Increase quantity.
   *
   * Maximum = product stock.
   */
  function increaseQuantity() {
    if (!product) {
      return;
    }

    setQuantity(
      (current) =>
        Math.min(
          product.stock,
          current + 1,
        ),
    );
  }

  return (
    <div className="details-page">
      <header className="simple-header">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
        >
          <ArrowLeft
            size={18}
          />

          Products
        </button>

        <span>
          Logged in as{' '}
          {user.name}
        </span>
      </header>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {!product &&
        !error && (
          <div className="loading-card">
            Loading product
            details…
          </div>
        )}

      {product && (
        <article className="details-card">
          <div className="details-image">
            <ProductImage
              imageUrl={
                product.image_url
              }
              alt={
                product.name
              }
            />
          </div>

          <div className="details-content">
            <span className="eyebrow">
              {
                product.category
                  ?.name ??
                'Product'
              }
            </span>

            <h1>
              {product.name}
            </h1>

            <p>
              {product.description ||
                'No description is available for this product.'}
            </p>

            <strong className="details-price">
              $
              {Number(
                product.price,
              ).toFixed(2)}
            </strong>

            <span
              className={
                product.stock > 0
                  ? 'details-stock in-stock'
                  : 'details-stock out-of-stock'
              }
            >
              {product.stock > 0
                ? `${product.stock} units available`
                : 'Out of stock'}
            </span>

            {product.stock > 0 && (
              <div className="details-quantity">
                <span>
                  Quantity
                </span>

                <div className="quantity-control">
                  <button
                    type="button"
                    onClick={
                      decreaseQuantity
                    }
                    disabled={
                      quantity <= 1
                    }
                  >
                    <Minus
                      size={16}
                    />
                  </button>

                  <strong>
                    {quantity}
                  </strong>

                  <button
                    type="button"
                    onClick={
                      increaseQuantity
                    }
                    disabled={
                      quantity >=
                      product.stock
                    }
                  >
                    <Plus
                      size={16}
                    />
                  </button>
                </div>
              </div>
            )}

            <div className="details-actions">
              <button
                type="button"
                className="details-add-cart"
                disabled={
                  product.stock <= 0
                }
                onClick={() =>
                  onAddToCart?.(
                    product,
                    quantity,
                  )
                }
              >
                <ShoppingCart
                  size={18}
                />

                Add to Cart
              </button>

              <button
                type="button"
                className="details-buy-now"
                disabled={
                  product.stock <= 0
                }
                onClick={() =>
                  onBuyNow?.(
                    product,
                    quantity,
                  )
                }
              >
                Buy Now
              </button>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}