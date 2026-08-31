import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CATEGORIES = ['Bags', 'Clothes', 'Jewelry', 'Other'];

function money(n) {
  return (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function getWishlist() {
  try {
    const saved = JSON.parse(localStorage.getItem('sanvi_wishlist') || '[]');
    return Array.isArray(saved) ? saved.map(String) : [];
  } catch { return []; }
}

function saveWishlist(ids) {
  localStorage.setItem('sanvi_wishlist', JSON.stringify(ids));
  window.dispatchEvent(new Event('wishlistChanged'));
}

function ProductCard({ product, onRemove, navigate }) {
  const image = product.images?.[0] || product.imageUrl || '';
  return (
    <article className="wishlist-card">
      <div className="wishlist-card-media" onClick={() => navigate(`/product/${product._id}`)}>
        {image ? <img src={image} alt={product.name} /> : <div className="card-placeholder">{(product.name || '?').slice(0, 2).toUpperCase()}</div>}
        <button type="button" className="wishlist-remove" onClick={(e) => { e.stopPropagation(); onRemove(product._id); }} aria-label="Remove from wishlist">♥</button>
        {product.videoUrl && <span className="video-badge">▶ VIDEO</span>}
      </div>
      <div className="wishlist-card-body">
        {product.category && product.category !== 'Other' && <span className="wishlist-category">{product.category}</span>}
        <h3>{product.name}</h3>
        <p>{product.description || 'Beautifully selected product'}</p>
        <div className="wishlist-card-bottom">
          <strong>₹{money(product.price)}</strong>
          <button type="button" className="quick-add" onClick={() => navigate(`/product/${product._id}`)}>View →</button>
        </div>
      </div>
    </article>
  );
}

export default function Wishlist() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(getWishlist);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products')
      .then((res) => { const data = res.data; setProducts(Array.isArray(data) ? data : data.products || []); })
      .catch((error) => { console.error('Could not load products:', error); setProducts([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const sync = () => setWishlistIds(getWishlist());
    window.addEventListener('wishlistChanged', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('wishlistChanged', sync); window.removeEventListener('storage', sync); };
  }, []);

  const wishlistProducts = useMemo(() => products.filter((p) => wishlistIds.includes(String(p._id))), [products, wishlistIds]);
  const groupedProducts = useMemo(() => {
    const groups = { Bags: [], Clothes: [], Jewelry: [], Other: [] };
    wishlistProducts.forEach((product) => {
      const category = CATEGORIES.includes(product.category) ? product.category : 'Other';
      groups[category].push(product);
    });
    return groups;
  }, [wishlistProducts]);

  function removeWishlist(productId) {
    const updated = wishlistIds.filter((id) => id !== String(productId));
    setWishlistIds(updated); saveWishlist(updated);
  }

  function clearWishlist() {
    if (!window.confirm('Clear your entire wishlist?')) return;
    setWishlistIds([]); saveWishlist([]);
  }

  return (
    <main className="wishlist-page">
      <section className="wishlist-hero">
        <div><span className="eyebrow">✦ YOUR SAVED ITEMS</span><h1 className="display">My Wishlist</h1><p>Products you love, saved for later.</p></div>
        <div className="wishlist-big-heart">♥</div>
      </section>
      {loading ? <div className="loading">Loading wishlist…</div> : wishlistProducts.length === 0 ? (
        <div className="wishlist-empty"><div className="empty-heart">♡</div><h2 className="display">Your wishlist is empty</h2><p>Tap the ♡ on any product you love and it will appear here.</p><button type="button" className="btn" onClick={() => navigate('/')}>Discover Products</button></div>
      ) : (
        <>
          <div className="wishlist-heading"><div><span>SAVED FOR YOU</span><h2 className="display">{wishlistProducts.length} {wishlistProducts.length === 1 ? 'Product' : 'Products'}</h2></div><button type="button" className="clear-wishlist" onClick={clearWishlist}>Clear wishlist</button></div>
          {CATEGORIES.map((category) => {
            const categoryProducts = groupedProducts[category];
            if (!categoryProducts.length) return null;
            return <section key={category} className="wishlist-category-section"><div className="wishlist-section-heading"><div><span>SAVED ITEMS</span><h2 className="display">{category}</h2></div><small>{categoryProducts.length} {categoryProducts.length === 1 ? 'item' : 'items'}</small></div><div className="wishlist-grid">{categoryProducts.map((product) => <ProductCard key={product._id} product={product} onRemove={removeWishlist} navigate={navigate} />)}</div></section>;
          })}
        </>
      )}
    </main>
  );
}
