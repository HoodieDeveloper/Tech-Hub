import {
  useEffect,
  useRef,
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

import {
  ProductImage,
} from '../../products/ProductImage';

import {
  DeleteProductModal,
} from './DeleteProductModal';

import type {
  Category,
  Product,
} from '../../products/types';

import {
  AdminProductFormPage,
} from './AdminProductFormPage';

import './ProductsPage.css';

/*
 * =========================================
 * CACHE KEYS
 * =========================================
 */

const PRODUCTS_CACHE_PREFIX =
  'techhub_admin_products_cache:';

const PRODUCTS_UI_CACHE_KEY =
  'techhub_admin_products_ui';

const CATEGORIES_CACHE_KEY =
  'techhub_admin_categories_cache';

/*
 * =========================================
 * TYPES
 * =========================================
 */

type ProductView =
  | 'list'
  | 'add'
  | 'edit';

type StatusFilter =
  | 'all'
  | 'active'
  | 'inactive'
  | 'low_stock'
  | 'out_of_stock';

type CategoryResponse = {
  data: Category[];
};

type ProductSummary = {
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
};

type PaginatedProducts = {
  current_page: number;
  data: Product[];
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
  summary: ProductSummary;
};

type CachedProducts = {
  response: PaginatedProducts;
  loadedIn: number;
};

type ProductUiState = {
  currentPage: number;
  search: string;
  categoryFilter: string;
  statusFilter: StatusFilter;
};

/*
 * =========================================
 * CACHE HELPERS
 * =========================================
 */

function readUiCache(): ProductUiState {
  try {
    const raw =
      sessionStorage.getItem(
        PRODUCTS_UI_CACHE_KEY,
      );

    if (!raw) {
      throw new Error();
    }

    const parsed =
      JSON.parse(
        raw,
      ) as ProductUiState;

    return {
      currentPage:
        parsed.currentPage || 1,

      search:
        parsed.search || '',

      categoryFilter:
        parsed.categoryFilter ||
        'all',

      statusFilter:
        parsed.statusFilter ||
        'all',
    };
  } catch {
    return {
      currentPage: 1,
      search: '',
      categoryFilter: 'all',
      statusFilter: 'all',
    };
  }
}

function saveUiCache(
  state: ProductUiState,
) {
  sessionStorage.setItem(
    PRODUCTS_UI_CACHE_KEY,
    JSON.stringify(
      state,
    ),
  );
}

function getProductsCache(
  url: string,
): CachedProducts | null {
  try {
    const raw =
      sessionStorage.getItem(
        PRODUCTS_CACHE_PREFIX +
          url,
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(
      raw,
    ) as CachedProducts;
  } catch {
    return null;
  }
}

function saveProductsCache(
  url: string,
  data: CachedProducts,
) {
  sessionStorage.setItem(
    PRODUCTS_CACHE_PREFIX +
      url,
    JSON.stringify(
      data,
    ),
  );
}

function clearProductsCache() {
  const keys: string[] =
    [];

  for (
    let index = 0;
    index <
    sessionStorage.length;
    index += 1
  ) {
    const key =
      sessionStorage.key(
        index,
      );

    if (
      key?.startsWith(
        PRODUCTS_CACHE_PREFIX,
      )
    ) {
      keys.push(
        key,
      );
    }
  }

  keys.forEach(
    (key) => {
      sessionStorage.removeItem(
        key,
      );
    },
  );
}

function readCategoriesCache():
  Category[] | null {
  try {
    const raw =
      sessionStorage.getItem(
        CATEGORIES_CACHE_KEY,
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(
      raw,
    ) as Category[];
  } catch {
    return null;
  }
}

/*
 * =========================================
 * PAGE
 * =========================================
 */

export function AdminProductsPage() {
  const initialUi =
    useRef(
      readUiCache(),
    ).current;

  const [
    view,
    setView,
  ] =
    useState<ProductView>(
      'list',
    );

  const [
    selectedProduct,
    setSelectedProduct,
  ] =
    useState<Product | null>(
      null,
    );

  const [
    pendingDeleteProduct,
    setPendingDeleteProduct,
  ] =
    useState<Product | null>(
      null,
    );

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  /*
   * =========================================
   * FILTER STATE
   * =========================================
   */

  const [
    search,
    setSearch,
  ] =
    useState(
      initialUi.search,
    );

  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState(
      initialUi.categoryFilter,
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      initialUi.statusFilter,
    );

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(
      initialUi.currentPage,
    );

  /*
   * Build initial URL before
   * creating product state.
   */
  function buildUrlFromValues(
    page: number,
    searchValue: string,
    categoryValue: string,
    statusValue: StatusFilter,
  ) {
    const params =
      new URLSearchParams();

    params.set(
      'page',
      String(page),
    );

    const cleanSearch =
      searchValue.trim();

    if (
      cleanSearch !== ''
    ) {
      params.set(
        'search',
        cleanSearch,
      );
    }

    if (
      categoryValue !==
      'all'
    ) {
      params.set(
        'category_id',
        categoryValue,
      );
    }

    if (
      statusValue !==
      'all'
    ) {
      params.set(
        'status',
        statusValue,
      );
    }

    return `/admin/products?${params.toString()}`;
  }

  const initialUrl =
    useRef(
      buildUrlFromValues(
        initialUi.currentPage,
        initialUi.search,
        initialUi.categoryFilter,
        initialUi.statusFilter,
      ),
    ).current;

  const initialCache =
    useRef(
      getProductsCache(
        initialUrl,
      ),
    ).current;

  /*
   * =========================================
   * PRODUCT STATE
   * =========================================
   */

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>(
      initialCache
        ?.response.data ??
        [],
    );

  const [
    categories,
    setCategories,
  ] =
    useState<Category[]>(
      () =>
        readCategoriesCache() ??
        [],
    );

  const [
    lastPage,
    setLastPage,
  ] =
    useState(
      initialCache
        ?.response.last_page ??
        1,
    );

  const [
    totalResults,
    setTotalResults,
  ] =
    useState(
      initialCache
        ?.response.total ??
        0,
    );

  const [
    summary,
    setSummary,
  ] =
    useState<ProductSummary>(
      initialCache
        ?.response.summary ??
        {
          total: 0,
          active: 0,
          lowStock: 0,
          outOfStock: 0,
        },
    );

  const [
    loadedIn,
    setLoadedIn,
  ] =
    useState<number | null>(
      initialCache
        ?.loadedIn ??
        null,
    );

  /*
   * If cached data exists,
   * don't show loading screen.
   */
  const [
    loading,
    setLoading,
  ] =
    useState(
      initialCache === null,
    );

  const [
    error,
    setError,
  ] =
    useState('');

  const [
    success,
    setSuccess,
  ] =
    useState('');

  /*
   * Prevent first useEffect
   * from fetching again when
   * cache already exists.
   */
  const skipInitialFetch =
    useRef(
      initialCache !== null,
    );

  /*
   * =========================================
   * URL
   * =========================================
   */

  function buildProductsUrl(
    page: number,
  ) {
    return buildUrlFromValues(
      page,
      search,
      categoryFilter,
      statusFilter,
    );
  }

  /*
   * =========================================
   * APPLY PRODUCT RESPONSE
   * =========================================
   */

  function applyProductData(
    productData: PaginatedProducts,
    loadSeconds: number,
  ) {
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

    setSummary(
      productData.summary,
    );

    setLoadedIn(
      loadSeconds,
    );
  }

  /*
   * =========================================
   * LOAD PRODUCTS
   * =========================================
   */

  async function loadProducts(
    page = currentPage,
    force = false,
  ) {
    const url =
      buildProductsUrl(
        page,
      );

    /*
     * IMPORTANT:
     *
     * If we already fetched this exact
     * page/filter/search before,
     * use sessionStorage instead.
     */
    if (!force) {
      const cached =
        getProductsCache(
          url,
        );

      if (cached) {
        applyProductData(
          cached.response,
          cached.loadedIn,
        );

        setLoading(
          false,
        );

        return;
      }
    }

    setLoading(true);
    setError('');

    const startedAt =
      performance.now();

    try {
      const productData =
        await apiGet<PaginatedProducts>(
          url,
        );

      const seconds =
        (
          (
            performance.now() -
            startedAt
          ) /
          1000
        );

      applyProductData(
        productData,
        seconds,
      );

      /*
       * Save this exact response.
       */
      saveProductsCache(
        url,
        {
          response:
            productData,

          loadedIn:
            seconds,
        },
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

  /*
   * =========================================
   * LOAD CATEGORIES
   * =========================================
   */

  async function loadCategories(
    force = false,
  ) {
    if (!force) {
      const cached =
        readCategoriesCache();

      if (cached) {
        setCategories(
          cached,
        );

        return;
      }
    }

    try {
      const categoryData =
        await apiGet<CategoryResponse>(
          '/admin/categories',
        );

      setCategories(
        categoryData.data,
      );

      sessionStorage.setItem(
        CATEGORIES_CACHE_KEY,
        JSON.stringify(
          categoryData.data,
        ),
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
   * =========================================
   * SAVE UI STATE
   * =========================================
   */

  useEffect(() => {
    saveUiCache({
      currentPage,
      search,
      categoryFilter,
      statusFilter,
    });
  }, [
    currentPage,
    search,
    categoryFilter,
    statusFilter,
  ]);

  /*
   * =========================================
   * INITIAL CATEGORIES
   * =========================================
   */

  useEffect(() => {
    void loadCategories();
  }, []);

  /*
   * =========================================
   * PRODUCT FETCH
   * =========================================
   */

  useEffect(() => {
    /*
     * First mount after returning to
     * Products:
     *
     * Cache exists → NO API REQUEST.
     */
    if (
      skipInitialFetch.current
    ) {
      skipInitialFetch.current =
        false;

      return;
    }

    /*
     * Search keeps 300ms debounce.
     */
    const delay =
      search.trim() !== ''
        ? 300
        : 0;

    const timer =
      window.setTimeout(
        () => {
          void loadProducts(
            currentPage,
          );
        },
        delay,
      );

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

  /*
   * =========================================
   * PAGINATION
   * =========================================
   */

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

    setCurrentPage(
      page,
    );
  }

  function getPageNumbers() {
    const pages: number[] =
      [];

    let startPage =
      Math.max(
        1,
        currentPage - 2,
      );

    const endPage =
      Math.min(
        lastPage,
        startPage + 4,
      );

    if (
      endPage -
        startPage <
      4
    ) {
      startPage =
        Math.max(
          1,
          endPage - 4,
        );
    }

    for (
      let page =
        startPage;
      page <= endPage;
      page += 1
    ) {
      pages.push(
        page,
      );
    }

    return pages;
  }

  /*
   * =========================================
   * DELETE
   * =========================================
   */

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
    if (
      !pendingDeleteProduct
    ) {
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
       * Database changed.
       * Old product cache is now stale.
       */
      clearProductsCache();

      if (
        products.length ===
          1 &&
        currentPage > 1
      ) {
        setCurrentPage(
          currentPage - 1,
        );
      } else {
        await loadProducts(
          currentPage,
          true,
        );
      }
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

  /*
   * =========================================
   * ADD / EDIT
   * =========================================
   */

  function openAddPage() {
    setSelectedProduct(
      null,
    );

    setError('');
    setSuccess('');

    setView(
      'add',
    );
  }

  function openEditPage(
    product: Product,
  ) {
    setSelectedProduct(
      product,
    );

    setError('');
    setSuccess('');

    setView(
      'edit',
    );
  }

  function handleSaved(
    savedProduct: Product,
  ) {
    /*
     * Product changed in database,
     * so invalidate old cache.
     */
    clearProductsCache();

    if (
      view === 'edit'
    ) {
      setSuccess(
        `${savedProduct.name} was updated successfully.`,
      );

      setSelectedProduct(
        null,
      );

      setView(
        'list',
      );

      void loadProducts(
        currentPage,
        true,
      );

      return;
    }

    setSuccess(
      `${savedProduct.name} was created successfully.`,
    );

    setSelectedProduct(
      null,
    );

    setView(
      'list',
    );

    if (
      currentPage === 1
    ) {
      void loadProducts(
        1,
        true,
      );
    } else {
      setCurrentPage(
        1,
      );
    }
  }

  function returnToList() {
    setSelectedProduct(
      null,
    );

    setView(
      'list',
    );
  }

  /*
   * =========================================
   * MANUAL REFRESH
   * =========================================
   */

  async function refreshPage() {
    /*
     * Refresh means:
     * ignore cache and get fresh data.
     */
    clearProductsCache();

    sessionStorage.removeItem(
      CATEGORIES_CACHE_KEY,
    );

    await Promise.all([
      loadProducts(
        currentPage,
        true,
      ),

      loadCategories(
        true,
      ),
    ]);
  }

  /*
   * =========================================
   * ADD / EDIT PAGE
   * =========================================
   */

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

      categories={
        categories
      }

      onBack={
        returnToList
      }

      onSaved={
        handleSaved
      }
    />
    );
  }

  /*
   * =========================================
   * LIST PAGE
   * =========================================
   */

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
            disabled={
              loading
            }
          >
            <RefreshCw
              size={18}
            />

            {loading
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

          <button
            type="button"
            className="products-primary-button"
            onClick={
              openAddPage
            }
          >
            <Plus
              size={19}
            />

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

      {/* SUMMARY */}

      <div className="products-summary-grid">
        <SummaryCard
          label="Total Products"
          value={
            summary.total
          }
          icon={
            Package
          }
        />

        <SummaryCard
          label="Active Products"
          value={
            summary.active
          }
          icon={
            CheckCircle2
          }
        />

        <SummaryCard
          label="Low Stock"
          value={
            summary.lowStock
          }
          icon={
            AlertTriangle
          }
        />

        <SummaryCard
          label="Out of Stock"
          value={
            summary.outOfStock
          }
          icon={
            Boxes
          }
        />
      </div>

      {/* TABLE */}

      <section className="products-table-card">
        <div className="products-filters">
          <label className="products-search-box">
            <Search
              size={18}
            />

            <input
              value={
                search
              }
              onChange={(
                event,
              ) => {
                setSearch(
                  event.target
                    .value,
                );

                setCurrentPage(
                  1,
                );
              }}
              placeholder="Search products..."
            />
          </label>

          <select
            value={
              categoryFilter
            }
            onChange={(
              event,
            ) => {
              setCategoryFilter(
                event.target
                  .value,
              );

              setCurrentPage(
                1,
              );
            }}
          >
            <option value="all">
              All Categories
            </option>

            {categories.map(
              (
                category,
              ) => (
                <option
                  key={
                    category.id
                  }
                  value={
                    category.id
                  }
                >
                  {
                    category.name
                  }
                </option>
              ),
            )}
          </select>

          <select
            value={
              statusFilter
            }
            onChange={(
              event,
            ) => {
              setStatusFilter(
                event.target
                  .value as StatusFilter,
              );

              setCurrentPage(
                1,
              );
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

        {loading &&
          products.length ===
            0 && (
            <div className="products-empty-state">
              Loading products...
            </div>
          )}

        {!loading &&
          products.length ===
            0 && (
            <div className="products-empty-state">
              No products match
              your filters.
            </div>
          )}

        {products.length >
          0 && (
          <>
            <div className="products-table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>
                      Product
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Price
                    </th>

                    <th>
                      Stock
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.map(
                    (
                      product,
                    ) => (
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

            {/* PAGINATION */}

            <div className="products-pagination">
              <div className="products-pagination-info">
                Showing{' '}
                {
                  products.length
                }{' '}
                of{' '}
                {
                  totalResults
                }{' '}
                matching products

                {loadedIn !==
                  null && (
                  <>
                    {' '}
                    · Loaded in{' '}
                    {
                      loadedIn.toFixed(
                        2,
                      )
                    }
                    s
                  </>
                )}
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
                  (
                    page,
                  ) => (
                    <button
                      type="button"
                      key={
                        page
                      }
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
                      {
                        page
                      }
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

            deleting={
              deleting
            }

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

/*
 * =========================================
 * SUMMARY CARD
 * =========================================
 */

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
        <Icon
          size={23}
        />
      </span>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>
    </article>
  );
}