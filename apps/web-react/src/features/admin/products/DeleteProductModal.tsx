import {
  AlertTriangle,
  Trash2,
  X,
} from 'lucide-react';

import type { Product } from '../../products/types';

type Props = {
  product: Product;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteProductModal({
  product,
  deleting,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div
      className="product-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <section
        className="product-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-product-title"
      >
        <button
          type="button"
          className="product-modal-close"
          onClick={onCancel}
          disabled={deleting}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="product-delete-icon">
          <AlertTriangle size={30} />
        </div>

        <div className="product-delete-content">
          <h3 id="delete-product-title">
            Delete Product?
          </h3>

          <p>
            Are you sure you want to delete{' '}
            <strong>{product.name}</strong>?
          </p>

          <div className="product-delete-warning">
            <Trash2 size={17} />

            <span>
              This product and its Supabase image will be
              permanently removed.
            </span>
          </div>
        </div>

        <div className="product-delete-actions">
          <button
            type="button"
            className="products-cancel-button"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="product-confirm-delete-button"
            onClick={onConfirm}
            disabled={deleting}
          >
            <Trash2 size={18} />

            {deleting
              ? 'Deleting...'
              : 'Delete Product'}
          </button>
        </div>
      </section>
    </div>
  );
}