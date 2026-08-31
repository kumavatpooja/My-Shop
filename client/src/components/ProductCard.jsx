import React, { useState } from 'react';
import { toEmbedUrl } from '../videoUtils';

function money(n) {
  return (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export default function ProductCard({ product, onBuy }) {
  const images = product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : [];
  const [index, setIndex] = useState(0);
  const [failedIdx, setFailedIdx] = useState(new Set());

  const embedUrl = product.videoUrl ? toEmbedUrl(product.videoUrl) : null;
  const hasDirectVideo = product.videoUrl && !embedUrl;
  const currentImg = images[index];
  const showImage = currentImg && !failedIdx.has(index);

  function markFailed(i) {
    setFailedIdx((prev) => new Set(prev).add(i));
  }

  function prev(e) {
    e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  }
  function next(e) {
    e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  }

  return (
    <div className="card">
      <div className="img">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={product.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 0 }}
          />
        ) : hasDirectVideo ? (
          <video
            src={product.videoUrl}
            controls
            poster={images[0] || undefined}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : showImage ? (
          <>
            <img src={currentImg} alt={product.name} onError={() => markFailed(index)} />
            {images.length > 1 && (
              <>
                <button className="gallery-nav prev" onClick={prev} aria-label="Previous photo">
                  ‹
                </button>
                <button className="gallery-nav next" onClick={next} aria-label="Next photo">
                  ›
                </button>
                <div className="gallery-dots">
                  {images.map((_, i) => (
                    <span key={i} className={i === index ? 'dot active' : 'dot'} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <span className="placeholder">{(product.name || '?').slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="body">
        {product.category && product.category !== 'Other' && (
          <span className="category-tag">{product.category}</span>
        )}
        <div className="pname">{product.name}</div>
        <div className="pdesc">{product.description}</div>
        <div className="row">
          <div className="price">
            <span style={{ fontSize: 14 }}>₹</span>
            {money(product.price)}
          </div>
          <button className="btn" onClick={onBuy}>
            Buy now
          </button>
        </div>
      </div>
    </div>
  );
}
