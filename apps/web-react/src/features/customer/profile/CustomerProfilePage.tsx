import {
  useEffect,
  useState,
} from 'react';

import './CustomerProfilePage.css';
import {
  ArrowLeft,
  Camera,
  Check,
  LogOut,
  Pencil,
  UserRound,
  X,
} from 'lucide-react';

import {
  apiPostForm,
  setStoredUser,
  type AuthUser,
} from '../../../core/api/client';

type Props = {
  user: AuthUser;

  onBack: () => void;

  onLogout: () => void;

  /*
   * We will connect this to App.tsx
   * in the next step so the navbar
   * updates immediately too.
   */
  onUserUpdated?: (
    user: AuthUser,
  ) => void;
};

type UpdateProfileResponse = {
  message: string;

  user: AuthUser;
};

export function CustomerProfilePage({
  user,
  onBack,
  onLogout,
  onUserUpdated,
}: Props) {
  /*
   * =========================================
   * EDIT MODE
   * =========================================
   */

  const [
    editing,
    setEditing,
  ] =
    useState(false);

  /*
   * =========================================
   * FORM
   * =========================================
   */

  const [
    name,
    setName,
  ] =
    useState(
      user.name,
    );

  const [
    email,
    setEmail,
  ] =
    useState(
      user.email,
    );

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
    useState<
      string | null
    >(
      user.avatar_url,
    );

  /*
   * =========================================
   * STATUS
   * =========================================
   */

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState('');

  const [
    success,
    setSuccess,
  ] =
    useState('');

  /*
   * =========================================
   * CURRENT DISPLAY USER
   * =========================================
   */

  const [
    profileUser,
    setProfileUser,
  ] =
    useState<AuthUser>(
      user,
    );

  /*
   * =========================================
   * KEEP USER DATA UPDATED
   * =========================================
   */

  useEffect(() => {
    setProfileUser(
      user,
    );

    setName(
      user.name,
    );

    setEmail(
      user.email,
    );

    setAvatarPreview(
      user.avatar_url,
    );
  }, [
    user,
  ]);

  /*
   * =========================================
   * AVATAR CHANGE
   * =========================================
   */

  function handleAvatarChange(
    event:
      React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target
        .files?.[0];

    if (!file) {
      return;
    }

    setAvatar(
      file,
    );

    const preview =
      URL.createObjectURL(
        file,
      );

    setAvatarPreview(
      preview,
    );
  }

  /*
   * =========================================
   * START EDIT
   * =========================================
   */

  function handleStartEdit() {
    setName(
      profileUser.name,
    );

    setEmail(
      profileUser.email,
    );

    setAvatar(
      null,
    );

    setAvatarPreview(
      profileUser.avatar_url,
    );

    setError(
      '',
    );

    setSuccess(
      '',
    );

    setEditing(
      true,
    );
  }

  /*
   * =========================================
   * CANCEL EDIT
   * =========================================
   */

  function handleCancelEdit() {
    setName(
      profileUser.name,
    );

    setEmail(
      profileUser.email,
    );

    setAvatar(
      null,
    );

    setAvatarPreview(
      profileUser.avatar_url,
    );

    setError(
      '',
    );

    setEditing(
      false,
    );
  }

  /*
   * =========================================
   * SAVE PROFILE
   * =========================================
   */

  async function handleSaveProfile(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanName =
      name.trim();

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (!cleanName) {
      setError(
        'Please enter your name.',
      );

      return;
    }

    if (!cleanEmail) {
      setError(
        'Please enter your email.',
      );

      return;
    }

    const formData =
      new FormData();

    formData.append(
      'name',
      cleanName,
    );

    formData.append(
      'email',
      cleanEmail,
    );

    if (avatar) {
      formData.append(
        'avatar',
        avatar,
      );
    }

    setSaving(
      true,
    );

    setError(
      '',
    );

    setSuccess(
      '',
    );

    try {
      const response =
        await apiPostForm<UpdateProfileResponse>(
          '/profile',
          formData,
        );

      /*
       * Update this page.
       */
      setProfileUser(
        response.user,
      );

      /*
       * Update localStorage.
       */
      setStoredUser(
        response.user,
      );

      /*
       * Tell App.tsx about the
       * updated customer.
       *
       * We will connect this
       * in the next step.
       */
      onUserUpdated?.(
        response.user,
      );

      setName(
        response.user.name,
      );

      setEmail(
        response.user.email,
      );

      setAvatar(
        null,
      );

      setAvatarPreview(
        response.user.avatar_url,
      );

      setSuccess(
        response.message ||
          'Profile updated successfully.',
      );

      setEditing(
        false,
      );
    } catch (
      err: unknown
    ) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update profile.',
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  return (
    <div className="customer-profile-page">
      <div className="customer-profile-container">

        {/* =====================================
            BACK
        ====================================== */}

        <button
          type="button"
          className="customer-profile-back"
          onClick={
            onBack
          }
        >
          <ArrowLeft
            size={18}
          />

          Back to Store
        </button>

        {/* =====================================
            PAGE TITLE
        ====================================== */}

        <div className="customer-profile-heading">
          <h1>
            My Profile
          </h1>

          <p>
            View and manage your
            account information.
          </p>
        </div>

        {/* =====================================
            ERROR
        ====================================== */}

        {error && (
          <div className="alert error">
            {
              error
            }
          </div>
        )}

        {/* =====================================
            SUCCESS
        ====================================== */}

        {success && (
          <div className="alert success">
            {
              success
            }
          </div>
        )}

        {/* =====================================
            VIEW PROFILE
        ====================================== */}

        {!editing && (
          <div className="customer-profile-card">

            {/* AVATAR */}

            <div className="customer-profile-avatar">
              {profileUser.avatar_url ? (
                <img
                  src={
                    profileUser.avatar_url
                  }
                  alt={
                    profileUser.name
                  }
                />
              ) : (
                <UserRound
                  size={70}
                />
              )}
            </div>

            {/* USER */}

            <div className="customer-profile-info">
              <h2>
                {
                  profileUser.name
                }
              </h2>

              <p>
                {
                  profileUser.email
                }
              </p>
            </div>

            {/* NO PASSWORD IS SHOWN */}

            <div className="customer-profile-actions">
              <button
                type="button"
                className="customer-profile-edit-button"
                onClick={
                  handleStartEdit
                }
              >
                <Pencil
                  size={18}
                />

                Update Profile
              </button>

              <button
                type="button"
                className="customer-profile-logout-button"
                onClick={
                  onLogout
                }
              >
                <LogOut
                  size={18}
                />

                Logout
              </button>
            </div>
          </div>
        )}

        {/* =====================================
            UPDATE PROFILE FORM
        ====================================== */}

        {editing && (
          <form
            className="customer-profile-card customer-profile-edit-form"
            onSubmit={
              handleSaveProfile
            }
          >

            {/* AVATAR */}

            <div className="customer-profile-avatar-editor">
              <div className="customer-profile-avatar">
                {avatarPreview ? (
                  <img
                    src={
                      avatarPreview
                    }
                    alt="Profile preview"
                  />
                ) : (
                  <UserRound
                    size={70}
                  />
                )}
              </div>

              <label className="customer-profile-photo-button">
                <Camera
                  size={17}
                />

                Change Photo

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleAvatarChange
                  }
                  hidden
                />
              </label>

              <small>
                JPG, JPEG, PNG or
                WEBP. Maximum 5 MB.
              </small>
            </div>

            {/* NAME */}

            <div className="customer-profile-field">
              <label htmlFor="profile-name">
                Name
              </label>

              <input
                id="profile-name"
                type="text"
                value={
                  name
                }
                maxLength={
                  255
                }
                disabled={
                  saving
                }
                onChange={(
                  event,
                ) =>
                  setName(
                    event.target
                      .value,
                  )
                }
              />
            </div>

            {/* EMAIL */}

            <div className="customer-profile-field">
              <label htmlFor="profile-email">
                Email
              </label>

              <input
                id="profile-email"
                type="email"
                value={
                  email
                }
                maxLength={
                  255
                }
                disabled={
                  saving
                }
                onChange={(
                  event,
                ) =>
                  setEmail(
                    event.target
                      .value,
                  )
                }
              />
            </div>

            {/* PASSWORD */}

            <div className="customer-profile-security-note">
              Your password is not
              displayed on this page.
            </div>

            {/* BUTTONS */}

            <div className="customer-profile-edit-actions">
              <button
                type="button"
                onClick={
                  handleCancelEdit
                }
                disabled={
                  saving
                }
              >
                <X
                  size={18}
                />

                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving
                }
              >
                <Check
                  size={18}
                />

                {saving
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}