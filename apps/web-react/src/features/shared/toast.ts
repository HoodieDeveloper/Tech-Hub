export type ToastKind =
  | 'success'
  | 'info'
  | 'error';

export type ToastEventDetail = {
  message: string;
  kind?: ToastKind;
  duration?: number;
};

export const TOAST_EVENT =
  'techhub:toast';

export function showToast(
  message: string,
  kind: ToastKind = 'success',
  duration = 2800,
) {
  window.dispatchEvent(
    new CustomEvent<ToastEventDetail>(
      TOAST_EVENT,
      {
        detail: {
          message,
          kind,
          duration,
        },
      },
    ),
  );
}
