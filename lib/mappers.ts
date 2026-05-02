import { User, CarGroup, Booking } from '@/types';

export function mapProfile(
  profile: { id: string; name: string; profile_image: string | null; color: string; created_at: string },
  email: string,
  groupId: string | null
): User {
  return {
    id: profile.id,
    name: profile.name,
    email,
    profileEmoji: profile.profile_image ?? '😀',
    color: profile.color,
    groupId,
    createdAt: profile.created_at,
  };
}

export function mapGroup(
  row: { id: string; join_code: string; car_name: string; created_by: string; created_at: string },
  userIds: string[] = []
): CarGroup {
  return {
    id: row.id,
    joinCode: row.join_code,
    carName: row.car_name,
    creatorId: row.created_by,
    userIds,
    createdAt: row.created_at,
  };
}

// Maps a raw Supabase bookings row to our Booking type.
// Supabase returns time as "HH:mm:ss", date as "YYYY-MM-DD".
export function mapBooking(row: {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  user_color: string;
  user_emoji: string;
  date: string;
  start_time: string;
  end_time: string;
  note: string | null;
  created_at: string;
}): Booking {
  return {
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    userName: row.user_name,
    userColor: row.user_color,
    userEmoji: row.user_emoji,
    date: row.date,
    startTime: (row.start_time ?? '').slice(0, 5),
    endTime:   (row.end_time   ?? '').slice(0, 5),
    note: row.note ?? undefined,
    createdAt: row.created_at,
  };
}
