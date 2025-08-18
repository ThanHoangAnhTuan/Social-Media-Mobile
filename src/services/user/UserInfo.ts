import { Session } from '@supabase/supabase-js';

import { supabase } from '@/src/lib/supabase';
import { UpdateUserInfo, UserInfo } from '@/src/types/auth';
import { ServiceResponse } from '@/src/types/response';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

export const UpdateUserProfile = async (
    userId: string,
    formData: Partial<UpdateUserInfo>
): Promise<ServiceResponse<void>> => {
    const { fullName, address, gender, birthDate, phone, avatar } = formData;
    const { error } = await supabase.from('user_info').upsert(
        {
            id: userId,
            full_name: fullName,
            address,
            phone,
            gender,
            avatar,
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

export const UpdateUserCoverPhoto = async (
    session: Session,
    imageUri: string
): Promise<ServiceResponse<string>> => {
    const userId = session?.user?.id;
    if (!userId) {
        throw new Error('No user ID found in session');
    }
    try {
        const userId = session.user.id;

        // Get old cover photo to delete
        const { data: oldCoverData, error: oldCoverError } = await supabase
            .from('user_info')
            .select('cover_photo')
            .eq('id', userId)
            .single();
        if (oldCoverError) {
            console.error('Error fetching old cover photo:', oldCoverError);
        }
        if (oldCoverData?.cover_photo) {
            const { error: deleteError } = await supabase.storage
                .from('uploads')
                .remove([oldCoverData.cover_photo]);
            if (deleteError) {
                console.error('Error deleting old cover photo:', deleteError);
            }
        }

        const random = new Date().getTime();
        // Store cover photos in covers/ folder
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
            console.error('Error uploading cover photo:', error);
            return {
                success: false,
                error: 'Đã xảy ra lỗi khi tải ảnh bìa lên! Vui lòng thử lại sau.',
            };
        }

        // Save cover photo path to database
        const { error: updateError } = await supabase.from('user_info').upsert(
            {
                id: userId,
                cover_photo: data?.path || null,
            },
            { onConflict: 'id' }
        );
        if (updateError) {
            console.error('Error updating user cover photo:', updateError);
            return {
                success: false,
                error: 'Đã xảy ra lỗi khi cập nhật ảnh bìa! Vui lòng thử lại sau.',
            };
        }

        return {
            data: getUserAvatar(data?.path ?? '') ?? '',
            success: true,
        };
    } catch (error) {
        console.error('Error updating user cover photo:', error);
        return {
            success: false,
            error: 'Đã xảy ra lỗi khi cập nhật ảnh bìa! Vui lòng thử lại sau.',
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
        coverPhoto: getUserAvatar(data?.cover_photo),
    };
    return { success: true, data: userInfo };
};

export const GetUserProfileById = async (
    userId: string
): Promise<ServiceResponse<UserInfo>> => {
    if (!userId) {
        return { success: false, error: 'No user ID provided' };
    }

    // Get user_info from our custom table
    const { data: userInfoData, error: userInfoError } = await supabase
        .from('user_info')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (userInfoError) {
        return {
            success: false,
            error: 'Error fetching user info: ' + userInfoError.message,
        };
    }

    // If no data found in user_info table, return minimal profile
    if (!userInfoData) {
        return {
            success: true,
            data: {
                id: userId,
                email: null,
                phone: null,
                fullName: 'Người dùng',
                address: null,
                gender: null,
                birthDate: null,
                avatar: null,
                coverPhoto: null,
            }
        };
    }

    const userInfo: UserInfo = {
        id: userId,
        email: null, // We don't expose email for privacy
        phone: userInfoData.phone || null,
        fullName: userInfoData.full_name || 'Người dùng',
        address: userInfoData.address || null,
        gender: userInfoData.gender || null,
        birthDate: userInfoData.yob ? new Date(userInfoData.yob) : null,
        avatar: getUserAvatar(userInfoData.avatar),
        coverPhoto: getUserAvatar(userInfoData.cover_photo),
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
