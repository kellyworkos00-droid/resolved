declare module 'react-hot-toast' {
  import { ReactNode } from 'react';

  export interface Toast {
    id: string;
    message: ReactNode;
    type?: 'success' | 'error' | 'loading' | 'custom' | 'blank';
    duration?: number;
    pauseDuration?: number;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    ariaProps?: {
      role: string;
      'aria-live': string;
    };
    style?: React.CSSProperties;
    className?: string;
    icon?: ReactNode;
    iconTheme?: {
      primary: string;
      secondary: string;
    };
    createdAt: number;
    visible: boolean;
    height?: number;
  }

  export interface ToastOptions {
    id?: string;
    duration?: number;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    style?: React.CSSProperties;
    className?: string;
    icon?: ReactNode;
    iconTheme?: {
      primary: string;
      secondary: string;
    };
  }

  export interface ToasterProps {
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    toastOptions?: ToastOptions;
    reverseOrder?: boolean;
    gutter?: number;
    containerStyle?: React.CSSProperties;
    containerClassName?: string;
  }

  export const Toaster: React.FC<ToasterProps>;

  export interface ToastHandler {
    (message: ReactNode, options?: ToastOptions): string;
    success: (message: ReactNode, options?: ToastOptions) => string;
    error: (message: ReactNode, options?: ToastOptions) => string;
    loading: (message: ReactNode, options?: ToastOptions) => string;
    custom: (message: ReactNode, options?: ToastOptions) => string;
    dismiss: (toastId?: string) => void;
    remove: (toastId?: string) => void;
    promise: <T>(
      promise: Promise<T>,
      msgs: {
        loading: ReactNode;
        success: ((data: T) => ReactNode) | ReactNode;
        error: ((err: any) => ReactNode) | ReactNode;
      },
      options?: ToastOptions
    ) => Promise<T>;
  }

  const toast: ToastHandler;
  export default toast;
}
