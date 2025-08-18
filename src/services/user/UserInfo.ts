import { Session } from '@supabase/supabase-js';

import { supabase } from '@/src/lib/supabase';
import { UpdateUserInfo, UserInfo } from '@/src/types/auth';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { ServiceResponse } from '@/src/types/response';

export const UpdateUserProfile = async (
    userId: string,
    formData: UpdateUserInfo
): Promise<ServiceResponse<void>> => {
    const { fullName, address, gender, birthDate, phone } = formData;
    const { error } = await supabase.from('user_info').upsert(
        {
            id: userId,
            full_name: fullName,
            address,
            phone,
            gender,
            yob: birthDate ? birthDate.toISOString() : null,
        },
        { onConflict: 'id' }
    );
    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true };
};

export const UpdateUserAvatar = async (
    session: Session,
    imageUri: string
): Promise<ServiceResponse<string>> => {
    const userId = session?.user?.id;
    if (!userId) {
        throw new Error('No user ID found in session');
    }
    try {
        const userId = session.user.id;
        // get old avatar
        const { data: oldAvatarData, error: oldAvatarError } = await supabase
            .from('user_info')
            .select('avatar')
            .eq('id', userId)
            .single();
        if (oldAvatarError) {
            console.error('Error fetching old avatar:', oldAvatarError);
        }
        if (oldAvatarData?.avatar) {
            const { error: deleteError } = await supabase.storage
                .from('uploads')
                .remove([oldAvatarData.avatar]);
            if (deleteError) {
                console.error('Error deleting old avatar:', deleteError);
            }
        }
        const random = new Date().getTime();
        console.log('image URI', imageUri);

        let fileName = `avatars/${random}.png`;
        const fileBase64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        let imageData = decode(fileBase64);
        let { data, error } = await supabase.storage
            .from('uploads')
            .upload(`${fileName}`, imageData, {
                contentType: 'image/*',
                upsert: true,
                cacheControl: '3600',
            });

        if (error) {
            console.error('Error uploading image:', error);
            return {
                success: false,
                error: 'Đã xảy ra lỗi khi tải ảnh lên! Vui lòng thử lại sau.',
            };
        }

        const { error: updateError } = await supabase.from('user_info').upsert(
            {
                avatar: data?.path || null,
            },
            { onConflict: 'id' }
        );
        if (updateError) {
            console.error('Error updating user avatar:', updateError);
            return {
                success: false,
                error: 'Đã xảy ra lỗi khi cập nhật ảnh đại diện! Vui lòng thử lại sau.',
            };
        }

        return {
            data: getUserAvatar(data?.path ?? '') ?? '',
            success: true,
        };
    } catch (error) {
        console.error('Error updating user avatar:', error);
        return {
            success: false,
            error: 'Đã xảy ra lỗi khi cập nhật ảnh đại diện! Vui lòng thử lại sau.',
        };
    }
};

export const GetUserProfile = async (
    session: Session
): Promise<ServiceResponse<UserInfo>> => {
    const userId = session?.user?.id;
    if (!userId) {
        return { success: false, error: 'No user ID found in session' };
    }

    const { data, error: errorInfo } = await supabase
        .from('user_info')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
    if (errorInfo) {
        return {
            success: false,
            error: 'Error fetching user info: ' + errorInfo.message,
        };
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
        avatar: getUserAvatar(data?.avatar),
    };
    return { success: true, data: userInfo };
};

export const getUserAvatar = (filePath: string | null): string | null => {
    if (!filePath) return null;
    if (filePath.startsWith('http')) return filePath;
    return `https://arrsejmhxfisnnhybfma.supabase.co/storage/v1/object/public/uploads/${filePath}`;
};

// export const getSupabaseAvatarUrl = (
//     filePath: string | null
// ): string | null => {
//     if (!filePath) return null;
//     return `https://arrsejmhxfisnnhybfma.supabase.co/storage/v1/object/public/uploads/${filePath}`;
// };

// export const getUserAvatarUrl = async (
//     session: Session
// ): Promise<ServiceResponse<string>> => {
//     const userId = session?.user?.id;
//     if (!userId) return { success: false, error: 'No user ID provided' };

//     const { data, error: errorInfo } = await supabase
//         .from('user_info')
//         .select('avatar')
//         .eq('id', userId)
//         .maybeSingle();
//     if (errorInfo) {
//         return {
//             success: false,
//             error: 'Error fetching user info: ' + errorInfo.message,
//         };
//     }
//     return {
//         success: true,
//         data:
//             getUserAvatar(data?.avatar) ||
//             session.user.user_metadata?.avatar_url ||
//             'https://ui-avatars.com/api/?name=' + (session?.user?.email || 'U'),
//     };
// };
