import { create } from 'zustand';
import { Swap, SwapStatus } from '@/types';
import { supabase } from '@/lib/supabase';

interface SwapsState {
  swaps: Swap[];
  isLoading: boolean;
  fetchSwaps: (userId: string) => Promise<void>;
  sendRequest: (swap: Omit<Swap, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Swap | null>;
  acceptSwap: (id: string) => Promise<void>;
  rejectSwap: (id: string) => Promise<void>;
  completeSwap: (id: string) => Promise<void>;
  cancelSwap: (id: string) => Promise<void>;
  getSwapsForUser: (userId: string) => Swap[];
  getPendingCount: (userId: string) => number;
}

function mapRowToSwap(row: Record<string, unknown>): Swap {
  return {
    id: row.id as string,
    requesterId: row.requester_id as string,
    providerId: row.receiver_id as string,
    requesterSkill: row.skill_requested as string,
    providerSkill: (row.skill_offered as string) || '',
    status: row.status as SwapStatus,
    matchType: (row.match_type as 'mutual' | 'one_way') || 'one_way',
    message: row.message as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string || row.created_at as string,
    scheduledDate: row.scheduled_date as string | undefined,
    completedAt: row.completed_at as string | undefined,
  };
}

async function updateSwapStatus(id: string, status: SwapStatus) {
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }
  const { error } = await supabase.from('swaps').update(updates).eq('id', id);
  if (error) {
    console.error(`Error updating swap to ${status}:`, error);
  }
  return error;
}

export const useSwapsStore = create<SwapsState>()((set, get) => ({
  swaps: [],
  isLoading: false,

  fetchSwaps: async (userId: string) => {
    console.log("=== FETCH SWAPS STARTED ===");
    console.log("Fetching swaps for user ID:", userId);
    
    set({ isLoading: true });
    
    const { data, error } = await supabase
      .from('swaps')
      .select('*')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    console.log("FETCHED SWAPS:", data);
    console.log("FETCH ERROR:", error);

    if (error) {
      console.error('ERROR fetching swaps:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      set({ isLoading: false });
      return;
    }

    const swaps = (data || []).map(mapRowToSwap);
    console.log("Mapped swaps:", swaps);
    console.log("Total swaps found:", swaps.length);

    set({ swaps, isLoading: false });
  },

  sendRequest: async (swapData) => {
    console.log("=== SEND REQUEST STARTED ===");
    console.log("Input data:", swapData);

    // Validate required fields
    if (!swapData.requesterId || !swapData.providerId) {
      console.error('ERROR: Missing user IDs:', {
        requesterId: swapData.requesterId,
        providerId: swapData.providerId,
      });
      return null;
    }

    if (!swapData.requesterSkill) {
      console.error('ERROR: Missing requester skill');
      return null;
    }

    // Prepare insert data
    const insertData = {
      requester_id: swapData.requesterId,
      receiver_id: swapData.providerId,
      skill_requested: swapData.requesterSkill,
      skill_offered: swapData.providerSkill || null,
      match_type: swapData.matchType || 'one_way',
      message: swapData.message || null,
      status: 'pending',
    };

    console.log("INSERTING INTO SUPABASE:", insertData);

    const { data, error } = await supabase
      .from('swaps')
      .insert([insertData])
      .select()
      .single();

    console.log("INSERT RESPONSE:", data);
    console.log("INSERT ERROR:", error);

    if (error) {
      console.error('=== SUPABASE ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error code:', error.code);
      console.error('Full error object:', error);
      return null;
    }

    if (!data) {
      console.error('ERROR: No data returned from insert');
      return null;
    }

    const newSwap = mapRowToSwap(data);
    console.log("SUCCESS: Swap created:", newSwap);
    
    set((state) => ({ swaps: [newSwap, ...state.swaps] }));
    return newSwap;
  },

  acceptSwap: async (id: string) => {
    const error = await updateSwapStatus(id, 'accepted');
    if (!error) {
      set((state) => ({
        swaps: state.swaps.map((swap) =>
          swap.id === id
            ? { ...swap, status: 'accepted' as SwapStatus, updatedAt: new Date().toISOString() }
            : swap
        ),
      }));
    }
  },

  rejectSwap: async (id: string) => {
    const error = await updateSwapStatus(id, 'rejected');
    if (!error) {
      set((state) => ({
        swaps: state.swaps.map((swap) =>
          swap.id === id
            ? { ...swap, status: 'rejected' as SwapStatus, updatedAt: new Date().toISOString() }
            : swap
        ),
      }));
    }
  },

  completeSwap: async (id: string) => {
    const error = await updateSwapStatus(id, 'completed');
    if (!error) {
      set((state) => ({
        swaps: state.swaps.map((swap) =>
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
    }
  },

  cancelSwap: async (id: string) => {
    const error = await updateSwapStatus(id, 'cancelled');
    if (!error) {
      set((state) => ({
        swaps: state.swaps.map((swap) =>
          swap.id === id
            ? { ...swap, status: 'cancelled' as SwapStatus, updatedAt: new Date().toISOString() }
            : swap
        ),
      }));
    }
  },

  getSwapsForUser: (userId: string) => {
    return get().swaps.filter(
      (swap) => swap.requesterId === userId || swap.providerId === userId
    );
  },

  getPendingCount: (userId: string) => {
    return get().swaps.filter(
      (swap) => swap.providerId === userId && swap.status === 'pending'
    ).length;
  },
}));
