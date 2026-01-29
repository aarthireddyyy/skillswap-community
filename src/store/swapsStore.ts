import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Swap, SwapStatus } from '@/types';
import { mockSwaps } from '@/lib/mockData';

interface SwapsState {
  swaps: Swap[];
  initializeSwaps: () => void;
  sendRequest: (swap: Omit<Swap, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Swap;
  acceptSwap: (id: string) => void;
  rejectSwap: (id: string) => void;
  completeSwap: (id: string) => void;
  cancelSwap: (id: string) => void;
  getSwapsForUser: (userId: string) => Swap[];
  getPendingCount: (userId: string) => number;
}

function generateId(): string {
  return 'swap_' + Math.random().toString(36).substring(2, 11);
}

export const useSwapsStore = create<SwapsState>()(
  persist(
    (set, get) => ({
      swaps: [],

      initializeSwaps: () => {
        const { swaps } = get();
        if (swaps.length === 0) {
          set({ swaps: mockSwaps });
        }
      },

      sendRequest: (swapData) => {
        const newSwap: Swap = {
          ...swapData,
          id: generateId(),
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({ swaps: [...state.swaps, newSwap] }));
        return newSwap;
      },

      acceptSwap: (id: string) => {
        set(state => ({
          swaps: state.swaps.map(swap =>
            swap.id === id
              ? { ...swap, status: 'accepted' as SwapStatus, updatedAt: new Date().toISOString() }
              : swap
          ),
        }));
      },

      rejectSwap: (id: string) => {
        set(state => ({
          swaps: state.swaps.map(swap =>
            swap.id === id
              ? { ...swap, status: 'rejected' as SwapStatus, updatedAt: new Date().toISOString() }
              : swap
          ),
        }));
      },

      completeSwap: (id: string) => {
        set(state => ({
          swaps: state.swaps.map(swap =>
            swap.id === id
              ? { 
                  ...swap, 
                  status: 'completed' as SwapStatus, 
                  updatedAt: new Date().toISOString(),
                  completedAt: new Date().toISOString(),
                }
              : swap
          ),
        }));
      },

      cancelSwap: (id: string) => {
        set(state => ({
          swaps: state.swaps.map(swap =>
            swap.id === id
              ? { ...swap, status: 'cancelled' as SwapStatus, updatedAt: new Date().toISOString() }
              : swap
          ),
        }));
      },

      getSwapsForUser: (userId: string) => {
        return get().swaps.filter(
          swap => swap.requesterId === userId || swap.providerId === userId
        );
      },

      getPendingCount: (userId: string) => {
        return get().swaps.filter(
          swap => swap.providerId === userId && swap.status === 'pending'
        ).length;
      },
    }),
    {
      name: 'skillhub-swaps',
    }
  )
);
