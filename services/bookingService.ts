import { supabase } from '@/lib/supabase';
import { mapBooking } from '@/lib/mappers';
import { Booking, LayoutBooking } from '@/types';

export const bookingService = {
  async createBooking(
    data: Omit<Booking, 'id' | 'createdAt'>
  ): Promise<{ booking: Booking | null; error: string | null }> {
    if (data.startTime >= data.endTime) {
      return { booking: null, error: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה' };
    }

    const { data: row, error } = await supabase
      .from('bookings')
      .insert({
        group_id:   data.groupId,
        user_id:    data.userId,
        user_name:  data.userName,
        user_color: data.userColor,
        user_emoji: data.userEmoji,
        date:       data.date,
        start_time: data.startTime,
        end_time:   data.endTime,
        note:       data.note || null,
      })
      .select()
      .single();

    if (error || !row) return { booking: null, error: 'שגיאה בשמירת הבקשה' };
    return { booking: mapBooking(row), error: null };
  },

  async updateBooking(
    id: string,
    userId: string,
    updates: Partial<Pick<Booking, 'date' | 'startTime' | 'endTime' | 'note'>>
  ): Promise<{ booking: Booking | null; error: string | null }> {
    const { startTime, endTime } = updates;
    if (startTime && endTime && startTime >= endTime) {
      return { booking: null, error: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה' };
    }

    const patch: Record<string, unknown> = {};
    if (updates.date      !== undefined) patch.date       = updates.date;
    if (updates.startTime !== undefined) patch.start_time = updates.startTime;
    if (updates.endTime   !== undefined) patch.end_time   = updates.endTime;
    if (updates.note      !== undefined) patch.note       = updates.note || null;

    const { data: row, error } = await supabase
      .from('bookings')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)  // RLS double-check
      .select()
      .single();

    if (error || !row) return { booking: null, error: 'שגיאה בעדכון הבקשה' };
    return { booking: mapBooking(row), error: null };
  },

  async deleteBooking(
    id: string,
    userId: string
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // RLS double-check

    return { error: error ? 'שגיאה במחיקת הבקשה' : null };
  },

  async getGroupBookings(groupId: string): Promise<Booking[]> {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('group_id', groupId)
      .order('date',       { ascending: true })
      .order('start_time', { ascending: true });

    return (data ?? []).map(mapBooking);
  },

  // Pure client-side layout — no DB access, stays synchronous
  layoutBookingsForDay(dayBookings: Booking[]): LayoutBooking[] {
    if (!dayBookings.length) return [];

    const sorted = [...dayBookings].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const columns: Booking[][] = [];
    const bookingCol: Record<string, number> = {};

    for (const booking of sorted) {
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const last = columns[col][columns[col].length - 1];
        if (last.endTime <= booking.startTime) {
          columns[col].push(booking);
          bookingCol[booking.id] = col;
          placed = true;
          break;
        }
      }
      if (!placed) {
        bookingCol[booking.id] = columns.length;
        columns.push([booking]);
      }
    }

    const totalCols = columns.length;
    return sorted.map(booking => ({
      booking,
      col: bookingCol[booking.id],
      totalCols,
    }));
  },
};
