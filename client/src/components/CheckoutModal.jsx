import React, { useState } from 'react';
import api from '../api';

function money(n) {
  return (Number(n) || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2
  });
}

function buildUpiLink(upiId, payeeName, amount, note) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName || 'Merchant',
    am: Number(amount).toFixed(2),
    cu: 'INR',
    tn: note || ''
  });

  return `upi://pay?${params.toString()}`;
}

export default function CheckoutModal({
  product,
  settings,
  onClose
}) {
  const [step, setStep] = useState('details');
  const [qty, setQty] = useState(1);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [order, setOrder] = useState(null);

  const price = Number(product?.price) || 0;

  const subtotal = price * qty;

  const shipping = Math.max(
    0,
    Number(settings?.shippingCharge) || 0
  );

  const total = subtotal + shipping;

  const payableTotal =
    Math.max(
      0,
      Number(order?.totalAmount) || total
    );

  const productImage =
    product?.images?.[0] ||
    product?.imageUrl ||
    '';

  const hasUpi =
    !!(
      settings?.upiId &&
      settings.upiId.trim()
    );

  const upiLink = hasUpi
    ? buildUpiLink(
        settings.upiId.trim(),
        settings.payeeName ||
          settings.storeName ||
          'Merchant',
        payableTotal,
        `Order - ${product?.name || 'Product'}`
      )
    : '';

  const qrSrc = hasUpi
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        upiLink
      )}`
    : '';

  async function handlePlaceOrder() {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Enter your name.';
    }

    if (!phone.trim()) {
      newErrors.phone =
        'Enter your phone number.';
    }

    if (!address.trim()) {
      newErrors.address =
        'Enter your delivery address.';
    }

    if (!city.trim()) {
      newErrors.city =
        'Enter your city.';
    }

    if (!state.trim()) {
      newErrors.state =
        'Enter your state.';
    }

    if (!pincode.trim()) {
      newErrors.pincode =
        'Enter your PIN code.';
    } else if (
      !/^\d{6}$/.test(pincode.trim())
    ) {
      newErrors.pincode =
        'Enter a valid 6-digit PIN code.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await api.post('/orders', {
        productId: product?._id,

        productName:
          product?.name || '',

        productPrice:
          product?.price || 0,

        quantity: qty,

        buyerName:
          name.trim(),

        buyerPhone:
          phone.trim(),

        buyerEmail:
          email.trim(),

        buyerAddress:
          address.trim(),

        buyerCity:
          city.trim(),

        buyerState:
          state.trim(),

        buyerPincode:
          pincode.trim(),

        paymentMethod: 'UPI'
      });

      setOrder(res.data);
      setStep('pay');

    } catch (err) {
      console.error(
        'Order error:',
        err
      );

      setSubmitError(
        err.response?.data?.error ||
        "Couldn't place the order. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function inputClass(error) {
    return error
      ? 'checkout-input checkout-input-error'
      : 'checkout-input';
  }

  return (
    <div
      className="checkout-overlay"
      onClick={(e) => {
        if (
          e.target === e.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div className="checkout-modal">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="checkout-header">

          <div>
            <div className="checkout-kicker">
              CHECKOUT
            </div>

            <h2>
              Complete your order
            </h2>

            <p>
              No account required
            </p>
          </div>

          <button
            type="button"
            className="checkout-close"
            onClick={onClose}
            aria-label="Close checkout"
          >
            ×
          </button>

        </div>


        {/* =================================================
            STEPS
        ================================================= */}

        <div className="checkout-steps">

          <div
            className={
              step === 'details'
                ? 'checkout-step active'
                : 'checkout-step done'
            }
          >

            <span>
              {step === 'pay' ? '✓' : '1'}
            </span>

            <div>
              <b>Details</b>
              <small>
                Delivery information
              </small>
            </div>

          </div>

          <div className="checkout-step-line" />

          <div
            className={
              step === 'pay'
                ? 'checkout-step active'
                : 'checkout-step'
            }
          >

            <span>
              2
            </span>

            <div>
              <b>Payment</b>
              <small>
                Pay securely
              </small>
            </div>

          </div>

        </div>


        {/* =================================================
            DETAILS SCREEN
        ================================================= */}

        {step === 'details' && (

          <>

            <div className="checkout-content">

              {/* ===========================================
                  LEFT — FORM
              =========================================== */}

              <div className="checkout-form">

                <div className="checkout-section-title">
                  <span>01</span>
                  Delivery details
                </div>


                {/* FULL NAME */}

                <div className="checkout-field">

                  <label>
                    Full name
                    <em>*</em>
                  </label>

                  <input
                    className={inputClass(
                      errors.name
                    )}
                    value={name}
                    onChange={(e) =>
                      setName(
                        e.target.value
                      )
                    }
                    placeholder="Your full name"
                  />

                  {errors.name && (
                    <div className="checkout-error">
                      {errors.name}
                    </div>
                  )}

                </div>


                {/* PHONE */}

                <div className="checkout-field">

                  <label>
                    Phone number
                    <em>*</em>
                  </label>

                  <input
                    className={inputClass(
                      errors.phone
                    )}
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value
                      )
                    }
                    placeholder="10-digit mobile number"
                    inputMode="tel"
                  />

                  {errors.phone && (
                    <div className="checkout-error">
                      {errors.phone}
                    </div>
                  )}

                </div>


                {/* EMAIL */}

                <div className="checkout-field">

                  <label>
                    Email
                    <span
                      style={{
                        marginLeft: 4,
                        fontWeight: 400,
                        color: '#999'
                      }}
                    >
                      optional
                    </span>
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    placeholder="your@email.com"
                  />

                </div>


                {/* ADDRESS */}

                <div className="checkout-section-title">
                  <span>02</span>
                  Delivery address
                </div>

                <div className="checkout-field">

                  <label>
                    Address
                    <em>*</em>
                  </label>

                  <textarea
                    className={
                      errors.address
                        ? 'checkout-input-error'
                        : ''
                    }
                    value={address}
                    onChange={(e) =>
                      setAddress(
                        e.target.value
                      )
                    }
                    placeholder="House / Flat / Street / Area"
                    rows={3}
                  />

                  {errors.address && (
                    <div className="checkout-error">
                      {errors.address}
                    </div>
                  )}

                </div>


                {/* CITY + STATE */}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: 14
                  }}
                >

                  <div className="checkout-field">

                    <label>
                      City
                      <em>*</em>
                    </label>

                    <input
                      value={city}
                      onChange={(e) =>
                        setCity(
                          e.target.value
                        )
                      }
                      placeholder="City"
                    />

                    {errors.city && (
                      <div className="checkout-error">
                        {errors.city}
                      </div>
                    )}

                  </div>


                  <div className="checkout-field">

                    <label>
                      State
                      <em>*</em>
                    </label>

                    <input
                      value={state}
                      onChange={(e) =>
                        setState(
                          e.target.value
                        )
                      }
                      placeholder="State"
                    />

                    {errors.state && (
                      <div className="checkout-error">
                        {errors.state}
                      </div>
                    )}

                  </div>

                </div>


                {/* PIN */}

                <div className="checkout-field">

                  <label>
                    PIN code
                    <em>*</em>
                  </label>

                  <input
                    value={pincode}
                    onChange={(e) =>
                      setPincode(
                        e.target.value
                          .replace(
                            /\D/g,
                            ''
                          )
                          .slice(0, 6)
                      )
                    }
                    placeholder="6-digit PIN"
                    inputMode="numeric"
                  />

                  {errors.pincode && (
                    <div className="checkout-error">
                      {errors.pincode}
                    </div>
                  )}

                </div>


                {submitError && (
                  <div className="checkout-submit-error">
                    {submitError}
                  </div>
                )}

              </div>


              {/* ===========================================
                  RIGHT — SUMMARY
              =========================================== */}

              <div className="checkout-summary">

                <div className="checkout-section-title">
                  <span>02</span>
                  Your order
                </div>


                {/* PRODUCT */}

                <div className="checkout-product">

                  <div className="checkout-product-image">

                    {productImage ? (

                      <img
                        src={productImage}
                        alt={
                          product?.name ||
                          'Product'
                        }
                      />

                    ) : (

                      <span>
                        {(product?.name || '?')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>

                    )}

                  </div>


                  <div className="checkout-product-info">

                    <h3>
                      {product?.name}
                    </h3>

                    {product?.category && (
                      <span>
                        {product.category}
                      </span>
                    )}

                    <strong>
                      ₹{money(price)}
                    </strong>

                  </div>

                </div>


                {/* QUANTITY */}

                <div className="checkout-quantity">

                  <div>

                    <span>
                      Quantity
                    </span>

                    <small>
                      Choose how many you need
                    </small>

                  </div>


                  <div className="checkout-qty">

                    <button
                      type="button"
                      onClick={() =>
                        setQty((q) =>
                          Math.max(
                            1,
                            q - 1
                          )
                        )
                      }
                    >
                      −
                    </button>

                    <b>
                      {qty}
                    </b>

                    <button
                      type="button"
                      onClick={() =>
                        setQty((q) =>
                          Math.min(
                            99,
                            q + 1
                          )
                        )
                      }
                    >
                      +
                    </button>

                  </div>

                </div>


                <div className="checkout-divider" />


                {/* PRICE */}

                <div className="checkout-price-row">

                  <span>
                    Product
                  </span>

                  <span>
                    ₹{money(subtotal)}
                  </span>

                </div>


                {/* SHIPPING */}

                <div className="checkout-price-row">

                  <span>
                    Delivery
                  </span>

                  <span
                    className={
                      shipping <= 0
                        ? 'free'
                        : ''
                    }
                  >
                    {shipping > 0
                      ? `₹${money(
                          shipping
                        )}`
                      : 'FREE'}
                  </span>

                </div>


                <div className="checkout-divider" />


                {/* TOTAL */}

                <div className="checkout-total">

                  <span>
                    Total
                  </span>

                  <strong>
                    ₹{money(total)}
                  </strong>

                </div>


                {/* SAFE */}

                <div className="checkout-safe">

                  <span>
                    ✓
                  </span>

                  <div>

                    <b>
                      Secure checkout
                    </b>

                    <small>
                      Your details are sent
                      directly to the seller.
                    </small>

                  </div>

                </div>

              </div>

            </div>


            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="checkout-footer">

              <div className="footer-total">

                <span>
                  Total
                </span>

                <strong>
                  ₹{money(total)}
                </strong>

              </div>


              <button
                type="button"
                className="continue-payment"
                disabled={submitting}
                onClick={handlePlaceOrder}
              >

                {submitting ? (

                  <>
                    <span className="spinner" />
                    Creating order…
                  </>

                ) : (

                  <>
                    <span>
                      Continue to Payment
                    </span>

                    <span>
                      →
                    </span>
                  </>

                )}

              </button>

            </div>

          </>

        )}


        {/* =================================================
            PAYMENT SCREEN
        ================================================= */}

        {step === 'pay' && (

          <div className="payment-screen">

            <div className="payment-success">

              <span>
                ✓
              </span>

              <h3>
                Order created!
              </h3>

              <p>
                Your order is saved.
                Complete payment below.
              </p>

            </div>


            <div className="payment-card">

              {/* ORDER */}

              <div className="payment-product">

                <span>
                  {product?.name}
                  {' · '}
                  Qty {qty}
                </span>

                <strong>
                  ₹{money(payableTotal)}
                </strong>

              </div>


              {order?._id && (

                <div
                  style={{
                    marginTop: 12,
                    fontSize: 10,
                    color: '#888'
                  }}
                >
                  Order ID:{' '}
                  <strong
                    style={{
                      color:
                        '#182033'
                    }}
                  >
                    {order._id
                      .slice(-8)
                      .toUpperCase()}
                  </strong>
                </div>

              )}


              {hasUpi ? (

                <>

                  <div className="upi-title">
                    Pay securely with UPI
                  </div>


                  <div className="qr-box">

                    <img
                      src={qrSrc}
                      alt="UPI payment QR code"
                    />

                  </div>


                  <div className="scan-text">
                    Scan this QR code with
                    any UPI app. On mobile,
                    you can tap the button
                    below.
                  </div>


                  <a
                    href={upiLink}
                    className="payment-button"
                  >
                    Pay ₹{money(
                      payableTotal
                    )} via UPI
                  </a>


                  <p className="payment-note">
                    After completing payment,
                    the seller will process
                    your order.
                  </p>

                </>

              ) : (

                <div className="no-upi">

                  <strong>
                    UPI payment is not
                    configured yet.
                  </strong>

                  <p>
                    Your order has been saved
                    as Pending. Please contact
                    the seller for payment
                    instructions.
                  </p>

                </div>

              )}


              <button
                type="button"
                className="back-to-details"
                onClick={() =>
                  setStep('details')
                }
              >
                ← Back to details
              </button>


              <button
                type="button"
                className="btn ghost block"
                style={{
                  marginTop: 10
                }}
                onClick={onClose}
              >
                Done
              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}