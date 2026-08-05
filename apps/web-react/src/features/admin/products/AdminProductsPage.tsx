import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';

import {
  apiDelete,
  apiGet,
} from '../../../core/api/client';

import { ProductImage } from '../../products/ProductImage';
import { DeleteProductModal } from './DeleteProductModal';

import type {
  Category,
  Product,
} from '../../products/types';

import { AdminProductFormPage } from './AdminProductFormPage';

import './ProductsPage.css';

type ProductView =
  | 'list'
  | 'add'
  | 'edit';

type CategoryResponse = {
  data: Category[];
};

type StatusFilter =
  | 'all'
  | 'active'
  | 'inactive'
  | 'low_stock'
  | 'out_of_stock';

export function AdminProductsPage() {
  const [view, setView] =
    useState<ProductView>('list');

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);
const [pendingDeleteProduct, setPendingDeleteProduct] =
  useState<Product | null>(null);

const [deleting, setDeleting] =
  useState(false);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [search, setSearch] =
    useState('');

  const [categoryFilter, setCategoryFilter] =
    useState('all');

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  async function loadProducts() {
    setLoading(true);
    setError('');

    try {
      const [
        productData,
        categoryData,
      ] = await Promise.all([
        apiGet<Product[]>('/admin/products'),

        apiGet<CategoryResponse>(
          '/admin/categories',
        ),
      ]);

      setProducts(productData);
      setCategories(categoryData.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load products.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  const summary = useMemo(() => {
    return {
      total: products.length,

      active: products.filter(
        (product) =>
          product.is_active !== false,
      ).length,

      lowStock: products.filter(
        (product) =>
          product.stock > 0 &&
          product.stock <= 5,
      ).length,

      outOfStock: products.filter(
        (product) =>
          product.stock === 0,
      ).length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        normalizedSearch === '' ||
        product.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        (product.description ?? '')
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === 'all' ||
        String(product.category_id) ===
          categoryFilter;

      let matchesStatus = true;

      if (statusFilter === 'active') {
        matchesStatus =
          product.is_active !== false;
      }

      if (statusFilter === 'inactive') {
        matchesStatus =
          product.is_active === false;
      }

      if (statusFilter === 'low_stock') {
        matchesStatus =
          product.stock > 0 &&
          product.stock <= 5;
      }

      if (statusFilter === 'out_of_stock') {
        matchesStatus =
          product.stock === 0;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    products,
    search,
    categoryFilter,
    statusFilter,
  ]);

 function openDeleteModal(product: Product) {
  setError('');
  setSuccess('');
  setPendingDeleteProduct(product);
}

function closeDeleteModal() {
  if (deleting) {
    return;
  }

  setPendingDeleteProduct(null);
}

async function confirmDelete() {
  if (!pendingDeleteProduct) {
    return;
  }

  const product = pendingDeleteProduct;

  setDeleting(true);
  setError('');
  setSuccess('');

  try {
    await apiDelete<{ message: string }>(
      `/admin/products/${product.id}`,
    );

    setProducts((current) =>
      current.filter(
        (item) => item.id !== product.id,
      ),
    );

    setPendingDeleteProduct(null);

    setSuccess(
      `${product.name} was deleted successfully.`,
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Unable to delete product.',
    );
  } finally {
    setDeleting(false);
  }
}

  function openAddPage() {
    setSelectedProduct(null);
    setError('');
    setSuccess('');
    setView('add');
  }

  function openEditPage(
    product: Product,
  ) {
    setSelectedProduct(product);
    setError('');
    setSuccess('');
    setView('edit');
  }

  function handleSaved(
    savedProduct: Product,
  ) {
    if (view === 'edit') {
      setProducts((current) =>
        current.map((product) =>
          product.id === savedProduct.id
            ? savedProduct
            : product,
        ),
      );

      setSuccess(
        `${savedProduct.name} was updated successfully.`,
      );
    } else {
      setProducts((current) => [
        savedProduct,
        ...current,
      ]);

      setSuccess(
        `${savedProduct.name} was created successfully.`,
      );
    }

    setSelectedProduct(null);
    setView('list');
  }

  function returnToList() {
    setSelectedProduct(null);
    setView('list');
  }

  if (
    view === 'add' ||
    view === 'edit'
  ) {
    return (
      <AdminProductFormPage
        product={
          view === 'edit'
            ? selectedProduct
            : null
        }
        onBack={returnToList}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <section className="admin-products-page">
      <div className="products-page-heading">
        <div>
          <h2>Product Management</h2>

          <p>
            Manage products, categories,
            stock and availability.
          </p>
        </div>

        <div className="products-heading-actions">
          <button
            type="button"
            className="products-refresh-button"
            onClick={() =>
              void loadProducts()
            }
            disabled={loading}
          >
            <RefreshCw size={18} />

            {loading
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

          <button
            type="button"
            className="products-primary-button"
            onClick={openAddPage}
          >
            <Plus size={19} />
            Add Product
          </button>
        </div>
      </div>

      {success && (
        <div className="products-alert success">
          {success}
        </div>
      )}

      {error && (
        <div className="products-alert error">
          {error}
        </div>
      )}

      <div className="products-summary-grid">
        <SummaryCard
          label="Total Products"
          value={summary.total}
          icon={Package}
        />

        <SummaryCard
          label="Active Products"
          value={summary.active}
          icon={CheckCircle2}
        />

        <SummaryCard
          label="Low Stock"
          value={summary.lowStock}
          icon={AlertTriangle}
        />

        <SummaryCard
          label="Out of Stock"
          value={summary.outOfStock}
          icon={Boxes}
        />
      </div>

      <section className="products-table-card">
        <div className="products-filters">
          <label className="products-search-box">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search products..."
            />
          </label>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value,
              )
            }
          >
            <option value="all">
              All Categories
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ),
            )}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as StatusFilter,
              )
            }
          >
            <option value="all">
              All Statuses
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

            <option value="low_stock">
              Low Stock
            </option>

            <option value="out_of_stock">
              Out of Stock
            </option>
          </select>
        </div>

        {loading && (
          <div className="products-empty-state">
            Loading products...
          </div>
        )}

        {!loading &&
          filteredProducts.length === 0 && (
            <div className="products-empty-state">
              No products match your filters.
            </div>
          )}

        {!loading &&
          filteredProducts.length > 0 && (
            <div className="products-table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map(
                    (product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="product-table-identity">
                            <ProductImage
                              imageUrl={
                                product.image_url
                              }
                              alt={
                                product.name
                              }
                            />

                            <div>
                              <strong>
                                {product.name}
                              </strong>

                              <span>
                                {product.description ||
                                  'No description'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="product-category-badge">
                            {product.category
                              ?.name ??
                              'Uncategorized'}
                          </span>
                        </td>

                        <td>
                          <strong>
                            $
                            {Number(
                              product.price,
                            ).toFixed(2)}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`product-stock ${
                              product.stock === 0
                                ? 'out'
                                : product.stock <= 5
                                  ? 'low'
                                  : 'available'
                            }`}
                          >
                            {product.stock}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`product-status ${
                              product.is_active === false
                                ? 'inactive'
                                : 'active'
                            }`}
                          >
                            {product.is_active === false
                              ? 'Inactive'
                              : 'Active'}
                          </span>
                        </td>

                        <td>
                          <div className="product-table-actions">
                            <button
                              type="button"
                              className="product-edit-button"
                              title="Edit product"
                              onClick={() =>
                                openEditPage(
                                  product,
                                )
                              }
                            >
                              <Pencil size={21} />
                            </button>

                          <button
  type="button"
  className="product-delete-button"
  title="Delete product"
  onClick={() =>
    openDeleteModal(product)
  }
>
  <Trash2 size={21} />
</button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}

{pendingDeleteProduct && (
  <DeleteProductModal
    product={pendingDeleteProduct}
    deleting={deleting}
    onCancel={closeDeleteModal}
    onConfirm={() => void confirmDelete()}
  />
)}
      </section>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Package;
}) {
  return (
    <article className="products-summary-card">
      <span className="products-summary-icon">
        <Icon size={23} />
      </span>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}