import { Session } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';

import { supabase } from '@/src/lib/supabase';
import {
    CreatePostData,
    FeelingActivity,
    LocationData,
    MediaItem,
    Post,
    PostsFilterOptions,
    UpdatePostData,
} from '@/src/types/post';
import { ServiceResponse } from '@/src/types/response';
import * as FileSystem from 'expo-file-system';
import { getUserAvatar } from '../user/UserInfo';

// Helper function để upload media lên Supabase Storage
const uploadMediaToStorage = async (
    mediaItems: MediaItem[],
    userId: string
): Promise<MediaItem[]> => {
    const uploadedMedia: MediaItem[] = [];

    for (const media of mediaItems) {
        try {
            // Đọc file từ URI
            const base64 = await FileSystem.readAsStringAsync(media.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Tạo tên file unique trong folder posts
            const timestamp = new Date().getTime();
            const fileExtension = media.type === 'image' ? 'jpg' : 'mp4';
            const fileName = `posts/${userId}/${timestamp}_${media.id}.${fileExtension}`;
            const arrayBuffer = decode(base64);
            const { data, error } = await supabase.storage
                .from('uploads')
                .upload(fileName, arrayBuffer, {
                    contentType:
                        media.type === 'image' ? 'image/jpeg' : 'video/mp4',
                    cacheControl: '3600',
                    upsert: false,
                });

            if (error) {
                console.error('Error uploading media:', error);
                uploadedMedia.push(media);
            } else {
                // Tạo public URL cho file đã upload
                const { data: publicUrl } = supabase.storage
                    .from('uploads')
                    .getPublicUrl(fileName);

                uploadedMedia.push({
                    ...media,
                    uri: publicUrl.publicUrl,
                });

                console.log(
                    'Media uploaded successfully:',
                    fileName,
                    publicUrl.publicUrl
                );
            }
        } catch (uploadError) {
            console.error('Error processing media:', uploadError);
            uploadedMedia.push(media);
        }
    }

    return uploadedMedia;
};

const createPost = async (
    session: Session,
    postData: CreatePostData
): Promise<ServiceResponse<Post>> => {
    try {
        console.log('Creating post with data:', postData);

        let uploadedMedia = postData.media;
        if (postData.media && postData.media.length > 0) {
            console.log('Uploading media files...');
            uploadedMedia = await uploadMediaToStorage(
                postData.media,
                session.user.id
            );
            console.log('Media upload completed:', uploadedMedia);
        }

        const { data, error } = await supabase
            .from('posts')
            .insert({
                user_id: postData.authorId,
                content: postData.content,
                location: postData.location || null,
                media: uploadedMedia || null, // Sử dụng uploaded media URLs
                likes: 0,
                comments: 0,
                shares: 0,
                feeling_activity: postData.feelingActivity || null,
                privacy: postData.privacy,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return { success: false, error: error.message };
        }

        if (!data) {
            return { success: false, error: 'Không thể tạo bài viết' };
        }

        const newPost: Post = {
            id: data.id,
            content: data.content,
            media: uploadedMedia || [], // Sử dụng uploaded media URLs
            location: data.location || null,
            feelingActivity: data.feeling_activity || null,
            privacy: data.privacy || 'public',
            likes: data.likes || 0,
            comments: data.comments || 0,
            shares: data.shares || 0,
            isLiked: false,
            createdAt: new Date(data.created_at),
            author: {
                id: session.user.id,
                name: session.user.user_metadata.full_name || 'Unknown User',
                avatar: session.user.user_metadata.avatar_url || '',
            },
        };

        return { success: true, data: newPost };
    } catch (error) {
        console.error('Error creating post:', error);
        return {
            success: false,
            error: 'Đã xảy ra lỗi khi tạo bài viết! Vui lòng thử lại sau.',
        };
    }
};
//     postId: number,
//     updateData: UpdatePostData,
//     userId?: number
// ): Promise<ServiceResponse<Post>> => {
//     try {
//         let query = supabase
//             .from('posts')
//             .update({
//                 ...updateData,
//                 updated_at: new Date().toISOString(),
//             })
//             .eq('id', postId);

//         // Kiểm tra quyền sở hữu nếu có userId
//         if (userId) {
//             query = query.eq('user_id', userId);
//         }

//         const { data, error } = await query.select().single();

//         if (error) {
//             return { success: false, error: error.message };
//         }

//         if (!data) {
//             return {
//                 success: false,
//                 error: 'Không tìm thấy bài post hoặc bạn không có quyền chỉnh sửa',
//             };
//         }

//         return { success: true, data };
//     } catch (error) {
//         return {
//             success: false,
//             error:
//                 error instanceof Error ? error.message : 'Lỗi không xác định',
//         };
//     }
// };

const updatePost = async (
    postId: string,
    updateData: UpdatePostData,
    session: Session
): Promise<ServiceResponse<Post>> => {
    try {
        console.log('Updating post with data:', updateData);

        const updateFields: any = {
            content: updateData.content,
            privacy: updateData.privacy,
            media: updateData.media, // Luôn update media
            updated_at: new Date().toISOString(),
        };

        console.log('Update fields:', updateFields);

        if (updateData.location !== undefined) {
            updateFields.location = updateData.location;
        }

        if (updateData.feelingActivity !== undefined) {
            updateFields.feeling_activity = updateData.feelingActivity;
        }

        const { data, error } = await supabase
            .from('posts')
            .update(updateFields)
            .eq('id', postId)
            .eq('user_id', session.user.id)
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return { success: false, error: error.message };
        }

        if (!data) {
            return {
                success: false,
                error: 'Không tìm thấy bài post hoặc bạn không có quyền chỉnh sửa',
            };
        }

        const { data: userInfo } = await supabase
            .from('user_info')
            .select('id, full_name, avatar')
            .eq('id', session.user.id)
            .single();

        const updatedPost: Post = {
            id: data.id,
            content: data.content,
            media: data.media || [],
            location: data.location || null,
            feelingActivity: data.feeling_activity || null,
            privacy: data.privacy || 'public',
            likes: data.likes || 0,
            comments: data.comments || 0,
            shares: data.shares || 0,
            isLiked: false, // This should be determined separately
            createdAt: new Date(data.created_at),
            author: {
                id: session.user.id,
                name:
                    userInfo?.full_name ||
                    session.user.user_metadata.full_name ||
                    'Unknown User',
                avatar:
                    getUserAvatar(userInfo?.avatar) ||
                    getUserAvatar(session.user.user_metadata.avatar_url) ||
                    '',
            },
        };

        return { success: true, data: updatedPost };
    } catch (error) {
        console.error('Error updating post:', error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

// Helper function để xóa media từ Storage
const deleteMediaFromStorage = async (
    mediaItems: MediaItem[]
): Promise<void> => {
    for (const media of mediaItems) {
        try {
            // Chỉ xóa nếu là URL từ Supabase Storage
            if (media.uri.includes('supabase')) {
                const urlParts = media.uri.split(
                    '/storage/v1/object/public/uploads/'
                );
                if (urlParts.length > 1) {
                    const filePath = urlParts[1];

                    const { error } = await supabase.storage
                        .from('uploads')
                        .remove([filePath]);

                    if (error) {
                        console.error(
                            'Error deleting media file:',
                            filePath,
                            error
                        );
                    } else {
                        console.log(
                            'Media file deleted successfully:',
                            filePath
                        );
                    }
                }
            }
        } catch (error) {
            console.error('Error processing media deletion:', error);
        }
    }
};

const deletePost = async (
    postId: string,
    session: Session
): Promise<ServiceResponse<boolean>> => {
    try {
        console.log('Deleting post:', postId, 'by user:', session.user.id);

        // Lấy thông tin post trước khi xóa để cleanup media files
        const { data: postData, error: fetchError } = await supabase
            .from('posts')
            .select('media')
            .eq('id', postId)
            .eq('user_id', session.user.id)
            .single();

        if (fetchError) {
            console.error('Error fetching post for deletion:', fetchError);
            return { success: false, error: fetchError.message };
        }

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', session.user.id);

        if (error) {
            console.error('Database error:', error);
            return { success: false, error: error.message };
        }

        if (postData?.media && Array.isArray(postData.media)) {
            console.log('Cleaning up media files...');
            await deleteMediaFromStorage(postData.media);
        }

        console.log('Post deleted successfully:', postId);
        return { success: true, data: true };
    } catch (error) {
        console.error('Error deleting post:', error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

const hardDeletePost = async (
    postId: string,
    session: Session
): Promise<ServiceResponse<boolean>> => {
    try {
        console.log('Hard deleting post:', postId, 'by user:', session.user.id);

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', session.user.id);

        if (error) {
            console.error('Database error:', error);
            return { success: false, error: error.message };
        }

        console.log('Post permanently deleted:', postId);
        return { success: true, data: true };
    } catch (error) {
        console.error('Error hard deleting post:', error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

const changePrivacyLevel = async (
    postId: number,
    privacyLevel: 'public' | 'friends' | 'private',
    userId?: number
): Promise<ServiceResponse<Post>> => {
    try {
        let query = supabase
            .from('posts')
            .update({
                privacy_level: privacyLevel,
                updated_at: new Date().toISOString(),
            })
            .eq('id', postId);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query.select().single();

        if (error) {
            return { success: false, error: error.message };
        }

        if (!data) {
            return {
                success: false,
                error: 'Không tìm thấy bài post hoặc bạn không có quyền thay đổi',
            };
        }

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

const getPostById = async (postId: number): Promise<ServiceResponse<Post>> => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', postId)
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

const getPosts = async (
    options: PostsFilterOptions = {
        userId: 0,
        privacyLevel: 'public',
        postType: 'text',
        isActive: true,
        limit: 10,
        offset: 0,
    }
): Promise<ServiceResponse<Post[]>> => {
    try {
        let query = supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        // Áp dụng các filter
        if (options.userId) {
            query = query.eq('userId', options.userId);
        }

        if (options.privacyLevel) {
            query = query.eq('privacyLevel', options.privacyLevel);
        }

        if (options.postType) {
            query = query.eq('postType', options.postType);
        }

        // Pagination
        if (options.limit) {
            query = query.limit(options.limit);
        }

        if (options.offset) {
            query = query.range(
                options.offset,
                options.offset + (options.limit || 10) - 1
            );
        }

        const { data, error } = await query;

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

const incrementLikeCount = async (
    postId: number
): Promise<ServiceResponse<Post>> => {
    try {
        const { data, error } = await supabase.rpc('increment_like_count', {
            post_id: postId,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return await getPostById(postId);
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

const decrementLikeCount = async (
    postId: number
): Promise<ServiceResponse<Post>> => {
    try {
        const { data, error } = await supabase.rpc('decrement_like_count', {
            post_id: postId,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        // Lấy lại post sau khi update
        return await getPostById(postId);
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

const incrementCommentCount = async (
    postId: number
): Promise<ServiceResponse<Post>> => {
    try {
        const { data, error } = await supabase.rpc('increment_comment_count', {
            post_id: postId,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return await getPostById(postId);
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

const decrementCommentCount = async (
    postId: number
): Promise<ServiceResponse<Post>> => {
    try {
        const { data, error } = await supabase.rpc('decrement_comment_count', {
            post_id: postId,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return await getPostById(postId);
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

const incrementShareCount = async (
    postId: number
): Promise<ServiceResponse<Post>> => {
    try {
        const { data, error } = await supabase.rpc('increment_share_count', {
            post_id: postId,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return await getPostById(postId);
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

const decrementShareCount = async (
    postId: number
): Promise<ServiceResponse<Post>> => {
    try {
        const { data, error } = await supabase.rpc('decrement_share_count', {
            post_id: postId,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return await getPostById(postId);
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

const getPostsByUserId = async (
    userId: string
): Promise<ServiceResponse<Post[]>> => {
    try {
        const { data: posts, error: postError } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (postError) {
            return { success: false, error: postError.message };
        }

        const { data: user, error: userError } = await supabase
            .from('user_info')
            .select('id, full_name, avatar')
            .eq('id', userId)
            .single();
        if (userError) {
            return { success: false, error: userError.message };
        }
        if (!user) {
            return { success: false, error: 'User not found' };
        }
        const formattedPosts = posts.map((post) => {
            console.log('Raw post data:', {
                id: post.id,
                created_at: post.created_at,
                updated_at: post.updated_at,
                created_at_type: typeof post.created_at,
                updated_at_type: typeof post.updated_at
            });
            
            const createdAt = post.created_at ? new Date(post.created_at) : new Date();
            const updatedAt = post.updated_at ? new Date(post.updated_at) : undefined;
            
            console.log('Processed dates:', {
                createdAt,
                updatedAt,
                createdAtValid: !isNaN(createdAt.getTime()),
                updatedAtValid: updatedAt ? !isNaN(updatedAt.getTime()) : 'undefined'
            });
            
            return {
                id: post.id,
                content: post.content,
                media: post.media || null,
                location: post.location || null,
                feelingActivity: post.feeling_activity || null,
                privacy: post.privacy,
                likes: post.likes,
                comments: post.comments,
                shares: post.shares,
                isLiked: post.isLiked,
                createdAt: createdAt,
                updatedAt: updatedAt,
                author: {
                    id: user.id,
                    name: user.full_name,
                    avatar: getUserAvatar(user.avatar) || '',
                },
            };
        });
        // console.log('Formatted posts:', formattedPosts);
        // console.log('Posts raw:', posts);
        // console.log('User:', user);

        return { success: true, data: formattedPosts || [] };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

// Helper function để tạo updateData thông minh
const createSmartUpdateData = (
    originalPost: Post,
    newContent: string,
    newPrivacy: 'public' | 'friends' | 'private',
    newMedia: MediaItem[], // Required
    newLocation?: LocationData | null,
    newFeelingActivity?: FeelingActivity | null
): UpdatePostData => {
    const updateData: UpdatePostData = {
        content: newContent,
        privacy: newPrivacy,
        media: newMedia,
    };

    if (JSON.stringify(newLocation) !== JSON.stringify(originalPost.location)) {
        updateData.location = newLocation;
    }

    if (
        JSON.stringify(newFeelingActivity) !==
        JSON.stringify(originalPost.feelingActivity)
    ) {
        updateData.feelingActivity = newFeelingActivity;
    }

    return updateData;
};

export {
    changePrivacyLevel, createPost, createSmartUpdateData, decrementCommentCount, decrementLikeCount, decrementShareCount, deletePost, getPostById,
    getPosts,
    getPostsByUserId, hardDeletePost, incrementCommentCount, incrementLikeCount, incrementShareCount, updatePost
};
