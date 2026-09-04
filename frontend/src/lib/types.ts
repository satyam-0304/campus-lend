export type Category = 'academics' | 'electronics' | 'sports' | 'event_wear';
export type EquipmentStatus = 'available' | 'borrowed';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export type Profile = {
  id: string;
  full_name: string;
  room_number: string;
  phone_number: string;
};

export type EquipmentRow = {
  equipment_id: string;
  equipment_name: string;
  category: Category;
  status: EquipmentStatus;
  owner_id: string;
  image_url: string | null;
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
  created_at: string;
};

export type BorrowRequestWithDetails = BorrowRequestRow & {
  equipment: { equipment_name: string };
  borrower: Profile;
  owner: Profile;
};
