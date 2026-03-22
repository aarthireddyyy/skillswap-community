import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export interface AppNotification {
  id: string;
  message: string;
  read: boolean;
  type: 'swap_request' | 'swap_accepted' | 'swap_rejected' | 'swap_completed' | 'info';
  createdAt: string;
  swapId?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  readNotificationIds: Set<string>;
  isOpen: boolean;
  isLoading: boolean;
  toggle: () => void;
  close: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  fetchNotifications: (userId: string) => Promise<void>;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      readNotificationIds: new Set<string>(),
      isOpen: false,
      isLoading: false,

      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      close: () => set({ isOpen: false }),

      markAsRead: (id: string) => {
        set((s) => {
          const newReadIds = new Set(s.readNotificationIds);
          newReadIds.add(id);
          return {
            readNotificationIds: newReadIds,
            notifications: s.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
          };
        });
      },

      markAllAsRead: () => {
        set((s) => {
          const allIds = new Set(s.notifications.map(n => n.id));
          return {
            readNotificationIds: allIds,
            notifications: s.notifications.map((n) => ({ ...n, read: true })),
          };
        });
      },

      unreadCount: () => get().notifications.filter((n) => !n.read).length,

      fetchNotifications: async (userId: string) => {
        set({ isLoading: true });

        try {
          const { readNotificationIds } = get();
          
          // Fetch recent swaps where the user is involved, as notifications
          const { data, error } = await supabase
            .from('swaps')
            .select('*')
            .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false })
            .limit(20);

          if (error) {
            console.error('Error fetching notifications:', error);
            set({ isLoading: false });
            return;
          }

          // Also fetch profile names for context
          const userIds = new Set<string>();
          (data || []).forEach((s: Record<string, unknown>) => {
            userIds.add(s.requester_id as string);
            userIds.add(s.receiver_id as string);
          });

          let namesMap: Record<string, string> = {};
          if (userIds.size > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, name')
              .in('id', Array.from(userIds));
            if (profiles) {
              profiles.forEach((p: Record<string, unknown>) => {
                namesMap[p.id as string] = (p.name as string) || 'Someone';
              });
            }
          }

          const notifications: AppNotification[] = (data || []).map(
            (swap: Record<string, unknown>) => {
              const swapId = swap.id as string;
              const isRequester = swap.requester_id === userId;
              const otherName = namesMap[
                isRequester
                  ? (swap.receiver_id as string)
                  : (swap.requester_id as string)
              ] || 'Someone';
              const status = swap.status as string;
              const skill = swap.skill_requested as string || 'a skill';

              let message = '';
              let type: AppNotification['type'] = 'info';

              if (status === 'pending' && !isRequester) {
                message = `${otherName} sent you a swap request for "${skill}"`;
                type = 'swap_request';
              } else if (status === 'pending' && isRequester) {
                message = `You sent a swap request to ${otherName} for "${skill}"`;
                type = 'info';
              } else if (status === 'accepted') {
                message = `Swap with ${otherName} for "${skill}" was accepted`;
                type = 'swap_accepted';
              } else if (status === 'rejected' && isRequester) {
                message = `${otherName} declined your swap request for "${skill}"`;
                type = 'swap_rejected';
              } else if (status === 'completed') {
                message = `Swap with ${otherName} for "${skill}" is completed`;
                type = 'swap_completed';
              } else if (status === 'cancelled') {
                message = `Swap with ${otherName} for "${skill}" was cancelled`;
                type = 'info';
              } else {
                message = `Swap update with ${otherName} for "${skill}"`;
                type = 'info';
              }

              // Check if this notification was previously marked as read
              const wasMarkedRead = readNotificationIds.has(swapId);
              const autoRead = ['completed', 'cancelled', 'rejected'].includes(status) && isRequester;

              return {
                id: swapId,
                message,
                read: wasMarkedRead || autoRead,
                type,
                createdAt: swap.created_at as string,
                swapId: swapId,
              };
            }
          );

          set({ notifications, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({ 
        readNotificationIds: Array.from(state.readNotificationIds) 
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        readNotificationIds: new Set(persistedState?.readNotificationIds || []),
      }),
    }
  )
);
