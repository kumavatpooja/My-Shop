import React, { useEffect, useMemo, useState } from 'react';
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

  const [activeSection, setActiveSection] =
    useState('dashboard');

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [passcode, setPasscode] =
    useState('');

  const [loginError, setLoginError] =
    useState('');

  const [products, setProducts] =
    useState([]);

  const [orders, setOrders] =
    useState([]);

  const [productPage, setProductPage] =
    useState(1);

  const [productTotal, setProductTotal] =
    useState(0);

  const [productTotalPages, setProductTotalPages] =
    useState(1);

  const [productSearch, setProductSearch] =
    useState('');

  const [productCategory, setProductCategory] =
    useState('All');

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [toast, setToast] =
    useState('');

  const [deletingOrder, setDeletingOrder] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  const [settingsErr, setSettingsErr] =
    useState('');

  const [form, setForm] = useState({
    storeName: settings.storeName || '',
    tagline: settings.tagline || '',
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

  /*
  =====================================================
  NAVIGATION
  =====================================================
  */

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '⌂'
    },
    {
      id: 'products',
      label: 'Products',
      icon: '▦'
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: '□'
    },
    {
      id: 'shop',
      label: 'Shop information',
      icon: '◇'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙'
    }
  ];

  function goTo(section) {
    setActiveSection(section);
    setMobileMenu(false);
  }

  /*
  =====================================================
  SETTINGS SYNC
  =====================================================
  */

  useEffect(() => {
    function handleUnauthorized() {
      setLoggedIn(false);
      setLoginError(
        'Your admin session expired. Please log in again.'
      );
      setOrders([]);
      setProducts([]);
    }

    window.addEventListener(
      'adminUnauthorized',
      handleUnauthorized
    );

    return () =>
      window.removeEventListener(
        'adminUnauthorized',
        handleUnauthorized
      );
  }, []);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      storeName: settings.storeName || '',
      tagline: settings.tagline || '',
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

  function showToast(message) {
    setToast(message);

    setTimeout(() => {
      setToast('');
    }, 2200);
  }

  /*
  =====================================================
  LOAD PRODUCTS
  =====================================================
  */

  async function loadProducts(
    page = productPage
  ) {
    try {
      const params =
        new URLSearchParams();

      params.set(
        'page',
        String(page)
      );

      params.set(
        'limit',
        '20'
      );

      if (
        productCategory !== 'All'
      ) {
        params.set(
          'category',
          productCategory
        );
      }

      if (
        productSearch.trim()
      ) {
        params.set(
          'search',
          productSearch.trim()
        );
      }

      const res =
        await api.get(
          `/products?${params.toString()}`
        );

      const data =
        res.data || {};

      const list =
        Array.isArray(data)
          ? data
          : data.products || [];

      const pagination =
        data.pagination || {
          page,
          total: list.length,
          totalPages: 1
        };

      setProducts(list);

      setProductTotal(
        pagination.total || 0
      );

      setProductTotalPages(
        pagination.totalPages || 1
      );
    } catch (err) {
      console.error(
        'Could not load products:',
        err
      );

      setProducts([]);
      setProductTotal(0);
      setProductTotalPages(1);
    }
  }

  /*
  =====================================================
  LOAD ORDERS
  =====================================================
  */

  async function loadOrders() {
    try {
      const res =
        await api.get('/orders');

      setOrders(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (err) {
      console.error(
        'Could not load orders:',
        err
      );
    }
  }

  useEffect(() => {
    if (loggedIn) {
      loadProducts(productPage);
    }
  }, [
    loggedIn,
    productPage,
    productCategory,
    productSearch
  ]);

  useEffect(() => {
    if (loggedIn) {
      loadOrders();
    }
  }, [loggedIn]);

  /*
  =====================================================
  ORDER STATUS
  =====================================================
  */

  async function updateOrderStatus(
    id,
    status
  ) {
    try {
      await api.put(
        `/orders/${id}`,
        { status }
      );

      await loadOrders();

      showToast(
        'Order updated'
      );
    } catch (err) {
      showToast(
        err.response?.data?.error ||
        'Could not update order.'
      );
    }
  }

  /*
  =====================================================
  DELETE ORDER
  =====================================================
  */

  async function deleteOrder() {
    if (!deletingOrder) {
      return;
    }

    setDeleting(true);

    try {
      await api.delete(
        `/orders/${deletingOrder._id}`
      );

      setOrders((prev) =>
        prev.filter(
          (order) =>
            order._id !==
            deletingOrder._id
        )
      );

      setDeletingOrder(null);

      showToast(
        'Order deleted'
      );
    } catch (err) {
      showToast(
        err.response?.data?.error ||
        'Could not delete order.'
      );
    } finally {
      setDeleting(false);
    }
  }

  /*
  =====================================================
  LOGIN
  =====================================================
  */

  async function handleLogin() {
    try {
      const res =
        await api.post(
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
      setPasscode('');
      setActiveSection(
        'dashboard'
      );
    } catch (err) {
      setLoginError(
        err.response?.data?.error ||
        'Wrong passcode. Try again.'
      );
    }
  }

  /*
  =====================================================
  LOGOUT
  =====================================================
  */

  function logout() {
    localStorage.removeItem(
      'adminToken'
    );

    setLoggedIn(false);
    setOrders([]);
    setProducts([]);
    setActiveSection(
      'dashboard'
    );
  }

  /*
  =====================================================
  SAVE SETTINGS
  =====================================================
  */

  async function saveSettings() {
    try {
      await api.put(
        '/settings',
        form
      );

      setSettingsErr('');

      showToast(
        'Settings saved'
      );

      if (onSettingsSaved) {
        onSettingsSaved();
      }
    } catch (err) {
      setSettingsErr(
        err.response?.data?.error ||
        "Couldn't save settings."
      );
    }
  }

  /*
  =====================================================
  ADD PRODUCT
  =====================================================
  */

  async function addProduct(data) {
    try {
      await api.post(
        '/products',
        data
      );

      setEditingProduct(null);
      setProductPage(1);

      await loadProducts(1);

      showToast(
        'Product added'
      );
    } catch (err) {
      showToast(
        err.response?.data?.error ||
        'Could not add product.'
      );
    }
  }

  /*
  =====================================================
  UPDATE PRODUCT
  =====================================================
  */

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

      await loadProducts(
        productPage
      );

      showToast(
        'Changes saved'
      );
    } catch (err) {
      showToast(
        err.response?.data?.error ||
        'Could not save changes.'
      );
    }
  }

  /*
  =====================================================
  DELETE PRODUCT
  =====================================================
  */

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

      if (
        products.length === 1 &&
        productPage > 1
      ) {
        setProductPage(
          (page) => page - 1
        );
      } else {
        await loadProducts(
          productPage
        );
      }

      showToast(
        'Product deleted'
      );
    } catch (err) {
      showToast(
        err.response?.data?.error ||
        'Could not delete product.'
      );
    }
  }

  /*
  =====================================================
  DASHBOARD DATA
  =====================================================
  */

  const pendingOrders =
    orders.filter(
      (order) =>
        order.status ===
        'Pending'
    ).length;

  const paidOrders =
    orders.filter(
      (order) =>
        order.status ===
        'Paid'
    ).length;

  const shippedOrders =
    orders.filter(
      (order) =>
        order.status ===
        'Shipped'
    ).length;

  const deliveredOrders =
    orders.filter(
      (order) =>
        order.status ===
        'Delivered'
    ).length;

  const cancelledOrders =
    orders.filter(
      (order) =>
        order.status ===
        'Cancelled'
    ).length;

  const totalRevenue =
    orders
      .filter(
        (order) =>
          order.status !==
          'Cancelled'
      )
      .reduce(
        (sum, order) =>
          sum +
          (Number(
            order.totalAmount
          ) || 0),
        0
      );

  const recentOrders =
    useMemo(() => {
      return [...orders]
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
        )
        .slice(0, 5);
    }, [orders]);

  /*
  =====================================================
  LOGIN PAGE
  =====================================================
  */

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
            Enter the store passcode
            to manage products and
            settings.
          </p>

          <input
            type="password"
            placeholder="Passcode"
            value={passcode}
            onChange={(e) =>
              setPasscode(
                e.target.value
              )
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
            onClick={
              handleLogin
            }
          >
            Unlock
          </button>

        </div>
      </main>
    );
  }

  /*
  =====================================================
  PRODUCT FORM
  =====================================================
  */

  if (
    editingProduct ===
    'new'
  ) {
    return (
      <main>
        <ProductForm
          submitLabel="Add product"
          onSubmit={
            addProduct
          }
          onCancel={() =>
            setEditingProduct(
              null
            )
          }
        />
      </main>
    );
  }

  if (
    editingProduct
  ) {
    return (
      <main>
        <ProductForm
          initial={
            editingProduct
          }
          submitLabel="Save changes"
          onSubmit={(data) =>
            updateProduct(
              editingProduct._id,
              data
            )
          }
          onCancel={() =>
            setEditingProduct(
              null
            )
          }
        />
      </main>
    );
  }

  /*
  =====================================================
  PAGE STYLES
  =====================================================
  */

  const pageStyle = {
    minHeight: 'calc(100vh - 90px)',
    background: 'var(--paper)',
    padding: '24px',
    maxWidth: 1440,
    margin: '0 auto'
  };

  const shellStyle = {
    display: 'grid',
    gridTemplateColumns:
      '230px minmax(0, 1fr)',
    gap: 24,
    alignItems: 'start'
  };

  const sidebarStyle = {
    background:
      'var(--surface, #fff)',
    border:
      '1px solid var(--line, #e8e1d8)',
    borderRadius: 18,
    padding: 14,
    position: 'sticky',
    top: 20
  };

  const contentStyle = {
    minWidth: 0
  };

  /*
  =====================================================
  MOBILE MENU BUTTON
  =====================================================
  */

  return (
    <main style={pageStyle}>

      <style>
        {`
          .admin-dashboard-shell {
            display: grid;
            grid-template-columns: 230px minmax(0, 1fr);
            gap: 24px;
            align-items: start;
          }

          .admin-sidebar {
            position: sticky;
            top: 20px;
          }

          .admin-mobile-button {
            display: none;
          }

          .admin-stat-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 20px;
          }

          .admin-stat-card {
            background: var(--surface, #fff);
            border: 1px solid var(--line, #e8e1d8);
            border-radius: 16px;
            padding: 20px;
          }

          .admin-stat-number {
            font-size: 30px;
            font-weight: 700;
            line-height: 1.1;
            margin-top: 8px;
          }

          .admin-dashboard-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.8fr);
            gap: 20px;
          }

          .admin-quick-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .admin-quick-button {
            text-align: left;
            border: 1px solid var(--line, #e8e1d8);
            background: var(--surface, #fff);
            border-radius: 12px;
            padding: 14px;
            cursor: pointer;
          }

          .admin-quick-button:hover {
            transform: translateY(-1px);
          }

          .admin-sidebar-button {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 11px;
            border: 0;
            background: transparent;
            padding: 12px 13px;
            border-radius: 11px;
            cursor: pointer;
            text-align: left;
            font-size: 14px;
          }

          .admin-sidebar-button.active {
            background: var(--ink, #222);
            color: #fff;
          }

          .admin-sidebar-button.logout {
            margin-top: 14px;
            border-top: 1px solid var(--line, #e8e1d8);
            border-radius: 0;
            padding-top: 16px;
          }

          .admin-order-mini {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 12px;
            align-items: center;
            padding: 13px 0;
            border-bottom: 1px solid var(--line, #e8e1d8);
          }

          .admin-order-mini:last-child {
            border-bottom: 0;
          }

          .admin-section-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            flex-wrap: wrap;
            margin-bottom: 18px;
          }

          .admin-section-title h1,
          .admin-section-title h2 {
            margin: 0;
          }

          .admin-section-title p {
            margin: 5px 0 0;
          }

          .admin-menu-title {
            font-weight: 700;
            padding: 8px 12px 14px;
          }

          .admin-brand-small {
            font-size: 12px;
            color: var(--ink-soft, #777);
            margin-top: 2px;
            padding: 0 12px 14px;
            border-bottom: 1px solid var(--line, #e8e1d8);
            margin-bottom: 8px;
          }

          @media (max-width: 1000px) {
            .admin-dashboard-shell {
              grid-template-columns: 1fr;
            }

            .admin-sidebar {
              position: static;
            }

            .admin-stat-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .admin-dashboard-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 700px) {
            .admin-dashboard-shell {
              display: block;
            }

            .admin-sidebar {
              display: ${mobileMenu ? 'block' : 'none'};
              margin-bottom: 16px;
            }

            .admin-mobile-button {
              display: flex;
              width: 100%;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 14px;
              border: 1px solid var(--line, #e8e1d8);
              background: var(--surface, #fff);
              border-radius: 13px;
              padding: 12px 14px;
              cursor: pointer;
            }

            .admin-stat-grid {
              grid-template-columns: 1fr 1fr;
            }

            .admin-quick-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 480px) {
            .admin-stat-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="admin-mobile-button">
        <strong>
          {navItems.find(
            (item) =>
              item.id ===
              activeSection
          )?.label ||
            'Dashboard'}
        </strong>

        <button
          type="button"
          onClick={() =>
            setMobileMenu(
              (open) => !open
            )
          }
        >
          ☰
        </button>
      </div>

      <div
        className="admin-dashboard-shell"
      >

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside
          className="admin-sidebar"
          style={
            sidebarStyle
          }
        >

          <div className="admin-menu-title">
            Admin
          </div>

          <div className="admin-brand-small">
            {settings.storeName ||
              'Your Store'}
          </div>

          {navItems.map(
            (item) => (
              <button
                key={item.id}
                type="button"
                className={
                  `admin-sidebar-button ${
                    activeSection ===
                    item.id
                      ? 'active'
                      : ''
                  }`
                }
                onClick={() =>
                  goTo(item.id)
                }
              >
                <span
                  style={{
                    width: 20,
                    textAlign:
                      'center'
                  }}
                >
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>
              </button>
            )
          )}

          <button
            type="button"
            className="admin-sidebar-button logout"
            onClick={
              logout
            }
          >
            <span
              style={{
                width: 20,
                textAlign:
                  'center'
              }}
            >
              ↪
            </span>

            <span>
              Logout
            </span>
          </button>

        </aside>


        {/* =================================================
            CONTENT
        ================================================= */}

        <section
          style={
            contentStyle
          }
        >

          {/* =================================================
              DASHBOARD
          ================================================= */}

          {activeSection ===
            'dashboard' && (
            <>

              <div
                className="panel"
              >

                <div
                  className="admin-section-title"
                >
                  <div>
                    <span className="admin-eyebrow">
                      ADMIN DASHBOARD
                    </span>

                    <h1 className="display">
                      Welcome back
                    </h1>

                    <p className="sub">
                      Manage your store,
                      products and orders
                      from one place.
                    </p>
                  </div>
                </div>

              </div>


              <div
                className="admin-stat-grid"
              >

                <div
                  className="admin-stat-card"
                >
                  <span className="admin-eyebrow">
                    PRODUCTS
                  </span>

                  <div className="admin-stat-number">
                    {productTotal}
                  </div>

                  <p className="sub">
                    Total products
                  </p>
                </div>


                <div
                  className="admin-stat-card"
                >
                  <span className="admin-eyebrow">
                    ORDERS
                  </span>

                  <div className="admin-stat-number">
                    {orders.length}
                  </div>

                  <p className="sub">
                    Total orders
                  </p>
                </div>


                <div
                  className="admin-stat-card"
                >
                  <span className="admin-eyebrow">
                    PENDING
                  </span>

                  <div className="admin-stat-number">
                    {pendingOrders}
                  </div>

                  <p className="sub">
                    Need attention
                  </p>
                </div>


                <div
                  className="admin-stat-card"
                >
                  <span className="admin-eyebrow">
                    REVENUE
                  </span>

                  <div
                    className="admin-stat-number"
                    style={{
                      fontSize: 25
                    }}
                  >
                    ₹{money(
                      totalRevenue
                    )}
                  </div>

                  <p className="sub">
                    Non-cancelled orders
                  </p>
                </div>

              </div>


              <div
                className="admin-dashboard-grid"
              >

                {/* RECENT ORDERS */}

                <div
                  className="panel"
                >

                  <div
                    className="admin-section-title"
                  >
                    <div>
                      <span className="admin-eyebrow">
                        ORDERS
                      </span>

                      <h2>
                        Recent orders
                      </h2>
                    </div>

                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() =>
                        goTo(
                          'orders'
                        )
                      }
                    >
                      View all →
                    </button>
                  </div>


                  {recentOrders.length ===
                  0 ? (
                    <p className="sub">
                      No orders yet.
                    </p>
                  ) : (
                    recentOrders.map(
                      (order) => (
                        <div
                          className="admin-order-mini"
                          key={
                            order._id
                          }
                        >

                          <div>
                            <strong>
                              {
                                order.productName
                              }
                              {' × '}
                              {
                                order.quantity
                              }
                            </strong>

                            <div className="sub">
                              {
                                order.buyerName
                              }
                              {' · '}
                              ₹
                              {money(
                                order.totalAmount
                              )}
                            </div>
                          </div>

                          <span
                            className={`status-select status-${(
                              order.status ||
                              'pending'
                            ).toLowerCase()}`}
                            style={{
                              padding:
                                '7px 10px',
                              borderRadius:
                                8,
                              fontSize:
                                12,
                              display:
                                'inline-block'
                            }}
                          >
                            {
                              order.status
                            }
                          </span>

                        </div>
                      )
                    )
                  )}

                </div>


                {/* QUICK ACTIONS */}

                <div
                  className="panel"
                >

                  <div
                    className="admin-section-title"
                  >
                    <div>
                      <span className="admin-eyebrow">
                        QUICK ACTIONS
                      </span>

                      <h2>
                        Manage store
                      </h2>
                    </div>
                  </div>


                  <div
                    className="admin-quick-grid"
                  >

                    <button
                      type="button"
                      className="admin-quick-button"
                      onClick={() =>
                        setEditingProduct(
                          'new'
                        )
                      }
                    >
                      <strong>
                        + Add product
                      </strong>

                      <div className="sub">
                        Add a new catalogue
                        item
                      </div>
                    </button>


                    <button
                      type="button"
                      className="admin-quick-button"
                      onClick={() =>
                        goTo(
                          'products'
                        )
                      }
                    >
                      <strong>
                        🛍 Products
                      </strong>

                      <div className="sub">
                        Manage catalogue
                      </div>
                    </button>


                    <button
                      type="button"
                      className="admin-quick-button"
                      onClick={() =>
                        goTo(
                          'orders'
                        )
                      }
                    >
                      <strong>
                        📦 Orders
                      </strong>

                      <div className="sub">
                        View customer orders
                      </div>
                    </button>


                    <button
                      type="button"
                      className="admin-quick-button"
                      onClick={() =>
                        goTo(
                          'shop'
                        )
                      }
                    >
                      <strong>
                        🏪 Store information
                      </strong>

                      <div className="sub">
                        Contact and shop details
                      </div>
                    </button>

                  </div>

                </div>

              </div>


              <div
                className="panel"
                style={{
                  marginTop: 20
                }}
              >

                <div
                  className="admin-section-title"
                >
                  <div>
                    <span className="admin-eyebrow">
                      ORDER OVERVIEW
                    </span>

                    <h2>
                      Order status
                    </h2>
                  </div>
                </div>


                <div
                  className="admin-stat-grid"
                  style={{
                    marginBottom: 0
                  }}
                >

                  <div className="admin-stat-card">
                    <strong>
                      Pending
                    </strong>

                    <div className="admin-stat-number">
                      {pendingOrders}
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <strong>
                      Paid
                    </strong>

                    <div className="admin-stat-number">
                      {paidOrders}
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <strong>
                      Shipped
                    </strong>

                    <div className="admin-stat-number">
                      {shippedOrders}
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <strong>
                      Delivered
                    </strong>

                    <div className="admin-stat-number">
                      {deliveredOrders}
                    </div>
                  </div>

                </div>

                {cancelledOrders >
                  0 && (
                  <p
                    className="sub"
                    style={{
                      marginTop:
                        16
                    }}
                  >
                    Cancelled orders:{' '}
                    {
                      cancelledOrders
                    }
                  </p>
                )}

              </div>

            </>
          )}


          {/* =================================================
              PRODUCTS
          ================================================= */}

          {activeSection ===
            'products' && (
            <div className="panel">

              <div
                className="products-admin-heading"
              >
                <div>
                  <span className="admin-eyebrow">
                    CATALOGUE MANAGEMENT
                  </span>

                  <h2>
                    Your products
                  </h2>

                  <p className="sub">
                    {productTotal}{' '}
                    total products ·
                    showing{' '}
                    {products.length}{' '}
                    on this page
                  </p>
                </div>

                <button
                  className="btn"
                  onClick={() =>
                    setEditingProduct(
                      'new'
                    )
                  }
                >
                  + Add product
                </button>
              </div>


              <div
                className="product-admin-toolbar"
              >

                <div
                  className="product-admin-search"
                >
                  <span>
                    ⌕
                  </span>

                  <input
                    value={
                      productSearch
                    }
                    onChange={(
                      e
                    ) => {
                      setProductSearch(
                        e.target.value
                      );

                      setProductPage(
                        1
                      );
                    }}
                    placeholder="Search your products..."
                  />

                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductSearch(
                          ''
                        );

                        setProductPage(
                          1
                        );
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>


                <div
                  className="product-admin-filters"
                >
                  {[
                    'All',
                    'Bags',
                    'Jewelry',
                    'Clothes',
                    'Other'
                  ].map(
                    (item) => (
                      <button
                        key={item}
                        type="button"
                        className={
                          productCategory ===
                          item
                            ? 'selected'
                            : ''
                        }
                        onClick={() => {
                          setProductCategory(
                            item
                          );

                          setProductPage(
                            1
                          );
                        }}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>

              </div>


              {products.length ===
              0 ? (
                <div className="admin-products-empty">

                  <div className="admin-products-empty-icon">
                    ✦
                  </div>

                  <strong>
                    {
                      productSearch ||
                      productCategory !==
                        'All'
                        ? 'No matching products'
                        : 'No products yet'
                    }
                  </strong>

                  <p>
                    {
                      productSearch ||
                      productCategory !==
                        'All'
                        ? 'Try another search or category.'
                        : 'Add your first product to start building the catalogue.'
                    }
                  </p>

                </div>
              ) : (
                <div className="admin-product-list">

                  {products.map(
                    (p) => (
                      <div
                        className="admin-product-row"
                        key={
                          p._id
                        }
                      >

                        <div className="admin-product-thumb">

                          {p.images?.[0] ? (
                            <img
                              src={
                                p.images[0]
                              }
                              alt=""
                            />
                          ) : (
                            <span>
                              {(
                                p.name ||
                                '?'
                              )
                                .slice(
                                  0,
                                  2
                                )
                                .toUpperCase()}
                            </span>
                          )}

                        </div>


                        <div className="admin-product-info">

                          <div className="admin-product-name">

                            {p.name}

                            {p.featured && (
                              <span className="admin-tag featured">
                                Featured
                              </span>
                            )}

                            {p.newArrival && (
                              <span className="admin-tag new">
                                New
                              </span>
                            )}

                            {p.videoUrl && (
                              <span className="admin-tag video">
                                Video
                              </span>
                            )}

                          </div>

                          <div className="admin-product-meta">
                            {p.category}
                            {' · '}
                            ₹
                            {money(
                              p.price
                            )}
                          </div>

                        </div>


                        <div className="acts">

                          <button
                            className="btn ghost"
                            onClick={() =>
                              setEditingProduct(
                                p
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="btn danger"
                            onClick={() =>
                              deleteProduct(
                                p._id
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}


              {productTotalPages >
                1 && (
                <div className="admin-pagination">

                  <button
                    className="btn ghost"
                    disabled={
                      productPage <=
                      1
                    }
                    onClick={() =>
                      setProductPage(
                        (page) =>
                          page - 1
                      )
                    }
                  >
                    ← Previous
                  </button>

                  <span>
                    Page{' '}
                    {productPage}{' '}
                    of{' '}
                    {
                      productTotalPages
                    }
                  </span>

                  <button
                    className="btn ghost"
                    disabled={
                      productPage >=
                      productTotalPages
                    }
                    onClick={() =>
                      setProductPage(
                        (page) =>
                          page + 1
                      )
                    }
                  >
                    Next →
                  </button>

                </div>
              )}

            </div>
          )}


          {/* =================================================
              ORDERS
          ================================================= */}

          {activeSection ===
            'orders' && (
            <div className="panel">

              <div
                className="admin-section-title"
              >

                <div>
                  <span className="admin-eyebrow">
                    ORDER MANAGEMENT
                  </span>

                  <h2>
                    Orders
                  </h2>

                  <p className="sub">
                    {orders.length}{' '}
                    placed
                  </p>
                </div>

                <button
                  className="btn ghost"
                  onClick={
                    loadOrders
                  }
                >
                  ↻ Refresh
                </button>

              </div>


              {orders.length ===
              0 ? (
                <p
                  className="sub"
                >
                  No orders yet.
                </p>
              ) : (
                orders.map(
                  (o) => {

                    const canDelete =
                      [
                        'Shipped',
                        'Delivered',
                        'Cancelled'
                      ].includes(
                        o.status
                      );

                    return (
                      <div
                        className="order-row"
                        key={
                          o._id
                        }
                      >

                        <div className="order-main">

                          <div className="order-title">

                            {o.productName}
                            {' × '}
                            {o.quantity}

                            <span className="order-amt">
                              ₹
                              {money(
                                o.totalAmount
                              )}
                            </span>

                          </div>


                          <div className="order-buyer">
                            {o.buyerName}
                            {' · '}
                            {o.buyerPhone}
                          </div>


                          {o.buyerEmail && (
                            <div className="order-buyer">
                              {
                                o.buyerEmail
                              }
                            </div>
                          )}


                          <div className="order-address">

                            {
                              o.buyerAddress
                            }

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
                            ).toLocaleString(
                              'en-IN'
                            )}
                          </div>

                        </div>


                        <div
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: 8,
                            flexWrap:
                              'wrap'
                          }}
                        >

                          <select
                            className={`status-select status-${(
                              o.status ||
                              'pending'
                            ).toLowerCase()}`}
                            value={
                              o.status
                            }
                            onChange={(
                              e
                            ) =>
                              updateOrderStatus(
                                o._id,
                                e.target
                                  .value
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
                                setDeletingOrder(
                                  o
                                )
                              }
                            >
                              Delete
                            </button>
                          )}

                        </div>

                      </div>
                    );
                  }
                )
              )}

            </div>
          )}


          {/* =================================================
              SHOP INFORMATION
          ================================================= */}

          {activeSection ===
            'shop' && (
            <div className="panel">

              <div
                className="admin-section-title"
              >
                <div>

                  <span className="admin-eyebrow">
                    CUSTOMER INFORMATION
                  </span>

                  <h2>
                    Shop information
                  </h2>

                  <p className="sub">
                    These details appear
                    automatically in your
                    shop's Contact, About
                    and Help sections.
                  </p>

                </div>

                <span
                  className="admin-section-icon"
                >
                  ✦
                </span>

              </div>


              <div className="admin-form-grid">

                <div>
                  <label>
                    Phone number
                  </label>

                  <input
                    value={
                      form.phone
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone:
                          e.target
                            .value
                      })
                    }
                    placeholder="+91 98765 43210"
                  />
                </div>


                <div>
                  <label>
                    WhatsApp number
                  </label>

                  <input
                    value={
                      form.whatsapp
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        whatsapp:
                          e.target
                            .value
                      })
                    }
                    placeholder="919876543210"
                  />
                </div>


                <div>
                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    value={
                      form.email
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email:
                          e.target
                            .value
                      })
                    }
                    placeholder="shop@example.com"
                  />
                </div>


                <div>
                  <label>
                    PIN code
                  </label>

                  <input
                    value={
                      form.pincode
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        pincode:
                          e.target
                            .value
                      })
                    }
                    placeholder="422001"
                  />
                </div>

              </div>


              <label>
                Shop address
              </label>

              <textarea
                value={
                  form.address
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    address:
                      e.target.value
                  })
                }
                placeholder="Enter your shop or delivery address"
              />


              <div className="admin-form-grid">

                <div>
                  <label>
                    City
                  </label>

                  <input
                    value={
                      form.city
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        city:
                          e.target
                            .value
                      })
                    }
                    placeholder="Nashik"
                  />
                </div>


                <div>
                  <label>
                    State
                  </label>

                  <input
                    value={
                      form.state
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        state:
                          e.target
                            .value
                      })
                    }
                    placeholder="Maharashtra"
                  />
                </div>

              </div>


              <label>
                About the shop
              </label>

              <textarea
                value={
                  form.aboutText
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    aboutText:
                      e.target.value
                  })
                }
                placeholder="Tell customers about your shop, handmade products or your story."
              />


              <div className="admin-form-grid">

                <div>
                  <label>
                    Instagram link
                  </label>

                  <input
                    value={
                      form.instagram
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        instagram:
                          e.target
                            .value
                      })
                    }
                    placeholder="https://instagram.com/yourshop"
                  />
                </div>


                <div>
                  <label>
                    Facebook link
                  </label>

                  <input
                    value={
                      form.facebook
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        facebook:
                          e.target
                            .value
                      })
                    }
                    placeholder="https://facebook.com/yourshop"
                  />
                </div>

              </div>


              <label>
                Google Maps link
              </label>

              <input
                value={
                  form.googleMaps
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    googleMaps:
                      e.target.value
                  })
                }
                placeholder="Paste your Google Maps shop link"
              />


              <div className="contact-admin-note">
                <strong>
                  Tip:
                </strong>{' '}
                Leave any optional field
                blank and that contact
                item will stay hidden from
                customers.
              </div>


              {settingsErr && (
                <div className="field-err">
                  {settingsErr}
                </div>
              )}


              <div className="panel-foot">
                <button
                  className="btn"
                  onClick={
                    saveSettings
                  }
                >
                  Save shop information
                </button>
              </div>

            </div>
          )}


          {/* =================================================
              SETTINGS
          ================================================= */}

          {activeSection ===
            'settings' && (
            <div className="panel">

              <div
                className="admin-section-title"
              >
                <div>

                  <span className="admin-eyebrow">
                    STORE CONFIGURATION
                  </span>

                  <h2>
                    Settings
                  </h2>

                  <p className="sub">
                    Configure your store
                    identity, payments and
                    admin security.
                  </p>

                </div>

              </div>


              <label>
                Store name
              </label>

              <input
                value={
                  form.storeName
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    storeName:
                      e.target.value
                  })
                }
                placeholder="Your Store"
              />


              <label>
                Tagline
              </label>

              <input
                value={
                  form.tagline
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    tagline:
                      e.target.value
                  })
                }
                placeholder="Your store tagline"
              />


              <label>
                UPI ID
                {' '}
                (e.g.
                yourname@okhdfcbank)
              </label>

              <input
                value={
                  form.upiId
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    upiId:
                      e.target.value
                  })
                }
                placeholder="yourname@bank"
              />


              <label>
                Payee name shown to buyers
              </label>

              <input
                value={
                  form.payeeName
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    payeeName:
                      e.target.value
                  })
                }
                placeholder={
                  form.storeName ||
                  'Your Store'
                }
              />


              <label>
                Delivery / shipping
                charge (₹)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.shippingCharge
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    shippingCharge:
                      e.target.value
                  })
                }
                placeholder="0"
              />

              <p className="sub">
                This amount is added to
                the customer's order
                total. Use 0 for free
                delivery.
              </p>


              <label>
                Change admin passcode
                {' '}
                (leave blank to keep
                current)
              </label>

              <input
                type="password"
                value={
                  form.newPasscode
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    newPasscode:
                      e.target.value
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
                  onClick={
                    saveSettings
                  }
                >
                  Save settings
                </button>
              </div>

            </div>
          )}

        </section>

      </div>


      {/* =====================================================
          DELETE ORDER MODAL
      ===================================================== */}

      {deletingOrder && (
        <div
          className="overlay"
          onClick={(e) => {
            if (
              e.target ===
                e.currentTarget &&
              !deleting
            ) {
              setDeletingOrder(
                null
              );
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
                  setDeletingOrder(
                    null
                  )
                }
              >
                ✕
              </button>

            </div>


            <div className="ticket-body">

              <div
                style={{
                  fontSize: 36,
                  textAlign:
                    'center',
                  marginBottom: 10
                }}
              >
                🗑️
              </div>

              <h3
                style={{
                  textAlign:
                    'center',
                  marginTop: 0
                }}
              >
                Delete this order?
              </h3>

              <p
                style={{
                  textAlign:
                    'center',
                  color:
                    'var(--ink-soft)',
                  lineHeight: 1.6
                }}
              >
                This will permanently
                remove the order from
                your database. This
                action cannot be undone.
              </p>


              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background:
                    'var(--paper)',
                  margin: '16px 0'
                }}
              >

                <strong>
                  {
                    deletingOrder.productName
                  }
                </strong>

                <div
                  style={{
                    marginTop: 5,
                    color:
                      'var(--ink-soft)'
                  }}
                >
                  {
                    deletingOrder.buyerName
                  }
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
                    {
                      deletingOrder.status
                    }
                  </strong>
                </div>

              </div>


              <div
                style={{
                  display:
                    'flex',
                  gap: 10,
                  marginTop: 18
                }}
              >

                <button
                  className="btn ghost"
                  style={{
                    flex: 1
                  }}
                  disabled={
                    deleting
                  }
                  onClick={() =>
                    setDeletingOrder(
                      null
                    )
                  }
                >
                  Keep order
                </button>

                <button
                  className="btn danger"
                  style={{
                    flex: 1
                  }}
                  disabled={
                    deleting
                  }
                  onClick={
                    deleteOrder
                  }
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


      <Toast
        message={toast}
      />

    </main>
  );
}