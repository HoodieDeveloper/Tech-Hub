import {
  useEffect,
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

type PaginatedProducts = {
  current_page: number;
  data: Product[];
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

type ProductSummary = {
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
};

export function AdminProductsPage() {
  const [view, setView] =
    useState<ProductView>('list');

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState<Product | null>(null);

  const [
    pendingDeleteProduct,
    setPendingDeleteProduct,
  ] = useState<Product | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [search, setSearch] =
    useState('');

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState('all');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StatusFilter>('all');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  /*
   * Pagination
   */
  const [currentPage, setCurrentPage] =
    useState(1);

  const [lastPage, setLastPage] =
    useState(1);

  const [totalResults, setTotalResults] =
    useState(0);

  /*
   * Dashboard summary.
   *
   * We load these counts separately so that
   * the cards still show totals for ALL
   * products instead of only the current
   * five products.
   */
  const [summary, setSummary] =
    useState<ProductSummary>({
      total: 0,
      active: 0,
      lowStock: 0,
      outOfStock: 0,
    });

  function buildProductsUrl(
    page: number,
  ) {
    const params =
      new URLSearchParams();

    params.set(
      'page',
      String(page),
    );

    const cleanSearch =
      search.trim();

    if (cleanSearch !== '') {
      params.set(
        'search',
        cleanSearch,
      );
    }

    if (
      categoryFilter !== 'all'
    ) {
      params.set(
        'category_id',
        categoryFilter,
      );
    }

    if (
      statusFilter !== 'all'
    ) {
      params.set(
        'status',
        statusFilter,
      );
    }

    return `/admin/products?${params.toString()}`;
  }

  async function loadProducts(
    page = currentPage,
  ) {
    setLoading(true);
    setError('');

    try {
      const productData =
        await apiGet<PaginatedProducts>(
          buildProductsUrl(page),
        );

      setProducts(
        productData.data,
      );

      setCurrentPage(
        productData.current_page,
      );

      setLastPage(
        productData.last_page,
      );

      setTotalResults(
        productData.total,
      );
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

  async function loadCategories() {
    try {
      const categoryData =
        await apiGet<CategoryResponse>(
          '/admin/categories',
        );

      setCategories(
        categoryData.data,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load categories.',
      );
    }
  }

  /*
   * Laravel pagination contains a "total"
   * value.
   *
   * We use that value to get the numbers
   * for the summary cards without loading
   * every product into React.
   */
  async function loadSummary() {
    try {
      const [
        allData,
        activeData,
        lowStockData,
        outOfStockData,
      ] = await Promise.all([
        apiGet<PaginatedProducts>(
          '/admin/products?page=1',
        ),

        apiGet<PaginatedProducts>(
          '/admin/products?page=1&status=active',
        ),

        apiGet<PaginatedProducts>(
          '/admin/products?page=1&status=low_stock',
        ),

        apiGet<PaginatedProducts>(
          '/admin/products?page=1&status=out_of_stock',
        ),
      ]);

      setSummary({
        total: allData.total,
        active: activeData.total,
        lowStock:
          lowStockData.total,
        outOfStock:
          outOfStockData.total,
      });
    } catch (err) {
      console.error(
        'Unable to load product summary.',
        err,
      );
    }
  }

  /*
   * Load categories and summary once.
   */
  useEffect(() => {
    void loadCategories();
    void loadSummary();
  }, []);

  /*
   * Reload products whenever the page
   * or filters change.
   *
   * Search uses a small delay so Laravel
   * is not called on every single
   * keyboard press immediately.
   */
  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadProducts(
          currentPage,
        );
      }, 300);

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    currentPage,
    search,
    categoryFilter,
    statusFilter,
  ]);

  function changePage(
    page: number,
  ) {
    if (
      page < 1 ||
      page > lastPage ||
      page === currentPage
    ) {
      return;
    }

    setCurrentPage(page);
  }

  function getPageNumbers() {
    const pages: number[] = [];

    /*
     * Show maximum 5 page buttons.
     *
     * Example:
     * Previous 1 2 3 4 5 Next
     */
    let startPage =
      Math.max(
        1,
        currentPage - 2,
      );

    let endPage =
      Math.min(
        lastPage,
        startPage + 4,
      );

    if (
      endPage - startPage < 4
    ) {
      startPage =
        Math.max(
          1,
          endPage - 4,
        );
    }

    for (
      let page = startPage;
      page <= endPage;
      page += 1
    ) {
      pages.push(page);
    }

    return pages;
  }

  function openDeleteModal(
    product: Product,
  ) {
    setError('');
    setSuccess('');

    setPendingDeleteProduct(
      product,
    );
  }

  function closeDeleteModal() {
    if (deleting) {
      return;
    }

    setPendingDeleteProduct(
      null,
    );
  }

  async function confirmDelete() {
    if (!pendingDeleteProduct) {
      return;
    }

    const product =
      pendingDeleteProduct;

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await apiDelete<{
        message: string;
      }>(
        `/admin/products/${product.id}`,
      );

      setPendingDeleteProduct(
        null,
      );

      setSuccess(
        `${product.name} was deleted successfully.`,
      );

      /*
       * If the last product on this
       * page was deleted, move back
       * one page.
       */
      if (
        products.length === 1 &&
        currentPage > 1
      ) {
        setCurrentPage(
          currentPage - 1,
        );
      } else {
        await loadProducts(
          currentPage,
        );
      }

      await loadSummary();
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
      setSuccess(
        `${savedProduct.name} was updated successfully.`,
      );

      setSelectedProduct(null);
      setView('list');

      void loadProducts(
        currentPage,
      );
    } else {
      setSuccess(
        `${savedProduct.name} was created successfully.`,
      );

      setSelectedProduct(null);
      setView('list');

      /*
       * New products are sorted newest
       * first, so return to page 1.
       */
      if (currentPage === 1) {
        void loadProducts(1);
      } else {
        setCurrentPage(1);
      }
    }

    void loadSummary();
  }

  function returnToList() {
    setSelectedProduct(null);
    setView('list');
  }

  async function refreshPage() {
    await Promise.all([
      loadProducts(
        currentPage,
      ),
      loadSummary(),
      loadCategories(),
    ]);
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
          <h2>
            Product Management
          </h2>

          <p>
            Manage products,
            categories, stock and
            availability.
          </p>
        </div>

        <div className="products-heading-actions">
          <button
            type="button"
            className="products-refresh-button"
            onClick={() =>
              void refreshPage()
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
          value={
            summary.outOfStock
          }
          icon={Boxes}
        />
      </div>

      <section className="products-table-card">
        <div className="products-filters">
          <label className="products-search-box">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value,
                );

                setCurrentPage(1);
              }}
              placeholder="Search products..."
            />
          </label>

          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(
                event.target.value,
              );

              setCurrentPage(1);
            }}
          >
            <option value="all">
              All Categories
            </option>

            {categories.map(
              (category) => (
                <option
                  key={
                    category.id
                  }
                  value={
                    category.id
                  }
                >
                  {category.name}
                </option>
              ),
            )}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target
                  .value as StatusFilter,
              );

              setCurrentPage(1);
            }}
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
          products.length === 0 && (
            <div className="products-empty-state">
              No products match your
              filters.
            </div>
          )}

        {!loading &&
          products.length > 0 && (
            <>
              <div className="products-table-wrapper">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>
                        Category
                      </th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map(
                      (product) => (
                        <tr
                          key={
                            product.id
                          }
                        >
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
                                  {
                                    product.name
                                  }
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
                              {product
                                .category
                                ?.name ??
                                'Uncategorized'}
                            </span>
                          </td>

                          <td>
                            <strong>
                              $
                              {Number(
                                product.price,
                              ).toFixed(
                                2,
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`product-stock ${
                                product.stock ===
                                0
                                  ? 'out'
                                  : product.stock <=
                                      5
                                    ? 'low'
                                    : 'available'
                              }`}
                            >
                              {
                                product.stock
                              }
                            </span>
                          </td>

                          <td>
                            <span
                              className={`product-status ${
                                product.is_active ===
                                false
                                  ? 'inactive'
                                  : 'active'
                              }`}
                            >
                              {product.is_active ===
                              false
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
                                <Pencil
                                  size={
                                    21
                                  }
                                />
                              </button>

                              <button
                                type="button"
                                className="product-delete-button"
                                title="Delete product"
                                onClick={() =>
                                  openDeleteModal(
                                    product,
                                  )
                                }
                              >
                                <Trash2
                                  size={
                                    21
                                  }
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="products-pagination">
                <div className="products-pagination-info">
                  Showing{' '}
                  {products.length}{' '}
                  of{' '}
                  {totalResults}{' '}
                  matching products
                </div>

                <div className="products-pagination-buttons">
                  <button
                    type="button"
                    onClick={() =>
                      changePage(
                        currentPage -
                          1,
                      )
                    }
                    disabled={
                      currentPage ===
                        1 ||
                      loading
                    }
                  >
                    ← Previous
                  </button>

                  {getPageNumbers().map(
                    (page) => (
                      <button
                        type="button"
                        key={page}
                        className={
                          page ===
                          currentPage
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          changePage(
                            page,
                          )
                        }
                        disabled={
                          loading
                        }
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      changePage(
                        currentPage +
                          1,
                      )
                    }
                    disabled={
                      currentPage ===
                        lastPage ||
                      loading
                    }
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}

        {pendingDeleteProduct && (
          <DeleteProductModal
            product={
              pendingDeleteProduct
            }
            deleting={deleting}
            onCancel={
              closeDeleteModal
            }
            onConfirm={() =>
              void confirmDelete()
            }
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