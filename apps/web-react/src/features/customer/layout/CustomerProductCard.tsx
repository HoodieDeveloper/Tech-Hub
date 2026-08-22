import {
  Heart,
  ShoppingCart,
} from 'lucide-react';

import {
  ProductImage,
} from '../../products/ProductImage';

import type {
  Product,
} from '../../products/types';

import './CustomerProductCard.css';

type Props = {
  product: Product;

  onProductClick: (
    product: Product,
  ) => void;

  isWishlisted?: boolean;

  onToggleWishlist?: (
    productId: number,
  ) => void;

  onAddToCart?: (
    product: Product,
  ) => void;

  onRemove?: (
    productId: number,
  ) => void;

  showCategoryLabel?: boolean;

  imageHeight?: number;

  cardClassName?: string;
};

export function CustomerProductCard({
  product,
  onProductClick,
  isWishlisted = false,
  onToggleWishlist,
  onAddToCart,
  onRemove,
  showCategoryLabel = false,
  imageHeight = 225,
  cardClassName,
}: Props) {
  const hasActions = Boolean(
    onAddToCart,
  );

  const canToggleFavorite =
    Boolean(onToggleWishlist) ||
    Boolean(onRemove);

  const categoryLabel =
    getCategoryLabel(product);

  function handleWishlistClick(
    event: {
      stopPropagation: () => void;
    },
  ) {
    event.stopPropagation();

    if (onToggleWishlist) {
      onToggleWishlist(product.id);
      return;
    }

    onRemove?.(product.id);
  }

  return (
    <article
      className={
        cardClassName
          ? `customer-product-card ${cardClassName}`
          : 'customer-product-card'
      }
    >
      <button
        type="button"
        className="customer-product-main"
        onClick={() =>
          onProductClick(product)
        }
      >
        <div
          className="customer-product-image"
          style={{
            height: imageHeight,
          }}
        >
          <ProductImage
            imageUrl={product.image_url}
            alt={product.name}
          />
        </div>

        <div className="customer-product-info">
          {showCategoryLabel && (
            <span className="customer-product-category">
              {categoryLabel}
            </span>
          )}

          <h3>{product.name}</h3>

          <div className="customer-product-price-row">
            <strong>
              ${Number(product.price).toFixed(2)}
            </strong>
          </div>
        </div>
      </button>

      {canToggleFavorite && (
        <button
          type="button"
          className={
            isWishlisted
              ? 'customer-product-favorite wishlisted'
              : 'customer-product-favorite'
          }
          onClick={handleWishlistClick}
          aria-label={
            isWishlisted
              ? 'Remove from wishlist'
              : 'Add to wishlist'
          }
        >
          <Heart
            size={18}
            fill={
              isWishlisted
                ? 'currentColor'
                : 'none'
            }
          />
        </button>
      )}

      <div
        className={
          hasActions
            ? 'customer-product-actions'
            : 'customer-product-actions customer-product-actions-placeholder'
        }
      >
        {onAddToCart && (
          <button
            type="button"
            className="customer-product-add-cart"
            disabled={product.stock <= 0}
            onClick={() =>
              onAddToCart(product)
            }
          >
            <ShoppingCart size={16} />
            {product.stock > 0
              ? 'Add to Cart'
              : 'Out of Stock'}
          </button>
        )}
      </div>
    </article>
  );
}

function getCategoryLabel(
  product: Product,
) {
  const fromName =
    product.category?.name?.trim();

  if (fromName) {
    return fromName;
  }

  const fromSlug =
    product.category?.slug?.trim();

  if (fromSlug) {
    return fromSlug
      .replace(
        /[-_]+/g,
        ' ',
      )
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase(),
      );
  }

  return 'General';
}