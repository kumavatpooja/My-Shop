import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function money(n) {
  return (Number(n) || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2
  });
}

function getWishlist() {
  try {
    const saved = localStorage.getItem('sanvi_wishlist');
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function saveWishlist(ids) {
  localStorage.setItem('sanvi_wishlist', JSON.stringify(ids));
  window.dispatchEvent(new Event('wishlistChanged'));
}

const CATEGORIES = ['Bags', 'Jewelry', 'Clothes', 'Other'];
const HOME_LIMIT = 8;
const SHOP_LIMIT = 24;

function ProductCard({ product, wishlist, toggleWishlist, navigate }) {
  const image = product.images?.[0] || product.imageUrl || '';
  const isLiked = wishlist.includes(String(product._id));

  return (
    <article
      className="modern-card"
      key={product._id}
      onClick={() => navigate(`/product/${product._id}`)}
    >
      <div className="modern-card-media">
        {image ? (
          <img src={image} alt={product.name} />
        ) : (
          <div className="card-placeholder">
            {(product.name || '?').slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="card-overlay" />

        {product.category && product.category !== 'Other' && (
          <span className="card-category">{product.category}</span>
        )}

        {product.videoUrl && (
          <span className="video-badge">▶ VIDEO</span>
        )}

        <button
          type="button"
          className={isLiked ? 'card-heart liked' : 'card-heart'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product._id);
          }}
          aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {isLiked ? '♥' : '♡'}
        </button>

        {product.images?.length > 1 && (
          <span className="photo-count">{product.images.length} photos</span>
        )}
      </div>

      <div className="modern-card-body">
        <div className="card-title-row">
          <h3>{product.name}</h3>
        </div>

        <p>{product.description || 'Beautifully selected product'}</p>

        <div className="modern-card-bottom">
          <div className="modern-price">₹{money(product.price)}</div>
          <button
            type="button"
            className="quick-add"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/product/${product._id}`);
            }}
          >
            View →
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductSection({ title, eyebrow, products, loading, onViewAll, wishlist, toggleWishlist, navigate }) {
  if (loading) {
    return (
      <section className="home-product-section">
        <div className="collection-heading">
          <div>
            <span>{eyebrow}</span>
            <h2 className="display">{title}</h2>
          </div>
        </div>
        <div className="section-loading">Loading {title.toLowerCase()}…</div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section className="home-product-section">
      <div className="collection-heading">
        <div>
          <span>{eyebrow}</span>
          <h2 className="display">{title}</h2>
        </div>
        {onViewAll && (
          <button type="button" className="section-view-all" onClick={onViewAll}>
            View all →
          </button>
        )}
      </div>
      <div className="modern-grid">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} navigate={navigate} />
        ))}
      </div>
    </section>
  );
}

export default function Shop({ settings }) {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState(getWishlist);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [shopProducts, setShopProducts] = useState([]);
  const [shopPagination, setShopPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [shopLoading, setShopLoading] = useState(false);

  const [sections, setSections] = useState({
    newArrivals: [],
    Bags: [],
    Jewelry: [],
    Clothes: [],
    Other: []
  });
  const [sectionsLoading, setSectionsLoading] = useState(true);

  const hasSearch = search.trim().length > 0;
  const browsingAll = category === 'All' && !hasSearch;

  useEffect(() => {
    function syncWishlist() {
      setWishlist(getWishlist());
    }

    window.addEventListener('wishlistChanged', syncWishlist);
    window.addEventListener('storage', syncWishlist);

    return () => {
      window.removeEventListener('wishlistChanged', syncWishlist);
      window.removeEventListener('storage', syncWishlist);
    };
  }, []);

  function toggleWishlist(productId) {
    const key = String(productId);
    const current = getWishlist();
    const updated = current.includes(key)
      ? current.filter((id) => id !== key)
      : [...current, key];

    saveWishlist(updated);
    setWishlist(updated);
  }


  async function loadHomeSections() {
    setSectionsLoading(true);
    try {
      const requests = await Promise.all([
        api.get('/products?limit=8'),
        ...CATEGORIES.map((cat) => api.get(`/products?category=${encodeURIComponent(cat)}&limit=${HOME_LIMIT}`))
      ]);

      const getProducts = (res) =>
        Array.isArray(res.data) ? res.data : (res.data?.products || []);

      setSections({
        newArrivals: getProducts(requests[0]),
        Bags: getProducts(requests[1]),
        Jewelry: getProducts(requests[2]),
        Clothes: getProducts(requests[3]),
        Other: getProducts(requests[4])
      });
    } catch (error) {
      console.error('Could not load home sections:', error);
      setSections({
        newArrivals: [],
        Bags: [],
        Jewelry: [],
        Clothes: [],
        Other: []
      });
    } finally {
      setSectionsLoading(false);
    }
  }

  async function loadShopResults(page = 1) {
    setShopLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(SHOP_LIMIT));
      if (category !== 'All') params.set('category', category);
      if (search.trim()) params.set('search', search.trim());

      const res = await api.get(`/products?${params.toString()}`);
      const data = res.data || {};

      setShopProducts(Array.isArray(data) ? data : (data.products || []));
      setShopPagination(
        data.pagination || {
          page,
          total: Array.isArray(data) ? data.length : 0,
          totalPages: 1
        }
      );
    } catch (error) {
      console.error('Could not load products:', error);
      setShopProducts([]);
      setShopPagination({ page: 1, total: 0, totalPages: 1 });
    } finally {
      setShopLoading(false);
    }
  }

  useEffect(() => {
    if (browsingAll) {
      loadHomeSections();
    }
  }, [browsingAll]);

  useEffect(() => {
    if (!browsingAll) {
      loadShopResults(1);
    }
  }, [category, search, browsingAll]);

  function chooseCategory(item) {
    setCategory(item);
    if (item === 'All') setSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function viewCategory(item) {
    setCategory(item);
    setSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderCard(product) {
    return (
      <ProductCard
        key={product._id}
        product={product}
        wishlist={wishlist}
        toggleWishlist={toggleWishlist}
        navigate={navigate}
      />
    );
  }

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <div>
          <span className="eyebrow">✦ NEW COLLECTION</span>
          <h1 className="display">{settings.storeName}</h1>
          <p>{settings.tagline || 'Discover beautiful products selected just for you.'}</p>
        </div>
        <div className="hero-decoration">
          <span>✦</span>
          <span>SC</span>
        </div>
      </section>

      <section className="shop-toolbar">
        <div className="search-box">
          <span>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
          />
          {search && (
            <button type="button" onClick={() => setSearch('')}>×</button>
          )}
        </div>

        <div className="category-list">
          {['All', ...CATEGORIES].map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? 'selected' : ''}
              onClick={() => chooseCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {browsingAll ? (
        <>
          <ProductSection
            title="New Arrivals"
            eyebrow="JUST IN"
            products={sections.newArrivals}
            loading={sectionsLoading}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            navigate={navigate}
          />

          {CATEGORIES.map((cat) => (
            <ProductSection
              key={cat}
              title={cat}
              eyebrow={`${cat.toUpperCase()} COLLECTION`}
              products={sections[cat]}
              loading={sectionsLoading}
              wishlist={wishlist}
              toggleWishlist={toggleWishlist}
              navigate={navigate}
              onViewAll={() => viewCategory(cat)}
            />
          ))}
        </>
      ) : (
        <section className="shop-results-section">
          <div className="collection-heading">
            <div>
              <span>{search ? 'SEARCH RESULTS' : 'COLLECTION'}</span>
              <h2 className="display">{search ? `Results for “${search}”` : category}</h2>
            </div>
            <small>{shopPagination.total || 0} products</small>
          </div>

          {shopLoading ? (
            <div className="loading">Loading collection…</div>
          ) : shopProducts.length === 0 ? (
            <div className="empty">
              <div className="display">No products found</div>
              <p>Try another search or category.</p>
            </div>
          ) : (
            <>
              <div className="modern-grid">{shopProducts.map(renderCard)}</div>
              {shopPagination.totalPages > 1 && (
                <div className="pagination-bar">
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={shopPagination.page <= 1 || shopLoading}
                    onClick={() => loadShopResults(shopPagination.page - 1)}
                  >
                    ← Previous
                  </button>
                  <span>
                    Page {shopPagination.page} of {shopPagination.totalPages}
                  </span>
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={shopPagination.page >= shopPagination.totalPages || shopLoading}
                    onClick={() => loadShopResults(shopPagination.page + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {(settings.aboutText || settings.phone || settings.whatsapp || settings.email || settings.address || settings.googleMaps || settings.instagram || settings.facebook) && (
        <section className="shop-info-area">
          <div className="shop-info-heading">
            <div>
              <span className="eyebrow">A LITTLE MORE ABOUT US</span>
              <h2 className="display">Made with care. Here to help.</h2>
            </div>
          </div>

          <div className="shop-info-grid">
            <article className="shop-info-card about-card">
              <div className="info-card-icon">✦</div>
              <span className="info-card-label">ABOUT THE SHOP</span>
              <h3>{settings.storeName}</h3>
              <p>{settings.aboutText || settings.tagline || 'Thank you for supporting our small business.'}</p>
            </article>

            <article className="shop-info-card">
              <div className="info-card-icon">♡</div>
              <span className="info-card-label">WHY SHOP WITH US</span>
              <div className="mini-benefit"><span>✓</span><div><strong>Carefully selected</strong><small>Products prepared with attention to detail.</small></div></div>
              <div className="mini-benefit"><span>✓</span><div><strong>Friendly support</strong><small>Contact the shop directly whenever you need help.</small></div></div>
              <div className="mini-benefit"><span>✓</span><div><strong>Simple ordering</strong><small>Choose your product and place your order easily.</small></div></div>
            </article>

            <article className="shop-info-card contact-card">
              <div className="info-card-icon">⌁</div>
              <span className="info-card-label">CONTACT US</span>
              {settings.phone && <a href={`tel:${settings.phone}`} className="contact-link"><span>☎</span><div><strong>Call us</strong><small>{settings.phone}</small></div></a>}
              {settings.whatsapp && <a href={`https://wa.me/${String(settings.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="contact-link"><span>◉</span><div><strong>WhatsApp</strong><small>Chat with us</small></div></a>}
              {settings.email && <a href={`mailto:${settings.email}`} className="contact-link"><span>✉</span><div><strong>Email</strong><small>{settings.email}</small></div></a>}
              {settings.googleMaps && <a href={settings.googleMaps} target="_blank" rel="noreferrer" className="contact-link"><span>⌖</span><div><strong>Find our shop</strong><small>Open Google Maps</small></div></a>}
            </article>
          </div>

          {(settings.address || settings.city || settings.state || settings.pincode || settings.instagram || settings.facebook) && (
            <div className="shop-contact-bar">
              <div className="shop-address">
                <span>⌖</span>
                <div>
                  <strong>Visit / Delivery Address</strong>
                  <p>
                    {settings.address}
                    {(settings.city || settings.state || settings.pincode) && (
                      <>
                        {settings.address ? ', ' : ''}
                        {[settings.city, settings.state, settings.pincode].filter(Boolean).join(', ')}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="social-links">
                {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram</a>}
                {settings.facebook && <a href={settings.facebook} target="_blank" rel="noreferrer">Facebook</a>}
              </div>
            </div>
          )}
        </section>
      )}

      <footer className="shop-footer">
        <div className="footer-brand">
          <div className="brand-mark">SC</div>
          <div>
            <strong>{settings.storeName}</strong>
            <span>{settings.tagline || 'Handpicked products for you'}</span>
          </div>
        </div>
        <div className="footer-copy">© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</div>
      </footer>
    </main>
  );
}
