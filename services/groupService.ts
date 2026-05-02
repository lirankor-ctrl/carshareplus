import { supabase } from '@/lib/supabase';
import { mapGroup } from '@/lib/mappers';
import { CarGroup, User } from '@/types';
import { generateJoinCode } from '@/lib/utils';

export const groupService = {
  async createGroup(
    carName: string,
    creatorId: string
  ): Promise<{ group: CarGroup | null; error: string | null }> {
    // Retry up to 3 times in case of join_code collision (astronomically unlikely)
    for (let attempt = 0; attempt < 3; attempt++) {
      const joinCode = generateJoinCode();
      const { data, error } = await supabase.rpc('create_car_group', {
        p_car_name:  carName,
        p_join_code: joinCode,
        p_user_id:   creatorId,
      });

      if (!error && data) {
        return { group: mapGroup(data as any, [creatorId]), error: null };
      }
      // Only retry on unique constraint violations
      if (!error?.message?.includes('unique')) break;
    }
    return { group: null, error: 'שגיאה ביצירת הקבוצה — נסה שוב' };
  },

  async joinGroup(
    code: string,
    userId: string
  ): Promise<{ group: CarGroup | null; error: string | null }> {
    const { data, error } = await supabase.rpc('join_group_by_code', {
      p_join_code: code.toUpperCase().trim(),
      p_user_id:   userId,
    });

    if (error) return { group: null, error: 'שגיאה בהצטרפות לקבוצה' };
    if ((data as any)?.error) return { group: null, error: (data as any).error };
    return { group: mapGroup(data as any), error: null };
  },

  async getGroupById(id: string): Promise<CarGroup | null> {
    const { data } = await supabase
      .from('car_groups')
      .select('*, group_members(user_id)')
      .eq('id', id)
      .single();

    if (!data) return null;

    const userIds = ((data.group_members ?? []) as { user_id: string }[]).map(m => m.user_id);
    return mapGroup(data, userIds);
  },

  async getGroupMembers(groupId: string): Promise<User[]> {
    const { data } = await supabase
      .from('group_members')
      .select('user_id, profiles(id, name, profile_image, color, created_at)')
      .eq('group_id', groupId);

    if (!data) return [];

    return data.map((m: any) => ({
      id:           m.profiles.id,
      name:         m.profiles.name,
      email:        '',
      profileEmoji: m.profiles.profile_image ?? '😀',
      color:        m.profiles.color,
      groupId,
      createdAt:    m.profiles.created_at,
    }));
  },

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    await supabase
      .from('group_members')
      .delete()
      .eq('user_id', userId)
      .eq('group_id', groupId);
  },
};
