import { createSignal, Show, onCleanup, For, createContext, useContext } from "solid-js";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
}

export function Notification(props: NotificationProps) {
  const [isVisible, setIsVisible] = createSignal(true);

  const bgColor = () => {
    switch (props.type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const textColor = () => {
    switch (props.type) {
      case "success":
        return "text-green-800";
      case "error":
        return "text-red-800";
      case "warning":
        return "text-yellow-800";
      case "info":
      default:
        return "text-blue-800";
    }
  };

  const icon = () => {
    switch (props.type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
      default:
        return "ℹ️";
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    props.onClose?.();
  };

  // Auto-hide after duration
  if (props.duration && props.duration > 0) {
    const timer = setTimeout(() => {
      handleClose();
    }, props.duration);

    onCleanup(() => clearTimeout(timer));
  }

  return (
    <Show when={isVisible()}>
      <div class={`rounded-md border p-4 ${bgColor()}`}>
        <div class="flex">
          <div class="flex-shrink-0">
            <span class="text-lg">{icon()}</span>
          </div>
          <div class="ml-3 flex-1">
            <h3 class={`text-sm font-medium ${textColor()}`}>
              {props.title}
            </h3>
            <Show when={props.message}>
              <div class={`mt-2 text-sm ${textColor()}`}>
                <p>{props.message}</p>
              </div>
            </Show>
          </div>
          <div class="ml-auto pl-3">
            <div class="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={handleClose}
                class={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${textColor()} hover:bg-opacity-20 hover:bg-current`}
              >
                <span class="sr-only">Dismiss</span>
                <span class="text-lg">×</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}

// Context and hook for global notifications

interface NotificationContextType {
  show: (notification: Omit<NotificationProps, "onClose">) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType>();

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}

export function NotificationProvider(props: { children: any }) {
  const [notifications, setNotifications] = createSignal<Array<NotificationProps & { id: string }>>([]);

  const show = (notification: Omit<NotificationProps, "onClose">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = {
      ...notification,
      id,
      onClose: () => removeNotification(id),
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration (default 5 seconds)
    const duration = notification.duration ?? 5000;
    setTimeout(() => removeNotification(id), duration);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (title: string, message?: string) => {
    show({ type: "success", title, message });
  };

  const showError = (title: string, message?: string) => {
    show({ type: "error", title, message });
  };

  const showWarning = (title: string, message?: string) => {
    show({ type: "warning", title, message });
  };

  const showInfo = (title: string, message?: string) => {
    show({ type: "info", title, message });
  };

  const contextValue: NotificationContextType = {
    show,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {props.children}
      
      {/* Notification container */}
      <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        <For each={notifications()}>
          {(notification) => (
            <Notification {...notification} />
          )}
        </For>
      </div>
    </NotificationContext.Provider>
  );
}
