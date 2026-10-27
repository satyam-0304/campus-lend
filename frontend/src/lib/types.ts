// Types for CampusLend frontend

export type Category = 'academics' | 'electronics' | 'sports' | 'event_wear';
export type EquipmentStatus = 'available' | 'borrowed';
export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'returned'
  | 'completed'
  | 'cancelled';

export type ResidenceType = 'hosteller' | 'day_scholar';

export type Profile = {
  id: string;
  full_name: string;
  room_number: string;
  phone_number: string;
  student_id?: string;
  degree?: string;
  batch_year?: string;
  branch?: string;
  residence_type?: ResidenceType | '';
  hostel_name?: string;
  address?: string;
};

export type ListingType = 'sell' | 'rent';

export type EquipmentRow = {
  equipment_id: string;
  equipment_name: string;
  category: Category;
  status: EquipmentStatus;
  owner_id: string;
  image_url: string | null;
  image_back_url: string | null; // Back / reverse photo for condition inspection
  price_note: string | null;
  quantity: number; // Number of identical items available
  listing_type?: ListingType;
  sale_price?: number | null;
  rate_per_day?: number | null;
  rate_per_month?: number | null;
  rate_per_semester?: number | null;
  created_at: string;
  avg_rating?: number;
  review_count?: number;
};

export type EquipmentWithOwner = EquipmentRow & {
  owner: Profile;
};

export type BorrowRequestRow = {
  request_id: string;
  equipment_id: string;
  borrower_id: string;
  owner_id: string;
  status: RequestStatus;
  requested_quantity: number; // Units requested
  request_type?: 'sell' | 'rent';
  rental_start_date?: string | null;
  rental_end_date?: string | null;
  total_amount?: number | null;
  buyer_note?: string | null;
  rental_duration_unit?: string | null;
  created_at: string;
};

export type BorrowRequestWithDetails = BorrowRequestRow & {
  equipment: {
    equipment_name: string;
    image_url?: string | null;
    category?: Category;
    sale_price?: number | null;
    rate_per_day?: number | null;
    rate_per_month?: number | null;
    rate_per_semester?: number | null;
  };
  borrower: Profile;
  owner: Profile;
};

export type Review = {
  review_id: string;
  request_id: string;
  equipment_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: {
    id: string;
    full_name: string;
    branch?: string;
    hostel_name?: string;
    batch_year?: string;
  };
};

export type Message = {
  message_id: string;
  request_id?: string | null;
  equipment_id?: string | null;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
  };
};

export type Notification = {
  notification_id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'request' | 'chat' | 'review';
  link?: string | null;
  is_read: boolean;
  created_at: string;
};
