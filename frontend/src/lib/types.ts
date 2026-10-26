// Types for CampusLend frontend

export type Category = 'academics' | 'electronics' | 'sports' | 'event_wear';
export type EquipmentStatus = 'available' | 'borrowed';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

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
  created_at: string;
};

export type BorrowRequestWithDetails = BorrowRequestRow & {
  equipment: { equipment_name: string };
  borrower: Profile;
  owner: Profile;
};
