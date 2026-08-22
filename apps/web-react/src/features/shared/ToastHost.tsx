import {
  useEffect,
  useState,
} from 'react';

import {
  CheckCircle2,
  CircleAlert,
  Info,
  X,
} from 'lucide-react';

import {
  TOAST_EVENT,
  type ToastEventDetail,
  type ToastKind,
} from './toast';

import './ToastHost.css';

type ToastItem = {
  id: number;
  message: string;
  kind: ToastKind;
};

let nextToastId = 1;

export function ToastHost() {
  const [
    toasts,
    setToasts,
  ] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handleToast(
      event: Event,
    ) {
      const toastEvent =
        event as CustomEvent<ToastEventDetail>;

      const detail =
        toastEvent.detail;

      if (!detail?.message) {
        return;
      }

      const id =
        nextToastId++;

      const item: ToastItem = {
        id,
        message:
          detail.message,
        kind:
          detail.kind ??
          'success',
      };

      setToasts(
        (current) => [
          ...current,
          item,
        ],
      );

      window.setTimeout(
        () => {
          setToasts(
            (current) =>
              current.filter(
                (toast) =>
                  toast.id !== id,
              ),
          );
        },
        detail.duration ??
          2800,
      );
    }

    window.addEventListener(
      TOAST_EVENT,
      handleToast,
    );

    return () => {
      window.removeEventListener(
        TOAST_EVENT,
        handleToast,
      );
    };
  }, []);

  function removeToast(
    id: number,
  ) {
    setToasts(
      (current) =>
        current.filter(
          (toast) =>
            toast.id !== id,
        ),
    );
  }

  return (
    <div
      className="techhub-toast-host"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(
        (toast) => {
          const Icon =
            toast.kind ===
            'success'
              ? CheckCircle2
              : toast.kind ===
                  'error'
                ? CircleAlert
                : Info;

          return (
            <div
              key={toast.id}
              className={`techhub-toast ${toast.kind}`}
            >
              <span className="techhub-toast-icon">
                <Icon
                  size={20}
                />
              </span>

              <span className="techhub-toast-message">
                {toast.message}
              </span>

              <button
                type="button"
                className="techhub-toast-close"
                aria-label="Close notification"
                onClick={() =>
                  removeToast(
                    toast.id,
                  )
                }
              >
                <X size={17} />
              </button>
            </div>
          );
        },
      )}
    </div>
  );
}
