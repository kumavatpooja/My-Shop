import React, { useState } from 'react';
import api from '../api';

function readAndResizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));

      img.onload = () => {
        const maxDim = 900;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round(h * (maxDim / w));
            w = maxDim;
          } else {
            w = Math.round(w * (maxDim / h));
            h = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas failed'));
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

const MAX_IMAGES = 8;

export default function ProductForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel
}) {
  const [name, setName] = useState(initial?.name || '');
  const [price, setPrice] = useState(initial?.price ?? '');
  const [description, setDescription] = useState(initial?.description || '');
  const [images, setImages] = useState(
    initial?.images?.length
      ? initial.images
      : initial?.imageUrl
        ? [initial.imageUrl]
        : []
  );
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [category, setCategory] = useState(initial?.category || 'Other');
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl || '');
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [errors, setErrors] = useState({});
  const [imgError, setImgError] = useState('');

  function addImage(url) {
    if (!url || !url.trim()) return;

    if (images.length >= MAX_IMAGES) {
      setImgError(`You can add up to ${MAX_IMAGES} photos per product.`);
      return;
    }

    setImages((prev) => [...prev, url.trim()]);
    setImgError('');
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddUrlClick() {
    addImage(imageUrlInput);
    setImageUrlInput('');
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setImgError(`You can add up to ${MAX_IMAGES} photos per product.`);
      e.target.value = '';
      return;
    }

    const toProcess = files.slice(0, room);

    try {
      const dataUrls = await Promise.all(toProcess.map(readAndResizeImage));
      setImages((prev) => [...prev, ...dataUrls]);
      setImgError(
        files.length > toProcess.length
          ? `Only added the first ${room} — limit is ${MAX_IMAGES}.`
          : ''
      );
    } catch {
      setImgError("Couldn't read one of those images. Try different files.");
    }

    e.target.value = '';
  }

  async function handleVideoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setVideoError('That video is too large (max 50MB).');
      return;
    }

    setVideoUploading(true);
    setVideoError('');

    try {
      const formData = new FormData();
      formData.append('video', file);

      const res = await api.post('/upload/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setVideoUrl(res.data.url);
    } catch (err) {
      setVideoError(
        err.response?.data?.error ||
          'Upload failed. Try a different file.'
      );
    } finally {
      setVideoUploading(false);
      e.target.value = '';
    }
  }

  function handleSubmit() {
    const nameOk = name.trim().length > 0;
    const numericPrice = parseFloat(price);
    const priceOk =
      price !== '' && !Number.isNaN(numericPrice) && numericPrice > 0;

    setErrors({
      name: nameOk ? '' : 'Enter a product name.',
      price: priceOk ? '' : 'Enter a valid price greater than 0.'
    });

    if (!nameOk || !priceOk) return;

    onSubmit({
      name: name.trim(),
      price: numericPrice,
      description: description.trim(),
      images,
      videoUrl: videoUrl.trim(),
      category,
      newArrival: false
    });
  }

  return (
    <div className="panel">
      <div className="product-form-heading">
        <div>
          <span className="admin-eyebrow">PRODUCT MANAGEMENT</span>
          <h2>{initial ? 'Edit product' : 'Add a product'}</h2>
          {!initial && (
            <p className="sub">
              Add the product details. New products automatically appear at the top of New Arrivals.
            </p>
          )}
        </div>
        <div className="product-form-mark">✦</div>
      </div>

      <label>Product name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Handmade ceramic mug"
      />
      {errors.name && <div className="field-err">{errors.name}</div>}

      <label>Price (₹)</label>
      <input
        type="number"
        min="0"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="e.g. 499"
      />
      {errors.price && <div className="field-err">{errors.price}</div>}

      <label>Category</label>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="Bags">Bags</option>
        <option value="Jewelry">Jewelry</option>
        <option value="Clothes">Clothes</option>
        <option value="Other">Other</option>
      </select>

      <label>Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="A short line about the product"
      />

      <label>Product photos ({images.length}/{MAX_IMAGES})</label>

      {images.length > 0 && (
        <div className="gallery-list">
          {images.map((url, i) => (
            <div className="gallery-thumb" key={`${url}-${i}`}>
              <img src={url} alt="" />
              {i === 0 && <span className="cover-badge">Cover</span>}
              <button
                type="button"
                className="gallery-remove"
                onClick={() => removeImage(i)}
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="img-upload-row">
        <input type="file" accept="image/*" multiple onChange={handleFiles} />
      </div>

      <div className="img-upload-row">
        <input
          value={imageUrlInput}
          onChange={(e) => setImageUrlInput(e.target.value)}
          placeholder="Or paste an image URL"
          onKeyDown={(e) => e.key === 'Enter' && handleAddUrlClick()}
        />
        <button type="button" className="btn ghost" onClick={handleAddUrlClick}>
          Add
        </button>
      </div>

      {imgError && <div className="field-err">{imgError}</div>}
      <p className="or-sep">
        The first photo is used as the cover image on the shop page. Upload several at once, or paste links one at a time.
      </p>

      <label>Product video (optional)</label>
      <input
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="Paste a YouTube/Vimeo link or direct video URL, or upload below"
      />

      <div className="img-upload-row">
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoFile}
          disabled={videoUploading}
        />
        {videoUploading && <span className="or-sep">Uploading…</span>}
      </div>

      {videoUrl && !videoUploading && (
        <p className="or-sep">
          Video attached ✓ —{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => setVideoUrl('')}
          >
            remove
          </button>
        </p>
      )}

      {videoError && <div className="field-err">{videoError}</div>}
      <p className="or-sep">Shown instead of photos on the product card when set.</p>

      <div className="panel-foot">
        {onCancel && (
          <button className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button className="btn" onClick={handleSubmit} disabled={videoUploading}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
