import {
  ChangeEvent,
  useEffect,
  useState,
} from 'react';

import {
  Bell,
  Building2,
  Globe2,
  ImagePlus,
  Mail,
  MapPin,
  RefreshCw,
  Save,
  Upload,
} from 'lucide-react';

import {
  apiGet,
  apiPostForm,
  apiPut,
} from '../../../core/api/client';

import './SettingsPage.css';

type SiteSettings = {
  id: number;
  store_name: string;
  store_email: string | null;
  store_address: string | null;
  currency: string;
  language: string;
  timezone: string;
  date_format: string;
  logo_url: string | null;
  logo_path: string | null;
  new_order_alerts: boolean;
  low_stock_alerts: boolean;
  daily_sales_summary: boolean;
};

type SettingsResponse = {
  settings: SiteSettings;
};

type UpdateSettingsResponse = {
  message: string;
  settings: SiteSettings;
};

export function AdminSettingsPage() {
  const [settings, setSettings] =
    useState<SiteSettings | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploadingLogo, setUploadingLogo] =
    useState(false);

  const [selectedLogo, setSelectedLogo] =
    useState<File | null>(null);

  const [logoPreview, setLogoPreview] =
    useState('');

  const [fileInputKey, setFileInputKey] =
    useState(0);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  async function loadSettings() {
    setLoading(true);
    setError('');

    try {
      const response =
        await apiGet<SettingsResponse>(
          '/admin/settings',
        );

      setSettings(response.settings);

      setLogoPreview(
        response.settings.logo_url ?? '',
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load website settings.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  function updateField<
    K extends keyof SiteSettings
  >(
    field: K,
    value: SiteSettings[K],
  ) {
    setSettings((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });

    setSuccess('');
  }

  async function handleSave() {
    if (!settings) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response =
        await apiPut<UpdateSettingsResponse>(
          '/admin/settings',
          {
            store_name:
              settings.store_name,

            store_email:
              settings.store_email || null,

            store_address:
              settings.store_address || null,

            currency:
              settings.currency,

            language:
              settings.language,

            timezone:
              settings.timezone,

            date_format:
              settings.date_format,

            new_order_alerts:
              settings.new_order_alerts,

            low_stock_alerts:
              settings.low_stock_alerts,

            daily_sales_summary:
              settings.daily_sales_summary,
          },
        );

      setSettings(response.settings);

      setSuccess(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save website settings.',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleLogoSelect(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError('');
    setSuccess('');

    if (!file.type.startsWith('image/')) {
      setError(
        'Please choose an image file.',
      );

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        'Shop logo must not be larger than 5 MB.',
      );

      return;
    }

    setSelectedLogo(file);

    const reader = new FileReader();

    reader.onload = () => {
      setLogoPreview(
        typeof reader.result === 'string'
          ? reader.result
          : '',
      );
    };

    reader.readAsDataURL(file);
  }

  async function handleLogoUpload() {
    if (!selectedLogo) {
      setError(
        'Please choose a logo first.',
      );

      return;
    }

    setUploadingLogo(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();

      formData.append(
        'logo',
        selectedLogo,
      );

      const response =
        await apiPostForm<UpdateSettingsResponse>(
          '/admin/settings/logo',
          formData,
        );

      setSettings(response.settings);

      setLogoPreview(
        response.settings.logo_url ?? '',
      );

      setSelectedLogo(null);

      setFileInputKey(
        (current) => current + 1,
      );

      setSuccess(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to upload shop logo.',
      );
    } finally {
      setUploadingLogo(false);
    }
  }

  if (loading) {
    return (
      <section className="admin-settings-page">
        <div className="settings-loading">
          Loading website settings...
        </div>
      </section>
    );
  }

  if (!settings) {
    return (
      <section className="admin-settings-page">
        <div className="settings-error">
          {error ||
            'Website settings could not be loaded.'}

          <button
            type="button"
            onClick={() =>
              void loadSettings()
            }
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-settings-page">
      <div className="settings-page-heading">
        <div>
          <h2>Website Settings</h2>

          <p>
            Manage your store information,
            shop logo, regional preferences
            and notifications.
          </p>
        </div>

        <div className="settings-heading-actions">
          <button
            type="button"
            className="settings-refresh-button"
            onClick={() =>
              void loadSettings()
            }
            disabled={
              loading ||
              saving ||
              uploadingLogo
            }
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button
            type="button"
            className="settings-save-button"
            onClick={() =>
              void handleSave()
            }
            disabled={
              saving ||
              uploadingLogo
            }
          >
            <Save size={18} />

            {saving
              ? 'Saving...'
              : 'Save Changes'}
          </button>
        </div>
      </div>

      {success && (
        <div className="settings-alert success">
          {success}
        </div>
      )}

      {error && (
        <div className="settings-alert error">
          {error}
        </div>
      )}

      <div className="settings-layout">
        {/* Store Information */}

        <section className="settings-card">
          <div className="settings-card-heading">
            <span className="settings-card-icon">
              <Building2 size={22} />
            </span>

            <div>
              <h3>
                Store Information
              </h3>

              <p>
                Information displayed
                across your website.
              </p>
            </div>
          </div>

          <div className="settings-form-grid">
            <label className="settings-field">
              <span>Store Name</span>

              <div className="settings-input">
                <Building2 size={18} />

                <input
                  type="text"
                  value={
                    settings.store_name
                  }
                  onChange={(event) =>
                    updateField(
                      'store_name',
                      event.target.value,
                    )
                  }
                  placeholder="TechHub"
                />
              </div>
            </label>

            <label className="settings-field">
              <span>Store Email</span>

              <div className="settings-input">
                <Mail size={18} />

                <input
                  type="email"
                  value={
                    settings.store_email ??
                    ''
                  }
                  onChange={(event) =>
                    updateField(
                      'store_email',
                      event.target.value,
                    )
                  }
                  placeholder="support@techhub.com"
                />
              </div>
            </label>

            <label className="settings-field full-width">
              <span>
                Store Address
              </span>

              <div className="settings-input settings-textarea">
                <MapPin size={18} />

                <textarea
                  value={
                    settings.store_address ??
                    ''
                  }
                  onChange={(event) =>
                    updateField(
                      'store_address',
                      event.target.value,
                    )
                  }
                  placeholder="Phnom Penh, Cambodia"
                  rows={3}
                />
              </div>
            </label>
          </div>
        </section>

        {/* Store Logo */}

        <section className="settings-card">
          <div className="settings-card-heading">
            <span className="settings-card-icon">
              <ImagePlus size={22} />
            </span>

            <div>
              <h3>Store Logo</h3>

              <p>
                Upload the logo used by
                your TechHub shop.
              </p>
            </div>
          </div>

          <div className="settings-logo-section">
            <div className="settings-logo-preview">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Store logo"
                />
              ) : (
                <div className="settings-logo-placeholder">
                  <Building2 size={44} />
                  <span>
                    No logo uploaded
                  </span>
                </div>
              )}
            </div>

            <div className="settings-logo-controls">
              <label className="settings-logo-choose">
                <ImagePlus size={18} />

                Choose Logo

                <input
                  key={fileInputKey}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={
                    handleLogoSelect
                  }
                />
              </label>

              {selectedLogo && (
                <div className="settings-logo-file-name">
                  {selectedLogo.name}
                </div>
              )}

              <button
                type="button"
                className="settings-logo-upload-button"
                onClick={() =>
                  void handleLogoUpload()
                }
                disabled={
                  !selectedLogo ||
                  uploadingLogo
                }
              >
                <Upload size={18} />

                {uploadingLogo
                  ? 'Uploading...'
                  : 'Update Logo'}
              </button>

              <small>
                PNG, JPG or WEBP.
                Maximum size 5 MB.
              </small>
            </div>
          </div>
        </section>

        {/* Regional Settings */}

        <section className="settings-card">
          <div className="settings-card-heading">
            <span className="settings-card-icon">
              <Globe2 size={22} />
            </span>

            <div>
              <h3>
                Regional Settings
              </h3>

              <p>
                Control currency,
                language and date display.
              </p>
            </div>
          </div>

          <div className="settings-form-grid">
            <label className="settings-field">
              <span>Currency</span>

              <select
                value={
                  settings.currency
                }
                onChange={(event) =>
                  updateField(
                    'currency',
                    event.target.value,
                  )
                }
              >
                <option value="USD">
                  USD - US Dollar
                </option>

                <option value="KHR">
                  KHR - Cambodian Riel
                </option>
              </select>
            </label>

            <label className="settings-field">
              <span>Language</span>

              <select
                value={
                  settings.language
                }
                onChange={(event) =>
                  updateField(
                    'language',
                    event.target.value,
                  )
                }
              >
                <option value="English">
                  English
                </option>

                <option value="Khmer">
                  Khmer
                </option>
              </select>
            </label>

            <label className="settings-field">
              <span>Time Zone</span>

              <select
                value={
                  settings.timezone
                }
                onChange={(event) =>
                  updateField(
                    'timezone',
                    event.target.value,
                  )
                }
              >
                <option value="Asia/Phnom_Penh">
                  Cambodia
                  (Asia/Phnom_Penh)
                </option>

                <option value="Asia/Bangkok">
                  Bangkok
                </option>

                <option value="Asia/Singapore">
                  Singapore
                </option>

                <option value="UTC">
                  UTC
                </option>
              </select>
            </label>

            <label className="settings-field">
              <span>Date Format</span>

              <select
                value={
                  settings.date_format
                }
                onChange={(event) =>
                  updateField(
                    'date_format',
                    event.target.value,
                  )
                }
              >
                <option value="M d, Y">
                  Aug 08, 2026
                </option>

                <option value="d/m/Y">
                  08/08/2026
                </option>

                <option value="m/d/Y">
                  08/08/2026
                </option>

                <option value="Y-m-d">
                  2026-08-08
                </option>
              </select>
            </label>
          </div>
        </section>

        {/* Notifications */}

        <section className="settings-card">
          <div className="settings-card-heading">
            <span className="settings-card-icon">
              <Bell size={22} />
            </span>

            <div>
              <h3>
                Notifications
              </h3>

              <p>
                Choose which alerts the
                admin should receive.
              </p>
            </div>
          </div>

          <div className="settings-toggle-list">
            <SettingToggle
              title="New Order Alerts"
              description="Notify the admin when a customer places a new order."
              checked={
                settings.new_order_alerts
              }
              onChange={(value) =>
                updateField(
                  'new_order_alerts',
                  value,
                )
              }
            />

            <SettingToggle
              title="Low Stock Alerts"
              description="Notify the admin when product stock becomes low."
              checked={
                settings.low_stock_alerts
              }
              onChange={(value) =>
                updateField(
                  'low_stock_alerts',
                  value,
                )
              }
            />

            <SettingToggle
              title="Daily Sales Summary"
              description="Receive a daily summary of store sales and orders."
              checked={
                settings.daily_sales_summary
              }
              onChange={(value) =>
                updateField(
                  'daily_sales_summary',
                  value,
                )
              }
            />
          </div>
        </section>
      </div>
    </section>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="settings-toggle-row">
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <label className="settings-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) =>
            onChange(
              event.target.checked,
            )
          }
        />

        <span className="settings-switch-slider" />
      </label>
    </div>
  );
}