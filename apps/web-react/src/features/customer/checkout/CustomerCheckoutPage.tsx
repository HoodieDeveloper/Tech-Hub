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

export function CustomerCheckoutPage({
  user,
  cartItems,
  onBack,
  onOrderSuccess,
}: Props) {
  const [
    customerName,
    setCustomerName,
  ] =
    useState(
      user.name,
    );

  const [
    customerEmail,
    setCustomerEmail,
  ] =
    useState(
      user.email,
    );

  const [
    customerPhone,
    setCustomerPhone,
  ] =
    useState('');

  const [
    shippingAddress,
    setShippingAddress,
  ] =
    useState('');

  const [
    latitude,
    setLatitude,
  ] =
    useState<number | null>(
      null,
    );

  const [
    longitude,
    setLongitude,
  ] =
    useState<number | null>(
      null,
    );

  const [
    locating,
    setLocating,
  ] =
    useState(false);

  const [
    locationError,
    setLocationError,
  ] =
    useState('');

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState(
      'fake_card',
    );

  const [
    savedCard,
    setSavedCard,
  ] =
    useState<SavedCard | null>(
      null,
    );

  const [
    loadingSavedCard,
    setLoadingSavedCard,
  ] =
    useState(true);

  const [
    useSavedCard,
    setUseSavedCard,
  ] =
    useState(false);

  /*
   * DEMO CARD FIELDS
   *
   * No fixed card.
   * No frontend validation.
   * User can type anything.
   */
  const [
    cardNumber,
    setCardNumber,
  ] =
    useState('');

  const [
    cardName,
    setCardName,
  ] =
    useState(
      user.name,
    );

  const [
    cardExpiry,
    setCardExpiry,
  ] =
    useState('');

  const [
    cardCvv,
    setCardCvv,
  ] =
    useState('');

  const [
    notes,
    setNotes,
  ] =
    useState('');

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState('');

  /*
   * =========================================
   * LOAD SAVED DEMO CARD
   * =========================================
   */

  useEffect(() => {
    let cancelled =
      false;

    apiGet<SavedCardResponse>(
      '/payments/saved-card',
    )
      .then(
        (
          response,
        ) => {
          if (
            cancelled
          ) {
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
        },
      )
      .catch(() => {
        /*
         * Checkout still works
         * without a saved card.
         */
      })
      .finally(() => {
        if (
          !cancelled
        ) {
          setLoadingSavedCard(
            false,
          );
        }
      });

    return () => {
      cancelled =
        true;
    };
  }, []);

  /*
   * =========================================
   * ORDER TOTAL
   * =========================================
   */

  const subtotal =
    useMemo(
      () =>
        cartItems.reduce(
          (
            total,
            item,
          ) =>
            total +
            Number(
              item.product
                .price,
            ) *
              item.quantity,
          0,
        ),
      [
        cartItems,
      ],
    );

  const totalQuantity =
    useMemo(
      () =>
        cartItems.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.quantity,
          0,
        ),
      [
        cartItems,
      ],
    );

  /*
   * =========================================
   * GOOGLE MAPS
   * =========================================
   */

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
      !navigator
        .geolocation
    ) {
      setLocationError(
        'This browser cannot read your location.',
      );

      return;
    }

    setLocating(
      true,
    );

    setLocationError(
      '',
    );

    navigator.geolocation
      .getCurrentPosition(
        (
          position,
        ) => {
          setLatitude(
            position
              .coords
              .latitude,
          );

          setLongitude(
            position
              .coords
              .longitude,
          );

          setLocating(
            false,
          );
        },

        () => {
          setLocationError(
            'Location permission was denied or your location could not be found. You can still type your address manually.',
          );

          setLocating(
            false,
          );
        },

        {
          enableHighAccuracy:
            true,

          timeout:
            12000,

          maximumAge:
            30000,
        },
      );
  }

  /*
   * =========================================
   * PLACE ORDER
   * =========================================
   */

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      cartItems.length ===
      0
    ) {
      setError(
        'Your cart is empty.',
      );

      return;
    }

    /*
     * IMPORTANT:
     *
     * No demo-card validation here.
     *
     * Whatever the user typed is
     * sent to the Laravel demo backend.
     */

    setSubmitting(
      true,
    );

    setError(
      '',
    );

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

            /*
             * Send exactly what
             * the user typed.
             */
            card_number:
              paymentMethod ===
                  'fake_card' &&
                !useSavedCard
                ? cardNumber
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
                (
                  item,
                ) => ({
                  product_id:
                    item.product
                      .id,

                  quantity:
                    item.quantity,
                }),
              ),
          },
        );

      onOrderSuccess(
        response.order,
      );
    } catch (
      err
    ) {
      setError(
        err instanceof
          Error
          ? err.message
          : 'Unable to place your order.',
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  }

  return (
    <div className="customer-checkout-page">
      {/* =====================================
          PAGE HEADER
      ====================================== */}

      <div className="checkout-page-header">
        <button
          type="button"
          onClick={
            onBack
          }
        >
          <ArrowLeft
            size={18}
          />

          Back to Cart
        </button>

        <div>
          <h1>
            Checkout
          </h1>

          <p>
            Complete your order
            information.
          </p>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <form
        onSubmit={
          handleSubmit
        }
        className="checkout-layout"
      >
        <div className="checkout-main">
          {/* =====================================
              CUSTOMER INFORMATION
          ====================================== */}

          <section className="checkout-card">
            <div className="checkout-card-title">
              <UserRound
                size={21}
              />

              <div>
                <h2>
                  Customer Information
                </h2>

                <p>
                  Enter the information
                  used for this order.
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
                  value={
                    customerName
                  }
                  onChange={(
                    event,
                  ) =>
                    setCustomerName(
                      event
                        .target
                        .value,
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
                  value={
                    customerEmail
                  }
                  onChange={(
                    event,
                  ) =>
                    setCustomerEmail(
                      event
                        .target
                        .value,
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
                  <Phone
                    size={18}
                  />

                  <input
                    type="tel"
                    value={
                      customerPhone
                    }
                    onChange={(
                      event,
                    ) =>
                      setCustomerPhone(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="012 345 678"
                    required
                  />
                </div>
              </label>
            </div>
          </section>

          {/* =====================================
              DELIVERY ADDRESS
          ====================================== */}

          <section className="checkout-card">
            <div className="checkout-card-title">
              <MapPin
                size={21}
              />

              <div>
                <h2>
                  Delivery Address
                </h2>

                <p>
                  Type your address and
                  optionally pin your
                  current location on
                  Google Maps.
                </p>
              </div>
            </div>

            <label>
              <span>
                Shipping Address
              </span>

              <textarea
                value={
                  shippingAddress
                }
                onChange={(
                  event,
                ) =>
                  setShippingAddress(
                    event
                      .target
                      .value,
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
                onClick={
                  useCurrentLocation
                }
                disabled={
                  locating
                }
              >
                <LocateFixed
                  size={18}
                />

                {locating
                  ? 'Finding location...'
                  : latitude !==
                      null
                    ? 'Update My Pin'
                    : 'Use My Current Location'}
              </button>

              {mapsOpenUrl && (
                <a
                  href={
                    mapsOpenUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps
                </a>
              )}
            </div>

            {locationError && (
              <p className="checkout-location-error">
                {
                  locationError
                }
              </p>
            )}

            {mapUrl && (
              <div className="checkout-google-map">
                <iframe
                  title="Delivery location"
                  src={
                    mapUrl
                  }
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />

                <div className="checkout-coordinate-row">
                  <span>
                    Latitude:{' '}
                    {latitude?.toFixed(
                      6,
                    )}
                  </span>

                  <span>
                    Longitude:{' '}
                    {longitude?.toFixed(
                      6,
                    )}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* =====================================
              DEMO PAYMENT
          ====================================== */}

          <section className="checkout-card">
            <div className="checkout-card-title">
              <CreditCard
                size={21}
              />

              <div>
                <h2>
                  Demo Payment
                </h2>

                <p>
                  Learning payment only.
                  Enter any fake card
                  information you want.
                </p>
              </div>
            </div>

            {/* PAYMENT METHOD */}

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
                  onChange={(
                    event,
                  ) =>
                    handlePaymentMethodChange(
                      event
                        .target
                        .value,
                    )
                  }
                />

                <div>
                  <strong>
                    Demo Card
                  </strong>

                  <span>
                    Fake payment for
                    learning and testing.
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
                  onChange={(
                    event,
                  ) =>
                    handlePaymentMethodChange(
                      event
                        .target
                        .value,
                    )
                  }
                />

                <div>
                  <strong>
                    Cash on Delivery
                  </strong>

                  <span>
                    Test an unpaid
                    order.
                  </span>
                </div>
              </label>
            </div>

            {/* =====================================
                DEMO CARD
            ====================================== */}

            {paymentMethod ===
              'fake_card' && (
              <div className="checkout-card-form">
                {loadingSavedCard ? (
                  <div className="checkout-saved-card-loading">
                    Checking saved
                    demo card...
                  </div>
                ) : savedCard &&
                  useSavedCard ? (
                  /*
                   * SAVED DEMO CARD
                   */
                  <div className="checkout-saved-card">
                    <div className="checkout-saved-card-icon">
                      <CreditCard
                        size={24}
                      />
                    </div>

                    <div>
                      <span>
                        Saved demo card
                      </span>

                      <strong>
                        {
                          savedCard.brand
                        }{' '}
                        ••••{' '}
                        {
                          savedCard.last_four
                        }
                      </strong>

                      <small>
                        {
                          savedCard.cardholder_name
                        }
                        {' · '}
                        Expires{' '}
                        {String(
                          savedCard.expiry_month,
                        ).padStart(
                          2,
                          '0',
                        )}
                        /
                        {String(
                          savedCard.expiry_year,
                        ).slice(
                          -2,
                        )}
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
                      Enter another
                      demo card
                    </button>
                  </div>
                ) : (
                  <>
                    {/* USE SAVED CARD */}

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
                        Use saved demo
                        card ••••{' '}
                        {
                          savedCard.last_four
                        }
                      </button>
                    )}

                    {/* DEMO NOTICE */}

                    <div className="checkout-demo-note">
                      <strong>
                        Learning mode
                      </strong>

                      <span>
                        Enter any fake
                        card information.
                        No real payment
                        will be processed.
                      </span>
                    </div>

                    {/* CARD NUMBER */}

                    <label>
                      <span>
                        Card Number
                      </span>

                      <input
                        type="text"
                        value={
                          cardNumber
                        }
                        onChange={(
                          event,
                        ) =>
                          setCardNumber(
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Enter anything"
                      />
                    </label>

                    {/* CARD NAME */}

                    <label>
                      <span>
                        Cardholder Name
                      </span>

                      <input
                        type="text"
                        value={
                          cardName
                        }
                        onChange={(
                          event,
                        ) =>
                          setCardName(
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Any name"
                      />
                    </label>

                    <div className="checkout-card-form-row">
                      {/* EXPIRY */}

                      <label>
                        <span>
                          Expiry
                        </span>

                        <input
                          type="text"
                          value={
                            cardExpiry
                          }
                          onChange={(
                            event,
                          ) =>
                            setCardExpiry(
                              event
                                .target
                                .value,
                            )
                          }
                          placeholder="Anything"
                        />
                      </label>

                      {/* CVV */}

                      <label>
                        <span>
                          CVV
                        </span>

                        <input
                          type="text"
                          value={
                            cardCvv
                          }
                          onChange={(
                            event,
                          ) =>
                            setCardCvv(
                              event
                                .target
                                .value,
                            )
                          }
                          placeholder="Anything"
                        />
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          {/* =====================================
              ORDER NOTE
          ====================================== */}

          <section className="checkout-card">
            <label>
              <span>
                Order Note
                (Optional)
              </span>

              <textarea
                value={
                  notes
                }
                onChange={(
                  event,
                ) =>
                  setNotes(
                    event
                      .target
                      .value,
                  )
                }
                rows={3}
                placeholder="Any special delivery instructions..."
              />
            </label>
          </section>
        </div>

        {/* =====================================
            ORDER SUMMARY
        ====================================== */}

        <aside className="checkout-summary">
          <div className="checkout-summary-title">
            <ShoppingBag
              size={20}
            />

            <h2>
              Order Summary
            </h2>
          </div>

          <div className="checkout-items">
            {cartItems.map(
              (
                item,
              ) => (
                <div
                  key={
                    item.product
                      .id
                  }
                  className="checkout-summary-item"
                >
                  <div>
                    <strong>
                      {
                        item.product
                          .name
                      }
                    </strong>

                    <span>
                      Qty:{' '}
                      {
                        item.quantity
                      }
                    </span>
                  </div>

                  <strong>
                    $
                    {(
                      Number(
                        item.product
                          .price,
                      ) *
                      item.quantity
                    ).toFixed(
                      2,
                    )}
                  </strong>
                </div>
              ),
            )}
          </div>

          <div className="checkout-summary-row">
            <span>
              Subtotal (
              {totalQuantity}{' '}
              items)
            </span>

            <strong>
              $
              {subtotal.toFixed(
                2,
              )}
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
              $
              {subtotal.toFixed(
                2,
              )}
            </strong>
          </div>

          {/* PAY BUTTON */}

          <button
            type="submit"
            className="checkout-place-order"
            disabled={
              submitting ||
              cartItems.length ===
                0
            }
          >
            <CheckCircle2
              size={19}
            />

            {submitting
              ? 'Placing Order...'
              : paymentMethod ===
                  'fake_card'
                ? savedCard &&
                  useSavedCard
                  ? 'Buy with Saved Demo Card'
                  : 'Pay with Demo Card'
                : 'Place COD Order'}
          </button>

          <p>
            Demo payment only.
            No real bank transaction
            occurs. Full card details
            and CVV are not stored.
          </p>
        </aside>
      </form>
    </div>
  );
}