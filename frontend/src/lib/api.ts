import { supabase } from './supabase';
import type {
  EquipmentWithOwner,
  BorrowRequestWithDetails,
  Profile,
  Category,
  RequestStatus,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function getAuthHeader(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) {
    throw new Error('Not authenticated — please log in');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const json = await res.json();
      if (json.error) errorMsg = json.error;
    } catch {
      // ignore parsing error
    }
    throw new Error(errorMsg);
  }
  if (res.status === 204) {
    return undefined as unknown as T;
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Equipment
  async getEquipment(): Promise<EquipmentWithOwner[]> {
    const res = await fetch(`${API_BASE_URL}/api/equipment`);
    return handleResponse<EquipmentWithOwner[]>(res);
  },

  async createEquipment(payload: {
    equipment_name: string;
    category: Category;
    image_url?: string | null;
  }): Promise<EquipmentWithOwner> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/equipment`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return handleResponse<EquipmentWithOwner>(res);
  },

  async deleteEquipment(equipmentId: string): Promise<void> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/equipment/${equipmentId}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse<void>(res);
  },

  // Requests
  async getDashboard(): Promise<{
    borrowed: BorrowRequestWithDetails[];
    lending: BorrowRequestWithDetails[];
  }> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/requests/dashboard`, {
      headers,
    });
    return handleResponse<{
      borrowed: BorrowRequestWithDetails[];
      lending: BorrowRequestWithDetails[];
    }>(res);
  },

  async createRequest(payload: {
    equipment_id: string;
    owner_id: string;
  }): Promise<BorrowRequestWithDetails> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/requests`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return handleResponse<BorrowRequestWithDetails>(res);
  },

  async updateRequestStatus(
    requestId: string,
    status: RequestStatus
  ): Promise<BorrowRequestWithDetails> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status }),
    });
    return handleResponse<BorrowRequestWithDetails>(res);
  },

  // Profiles
  async getMyProfile(): Promise<Profile> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/profiles/me`, {
      headers,
    });
    return handleResponse<Profile>(res);
  },

  async updateMyProfile(updates: {
    full_name?: string;
    room_number?: string;
    phone_number?: string;
  }): Promise<Profile> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/profiles/me`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    return handleResponse<Profile>(res);
  },
};
