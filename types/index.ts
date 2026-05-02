export interface User {
  id: string;           // Supabase auth UUID
  name: string;
  email: string;
  profileEmoji: string; // stored as profile_image in DB
  color: string;
  groupId: string | null; // derived from group_members table
  createdAt: string;
}

export interface CarGroup {
  id: string;
  joinCode: string;     // join_code in DB
  carName: string;      // car_name in DB
  creatorId: string;    // created_by in DB
  userIds: string[];    // derived from group_members
  createdAt: string;
}

export interface Booking {
  id: string;
  groupId: string;
  userId: string;
  userName: string;   // denormalized for realtime display
  userColor: string;  // denormalized
  userEmoji: string;  // denormalized
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  note?: string;
  createdAt: string;
}

export type CalendarView = 'week' | 'month' | 'day';

export interface LayoutBooking {
  booking: Booking;
  col: number;
  totalCols: number;
}
