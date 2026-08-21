import { create } from 'zustand';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  show: (title: string, message?: string, buttons?: AlertButton[]) => void;
  hide: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: '',
  buttons: [],
  show: (title, message, buttons) => set({ visible: true, title, message, buttons: buttons || [] }),
  hide: () => set({ visible: false }),
}));

/**
 * Helper object that mimics React Native's Alert API
 * but triggers our custom global modal instead.
 */
export const customAlert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    // Add a slight delay if this is called immediately after a previous alert closes
    // to ensure state updates cleanly
    setTimeout(() => {
      useAlertStore.getState().show(title, message, buttons);
    }, 10);
  }
};
