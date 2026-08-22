import './CustomerCheckoutPage.css';
import {
  FormEvent,
  useMemo,
  useState,
} from 'react';

import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  MapPin,
  Phone,
  ShoppingBag,
  UserRound,
} from 'lucide-react';

import {
  apiPost,
  type AuthUser,
} from '../../../core/api/client';

import type {
  CartItem,
} from '../cart/types';

type OrderItem = {
  id: number;
  product_id: number | null;
  product_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
};

type Order = {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: string;
  delivery_fee: string;
  total: string;
  currency: string;
  items: OrderItem[];
};

type OrderResponse = {
  message: string;
  order: Order;
};

type Props = {
  user: AuthUser;
  cartItems: CartItem[];

  onBack: () => void;

  onOrderSuccess: (
    order: Order,
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
    paymentMethod,
    setPaymentMethod,
  ] = useState('bank_transfer');

  const [
    cardNumber,
    setCardNumber,
  ] = useState('');

  const [
    cardName,
    setCardName,
  ] = useState('');

  const [
    cardExpiry,
    setCardExpiry,
  ] = useState('');

  const [
    cardCvv,
    setCardCvv,
  ] = useState('');

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

  function handlePaymentMethodChange(
    nextPaymentMethod: string,
  ) {
    setPaymentMethod(
      nextPaymentMethod,
    );

    if (
      nextPaymentMethod ===
      'cash_on_delivery'
    ) {
      setCardNumber('');
      setCardName('');
      setCardExpiry('');
      setCardCvv('');
    }
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
      'bank_transfer'
    ) {
      const normalizedCardNumber =
        cardNumber.replace(
          /\s+/g,
          '',
        );

      if (
        !/^\d{16}$/.test(
          normalizedCardNumber,
        )
      ) {
        setError(
          'Card number must be exactly 16 digits.',
        );

        return;
      }

      if (
        cardName
          .trim()
          .length < 2
      ) {
        setError(
          'Please enter the cardholder name.',
        );

        return;
      }

      const expiryMatch =
        cardExpiry.match(
          /^(\d{2})\/(\d{2})$/,
        );

      if (!expiryMatch) {
        setError(
          'Expiry date must be in MM/YY format.',
        );

        return;
      }

      const expiryMonth = Number(
        expiryMatch[1],
      );

      if (
        expiryMonth < 1 ||
        expiryMonth > 12
      ) {
        setError(
          'Expiry month must be between 01 and 12.',
        );

        return;
      }

      if (
        !/^\d{3,4}$/.test(
          cardCvv,
        )
      ) {
        setError(
          'CVV must be 3 or 4 digits.',
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

            payment_method:
              paymentMethod,

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
            Complete your order
            information.
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
          {/* Customer Information */}

          <section className="checkout-card">
            <div className="checkout-card-title">
              <UserRound size={21} />

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
                  value={
                    customerEmail
                  }
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
                    value={
                      customerPhone
                    }
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

          {/* Delivery */}

          <section className="checkout-card">
            <div className="checkout-card-title">
              <MapPin size={21} />

              <div>
                <h2>
                  Delivery Address
                </h2>

                <p>
                  Where should we
                  deliver your order?
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
          </section>

          {/* Payment */}

          <section className="checkout-card">
            <div className="checkout-card-title">
              <CreditCard size={21} />

              <div>
                <h2>
                  Payment Method
                </h2>

                <p>
                  Choose how you want
                  to pay.
                </p>
              </div>
            </div>

            <div className="checkout-payment-options">
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="bank_transfer"
                  checked={
                    paymentMethod ===
                    'bank_transfer'
                  }
                  onChange={(event) =>
                    handlePaymentMethodChange(
                      event.target.value,
                    )
                  }
                />

                <div>
                  <strong>
                    Credit / Debit Card
                  </strong>

                  <span>
                    Pay securely
                    with your card.
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
                    Pay when your
                    order arrives.
                  </span>
                </div>
              </label>
            </div>

            {paymentMethod ===
              'bank_transfer' && (
              <div className="checkout-card-form">
                <label>
                  <span>
                    Card Number
                  </span>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={
                      cardNumber
                    }
                    onChange={(event) => {
                      const digits =
                        event.target.value
                          .replace(
                            /\D/g,
                            '',
                          )
                          .slice(
                            0,
                            16,
                          );

                      const grouped =
                        digits.replace(
                          /(\d{4})(?=\d)/g,
                          '$1 ',
                        );

                      setCardNumber(
                        grouped,
                      );
                    }}
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </label>

                <label>
                  <span>
                    Name on Card
                  </span>

                  <input
                    type="text"
                    autoComplete="cc-name"
                    value={
                      cardName
                    }
                    onChange={(event) =>
                      setCardName(
                        event.target.value,
                      )
                    }
                    placeholder="Cardholder name"
                    required
                  />
                </label>

                <div className="checkout-card-form-row">
                  <label>
                    <span>
                      Expiry Date
                    </span>

                    <input
                      type="text"
                      autoComplete="cc-exp"
                      inputMode="numeric"
                      value={
                        cardExpiry
                      }
                      onChange={(event) => {
                        const digits =
                          event.target.value
                            .replace(
                              /\D/g,
                              '',
                            )
                            .slice(
                              0,
                              4,
                            );

                        const formattedExpiry =
                          digits.length >
                          2
                            ? `${digits.slice(0, 2)}/${digits.slice(2)}`
                            : digits;

                        setCardExpiry(
                          formattedExpiry,
                        );
                      }}
                      maxLength={5}
                      placeholder="MM/YY"
                      required
                    />
                  </label>

                  <label>
                    <span>
                      CVV
                    </span>

                    <input
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={cardCvv}
                      onChange={(event) =>
                        setCardCvv(
                          event.target.value
                            .replace(
                              /\D/g,
                              '',
                            )
                            .slice(
                              0,
                              4,
                            ),
                        )
                      }
                      placeholder="123"
                      required
                    />
                  </label>
                </div>
              </div>
            )}
          </section>

          {/* Note */}

          <section className="checkout-card">
            <label>
              <span>
                Order Note
                {' '}
                (Optional)
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

        {/* Order Summary */}

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
                  key={
                    item.product.id
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
                    ).toFixed(2)}
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

          <button
            type="submit"
            className="checkout-place-order"
            disabled={
              submitting ||
              cartItems.length === 0
            }
          >
            <CheckCircle2
              size={19}
            />

            {submitting
              ? 'Placing Order...'
              : 'Place Order'}
          </button>

          <p>
            Laravel will verify
            prices and stock again
            before creating the
            order.
          </p>
        </aside>
      </form>
    </div>
  );
}