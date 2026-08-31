import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import api from '../api';
import { toEmbedUrl } from '../videoUtils';
import CheckoutModal from '../components/CheckoutModal.jsx';

function money(n) {
  return (Number(n) || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2
  });
}

export default function ProductDetails({ settings }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [active, setActive] = useState(0);

  const [liked, setLiked] = useState(false);

  const [showCheckout, setShowCheckout] = useState(false);

  /*
   * =========================================================
   * LOAD PRODUCT
   * =========================================================
   *
   * We load the complete products list because your current
   * backend already has GET /api/products working.
   */

  useEffect(() => {
    let alive = true;

    async function loadProduct() {
      try {
        setLoading(true);

        const res = await api.get(`/products/${id}`);

        if (!alive) return;
        setProduct(res.data || null);
      } catch (error) {
        console.error(
          'Could not load product:',
          error
        );

        if (alive) {
          setProduct(null);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      alive = false;
    };
  }, [id]);

  /*
   * =========================================================
   * WISHLIST
   * =========================================================
   *
   * Saved in localStorage so the heart remains after refresh.
   */

  useEffect(() => {
    if (!product?._id) return;

    try {
      const saved =
        JSON.parse(
          localStorage.getItem('sanvi_wishlist') || '[]'
        );

      setLiked(
        Array.isArray(saved) &&
          saved.includes(String(product._id))
      );
    } catch {
      setLiked(false);
    }
  }, [product?._id]);

  function toggleWishlist() {
    if (!product?._id) return;

    const key = String(product._id);

    let saved = [];

    try {
      saved =
        JSON.parse(
          localStorage.getItem('sanvi_wishlist') || '[]'
        );

      if (!Array.isArray(saved)) {
        saved = [];
      }
    } catch {
      saved = [];
    }

    let updated;

    if (saved.includes(key)) {
      updated = saved.filter(
        (item) => item !== key
      );
      setLiked(false);
    } else {
      updated = [...saved, key];
      setLiked(true);
    }

    localStorage.setItem(
      'sanvi_wishlist',
      JSON.stringify(updated)
    );
  }

  /*
   * =========================================================
   * MEDIA GALLERY
   * =========================================================
   *
   * Every image + video becomes one gallery item.
   */

  const media = useMemo(() => {
    if (!product) return [];

    const result = [];

    if (Array.isArray(product.images)) {
      product.images.forEach((url) => {
        if (
          typeof url === 'string' &&
          url.trim()
        ) {
          result.push({
            type: 'image',
            url: url.trim()
          });
        }
      });
    }

    /*
     * Support old products that may still use imageUrl.
     */
    if (
      result.length === 0 &&
      product.imageUrl
    ) {
      result.push({
        type: 'image',
        url: product.imageUrl
      });
    }

    /*
     * Add video after all photos.
     */
    if (
      product.videoUrl &&
      typeof product.videoUrl === 'string'
    ) {
      result.push({
        type: 'video',
        url: product.videoUrl
      });
    }

    return result;
  }, [product]);

  /*
   * =========================================================
   * GALLERY CONTROLS
   * =========================================================
   */

  function previous() {
    if (!media.length) return;

    setActive((current) =>
      current === 0
        ? media.length - 1
        : current - 1
    );
  }

  function next() {
    if (!media.length) return;

    setActive((current) =>
      current === media.length - 1
        ? 0
        : current + 1
    );
  }

  /*
   * =========================================================
   * STATES
   * =========================================================
   */

  if (loading) {
    return (
      <main className="product-page">
        <div className="loading">
          Loading product...
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="product-page">
        <div className="empty">
          <div className="display">
            Product not found
          </div>

          <p>
            This product could not be loaded.
          </p>

          <button
            className="btn"
            onClick={() => navigate('/')}
          >
            Back to shop
          </button>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * CURRENT MEDIA
   * =========================================================
   */

  const current =
    media[active] || null;

  const embedUrl =
    current?.type === 'video'
      ? toEmbedUrl(current.url)
      : null;

  return (
    <main className="product-page">

      {/* =====================================================
          BACK
      ===================================================== */}

      <button
        className="back-link"
        type="button"
        onClick={() => navigate('/')}
      >
        ← Back to shop
      </button>

      {/* =====================================================
          PRODUCT DETAIL
      ===================================================== */}

      <section className="product-detail">

        {/* ===================================================
            GALLERY
        =================================================== */}

        <div className="product-gallery">

          {/* THUMBNAILS */}

          <div className="gallery-thumbs">

            {media.map((item, index) => (
              <button
                key={`${item.type}-${index}`}
                type="button"
                className={
                  active === index
                    ? 'gallery-thumb selected'
                    : 'gallery-thumb'
                }
                onClick={() =>
                  setActive(index)
                }
                aria-label={
                  item.type === 'video'
                    ? 'View product video'
                    : `View product image ${index + 1}`
                }
              >

                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={`${product.name} ${index + 1}`}
                  />
                ) : (
                  <div className="video-thumb">
                    <span>▶</span>
                    <small>VIDEO</small>
                  </div>
                )}

              </button>
            ))}

          </div>

          {/* MAIN MEDIA */}

          <div className="main-media">

            {/* PREVIOUS */}

            {media.length > 1 && (
              <button
                type="button"
                className="media-arrow left"
                onClick={previous}
                aria-label="Previous media"
              >
                ‹
              </button>
            )}

            {/* IMAGE */}

            {current?.type === 'image' && (
              <img
                src={current.url}
                alt={product.name}
              />
            )}

            {/* VIDEO */}

            {current?.type === 'video' && (
              <div className="main-video">

                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={`${product.name} video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={current.url}
                    controls
                    playsInline
                    poster={
                      product.images?.[0] ||
                      product.imageUrl ||
                      undefined
                    }
                  />
                )}

              </div>
            )}

            {/* NO MEDIA */}

            {!current && (
              <div className="card-placeholder">
                {(product.name || '?')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}

            {/* NEXT */}

            {media.length > 1 && (
              <button
                type="button"
                className="media-arrow right"
                onClick={next}
                aria-label="Next media"
              >
                ›
              </button>
            )}

            {/* WISHLIST */}

            <button
              type="button"
              className={
                liked
                  ? 'detail-heart liked'
                  : 'detail-heart'
              }
              onClick={toggleWishlist}
              aria-label={
                liked
                  ? 'Remove from wishlist'
                  : 'Add to wishlist'
              }
              title={
                liked
                  ? 'Remove from wishlist'
                  : 'Add to wishlist'
              }
            >
              {liked ? '♥' : '♡'}
            </button>

            {/* MEDIA COUNT */}

            {media.length > 0 && (
              <div className="media-count">
                {active + 1} / {media.length}
              </div>
            )}

          </div>
        </div>

        {/* ===================================================
            PRODUCT INFORMATION
        =================================================== */}

        <div className="product-info">

          {/* CATEGORY */}

          {product.category &&
            product.category !== 'Other' && (
              <div className="detail-category">
                {product.category}
              </div>
            )}

          {/* NAME */}

          <h1>{product.name}</h1>

          {/* RATING */}

          <div className="rating-row">
            <span className="stars">
              ★★★★★
            </span>

            <span>
              New collection
            </span>
          </div>

          {/* PRICE */}

          <div className="detail-price">
            ₹{money(product.price)}
          </div>

          <div className="tax-note">
            Inclusive of applicable taxes
          </div>

          <div className="detail-line" />

          {/* DESCRIPTION */}

          <p className="detail-description">
            {product.description ||
              'Beautifully selected product from our collection.'}
          </p>

          {/* =================================================
              FEATURES
          ================================================= */}

          <div className="feature-grid">

            <div>
              <span>🚚</span>

              <b>
                Easy Delivery
              </b>

              <small>
                Across India
              </small>
            </div>

            <div>
              <span>✓</span>

              <b>
                Quality Checked
              </b>

              <small>
                Before dispatch
              </small>
            </div>

            <div>
              <span>🔒</span>

              <b>
                Secure Payment
              </b>

              <small>
                UPI supported
              </small>
            </div>

            <div>
              <span>💬</span>

              <b>
                Customer Support
              </b>

              <small>
                We're here to help
              </small>
            </div>

          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="detail-actions">

            <button
              type="button"
              className="btn add-cart-btn"
              onClick={() =>
                setShowCheckout(true)
              }
            >
              🛒 Add to Cart
            </button>

            <button
              type="button"
              className="btn buy-btn"
              onClick={() =>
                setShowCheckout(true)
              }
            >
              Buy Now
            </button>

          </div>

          {/* =================================================
              TRUST BOX
          ================================================= */}

          <div className="trust-box">

            <div>
              <strong>
                Authentic products
              </strong>

              <span>
                Carefully selected by{' '}
                {settings?.storeName ||
                  'Sanvi Collection'}
              </span>
            </div>

            <div>
              <strong>
                Need help?
              </strong>

              <span>
                Contact us before ordering
              </span>
            </div>

          </div>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <details
            className="description-box"
            open
          >
            <summary>
              Product Description
            </summary>

            <p>
              {product.description ||
                'Product details will appear here.'}
            </p>
          </details>

          {/* =================================================
              SHIPPING
          ================================================= */}

          <details className="description-box">
            <summary>
              Shipping Information
            </summary>

            <p>
              Delivery details and charges
              can be confirmed during checkout.
            </p>
          </details>

          {/* =================================================
              PAYMENT INFORMATION
          ================================================= */}

          <details className="description-box">
            <summary>
              Payment Information
            </summary>

            <p>
              You can place your order without
              creating an account. UPI payment
              will be available after entering
              your delivery details.
            </p>
          </details>

        </div>
      </section>

      {/* =====================================================
          REAL CHECKOUT / ORDER DETAILS
      ===================================================== */}

      {showCheckout && (
        <CheckoutModal
          product={product}
          settings={settings}
          onClose={() =>
            setShowCheckout(false)
          }
        />
      )}

    </main>
  );
}