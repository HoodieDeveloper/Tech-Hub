import {
  useEffect,
  useState,
} from 'react';

import type {
  ChangeEvent,
  FormEvent,
} from 'react';

import {
  ArrowLeft,
  ImagePlus,
  Save,
} from 'lucide-react';

import {
  apiPostForm,
  apiUpdateForm,
} from '../../../core/api/client';

import { ProductImage } from '../../products/ProductImage';

import type {
  Category,
  Product,
} from '../../products/types';

type Props = {
  product?: Product | null;
  categories: Category[];
  onBack: () => void;
  onSaved: (
    product: Product,
    saveDurationMs: number,
  ) => void;
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  isActive: boolean;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export function AdminProductFormPage({
  product = null,
  categories,
  onBack,
  onSaved,
}: Props) {
  const isEditing = product !== null;

  const [form, setForm] = useState<ProductForm>({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product
      ? String(product.price)
      : '',
    stock: product
      ? String(product.stock)
      : '',
    categoryId: product?.category_id
      ? String(product.category_id)
      : '',
    isActive:
      product?.is_active !== false,
  });

  const [image, setImage] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState(product?.image_url ?? '');

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const activeCategories =
    categories.filter(
      (category) =>
        category.is_active !== false,
    );

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleChange(
    event: ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleActiveChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setForm((current) => ({
      ...current,
      isActive: event.target.checked,
    }));
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedImage =
      event.target.files?.[0] ?? null;

    setError('');

    if (!selectedImage) {
      setImage(null);

      setPreviewUrl(
        product?.image_url ?? '',
      );

      return;
    }

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        selectedImage.type,
      )
    ) {
      event.target.value = '';

      setError(
        'Please choose a JPG, PNG, or WEBP image.',
      );

      return;
    }

    if (selectedImage.size > MAX_IMAGE_SIZE) {
      event.target.value = '';

      setError(
        'The product image must not be larger than 5 MB.',
      );

      return;
    }

    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setImage(selectedImage);

    setPreviewUrl(
      URL.createObjectURL(selectedImage),
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.categoryId) {
      setError('Please select a category.');
      return;
    }

    if (!isEditing && !image) {
      setError('Please choose a product image.');
      return;
    }

    setSaving(true);
    setError('');

    const saveStartedAt =
      performance.now();

    const data = new FormData();

    data.append(
      'name',
      form.name.trim(),
    );

    data.append(
      'description',
      form.description.trim(),
    );

    data.append('price', form.price);
    data.append('stock', form.stock);

    data.append(
      'category_id',
      form.categoryId,
    );

    data.append(
      'is_active',
      form.isActive ? '1' : '0',
    );

    if (image) {
      data.append('image', image);
    }

    try {
      const savedProduct = isEditing
        ? await apiUpdateForm<Product>(
            `/admin/products/${product.id}`,
            data,
          )
        : await apiPostForm<Product>(
            '/admin/products',
            data,
          );

      onSaved(
        savedProduct,
        performance.now() -
          saveStartedAt,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditing
            ? 'Failed to update product.'
            : 'Failed to create product.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-product-form-page">
      <div className="products-page-heading">
        <button
          type="button"
          className="products-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          Back to products
        </button>

        <div>
          <h2>
            {isEditing
              ? 'Edit Product'
              : 'Add New Product'}
          </h2>

          <p>
            {isEditing
              ? 'Update product information, category, stock and image.'
              : 'Add product information, category, stock and image.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="products-alert error">
          {error}
        </div>
      )}

      <form
        className="admin-product-form"
        onSubmit={handleSubmit}
      >
        <div className="product-form-main">
          <section className="product-form-section">
            <div className="product-form-section-heading">
              <h3>Product Information</h3>

              <p>
                Enter the main information for this
                product.
              </p>
            </div>

            <div className="product-form-fields">
              <label className="product-field full-width">
                <span>Product Name *</span>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Example: ASUS Gaming Laptop"
                  required
                />
              </label>

              <label className="product-field full-width">
                <span>Description</span>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Write a short product description"
                  rows={5}
                />
              </label>

              <label className="product-field">
                <span>Category *</span>

                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  disabled={
                    activeCategories.length ===
                    0
                  }
                  required
                >
                  <option value="">
                    {activeCategories.length ===
                    0
                      ? 'No categories available'
                      : 'Select category'}
                  </option>

                  {activeCategories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="product-field">
                <span>Price (USD) *</span>

                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </label>

              <label className="product-field">
                <span>Stock Quantity *</span>

                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="0"
                  required
                />
              </label>

              <label className="product-active-field">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={handleActiveChange}
                />

                <span>
                  <strong>Active Product</strong>

                  <small>
                    Customers can see this product.
                  </small>
                </span>
              </label>
            </div>
          </section>
        </div>

        <aside className="product-form-sidebar">
          <section className="product-form-section">
            <div className="product-form-section-heading">
              <h3>Product Image</h3>

              <p>
                {isEditing
                  ? 'Choose a new image only when replacing the current image.'
                  : 'Upload JPG, PNG or WEBP up to 5 MB.'}
              </p>
            </div>

            <label className="product-image-uploader">
              {previewUrl ? (
                <ProductImage
                  imageUrl={previewUrl}
                  alt="Product preview"
                  preview
                />
              ) : (
                <span className="product-image-placeholder">
                  <ImagePlus size={34} />

                  <strong>
                    Choose product image
                  </strong>

                  <small>
                    Click to browse your computer
                  </small>
                </span>
              )}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />
            </label>

            {image && (
              <p className="selected-image-name">
                New image: {image.name}
              </p>
            )}
          </section>

          <div className="product-form-actions">
            <button
              type="button"
              className="products-cancel-button"
              onClick={onBack}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="products-primary-button"
              disabled={
                saving
              }
            >
              <Save size={18} />

              {saving
                ? isEditing
                  ? 'Updating product...'
                  : 'Saving product...'
                : isEditing
                  ? 'Update Product'
                  : 'Save Product'}
            </button>
          </div>
        </aside>
      </form>
    </section>
  );
}