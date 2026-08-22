type Props = {
  onViewAll?: () => void;
};

export function CustomerFooter({
  onViewAll,
}: Props) {
  return (
    <footer className="store-footer">
      <div className="storefront-container footer-grid">

        {/* =====================================
            DCS INFORMATION
        ====================================== */}

        <div className="footer-brand">
          <h3>
            DCS Computer shop
          </h3>

          <p>
            Your trusted destination
            for the latest tech.
          </p>

          <p>
            Great products, Better
            experiences.
          </p>

          {/* SOCIAL MEDIA */}

          <div className="social-links">

            <button
              type="button"
              aria-label="Instagram"
            >
              <img
                src="/images/footer/Instagram.png"
                alt="Instagram"
              />
            </button>

            <button
              type="button"
              aria-label="Telegram"
            >
              <img
                src="/images/footer/Telegram.png"
                alt="Telegram"
              />
            </button>

            <button
              type="button"
              aria-label="Facebook"
              onClick={() =>
                window.open(
                  'https://www.facebook.com/dcscomputershop',
                  '_blank',
                  'noopener,noreferrer',
                )
              }
            >
              <img
                src="/images/footer/Facebook.png"
                alt="Facebook"
              />
            </button>

            <button
              type="button"
              aria-label="X"
            >
              <img
                src="/images/footer/x.png"
                alt="X"
              />
            </button>

          </div>
        </div>

        {/* =====================================
            SHOP
        ====================================== */}

        <div className="footer-column">
          <h4>
            Shop
          </h4>

          <button
            type="button"
            onClick={
              onViewAll
            }
          >
            All Categories
          </button>

          <button
            type="button"
          >
            Best Sellers
          </button>

          <button
            type="button"
          >
            New Arrivals
          </button>

          <button
            type="button"
          >
            Deals
          </button>
        </div>

        {/* =====================================
            CUSTOMER CARE
        ====================================== */}

        <div className="footer-column">
          <h4>
            Customer Care
          </h4>

          <button
            type="button"
          >
            Contact Us
          </button>

          <button
            type="button"
          >
            Track Order
          </button>

          <button
            type="button"
          >
            Return & Refunds
          </button>

          <button
            type="button"
          >
            Shipping Info
          </button>

          <button
            type="button"
          >
            FAQ
          </button>
        </div>

        {/* =====================================
            COMPANY
        ====================================== */}

        <div className="footer-column">
          <h4>
            Company
          </h4>

          <button
            type="button"
          >
            About DCS
          </button>

          <button
            type="button"
          >
            Careers
          </button>

          <button
            type="button"
          >
            Press
          </button>

          <button
            type="button"
          >
            DCS Rewards
          </button>

          <button
            type="button"
          >
            Sustainability
          </button>
        </div>

        {/* =====================================
            NEWSLETTER
        ====================================== */}

        <div className="footer-newsletter">
          <h4>
            Stay in the loop
          </h4>

          <p>
            Subscribe for exclusive
            deals and updates.
          </p>

          <div className="newsletter-form">

            <input
              type="email"
              placeholder="Enter Your Email"
            />

            <button
              type="button"
            >
              Subscribe
            </button>

          </div>

          {/* PAYMENT METHODS */}

          <div className="payment-methods">

            <img
              src="/images/footer/visa.png"
              alt="Visa"
            />

            <img
              src="/images/footer/MasterCard.png"
              alt="Mastercard"
            />

            <img
              src="/images/footer/PayPal.png"
              alt="PayPal"
            />

            <img
              src="/images/footer/wing.png"
              alt="Wing Bank"
            />

            <img
              src="/images/footer/ABA.png"
              alt="ABA Bank"
            />

          </div>
        </div>

      </div>

      {/* =====================================
          COPYRIGHT
      ====================================== */}

      <div className="storefront-container footer-bottom">
        © 2026 DCS, All rights reserved.
      </div>
    </footer>
  );
}