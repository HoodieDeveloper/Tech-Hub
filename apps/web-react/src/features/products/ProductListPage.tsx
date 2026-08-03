import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ImagePlus, RefreshCw } from 'lucide-react';
import { API_URL, apiGet, apiPostForm } from '../../core/api/client';
import { ProductImage } from './ProductImage';
import type { Product } from './types';

type ProductForm = {
  name: string;
  description: string;
  price: string;
  stock: string;
};

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadProducts() {
    setLoading(true);
    setError('');

    try {
      const data = await apiGet<Product[]>('/products');
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedImage = event.target.files?.[0] ?? null;
    setError('');
    setSuccess('');

    if (!selectedImage) {
      setImage(null);
      setPreviewUrl('');
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(selectedImage.type)) {
      event.target.value = '';
      setImage(null);
      setPreviewUrl('');
      setError('Please choose a JPG, PNG, or WEBP image.');
      return;
    }

    if (selectedImage.size > MAX_IMAGE_SIZE) {
      event.target.value = '';
      setImage(null);
      setPreviewUrl('');
      setError('The product image must not be larger than 5 MB.');
      return;
    }

    setImage(selectedImage);
    setPreviewUrl(URL.createObjectURL(selectedImage));
  }

  function resetForm() {
    setForm(emptyForm);
    setImage(null);
    setPreviewUrl('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!image) {
      setError('Please choose a product image.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const data = new FormData();
    data.append('name', form.name.trim());
    data.append('description', form.description.trim());
    data.append('price', form.price);
    data.append('stock', form.stock);
    data.append('is_active', '1');
    data.append('image', image);

    try {
      const newProduct = await apiPostForm<Product>('/products', data);
      setProducts((currentProducts) => [newProduct, ...currentProducts]);
      resetForm();
      setSuccess(
        'Product and image saved. Laravel uploaded the image to Supabase, and the same URL is ready for React and Flutter.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p>Upload once from the web; display the same image on web and mobile.</p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={() => void loadProducts()}
          disabled={loading}
        >
          <RefreshCw size={17} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="connection-note">
        <strong>Connected API:</strong> <code>{API_URL}/products</code>
      </div>

      <div className="product-form-card">
        <div>
          <h3>Add a product</h3>
          <p className="helper-text">
            Choose an image from your computer. React sends the image to Laravel,
            Laravel uploads it to Supabase Storage, and the URL is saved automatically.
          </p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Product name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Example: USB-C Hub"
                required
              />
            </label>

            <label>
              Price (USD)
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={handleChange}
                placeholder="18.50"
                required
              />
            </label>

            <label>
              Stock
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={handleChange}
                placeholder="12"
                required
              />
            </label>

            <label className="full-width-field">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Example: 7-in-1 USB-C hub for laptops"
                rows={3}
              />
            </label>

            <label className="full-width-field image-file-field">
              Product image
              <span className="file-input-box">
                <ImagePlus size={22} />
                <span>
                  <strong>{image ? image.name : 'Choose JPG, PNG, or WEBP'}</strong>
                  <small>Maximum file size: 5 MB</small>
                </span>
                <input
                  ref={fileInputRef}
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  required
                />
              </span>
            </label>
          </div>

          {previewUrl && (
            <div className="preview-section">
              <span>Image preview</span>
              <ProductImage imageUrl={previewUrl} alt="New product preview" preview />
            </div>
          )}

          <button type="submit" disabled={saving}>
            {saving ? 'Uploading image and saving…' : 'Create Product'}
          </button>
        </form>

        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}
      </div>

      {loading && <p className="message">Loading products from Laravel…</p>}

      {!loading && !error && products.length === 0 && (
        <div className="empty-state">
          No products yet. Add the first product above.
        </div>
      )}

      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <ProductImage imageUrl={product.image_url} alt={product.name} />

            <div className="product-body">
              <h3>{product.name}</h3>
              <p>{product.description || 'No description yet.'}</p>

              <div className="product-meta">
                <strong>${Number(product.price).toFixed(2)}</strong>
                <span>Stock: {product.stock}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
