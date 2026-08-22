import './CustomerCheckoutPage.css';
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  LocateFixed,
  MapPin,
  Phone,
  ShoppingBag,
  UserRound,
} from 'lucide-react';

import {
  apiGet,
  apiPost,
  type AuthUser,
} from '../../../core/api/client';

import type {
  CartItem,
} from '../cart/types';

import type {
  CustomerOrderResult,
} from '../orders/types';

type OrderResponse = {
  message: string;
  order: CustomerOrderResult;
};

type SavedCard = {
  id: number;
  brand: string;
  last_four: string;
  cardholder_name: string;
  expiry_month: number;
  expiry_year: number;
};

type SavedCardResponse = {
  saved_card: SavedCard | null;
};

type Props = {
  user: AuthUser;
  cartItems: CartItem[];

  onBack: () => void;

  onOrderSuccess: (
    order: CustomerOrderResult,
  ) => void;
};

const DEMO_CARD_NUMBER =
  '4242 4242 4242 4242';
const DEMO_CARD_EXPIRY =
  '12/34';
const DEMO_CARD_CVV =
  '123';

export function CustomerCheckoutPage({
  user,
  cartItems,
  onBack,
  onOrderSuccess,
}: Props) {
  const [
    customerName,
    setCustomerName,
  ] = useState(user.name);

  const [
    customerEmail,
    setCustomerEmail,
  ] = useState(user.email);

  const [
    customerPhone,
    setCustomerPhone,
  ] = useState('');

  const [
    shippingAddress,
    setShippingAddress,
  ] = useState('');

  const [
    latitude,
    setLatitude,
  ] = useState<number | null>(
    null,
  );

  const [
    longitude,
    setLongitude,
  ] = useState<number | null>(
    null,
  );

  const [
    locating,
    setLocating,
  ] = useState(false);

  const [
    locationError,
    setLocationError,
  ] = useState('');

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState('fake_card');

  const [
    savedCard,
    setSavedCard,
  ] = useState<SavedCard | null>(
    null,
  );

  const [
    loadingSavedCard,
    setLoadingSavedCard,
  ] = useState(true);

  const [
    useSavedCard,
    setUseSavedCard,
  ] = useState(false);

  const [
    cardNumber,
    setCardNumber,
  ] = useState(
    DEMO_CARD_NUMBER,
  );

  const [
    cardName,
    setCardName,
  ] = useState(user.name);

  const [
    cardExpiry,
    setCardExpiry,
  ] = useState(
    DEMO_CARD_EXPIRY,
  );

  const [
    cardCvv,
    setCardCvv,
  ] = useState(
    DEMO_CARD_CVV,
  );

  const [
    notes,
    setNotes,
  ] = useState('');

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  useEffect(() => {
    let cancelled = false;

    apiGet<SavedCardResponse>(
      '/payments/saved-card',
    )
      .then((response) => {
        if (cancelled) {
          return;
        }

        setSavedCard(
          response.saved_card,
        );

        if (
          response.saved_card
        ) {
          setUseSavedCard(
            true,
          );
        }
      })
      .catch(() => {
        /*
         * The page still works with
         * the built-in demo card when
         * no saved card can be loaded.
         */
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSavedCard(
            false,
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const subtotal =
    useMemo(
      () =>
        cartItems.reduce(
          (total, item) =>
            total +
            Number(
              item.product.price,
            ) *
              item.quantity,
          0,
        ),
      [cartItems],
    );

  const totalQuantity =
    useMemo(
      () =>
        cartItems.reduce(
          (total, item) =>
            total +
            item.quantity,
          0,
        ),
      [cartItems],
    );

  const mapUrl =
    latitude !== null &&
    longitude !== null
      ? `https://www.google.com/maps?q=${latitude},${longitude}&z=18&output=embed`
      : null;

  const mapsOpenUrl =
    latitude !== null &&
    longitude !== null
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

  function handlePaymentMethodChange(
    nextPaymentMethod: string,
  ) {
    setPaymentMethod(
      nextPaymentMethod,
    );
  }

  function useCurrentLocation() {
    if (
      !navigator.geolocation
    ) {
      setLocationError(
        'This browser cannot read your location.',
      );
      return;
    }

    setLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(
          position.coords.latitude,
        );
        setLongitude(
          position.coords.longitude,
        );
        setLocating(false);
      },
      () => {
        setLocationError(
          'Location permission was denied or your location could not be found. You can still type your address manually.',
        );
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      },
    );
  }

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      cartItems.length === 0
    ) {
      setError(
        'Your cart is empty.',
      );
      return;
    }

    if (
      paymentMethod ===
        'fake_card' &&
      !useSavedCard
    ) {
      const normalizedCardNumber =
        cardNumber.replace(
          /\s+/g,
          '',
        );

      if (
        normalizedCardNumber !==
        '4242424242424242'
      ) {
        setError(
          'This project only accepts the demo card 4242 4242 4242 4242. Do not enter a real card.',
        );
        return;
      }

      if (
        cardName
          .trim()
          .length < 2
      ) {
        setError(
          'Please enter the demo cardholder name.',
        );
        return;
      }

      if (
        !/^(0[1-9]|1[0-2])\/\d{2}$/.test(
          cardExpiry,
        )
      ) {
        setError(
          'Demo expiry date must be in MM/YY format.',
        );
        return;
      }

      if (
        !/^\d{3}$/.test(
          cardCvv,
        )
      ) {
        setError(
          'Demo CVV must be 3 digits.',
        );
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      const response =
        await apiPost<OrderResponse>(
          '/orders',
          {
            customer_name:
              customerName,

            customer_email:
              customerEmail,

            customer_phone:
              customerPhone,

            shipping_address:
              shippingAddress,

            shipping_latitude:
              latitude,

            shipping_longitude:
              longitude,

            payment_method:
              paymentMethod,

            use_saved_card:
              paymentMethod ===
                'fake_card' &&
              useSavedCard,

            card_number:
              paymentMethod ===
                  'fake_card' &&
                !useSavedCard
                ? cardNumber.replace(
                    /\s+/g,
                    '',
                  )
                : null,

            cardholder_name:
              paymentMethod ===
                  'fake_card' &&
                !useSavedCard
                ? cardName
                : null,

            card_expiry:
              paymentMethod ===
                  'fake_card' &&
                !useSavedCard
                ? cardExpiry
                : null,

            card_cvv:
              paymentMethod ===
                  'fake_card' &&
                !useSavedCard
                ? cardCvv
                : null,

            notes:
              notes.trim() ||
              null,

            items:
              cartItems.map(
                (item) => ({
                  product_id:
                    item.product.id,

                  quantity:
                    item.quantity,
                }),
              ),
          },
        );

      onOrderSuccess(
        response.order,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to place your order.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="customer-checkout-page">
      <div className="checkout-page-header">
        <button
          type="button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          Back to Cart
        </button>

        <div>
          <h1>
            Checkout
          </h1>

          <p>
            Complete your order information.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="checkout-layout"
      >
        <div className="checkout-main">
          <section className="checkout-card">
            <div className="checkout-card-title">
              <UserRound size={21} />

              <div>
                <h2>
                  Customer Information
                </h2>

                <p>
                  Enter the information used for this order.
                </p>
              </div>
            </div>

            <div className="checkout-form-grid">
              <label>
                <span>
                  Full Name
                </span>

                <input
                  type="text"
                  value={customerName}
                  onChange={(event) =>
                    setCustomerName(
                      event.target.value,
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  Email
                </span>

                <input
                  type="email"
                  value={customerEmail}
                  onChange={(event) =>
                    setCustomerEmail(
                      event.target.value,
                    )
                  }
                  required
                />
              </label>

              <label className="full-width">
                <span>
                  Phone Number
                </span>

                <div className="checkout-input-icon">
                  <Phone size={18} />

                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(event) =>
                      setCustomerPhone(
                        event.target.value,
                      )
                    }
                    placeholder="012 345 678"
                    required
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="checkout-card">
            <div className="checkout-card-title">
              <MapPin size={21} />

              <div>
                <h2>
                  Delivery Address
                </h2>

                <p>
                  Type your address and optionally pin your real current location on Google Maps.
                </p>
              </div>
            </div>

            <label>
              <span>
                Shipping Address
              </span>

              <textarea
                value={shippingAddress}
                onChange={(event) =>
                  setShippingAddress(
                    event.target.value,
                  )
                }
                rows={4}
                placeholder="House number, street, commune, district, Phnom Penh..."
                required
              />
            </label>

            <div className="checkout-map-actions">
              <button
                type="button"
                className="checkout-location-button"
                onClick={useCurrentLocation}
                disabled={locating}
              >
                <LocateFixed size={18} />
                {locating
                  ? 'Finding location...'
                  : latitude !== null
                    ? 'Update My Pin'
                    : 'Use My Current Location'}
              </button>

              {mapsOpenUrl && (
                <a
                  href={mapsOpenUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps
                </a>
              )}
            </div>

            {locationError && (
              <p className="checkout-location-error">
                {locationError}
              </p>
            )}

            {mapUrl && (
              <div className="checkout-google-map">
                <iframe
                  title="Delivery location"
                  src={mapUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />

                <div className="checkout-coordinate-row">
                  <span>
                    Latitude: {latitude?.toFixed(6)}
                  </span>
                  <span>
                    Longitude: {longitude?.toFixed(6)}
                  </span>
                </div>
              </div>
            )}
          </section>

          <section className="checkout-card">
            <div className="checkout-card-title">
              <CreditCard size={21} />

              <div>
                <h2>
                  Demo Payment
                </h2>

                <p>
                  This project uses a fake card only. Real card numbers are rejected.
                </p>
              </div>
            </div>

            <div className="checkout-payment-options">
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="fake_card"
                  checked={
                    paymentMethod ===
                    'fake_card'
                  }
                  onChange={(event) =>
                    handlePaymentMethodChange(
                      event.target.value,
                    )
                  }
                />

                <div>
                  <strong>
                    Demo Card
                  </strong>

                  <span>
                    Instant fake payment for testing the shop.
                  </span>
                </div>
              </label>

              <label>
                <input
                  type="radio"
                  name="payment"
                  value="cash_on_delivery"
                  checked={
                    paymentMethod ===
                    'cash_on_delivery'
                  }
                  onChange={(event) =>
                    handlePaymentMethodChange(
                      event.target.value,
                    )
                  }
                />

                <div>
                  <strong>
                    Cash on Delivery
                  </strong>

                  <span>
                    Keep COD available for testing unpaid orders.
                  </span>
                </div>
              </label>
            </div>

            {paymentMethod ===
              'fake_card' && (
              <div className="checkout-card-form">
                {loadingSavedCard ? (
                  <div className="checkout-saved-card-loading">
                    Checking saved demo card...
                  </div>
                ) : savedCard &&
                  useSavedCard ? (
                  <div className="checkout-saved-card">
                    <div className="checkout-saved-card-icon">
                      <CreditCard size={24} />
                    </div>

                    <div>
                      <span>
                        Saved demo card
                      </span>
                      <strong>
                        {savedCard.brand} •••• {savedCard.last_four}
                      </strong>
                      <small>
                        {savedCard.cardholder_name} · Expires {String(savedCard.expiry_month).padStart(2, '0')}/{String(savedCard.expiry_year).slice(-2)}
                      </small>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setUseSavedCard(
                          false,
                        )
                      }
                    >
                      Use demo card fields
                    </button>
                  </div>
                ) : (
                  <>
                    {savedCard && (
                      <button
                        type="button"
                        className="checkout-use-saved-card"
                        onClick={() =>
                          setUseSavedCard(
                            true,
                          )
                        }
                      >
                        Use saved demo card •••• {savedCard.last_four}
                      </button>
                    )}

                    <div className="checkout-demo-note">
                      <strong>
                        Demo card only
                      </strong>
                      <span>
                        Number: 4242 4242 4242 4242 · Expiry: 12/34 · CVV: 123
                      </span>
                    </div>

                    <label>
                      <span>
                        Demo Card Number
                      </span>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={cardNumber}
                        onChange={(event) => {
                          const digits =
                            event.target.value
                              .replace(/\D/g, '')
                              .slice(0, 16);

                          setCardNumber(
                            digits.replace(
                              /(\d{4})(?=\d)/g,
                              '$1 ',
                            ),
                          );
                        }}
                        required
                      />
                    </label>

                    <label>
                      <span>
                        Demo Cardholder Name
                      </span>

                      <input
                        type="text"
                        value={cardName}
                        onChange={(event) =>
                          setCardName(
                            event.target.value,
                          )
                        }
                        required
                      />
                    </label>

                    <div className="checkout-card-form-row">
                      <label>
                        <span>
                          Demo Expiry
                        </span>

                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(event) =>
                            setCardExpiry(
                              event.target.value
                                .replace(/[^\d/]/g, '')
                                .slice(0, 5),
                            )
                          }
                          maxLength={5}
                          required
                        />
                      </label>

                      <label>
                        <span>
                          Demo CVV
                        </span>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={cardCvv}
                          onChange={(event) =>
                            setCardCvv(
                              event.target.value
                                .replace(/\D/g, '')
                                .slice(0, 3),
                            )
                          }
                          maxLength={3}
                          required
                        />
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          <section className="checkout-card">
            <label>
              <span>
                Order Note (Optional)
              </span>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
                rows={3}
                placeholder="Any special delivery instructions..."
              />
            </label>
          </section>
        </div>

        <aside className="checkout-summary">
          <div className="checkout-summary-title">
            <ShoppingBag size={20} />
            <h2>
              Order Summary
            </h2>
          </div>

          <div className="checkout-items">
            {cartItems.map(
              (item) => (
                <div
                  key={item.product.id}
                  className="checkout-summary-item"
                >
                  <div>
                    <strong>
                      {item.product.name}
                    </strong>

                    <span>
                      Qty: {item.quantity}
                    </span>
                  </div>

                  <strong>
                    ${(
                      Number(
                        item.product.price,
                      ) *
                      item.quantity
                    ).toFixed(2)}
                  </strong>
                </div>
              ),
            )}
          </div>

          <div className="checkout-summary-row">
            <span>
              Subtotal ({totalQuantity} items)
            </span>

            <strong>
              ${subtotal.toFixed(2)}
            </strong>
          </div>

          <div className="checkout-summary-row">
            <span>
              Shipping
            </span>

            <strong>
              Free
            </strong>
          </div>

          <div className="checkout-summary-total">
            <span>
              Total
            </span>

            <strong>
              ${subtotal.toFixed(2)}
            </strong>
          </div>

          <button
            type="submit"
            className="checkout-place-order"
            disabled={
              submitting ||
              cartItems.length === 0
            }
          >
            <CheckCircle2 size={19} />

            {submitting
              ? 'Placing Order...'
              : paymentMethod === 'fake_card'
                ? savedCard && useSavedCard
                  ? 'Buy with Saved Demo Card'
                  : 'Pay with Demo Card'
                : 'Place COD Order'}
          </button>

          <p>
            Demo card payment is fake and stores only safe test metadata (brand, last four digits and expiry). CVV and full card number are never saved.
          </p>
        </aside>
      </form>
    </div>
  );
}
