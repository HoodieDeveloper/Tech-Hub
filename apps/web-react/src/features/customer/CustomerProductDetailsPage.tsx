import {
  useEffect,
  useState,
} from 'react';

import {
  ArrowLeft,
  Clock3,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react';

import {
  apiGet,
} from '../../core/api/client';

import {
  ProductImage,
} from '../products/ProductImage';

import type {
  Product,
} from '../products/types';

type Props = {
  productId: number;

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

const colorOptions = [
  '#d9d9d9',
  '#7f7f7f',
  '#0b0b0c',
  '#d0d0d0',
  '#8a8a8a',
];

const storageOptions = [
  '256GB',
  '512GB',
  '1TB',
];

export function CustomerProductDetailsPage({
  productId,
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

  function decreaseQuantity() {
    setQuantity(
      (current) =>
        Math.max(
          1,
          current - 1,
        ),
    );
  }

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
    <div className="product-detail-page">
      <main className="storefront-container product-detail-main">
        <button
          type="button"
          className="product-detail-back"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Back to products
        </button>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {!product && !error && (
          <div className="loading-card">
            Loading product details…
          </div>
        )}

        {product && (
          <section className="product-detail-layout">
            <div className="product-detail-image-panel">
              <div className="product-detail-image-frame">
                <ProductImage
                  imageUrl={product.image_url}
                  alt={product.name}
                />
              </div>
            </div>

            <aside className="product-detail-info">
              <h1>{product.name}</h1>

              <div className="product-detail-price">
                ${Number(product.price).toFixed(2)}
              </div>

  

              <div className="product-option-group quantity-group">
                <div className="product-option-label">Quantity</div>

                <div className="quantity-control" aria-label="Quantity selection">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>

                  <span>{quantity}</span>

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={quantity >= product.stock}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="product-detail-actions">
                <button
                  type="button"
                  className="detail-primary-button"
                  disabled={product.stock <= 0}
                  onClick={() => onAddToCart?.(product, quantity)}
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>

                <button
                  type="button"
                  className="detail-secondary-button"
                  disabled={product.stock <= 0}
                  onClick={() => onBuyNow?.(product, quantity)}
                >
                  Buy Now
                </button>
              </div>
            </aside>
          </section>
        )}
      </main>

      <div className="store-benefits product-detail-benefits">
        <div className="benefit-item">
          <Truck size={25} />

          <div>
            <strong>Free Shipping</strong>
            <span>On orders over $49</span>
          </div>
        </div>

        <div className="benefit-item">
          <ShieldCheck size={25} />

          <div>
            <strong>Secure Payment</strong>
            <span>100% encrypted checkout</span>
          </div>
        </div>

        <div className="benefit-item">
          <RotateCcw size={25} />

          <div>
            <strong>Easy Returns</strong>
            <span>30-day return policy</span>
          </div>
        </div>

        <div className="benefit-item">
          <Clock3 size={25} />

          <div>
            <strong>24/7 Support</strong>
            <span>We're here to help</span>
          </div>
        </div>
      </div>
    </div>
  );
}