import { supabase } from './supabase';
import type {
  EquipmentWithOwner,
  BorrowRequestWithDetails,
  Profile,
  Category,
  RequestStatus,
  Review,
  Message,
  Notification,
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
  // ── Equipment ───────────────────────────────────────────────
  async getEquipment(): Promise<EquipmentWithOwner[]> {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${API_BASE_URL}/api/equipment`, { headers });
    return handleResponse<EquipmentWithOwner[]>(res);
  },

  async getMyEquipment(): Promise<EquipmentWithOwner[]> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/equipment/mine`, { headers });
    return handleResponse<EquipmentWithOwner[]>(res);
  },

  async createEquipment(payload: {
    equipment_name: string;
    category: Category;
    image_url: string;
    image_back_url: string;
    price_note?: string | null;
    quantity?: number;
    listing_type?: 'sell' | 'rent';
    sale_price?: number | null;
    rate_per_day?: number | null;
    rate_per_month?: number | null;
    rate_per_semester?: number | null;
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

  // ── Requests & Dashboard ────────────────────────────────────
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
    requested_quantity?: number;
    request_type?: 'sell' | 'rent';
    rental_start_date?: string | null;
    rental_end_date?: string | null;
    total_amount?: number | null;
    buyer_note?: string | null;
    rental_duration_unit?: string | null;
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

  async cancelRequest(requestId: string): Promise<void> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse<void>(res);
  },

  // ── Profiles ────────────────────────────────────────────────
  async getMyProfile(): Promise<Profile> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/profiles/me`, {
      headers,
    });
    return handleResponse<Profile>(res);
  },

  async updateMyProfile(updates: Partial<Omit<Profile, 'id'>>): Promise<Profile> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/profiles/me`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    return handleResponse<Profile>(res);
  },

  // ── Reviews ─────────────────────────────────────────────────
  async getEquipmentReviews(equipmentId: string): Promise<Review[]> {
    const res = await fetch(`${API_BASE_URL}/api/reviews/equipment/${equipmentId}`);
    return handleResponse<Review[]>(res);
  },

  async createReview(payload: {
    request_id: string;
    equipment_id: string;
    rating: number;
    comment?: string;
  }): Promise<Review> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/reviews`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return handleResponse<Review>(res);
  },

  // ── Messages / Chat ─────────────────────────────────────────
  async getConversation(params: {
    other_user_id?: string;
    request_id?: string;
    equipment_id?: string;
  }): Promise<Message[]> {
    const headers = await getAuthHeader();
    const query = new URLSearchParams();
    if (params.other_user_id) query.set('other_user_id', params.other_user_id);
    if (params.request_id) query.set('request_id', params.request_id);
    if (params.equipment_id) query.set('equipment_id', params.equipment_id);

    const res = await fetch(`${API_BASE_URL}/api/messages/conversation?${query.toString()}`, {
      headers,
    });
    return handleResponse<Message[]>(res);
  },

  async sendMessage(payload: {
    recipient_id: string;
    equipment_id?: string | null;
    request_id?: string | null;
    content: string;
  }): Promise<Message> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return handleResponse<Message>(res);
  },

  // ── Notifications ───────────────────────────────────────────
  async getNotifications(): Promise<{
    notifications: Notification[];
    unread_count: number;
  }> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/notifications`, {
      headers,
    });
    return handleResponse<{
      notifications: Notification[];
      unread_count: number;
    }>(res);
  },

  async markNotificationRead(id: string): Promise<void> {
    const headers = await getAuthHeader();
    await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
      method: 'PUT',
      headers,
    });
  },

  async markAllNotificationsRead(): Promise<void> {
    const headers = await getAuthHeader();
    await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: 'PUT',
      headers,
    });
  },

  // ── Email OTP ───────────────────────────────────────────────
  async sendOtp(email: string): Promise<{ success: boolean; message: string; devOtp?: string }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse<{ success: boolean; message: string; devOtp?: string }>(res);
  },

  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; verified: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    return handleResponse<{ success: boolean; verified: boolean; message: string }>(res);
  },
};
