import React, { useEffect, useState } from 'react';
import api from '../api';
import ProductForm from '../components/ProductForm.jsx';

function money(n) {
  return (Number(n) || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2
  });
}

function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="toast">
      {message}
    </div>
  );
}

export default function Admin({
  settings,
  onSettingsSaved
}) {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem('adminToken')
  );

  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('All');

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [toast, setToast] = useState('');

  const [deletingOrder, setDeletingOrder] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  const [form, setForm] = useState({
    storeName: settings.storeName,
    tagline: settings.tagline,
    upiId: settings.upiId || '',
    payeeName: settings.payeeName || '',
    shippingCharge: settings.shippingCharge ?? 0,
    phone: settings.phone || '',
    whatsapp: settings.whatsapp || '',
    email: settings.email || '',
    address: settings.address || '',
    city: settings.city || '',
    state: settings.state || '',
    pincode: settings.pincode || '',
    instagram: settings.instagram || '',
    facebook: settings.facebook || '',
    googleMaps: settings.googleMaps || '',
    aboutText: settings.aboutText || '',
    newPasscode: ''
  });

  const [settingsErr, setSettingsErr] =
    useState('');

  // =====================================================
  // SETTINGS
  // =====================================================

  useEffect(() => {
    function handleUnauthorized() {
      setLoggedIn(false);
      setLoginError('Your admin session expired. Please log in again.');
      setOrders([]);
      setProducts([]);
    }

    window.addEventListener('adminUnauthorized', handleUnauthorized);
    return () => window.removeEventListener('adminUnauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      storeName: settings.storeName,
      tagline: settings.tagline,
      upiId: settings.upiId || '',
      payeeName: settings.payeeName || '',
      shippingCharge: settings.shippingCharge ?? 0,
      phone: settings.phone || '',
      whatsapp: settings.whatsapp || '',
      email: settings.email || '',
      address: settings.address || '',
      city: settings.city || '',
      state: settings.state || '',
      pincode: settings.pincode || '',
      instagram: settings.instagram || '',
      facebook: settings.facebook || '',
      googleMaps: settings.googleMaps || '',
      aboutText: settings.aboutText || ''
    }));
  }, [settings]);

  function showToast(msg) {
    setToast(msg);

    setTimeout(() => {
      setToast('');
    }, 2200);
  }

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  async function loadProducts(page = productPage) {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (productCategory !== 'All') params.set('category', productCategory);
      if (productSearch.trim()) params.set('search', productSearch.trim());

      const res = await api.get(`/products?${params.toString()}`);
      const data = res.data || {};
      const list = Array.isArray(data) ? data : (data.products || []);
      const pagination = data.pagination || { page, total: list.length, totalPages: 1 };

      setProducts(list);
      setProductTotal(pagination.total || 0);
      setProductTotalPages(pagination.totalPages || 1);
    } catch (err) {
      console.error('Could not load products:', err);
      setProducts([]);
      setProductTotal(0);
      setProductTotalPages(1);
    }
  }

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  async function loadOrders() {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Could not load orders:', err);
    }
  }

  useEffect(() => {
    if (loggedIn) {
      loadProducts(productPage);
    }
  }, [loggedIn, productPage, productCategory, productSearch]);

  useEffect(() => {
    if (loggedIn) {
      loadOrders();
    }
  }, [loggedIn]);

  // =====================================================
  // UPDATE ORDER STATUS
  // =====================================================

  async function updateOrderStatus(id, status) {
    try {
      await api.put(`/orders/${id}`, {
        status
      });

      await loadOrders();

      showToast('Order updated');
    } catch (err) {
      showToast(
        err.response?.data?.error ||
        'Could not update order.'
      );
    }
  }

  // =====================================================
  // DELETE ORDER
  // =====================================================

  async function deleteOrder() {
    if (!deletingOrder) return;

    setDeleting(true);

    try {
      await api.delete(
        `/orders/${deletingOrder._id}`
      );

      setOrders((prev) =>
        prev.filter(
          (order) =>
            order._id !== deletingOrder._id
        )
      );

      setDeletingOrder(null);

      showToast('Order deleted');

    } catch (err) {
      showToast(
        err.response?.data?.error ||
        'Could not delete order.'
      );
    } finally {
      setDeleting(false);
    }
  }

  // =====================================================
  // LOGIN
  // =====================================================

  async function handleLogin() {
    try {
      const res = await api.post(
        '/auth/login',
        {
          passcode
        }
      );

      localStorage.setItem(
        'adminToken',
        res.data.token
      );

      setLoggedIn(true);
      setLoginError('');

    } catch (err) {
      setLoginError(
        err.response?.data?.error ||
        'Wrong passcode. Try again.'
      );
    }
  }

  // =====================================================
  // SAVE SETTINGS
  // =====================================================

  async function saveSettings() {
    try {
      await api.put(
        '/settings',
        form
      );

      setSettingsErr('');

      showToast('Settings saved');

      onSettingsSaved();

    } catch (err) {
      setSettingsErr(
        err.response?.data?.error ||
        "Couldn't save settings."
      );
    }
  }

  // =====================================================
  // ADD PRODUCT
  // =====================================================

  async function addProduct(data) {
    try {
      await api.post(
        '/products',
        data
      );

      setEditingProduct(null);
      setProductPage(1);
      showToast('Product added');

    } catch (err) {
      showToast(
        err.response?.data?.error ||
        'Could not add product.'
      );
    }
  }

  // =====================================================
  // UPDATE PRODUCT
  // =====================================================

  async function updateProduct(
    id,
    data
  ) {
    try {
      await api.put(
        `/products/${id}`,
        data
      );

      setEditingProduct(null);
      showToast('Changes saved');

    } catch (err) {
      showToast(
        err.response?.data?.error ||
        'Could not save changes.'
      );
    }
  }

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  async function deleteProduct(id) {
    if (
      !window.confirm(
        'Delete this product? This cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/products/${id}`
      );

      if (products.length === 1 && productPage > 1) {
        setProductPage((page) => page - 1);
      } else {
        loadProducts(productPage);
      }

      showToast('Product deleted');

    } catch (err) {
      showToast(
        err.response?.data?.error ||
        'Could not delete product.'
      );
    }
  }

  // =====================================================
  // LOGIN PAGE
  // =====================================================

  if (!loggedIn) {
    return (
      <main>
        <div className="lock">

          <div
            className="display"
            style={{
              fontSize: 22,
              marginBottom: 6
            }}
          >
            Admin access
          </div>

          <p>
            Enter the store passcode to manage
            products and settings.
          </p>

          <input
            type="password"
            placeholder="Passcode"
            value={passcode}
            onChange={(e) =>
              setPasscode(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              handleLogin()
            }
            style={{
              marginBottom: 10
            }}
          />

          {loginError && (
            <div className="field-err">
              {loginError}
            </div>
          )}

          <button
            className="btn block"
            style={{
              marginTop: 12
            }}
            onClick={handleLogin}
          >
            Unlock
          </button>

        </div>
      </main>
    );
  }

  // =====================================================
  // ADD PRODUCT PAGE
  // =====================================================

  if (editingProduct === 'new') {
    return (
      <main>

        <ProductForm
          submitLabel="Add product"
          onSubmit={addProduct}
          onCancel={() =>
            setEditingProduct(null)
          }
        />

      </main>
    );
  }

  // =====================================================
  // EDIT PRODUCT PAGE
  // =====================================================

  if (editingProduct) {
    return (
      <main>

        <ProductForm
          initial={editingProduct}
          submitLabel="Save changes"
          onSubmit={(data) =>
            updateProduct(
              editingProduct._id,
              data
            )
          }
          onCancel={() =>
            setEditingProduct(null)
          }
        />

      </main>
    );
  }

  // =====================================================
  // ADMIN DASHBOARD
  // =====================================================

  return (
    <main>

      {/* =================================================
          STORE SETTINGS
      ================================================= */}

      <div className="panel">

        <h2>
          Store settings
        </h2>

        <p className="sub">
          Your shop name, and the UPI ID
          payments should go to.
        </p>

        <label>
          Store name
        </label>

        <input
          value={form.storeName}
          onChange={(e) =>
            setForm({
              ...form,
              storeName: e.target.value
            })
          }
        />

        <label>
          Tagline
        </label>

        <input
          value={form.tagline}
          onChange={(e) =>
            setForm({
              ...form,
              tagline: e.target.value
            })
          }
        />

        <label>
          UPI ID
          (e.g. yourname@okhdfcbank)
        </label>

        <input
          value={form.upiId}
          onChange={(e) =>
            setForm({
              ...form,
              upiId: e.target.value
            })
          }
          placeholder="yourname@bank"
        />

        <label>
          Payee name shown to buyers
        </label>

        <input
          value={form.payeeName}
          onChange={(e) =>
            setForm({
              ...form,
              payeeName: e.target.value
            })
          }
          placeholder={form.storeName}
        />

        <label>
          Delivery / shipping charge (₹)
        </label>

        <input
          type="number"
          min="0"
          step="0.01"
          value={form.shippingCharge}
          onChange={(e) =>
            setForm({
              ...form,
              shippingCharge: e.target.value
            })
          }
          placeholder="0"
        />

        <p className="sub">
          This amount is added to the customer's order total. Use 0 for free delivery.
        </p>

        <label>
          Change admin passcode
          (leave blank to keep current)
        </label>

        <input
          type="password"
          value={form.newPasscode}
          onChange={(e) =>
            setForm({
              ...form,
              newPasscode: e.target.value
            })
          }
          placeholder="New passcode"
        />

        {settingsErr && (
          <div className="field-err">
            {settingsErr}
          </div>
        )}

        <div className="panel-foot">

          <button
            className="btn"
            onClick={saveSettings}
          >
            Save settings
          </button>

        </div>

      </div>



      {/* =================================================
          SHOP INFORMATION / CONTACT
      ================================================= */}

      <div className="panel">
        <div className="admin-section-heading">
          <div>
            <span className="admin-eyebrow">CUSTOMER INFORMATION</span>
            <h2>Shop information</h2>
          </div>
          <span className="admin-section-icon">✦</span>
        </div>

        <p className="sub">
          These details appear automatically in your shop's Contact, About and Help sections.
        </p>

        <div className="admin-form-grid">
          <div>
            <label>Phone number</label>
            <input value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210" />
          </div>
          <div>
            <label>WhatsApp number</label>
            <input value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="919876543210" />
          </div>
          <div>
            <label>Email</label>
            <input type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="shop@example.com" />
          </div>
          <div>
            <label>PIN code</label>
            <input value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              placeholder="422001" />
          </div>
        </div>

        <label>Shop address</label>
        <textarea value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Enter your shop or delivery address" />

        <div className="admin-form-grid">
          <div>
            <label>City</label>
            <input value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Nashik" />
          </div>
          <div>
            <label>State</label>
            <input value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="Maharashtra" />
          </div>
        </div>

        <label>About the shop</label>
        <textarea value={form.aboutText}
          onChange={(e) => setForm({ ...form, aboutText: e.target.value })}
          placeholder="Tell customers about your shop, handmade products or your story." />

        <div className="admin-form-grid">
          <div>
            <label>Instagram link</label>
            <input value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="https://instagram.com/yourshop" />
          </div>
          <div>
            <label>Facebook link</label>
            <input value={form.facebook}
              onChange={(e) => setForm({ ...form, facebook: e.target.value })}
              placeholder="https://facebook.com/yourshop" />
          </div>
        </div>

        <label>Google Maps link</label>
        <input value={form.googleMaps}
          onChange={(e) => setForm({ ...form, googleMaps: e.target.value })}
          placeholder="Paste your Google Maps shop link" />

        <div className="contact-admin-note">
          <strong>Tip:</strong> Leave any optional field blank and that contact item will stay hidden from customers.
        </div>

        {settingsErr && <div className="field-err">{settingsErr}</div>}

        <div className="panel-foot">
          <button className="btn" onClick={saveSettings}>
            Save shop information
          </button>
        </div>
      </div>

      {/* =================================================
          PRODUCTS
      ================================================= */}

      <div className="panel">

        <div className="products-admin-heading">
          <div>
            <span className="admin-eyebrow">CATALOGUE MANAGEMENT</span>
            <h2>Your products</h2>
            <p className="sub">{productTotal} total products · showing {products.length} on this page</p>
          </div>
          <button className="btn" onClick={() => setEditingProduct('new')}>
            + Add product
          </button>
        </div>

        <div className="product-admin-toolbar">
          <div className="product-admin-search">
            <span>⌕</span>
            <input
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setProductPage(1);
              }}
              placeholder="Search your products..."
            />
            {productSearch && (
              <button type="button" onClick={() => { setProductSearch(''); setProductPage(1); }}>×</button>
            )}
          </div>

          <div className="product-admin-filters">
            {['All', 'Bags', 'Jewelry', 'Clothes', 'Other'].map((item) => (
              <button
                key={item}
                type="button"
                className={productCategory === item ? 'selected' : ''}
                onClick={() => {
                  setProductCategory(item);
                  setProductPage(1);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="admin-products-empty">
            <div className="admin-products-empty-icon">✦</div>
            <strong>{productSearch || productCategory !== 'All' ? 'No matching products' : 'No products yet'}</strong>
            <p>{productSearch || productCategory !== 'All' ? 'Try another search or category.' : 'Add your first product to start building the catalogue.'}</p>
          </div>
        ) : (
          <div className="admin-product-list">
            {products.map((p) => (
              <div className="admin-product-row" key={p._id}>
                <div className="admin-product-thumb">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" />
                  ) : (
                    <span>{(p.name || '?').slice(0, 2).toUpperCase()}</span>
                  )}
                </div>

                <div className="admin-product-info">
                  <div className="admin-product-name">
                    {p.name}
                    {p.featured && <span className="admin-tag featured">Featured</span>}
                    {p.newArrival && <span className="admin-tag new">New</span>}
                    {p.videoUrl && <span className="admin-tag video">Video</span>}
                  </div>
                  <div className="admin-product-meta">
                    {p.category} · ₹{money(p.price)}
                  </div>
                </div>

                <div className="acts">
                  <button className="btn ghost" onClick={() => setEditingProduct(p)}>Edit</button>
                  <button className="btn danger" onClick={() => deleteProduct(p._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {productTotalPages > 1 && (
          <div className="admin-pagination">
            <button
              className="btn ghost"
              disabled={productPage <= 1}
              onClick={() => setProductPage((page) => page - 1)}
            >
              ← Previous
            </button>
            <span>Page {productPage} of {productTotalPages}</span>
            <button
              className="btn ghost"
              disabled={productPage >= productTotalPages}
              onClick={() => setProductPage((page) => page + 1)}
            >
              Next →
            </button>
          </div>
        )}

      </div>


      {/* =================================================
          ORDERS
      ================================================= */}

      <div className="panel">

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap'
          }}
        >

          <div>

            <h2>
              Orders
            </h2>

            <p className="sub">
              {orders.length} placed
            </p>

          </div>

          {orders.length > 0 && (
            <button
              className="btn ghost"
              onClick={loadOrders}
            >
              ↻ Refresh
            </button>
          )}

        </div>


        {orders.length === 0 ? (

          <p
            style={{
              color: 'var(--ink-soft)',
              fontSize: 13.5
            }}
          >
            No orders yet.
          </p>

        ) : (

          orders.map((o) => {

            const canDelete =
              [
                'Shipped',
                'Delivered',
                'Cancelled'
              ].includes(o.status);

            return (
              <div
                className="order-row"
                key={o._id}
              >

                <div className="order-main">

                  <div className="order-title">

                    {o.productName}
                    {' × '}
                    {o.quantity}

                    <span className="order-amt">
                      ₹{money(o.totalAmount)}
                    </span>

                  </div>


                  <div className="order-buyer">

                    {o.buyerName}
                    {' · '}
                    {o.buyerPhone}

                  </div>


                  {o.buyerEmail && (
                    <div className="order-buyer">
                      {o.buyerEmail}
                    </div>
                  )}


                  <div className="order-address">

                    {o.buyerAddress}

                    {o.buyerCity &&
                      `, ${o.buyerCity}`}

                    {o.buyerState &&
                      `, ${o.buyerState}`}

                    {o.buyerPincode &&
                      ` - ${o.buyerPincode}`}

                  </div>


                  <div className="order-date">

                    {new Date(
                      o.createdAt
                    ).toLocaleString('en-IN')}

                  </div>

                </div>


                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap'
                  }}
                >

                  <select
                    className={`status-select status-${(
                      o.status || 'pending'
                    ).toLowerCase()}`}
                    value={o.status}
                    onChange={(e) =>
                      updateOrderStatus(
                        o._id,
                        e.target.value
                      )
                    }
                  >

                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Paid">
                      Paid
                    </option>

                    <option value="Shipped">
                      Shipped
                    </option>

                    <option value="Delivered">
                      Delivered
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>

                  </select>


                  {canDelete && (
                    <button
                      className="btn danger"
                      onClick={() =>
                        setDeletingOrder(o)
                      }
                      title="Delete this completed order"
                    >
                      Delete
                    </button>
                  )}

                </div>

              </div>
            );
          })

        )}

      </div>


      {/* =================================================
          DELETE ORDER CONFIRMATION
      ================================================= */}

      {deletingOrder && (
        <div
          className="overlay"
          onClick={(e) => {
            if (
              e.target === e.currentTarget &&
              !deleting
            ) {
              setDeletingOrder(null);
            }
          }}
        >

          <div
            className="ticket"
            style={{
              maxWidth: 430
            }}
          >

            <div className="ticket-head">

              <div className="t">
                Delete order
              </div>

              <button
                aria-label="Close"
                onClick={() =>
                  !deleting &&
                  setDeletingOrder(null)
                }
              >
                ✕
              </button>

            </div>


            <div className="ticket-body">

              <div
                style={{
                  fontSize: 36,
                  textAlign: 'center',
                  marginBottom: 10
                }}
              >
                🗑️
              </div>

              <h3
                style={{
                  textAlign: 'center',
                  marginTop: 0
                }}
              >
                Delete this order?
              </h3>

              <p
                style={{
                  textAlign: 'center',
                  color: 'var(--ink-soft)',
                  lineHeight: 1.6
                }}
              >
                This will permanently remove
                the order from your database.
                This action cannot be undone.
              </p>


              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: 'var(--paper)',
                  margin: '16px 0'
                }}
              >

                <strong>
                  {deletingOrder.productName}
                </strong>

                <div
                  style={{
                    marginTop: 5,
                    color: 'var(--ink-soft)'
                  }}
                >
                  {deletingOrder.buyerName}
                  {' · '}
                  ₹
                  {money(
                    deletingOrder.totalAmount
                  )}
                </div>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 13
                  }}
                >
                  Status:{' '}
                  <strong>
                    {deletingOrder.status}
                  </strong>
                </div>

              </div>


              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 18
                }}
              >

                <button
                  className="btn ghost"
                  style={{
                    flex: 1
                  }}
                  disabled={deleting}
                  onClick={() =>
                    setDeletingOrder(null)
                  }
                >
                  Keep order
                </button>

                <button
                  className="btn danger"
                  style={{
                    flex: 1
                  }}
                  disabled={deleting}
                  onClick={deleteOrder}
                >
                  {deleting
                    ? 'Deleting…'
                    : 'Delete permanently'}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}


      <Toast message={toast} />

    </main>
  );
}