import { Session } from '@supabase/supabase-js';

import { supabase } from '@/src/lib/supabase';
import { FormData, UserInfo } from '@/src/types/auth';

export const UpdateUserProfile = async (
    session: Session,
    formData: FormData
): Promise<void> => {
    const userId = session?.user?.id;
    const { fullName, address, gender, birthDate, phone, } = formData;
    const { error } = await supabase
        .from('user_info')
        .upsert(
            {
                id: userId,
                full_name: fullName,
                address,
                phone,
                gender,
                yob: birthDate ? birthDate.toISOString() : null,
            },
            { onConflict: 'id' }
        )
        .select();
    if (error) {
        throw error;
    }
};

export const GetUserProfile = async (session: Session): Promise<UserInfo> => {
    const userId = session?.user?.id;
    if (!userId) {
        throw new Error('No user ID found in session');
    }

    const { data, error: errorInfo } = await supabase
        .from('user_info')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
    if (errorInfo) {
        throw new Error('Error fetching user info: ' + errorInfo.message);
    }

    const userInfo: UserInfo = {
        email: session.user.email || null,
        id: session.user.id || null,
        phone: data?.phone || session.user.user_metadata?.phone || null,
        fullName:
            data?.full_name || session.user.user_metadata?.full_name || null,
        address: data?.address || null,
        gender: data?.gender || null,
        birthDate: data?.yob ? new Date(data.yob) : null,
        avatar: data?.avatar || session.user.user_metadata?.avatar_url || null,
    };

    return userInfo;
};
