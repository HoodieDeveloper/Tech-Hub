import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { apiGet, apiPost } from '../../core/api/client';
import type { Product } from './types';

type ProductForm = {
  name: string;
  description: string;
  price: string;
  stock: string;
  image_url: string;
};

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  image_url: '',
};

export function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    loadProducts();
  }, []);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const newProduct = await apiPost<Product>('/products', {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        stock: Number(form.stock),
        image_url: form.image_url || null,
        is_active: true,
      });

      setProducts((currentProducts) => [newProduct, ...currentProducts]);
      setForm(emptyForm);
      setSuccess('Product added successfully.');
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
          <p>Products from Laravel API and Supabase database.</p>
        </div>
      </div>

      <div className="product-form-card">
        <h3>Add Product</h3>

        <form className="form" onSubmit={handleSubmit}>
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
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Example: 7-in-1 USB-C hub for laptop"
            />
          </label>

          <label>
            Price
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
              value={form.stock}
              onChange={handleChange}
              placeholder="12"
              required
            />
          </label>

          <label>
            Image URL
            <input
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="https://placehold.co/600x400?text=Product"
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? 'Adding...' : 'Add Product'}
          </button>
        </form>

        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}
      </div>

      {loading && <p className="message">Loading products...</p>}

      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-image">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} />
              ) : (
                'No Image'
              )}
            </div>

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