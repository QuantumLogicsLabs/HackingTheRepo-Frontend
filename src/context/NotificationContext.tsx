import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type NotificationType = "success" | "error" | "info";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  toast: NotificationItem | null;
  dropdownOpen: boolean;
  addNotification: (
    payload: Omit<NotificationItem, "id" | "read" | "createdAt">,
  ) => void;
  markAllRead: () => void;
  setDropdownOpen: (open: boolean) => void;
  dismissNotification: (id: string) => void;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toast, setToast] = useState<NotificationItem | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const addNotification = useCallback(
    (payload: Omit<NotificationItem, "id" | "read" | "createdAt">) => {
      const nextNotification: NotificationItem = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        read: false,
        ...payload,
      };
      setNotifications((current) => [nextNotification, ...current]);
      setToast(nextNotification);
      setDropdownOpen(true);
    },
    [],
  );

  const markAllRead = useCallback(() => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    );
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      toast,
      dropdownOpen,
      addNotification,
      markAllRead,
      setDropdownOpen,
      dismissNotification,
      dismissToast,
    }),
    [
      notifications,
      toast,
      dropdownOpen,
      addNotification,
      markAllRead,
      dismissNotification,
      dismissToast,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return context;
}
