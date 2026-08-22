import {
  useEffect,
  useRef,
  useState,
} from 'react';

import type {
  ChangeEvent,
  FormEvent,
} from 'react';

import './LoginPage.css';

import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Headphones,
  Heart,
  ImagePlus,
  LockKeyhole,
  Mail,
  Search,
  ShoppingCart,
  Truck,
  UserRound,
} from 'lucide-react';

import {
  apiPost,
  apiPostForm,
  setAuthSession,
  type AuthUser,
} from '../../core/api/client';

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type Props = {
  onSuccess: (
    user: AuthUser,
  ) => void;

  onBack: () => void;
};

const MAX_AVATAR_SIZE =
  5 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export function LoginPage({
  onSuccess,
  onBack,
}: Props) {
  const [
    mode,
    setMode,
  ] =
    useState<
      'login' | 'register'
    >(
      'login',
    );

  const [
    name,
    setName,
  ] =
    useState('');

  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    password,
    setPassword,
  ] =
    useState('');

  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] =
    useState('');

  const [
    rememberMe,
    setRememberMe,
  ] =
    useState(false);

  const [
    avatar,
    setAvatar,
  ] =
    useState<File | null>(
      null,
    );

  const [
    avatarPreview,
    setAvatarPreview,
  ] =
    useState('');

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState('');

  const avatarInputRef =
    useRef<HTMLInputElement>(
      null,
    );

  /*
   * =========================================
   * CLEAN AVATAR PREVIEW
   * =========================================
   */

  useEffect(() => {
    return () => {
      if (
        avatarPreview
      ) {
        URL.revokeObjectURL(
          avatarPreview,
        );
      }
    };
  }, [avatarPreview]);

  /*
   * =========================================
   * AVATAR
   * =========================================
   */

  function handleAvatarChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile =
      event.target.files?.[0] ??
      null;

    setError('');
    setSuccessMessage('');

    if (!selectedFile) {
      setAvatar(
        null,
      );

      setAvatarPreview(
        '',
      );

      return;
    }

    if (
      !ALLOWED_AVATAR_TYPES.includes(
        selectedFile.type,
      )
    ) {
      event.target.value =
        '';

      setAvatar(
        null,
      );

      setAvatarPreview(
        '',
      );

      setError(
        'Profile picture must be JPG, PNG, or WEBP.',
      );

      return;
    }

    if (
      selectedFile.size >
      MAX_AVATAR_SIZE
    ) {
      event.target.value =
        '';

      setAvatar(
        null,
      );

      setAvatarPreview(
        '',
      );

      setError(
        'Profile picture must not be larger than 5 MB.',
      );

      return;
    }

    if (
      avatarPreview
    ) {
      URL.revokeObjectURL(
        avatarPreview,
      );
    }

    setAvatar(
      selectedFile,
    );

    setAvatarPreview(
      URL.createObjectURL(
        selectedFile,
      ),
    );
  }

  function removeAvatar() {
    if (
      avatarPreview
    ) {
      URL.revokeObjectURL(
        avatarPreview,
      );
    }

    setAvatar(
      null,
    );

    setAvatarPreview(
      '',
    );

    if (
      avatarInputRef.current
    ) {
      avatarInputRef
        .current
        .value = '';
    }
  }

  /*
   * =========================================
   * SUBMIT
   * =========================================
   */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(
      true,
    );

    setError(
      '',
    );

    setSuccessMessage(
      '',
    );

    try {
      /*
       * =====================================
       * LOGIN
       * =====================================
       *
       * Only Login saves the token
       * and enters the website.
       */
      if (
        mode === 'login'
      ) {
        const data =
          await apiPost<AuthResponse>(
            '/login',
            {
              email:
                email.trim(),

              password,
            },
            false,
          );

        setAuthSession(
          data.token,
          data.user,
        );

        onSuccess(
          data.user,
        );

        return;
      }

      /*
       * =====================================
       * REGISTER
       * =====================================
       */

      const formData =
        new FormData();

      formData.append(
        'name',
        name.trim(),
      );

      formData.append(
        'email',
        email.trim(),
      );

      formData.append(
        'password',
        password,
      );

      formData.append(
        'password_confirmation',
        passwordConfirmation,
      );

      if (
        avatar
      ) {
        formData.append(
          'avatar',
          avatar,
        );
      }

      /*
       * Create the account.
       *
       * IMPORTANT:
       * We intentionally do NOT call
       * setAuthSession() here.
       *
       * We also do NOT call onSuccess().
       *
       * The customer must log in
       * themselves after registration.
       */
      await apiPostForm<AuthResponse>(
        '/register',
        formData,
        false,
      );

      /*
       * Registration succeeded.
       *
       * Go back to Login mode.
       */
      setMode(
        'login',
      );

      /*
       * Keep email filled in
       * so the customer doesn't
       * have to type it again.
       */
      setEmail(
        email.trim(),
      );

      /*
       * Clear registration-only data.
       */
      setName(
        '',
      );

      setPassword(
        '',
      );

      setPasswordConfirmation(
        '',
      );

      setRememberMe(
        false,
      );

      removeAvatar();

      setSuccessMessage(
        'Account created successfully. Please log in to continue.',
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : mode ===
              'register'
            ? 'Unable to create account.'
            : 'Unable to log in.',
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  /*
   * =========================================
   * LOGIN / SIGN UP MODE
   * =========================================
   */

  function changeMode(
    nextMode:
      | 'login'
      | 'register',
  ) {
    setMode(
      nextMode,
    );

    setError(
      '',
    );

    setSuccessMessage(
      '',
    );

    setPassword(
      '',
    );

    setPasswordConfirmation(
      '',
    );

    removeAvatar();
  }

  return (
    <div className="shop-auth-page">

      {/* =====================================
          HEADER
      ====================================== */}

      <header className="shop-auth-header">
        <div className="shop-auth-topbar">
          <span>
            <Truck
              size={13}
            />

            Free shipping on orders
            over $49
          </span>

          <div>
            <span>
              Need help?
            </span>

            <span>
              +855 12 23 23 56
            </span>

            <span>
              Support
            </span>

            <span>
              Track Order
            </span>

            <span>
              English | USD
            </span>
          </div>
        </div>

        <div className="shop-auth-mainbar">
          <button
            type="button"
            className="shop-auth-brand"
            onClick={
              onBack
            }
          >
            DCS Computer Shop
          </button>

          <div className="shop-auth-search">
            <button
              type="button"
              className="category-button"
            >
              All Categories

              <ChevronDown
                size={17}
              />
            </button>

            <label>
              <input
                type="search"
                placeholder="Search for products, brands or categories..."
              />

              <Search
                size={22}
              />
            </label>
          </div>

          <div className="shop-auth-actions">
            <button
              type="button"
            >
              <Heart
                size={22}
              />

              <span>
                Wishlist
              </span>
            </button>

            <button
              type="button"
            >
              <UserRound
                size={22}
              />

              <span>
                Account
              </span>
            </button>

            <button
              type="button"
              className="cart-button"
            >
              <ShoppingCart
                size={23}
              />

              <span className="cart-badge">
                0
              </span>

              <span>
                Cart
              </span>
            </button>
          </div>
        </div>

        <nav className="shop-auth-nav">
          <button
            type="button"
            onClick={
              onBack
            }
          >
            Home
          </button>

          <button
            type="button"
          >
            Shop by Category

            <ChevronDown
              size={16}
            />
          </button>

          <button
            type="button"
          >
            Deals
          </button>

          <button
            type="button"
          >
            New Arrivals
          </button>

          <button
            type="button"
          >
            Best Sellers
          </button>

          <button
            type="button"
          >
            Brands
          </button>

          <button
            type="button"
          >
            TechHub Rewards
          </button>
        </nav>
      </header>

      {/* =====================================
          CONTENT
      ====================================== */}

      <main className="shop-auth-content">

        {/* VISUAL */}

        <section className="shop-auth-visual">
          <img
            src="/images/sci_fi_laptop.png"
            alt="Futuristic gaming laptop"
          />

          <div className="shop-auth-visual-overlay">
            <button
              type="button"
              className={
                mode ===
                'login'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                changeMode(
                  'login',
                )
              }
            >
              Login
            </button>

            <button
              type="button"
              className={
                mode ===
                'register'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                changeMode(
                  'register',
                )
              }
            >
              Sign Up
            </button>
          </div>
        </section>

        {/* FORM */}

        <section className="shop-auth-form-section">
          <button
            type="button"
            className="shop-auth-back"
            onClick={
              onBack
            }
          >
            <ArrowLeft
              size={17}
            />

            Back to products
          </button>

          <div className="shop-auth-form-container">

            {/* USER IMAGE */}

            <div className="shop-auth-user-icon">
              {mode ===
                'register' &&
              avatarPreview ? (
                <img
                  src={
                    avatarPreview
                  }
                  alt="Profile preview"
                  className="shop-auth-avatar-preview"
                />
              ) : (
                <UserRound
                  size={54}
                  strokeWidth={
                    1.8
                  }
                />
              )}
            </div>

            {/* TITLE */}

            <h1>
              {mode ===
              'login'
                ? 'Login to your account'
                : 'Create New Account'}
            </h1>

            {/* REGISTER SUCCESS MESSAGE */}

            {successMessage && (
              <div className="alert success">
                {
                  successMessage
                }
              </div>
            )}

            <form
              className="shop-auth-form"
              onSubmit={
                handleSubmit
              }
            >

              {/* PROFILE PICTURE */}

              {mode ===
                'register' && (
                <div className="shop-auth-avatar-field">
                  <label className="shop-auth-avatar-upload">
                    <ImagePlus
                      size={23}
                    />

                    <span>
                      {avatar
                        ? avatar.name
                        : 'Choose profile picture'}
                    </span>

                    <small>
                      JPG, PNG or WEBP
                      — max 5 MB
                    </small>

                    <input
                      ref={
                        avatarInputRef
                      }
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handleAvatarChange
                      }
                    />
                  </label>

                  {avatar && (
                    <button
                      type="button"
                      className="shop-auth-remove-avatar"
                      onClick={
                        removeAvatar
                      }
                    >
                      Remove picture
                    </button>
                  )}
                </div>
              )}

              {/* USERNAME */}

              {mode ===
                'register' && (
                <label className="shop-auth-input">
                  <UserRound
                    size={27}
                  />

                  <input
                    type="text"
                    value={
                      name
                    }
                    onChange={(
                      event,
                    ) =>
                      setName(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Please Enter your Username"
                    required
                  />
                </label>
              )}

              {/* EMAIL */}

              <label className="shop-auth-input">
                <Mail
                  size={27}
                />

                <input
                  type="email"
                  value={
                    email
                  }
                  onChange={(
                    event,
                  ) =>
                    setEmail(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Please Enter your E-mail"
                  required
                />
              </label>

              {/* PASSWORD */}

              <label className="shop-auth-input">
                <LockKeyhole
                  size={27}
                />

                <input
                  type="password"
                  value={
                    password
                  }
                  onChange={(
                    event,
                  ) =>
                    setPassword(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Password"
                  minLength={8}
                  required
                />
              </label>

              {/* CONFIRM PASSWORD */}

              {mode ===
                'register' && (
                <label className="shop-auth-input">
                  <LockKeyhole
                    size={27}
                  />

                  <input
                    type="password"
                    value={
                      passwordConfirmation
                    }
                    onChange={(
                      event,
                    ) =>
                      setPasswordConfirmation(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Please Re-type your Password"
                    minLength={8}
                    required
                  />
                </label>
              )}

              {/* OPTIONS */}

              <div className="shop-auth-options">
                <label className="remember-option">
                  <input
                    type="checkbox"
                    checked={
                      rememberMe
                    }
                    onChange={(
                      event,
                    ) =>
                      setRememberMe(
                        event
                          .target
                          .checked,
                      )
                    }
                  />

                  <span>
                    Remember Me
                  </span>
                </label>

                {mode ===
                  'login' && (
                  <button
                    type="button"
                    className="forgot-password-button"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {/* ERROR */}

              {error && (
                <div className="alert error">
                  {
                    error
                  }
                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                className="shop-auth-submit"
                disabled={
                  loading
                }
              >
                <span>
                  {loading
                    ? 'Please wait...'
                    : mode ===
                        'login'
                      ? 'Login'
                      : 'Create Account'}
                </span>

                {!loading && (
                  <ArrowRight
                    size={19}
                  />
                )}
              </button>
            </form>

            {/* SOCIAL LOGIN */}

            {mode ===
              'login' && (
              <div className="shop-auth-social-section">
                <div className="social-divider">
                  <span />

                  <p>
                    or continue with
                  </p>

                  <span />
                </div>

                <div className="social-login-grid">
                  <button
                    type="button"
                  >
                    <strong className="google-logo">
                      G
                    </strong>

                    <span>
                      Google
                    </span>
                  </button>

                  <button
                    type="button"
                  >
                    <strong className="apple-logo">
                      ●
                    </strong>

                    <span>
                      Apple
                    </span>
                  </button>

                  <button
                    type="button"
                  >
                    <strong className="facebook-logo">
                      f
                    </strong>

                    <span>
                      Facebook
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* HELP */}

            <div className="shop-auth-help">
              <Headphones
                size={17}
              />

              Need assistance?
              Contact our support
              team.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}