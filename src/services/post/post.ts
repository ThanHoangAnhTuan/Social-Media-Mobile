import { Session } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

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
import { getFriendshipStatus } from '../friend/friend';
import { createNotification } from '../notification/notification';
import { getUserAvatar } from '../user/UserInfo';

// Helper function to process media URLs
const processMediaUrls = (media: any): MediaItem[] => {
    if (!media || !Array.isArray(media)) {
        return [];
    }
    
    return media.map((item: any) => ({
        ...item,
        uri: item.uri && item.uri.startsWith('http') 
            ? item.uri 
            : `https://arrsejmhxfisnnhybfma.supabase.co/storage/v1/object/public/uploads/${item.uri || ''}`
    }));
};

const uploadMediaToStorage = async (
    mediaItems: MediaItem[],
    userId: string
): Promise<MediaItem[]> => {
    const uploadedMedia: MediaItem[] = [];

    for (const media of mediaItems) {
        try {
            const base64 = await FileSystem.readAsStringAsync(media.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

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
                const { data: publicUrl } = supabase.storage
                    .from('uploads')
                    .getPublicUrl(fileName);

                uploadedMedia.push({
                    ...media,
                    uri: publicUrl.publicUrl,
                });

                // console.log(
                //     'Media uploaded successfully:',
                //     fileName,
                //     publicUrl.publicUrl
                // );
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
                media: uploadedMedia || [],
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
            media: uploadedMedia || [],
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

const updatePost = async (
    postId: string,
    updateData: UpdatePostData,
    session: Session
): Promise<ServiceResponse<Post>> => {
    try {

        const updateFields: any = {
            content: updateData.content,
            privacy: updateData.privacy,
            media: updateData.media,
            updated_at: new Date().toISOString(),
        };

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
            isLiked: false,
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
                        // console.log(
                        //     'Media file deleted successfully:',
                        //     filePath
                        // );
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
        // console.log('Deleting post:', postId, 'by user:', session.user.id);

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

        // Xóa tất cả comments của post trước khi xóa post
        const { error: commentsDeleteError } = await supabase
            .from('comments')
            .delete()
            .eq('post_id', postId);

        if (commentsDeleteError) {
            console.error('Error deleting comments:', commentsDeleteError);
            return { success: false, error: commentsDeleteError.message };
        }

        // Xóa post
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
            // console.log('Cleaning up media files...');
            await deleteMediaFromStorage(postData.media);
        }

        // console.log('Post deleted successfully:', postId);
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
        // console.log('Hard deleting post:', postId, 'by user:', session.user.id);

        // Xóa tất cả comments của post trước khi xóa post
        const { error: commentsDeleteError } = await supabase
            .from('comments')
            .delete()
            .eq('post_id', postId);

        if (commentsDeleteError) {
            console.error('Error deleting comments:', commentsDeleteError);
            return { success: false, error: commentsDeleteError.message };
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

        // console.log('Post permanently deleted:', postId);
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

const getPostById = async (postId: string): Promise<ServiceResponse<Post>> => {
    try {
        const { data: post, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', postId)
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        if (!post) {
            return { success: false, error: 'Không tìm thấy bài viết' };
        }

        // Lấy thông tin user
        const { data: userInfo, error: userError } = await supabase
            .from('user_info')
            .select('id, full_name, avatar')
            .eq('id', post.user_id)
            .single();

        if (userError) {
            console.error('Error fetching user info:', userError);
        }

        // Format post cho UI
        const formattedPost: Post = {
            id: post.id,
            content: post.content,
            media: post.media || [],
            location: post.location || null,
            feelingActivity: post.feeling_activity || null,
            privacy: post.privacy || 'public',
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.shares || 0,
            isLiked: false,
            createdAt: new Date(post.created_at),
            author: {
                id: post.user_id,
                name: userInfo?.full_name || 'Unknown User',
                avatar: getUserAvatar(userInfo?.avatar) || '',
            },
        };

        return { success: true, data: formattedPost };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

const getPostByIdWithPrivacy = async (
    postId: string,
    currentUserId: string
): Promise<ServiceResponse<Post>> => {
    try {
        const { data: post, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', postId)
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        if (!post) {
            return { success: false, error: 'Không tìm thấy bài viết' };
        }

        // Kiểm tra privacy
        const postUserId = post.user_id;
        
        // Case 1: Public posts - cho phép truy cập
        if (post.privacy === 'public') {
            // Continue to format post
        }
        // Case 2: Private posts - chỉ cho phép chủ bài viết
        else if (post.privacy === 'private') {
            if (postUserId !== currentUserId) {
                return { success: false, error: 'Bạn không có quyền xem bài viết này' };
            }
        }
        // Case 3: Friends posts - kiểm tra friendship
        else if (post.privacy === 'friends') {
            // Nếu không phải chủ bài viết
            if (postUserId !== currentUserId) {
                const friendshipStatus = await getFriendshipStatus(currentUserId, postUserId);
                
                // Chỉ cho phép nếu là bạn bè
                if (friendshipStatus.status !== 'accepted') {
                    return { success: false, error: 'Bạn không có quyền xem bài viết này' };
                }
            }
        }

        // Lấy thông tin user
        const { data: userInfo, error: userError } = await supabase
            .from('user_info')
            .select('id, full_name, avatar')
            .eq('id', post.user_id)
            .single();

        if (userError) {
            console.error('Error fetching user info:', userError);
        }

        // Format post cho UI
        const formattedPost: Post = {
            id: post.id,
            content: post.content,
            media: post.media || [],
            location: post.location || null,
            feelingActivity: post.feeling_activity || null,
            privacy: post.privacy || 'public',
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.shares || 0,
            isLiked: false,
            createdAt: new Date(post.created_at),
            author: {
                id: post.user_id,
                name: userInfo?.full_name || 'Unknown User',
                avatar: getUserAvatar(userInfo?.avatar) || '',
            },
        };

        return { success: true, data: formattedPost };
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

        if (options.userId) {
            query = query.eq('userId', options.userId);
        }

        if (options.privacyLevel) {
            query = query.eq('privacyLevel', options.privacyLevel);
        }

        if (options.postType) {
            query = query.eq('postType', options.postType);
        }

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
    postId: string
): Promise<ServiceResponse<Post>> => {
    try {
        // Lấy số likes hiện tại trước
        const { data: currentPost, error: fetchError } = await supabase
            .from('posts')
            .select('likes')
            .eq('id', postId)
            .single();

        if (fetchError) {
            return { success: false, error: fetchError.message };
        }

        // Tăng likes lên 1
        const { data, error } = await supabase
            .from('posts')
            .update({ 
                likes: (currentPost.likes || 0) + 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', postId)
            .select()
            .single();

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
    postId: string
): Promise<ServiceResponse<Post>> => {
    try {
        // Lấy số likes hiện tại trước
        const { data: currentPost, error: fetchError } = await supabase
            .from('posts')
            .select('likes')
            .eq('id', postId)
            .single();

        if (fetchError) {
            return { success: false, error: fetchError.message };
        }

        // Giảm likes đi 1 (không cho xuống dưới 0)
        const { data, error } = await supabase
            .from('posts')
            .update({ 
                likes: Math.max((currentPost.likes || 0) - 1, 0),
                updated_at: new Date().toISOString()
            })
            .eq('id', postId)
            .select()
            .single();

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
    postId: string
): Promise<ServiceResponse<Post>> => {
    try {
        // Lấy số shares hiện tại trước
        const { data: currentPost, error: fetchError } = await supabase
            .from('posts')
            .select('shares')
            .eq('id', postId)
            .single();

        if (fetchError) {
            return { success: false, error: fetchError.message };
        }

        // Tăng shares lên 1
        const { data, error } = await supabase
            .from('posts')
            .update({ 
                shares: (currentPost.shares || 0) + 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', postId)
            .select()
            .single();

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
    postId: string
): Promise<ServiceResponse<Post>> => {
    try {
        // Lấy số shares hiện tại trước
        const { data: currentPost, error: fetchError } = await supabase
            .from('posts')
            .select('shares')
            .eq('id', postId)
            .single();

        if (fetchError) {
            return { success: false, error: fetchError.message };
        }

        // Giảm shares đi 1 (không cho xuống dưới 0)
        const { data, error } = await supabase
            .from('posts')
            .update({ 
                shares: Math.max((currentPost.shares || 0) - 1, 0),
                updated_at: new Date().toISOString()
            })
            .eq('id', postId)
            .select()
            .single();

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

const incrementCommentCount = async (
    postId: string
): Promise<ServiceResponse<Post>> => {
    try {
        // Lấy số comments hiện tại trước
        const { data: currentPost, error: fetchError } = await supabase
            .from('posts')
            .select('comments')
            .eq('id', postId)
            .single();

        if (fetchError) {
            return { success: false, error: fetchError.message };
        }

        // Tăng comments lên 1
        const { data, error } = await supabase
            .from('posts')
            .update({ 
                comments: (currentPost.comments || 0) + 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', postId)
            .select()
            .single();

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
    postId: string
): Promise<ServiceResponse<Post>> => {
    try {
        // Lấy số comments hiện tại trước
        const { data: currentPost, error: fetchError } = await supabase
            .from('posts')
            .select('comments')
            .eq('id', postId)
            .single();

        if (fetchError) {
            return { success: false, error: fetchError.message };
        }

        // Giảm comments đi 1 (không cho xuống dưới 0)
        const { data, error } = await supabase
            .from('posts')
            .update({ 
                comments: Math.max((currentPost.comments || 0) - 1, 0),
                updated_at: new Date().toISOString()
            })
            .eq('id', postId)
            .select()
            .single();

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

const getAllPosts = async (): Promise<ServiceResponse<Post[]>> => {
    try {
        console.log('Fetching all posts from Supabase...');

        const { data: posts, error: postError } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (postError) {
            console.error('Error fetching posts:', postError);
            return { success: false, error: postError.message };
        }

        if (!posts || posts.length === 0) {
            console.log('No posts found');
            return { success: true, data: [] };
        }

        const userIds = [...new Set(posts.map((post) => post.user_id))];

        // Lấy thông tin users
        const { data: users, error: userError } = await supabase
            .from('user_info')
            .select('id, full_name, avatar')
            .in('id', userIds);

        if (userError) {
            console.error('Error fetching users:', userError);
            return { success: false, error: userError.message };
        }

        // Tạo map để lookup user info nhanh
        const userMap = new Map();
        users?.forEach((user) => {
            userMap.set(user.id, user);
        });

        const formattedPosts: Post[] = posts.map((post) => {
            const userInfo = userMap.get(post.user_id);

            return {
                id: post.id,
                content: post.content,
                media: processMediaUrls(post.media),
                location: post.location || null,
                feelingActivity: post.feeling_activity || null,
                privacy: post.privacy || 'public',
                likes: post.likes || 0,
                comments: post.comments || 0,
                shares: post.shares || 0,
                isLiked: false,
                createdAt: new Date(post.created_at),
                author: {
                    id: post.user_id,
                    name: userInfo?.full_name || 'Unknown User',
                    avatar: getUserAvatar(userInfo?.avatar) || 'https://via.placeholder.com/50',
                },
            };
        });

        // console.log(`Fetched ${formattedPosts.length} posts successfully`);
        return { success: true, data: formattedPosts };
    } catch (error) {
        console.error('Error in getAllPosts:', error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

const getAllPostsWithPrivacy = async (
    currentUserId: string
): Promise<ServiceResponse<Post[]>> => {
    try {
        console.log('Fetching posts with privacy filtering for user:', currentUserId);

        // Bước 1: Lấy tất cả posts
        const { data: posts, error: postError } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (postError) {
            console.error('Error fetching posts:', postError);
            return { success: false, error: postError.message };
        }

        if (!posts || posts.length === 0) {
            console.log('No posts found');
            return { success: true, data: [] };
        }

        // Bước 2: Filter posts dựa trên privacy
        const filteredPosts = [];
        
        for (const post of posts) {
            const postUserId = post.user_id;
            
            // Case 1: Public posts - hiển thị cho mọi người
            if (post.privacy === 'public') {
                filteredPosts.push(post);
                continue;
            }
            
            // Case 2: Private posts - chỉ hiển thị cho chính chủ
            if (post.privacy === 'private') {
                if (postUserId === currentUserId) {
                    filteredPosts.push(post);
                }
                continue;
            }
            
            // Case 3: Friends posts - kiểm tra friendship
            if (post.privacy === 'friends') {
                // Nếu là post của chính mình
                if (postUserId === currentUserId) {
                    filteredPosts.push(post);
                    continue;
                }
                
                // Kiểm tra friendship status
                const friendshipStatus = await getFriendshipStatus(currentUserId, postUserId);
                
                // Chỉ hiển thị nếu là bạn bè (status = 'accepted')
                if (friendshipStatus.status === 'accepted') {
                    filteredPosts.push(post);
                }
                continue;
            }
        }

        // Bước 3: Lấy thông tin users cho các posts đã filter
        const userIds = [...new Set(filteredPosts.map((post) => post.user_id))];

        if (userIds.length === 0) {
            return { success: true, data: [] };
        }

        const { data: users, error: userError } = await supabase
            .from('user_info')
            .select('id, full_name, avatar')
            .in('id', userIds);

        if (userError) {
            console.error('Error fetching users:', userError);
            return { success: false, error: userError.message };
        }

        // Tạo map để lookup user info nhanh
        const userMap = new Map();
        users?.forEach((user) => {
            userMap.set(user.id, user);
        });

        // Bước 4: Format posts
        const formattedPosts: Post[] = filteredPosts.map((post) => {
            const userInfo = userMap.get(post.user_id);

            return {
                id: post.id,
                content: post.content,
                media: post.media || [],
                location: post.location || null,
                feelingActivity: post.feeling_activity || null,
                privacy: post.privacy || 'public',
                likes: post.likes || 0,
                comments: post.comments || 0,
                shares: post.shares || 0,
                isLiked: false,
                createdAt: new Date(post.created_at),
                author: {
                    id: post.user_id,
                    name: userInfo?.full_name || 'Unknown User',
                    avatar: getUserAvatar(userInfo?.avatar) || 'https://via.placeholder.com/50',
                },
            };
        });

        console.log(`Fetched ${formattedPosts.length} posts with privacy filtering`);
        return { success: true, data: formattedPosts };
    } catch (error) {
        console.error('Error in getAllPostsWithPrivacy:', error);
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
                media: processMediaUrls(post.media),
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
                    avatar: getUserAvatar(user.avatar) || 'https://via.placeholder.com/50',
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

const getPostsByUserIdWithPrivacy = async (
    targetUserId: string,
    currentUserId: string
): Promise<ServiceResponse<Post[]>> => {
    try {
        // Bước 1: Lấy tất cả posts của target user
        const { data: posts, error: postError } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

        if (postError) {
            return { success: false, error: postError.message };
        }

        // Bước 2: Lấy thông tin target user
        const { data: user, error: userError } = await supabase
            .from('user_info')
            .select('id, full_name, avatar')
            .eq('id', targetUserId)
            .single();

        if (userError) {
            return { success: false, error: userError.message };
        }

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Bước 3: Filter posts dựa trên privacy và relationship
        const filteredPosts = [];
        
        // Nếu đang xem profile của chính mình - hiển thị tất cả posts
        if (targetUserId === currentUserId) {
            filteredPosts.push(...posts);
        } else {
            // Kiểm tra friendship status một lần
            const friendshipStatus = await getFriendshipStatus(currentUserId, targetUserId);
            const isFriend = friendshipStatus.status === 'accepted';
            
            for (const post of posts) {
                // Public posts - hiển thị cho mọi người
                if (post.privacy === 'public') {
                    filteredPosts.push(post);
                }
                // Friends posts - chỉ hiển thị cho bạn bè
                else if (post.privacy === 'friends' && isFriend) {
                    filteredPosts.push(post);
                }
                // Private posts - không hiển thị cho người khác
                // (đã bị loại bỏ bằng cách không thêm vào filteredPosts)
            }
        }

        // Bước 4: Format posts
        const formattedPosts = filteredPosts.map((post) => {
            const createdAt = post.created_at ? new Date(post.created_at) : new Date();
            const updatedAt = post.updated_at ? new Date(post.updated_at) : undefined;

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
                    avatar: getUserAvatar(user.avatar) || 'https://via.placeholder.com/50',
                },
            };
        });

        console.log(`Fetched ${formattedPosts.length} posts for user ${targetUserId} with privacy filtering`);
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

// Function to handle like with notification
const likePost = async (
    postId: string,
    likerId: string,
    likerName: string
): Promise<ServiceResponse<Post>> => {
    try {
        // Lấy thông tin post trước để biết chủ sở hữu
        const { data: postData, error: postError } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .single();

        if (postError) {
            console.error('Error fetching post owner:', postError);
            return { success: false, error: postError.message };
        }

        const postOwnerId = postData.user_id;

        // Increment like count - sử dụng string postId
        const result = await incrementLikeCount(postId);
        
        if (result.success) {
            // Only send notification if liker is not the post owner
            if (likerId !== postOwnerId) {
                try {
                    // Sử dụng createNotification service
                    await createNotification(
                        likerId,        // senderId: người thích bài viết
                        postOwnerId,    // receiverId: chủ bài viết
                        'like',
                        `${likerName} đã thích bài viết của bạn`,
                        {
                            postId: postId,
                            likerName: likerName,
                            description: 'Nhấn để xem bài viết'
                        }
                    );
                    console.log('Like notification created successfully');
                } catch (notificationError) {
                    console.error('Error creating like notification:', notificationError);
                }
            }
        }
        
        return result;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

// Function to handle comment with notification  
const commentOnPost = async (
    postId: string,
    commenterId: string,
    commenterName: string,
    commentContent: string
): Promise<ServiceResponse<boolean>> => {
    try {
        // Lấy thông tin post trước để biết chủ sở hữu
        const { data: postData, error: postError } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .single();

        if (postError) {
            console.error('Error fetching post owner:', postError);
            return { success: false, error: postError.message };
        }

        const postOwnerId = postData.user_id;

        // Only send notification if commenter is not the post owner
        if (commenterId !== postOwnerId) {
            try {
                // Tạo notification trực tiếp qua Supabase
                const { error: notificationError } = await supabase
                    .from('notifications')
                    .insert({
                        senderId: commenterId,    // senderId: người bình luận
                        receiverId: postOwnerId,  // receiverId: chủ bài viết
                        type: 'comment',
                        title: `${commenterName} đã bình luận bài viết của bạn`,
                        data: {
                            postId: postId,
                            commenterName: commenterName,
                            commentContent: commentContent.substring(0, 50) + (commentContent.length > 50 ? '...' : ''),
                            description: 'Nhấn để xem bình luận'
                        },
                        created_at: new Date().toISOString()
                    });

                if (notificationError) {
                    console.error('Error creating comment notification:', notificationError);
                } else {
                    console.log('Comment notification created successfully');
                }
            } catch (notificationError) {
                console.error('Error creating comment notification:', notificationError);
            }
        }
        
        return { success: true, data: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

// Hàm để sync comment count với số comment thực tế (không bao gồm like records)
const syncCommentCount = async (postId: string): Promise<ServiceResponse<any>> => {
    try {
        // Đếm số comment thực tế (chỉ những record với is_like = false)
        const { count, error: countError } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId)
            .eq('is_like', false); // Chỉ đếm comment thật, không đếm like records

        if (countError) {
            return { success: false, error: countError.message };
        }

        // Cập nhật comment count trong posts table
        const { error: updateError } = await supabase
            .from('posts')
            .update({ 
                comments: count || 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', postId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        console.log(`Synced comment count for post ${postId}: ${count} comments`);
        return { success: true, data: { postId, commentCount: count } };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

// Hàm để sync tất cả comment counts
const syncAllCommentCounts = async (): Promise<ServiceResponse<any>> => {
    try {
        // Lấy tất cả posts
        const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select('id');

        if (postsError) {
            return { success: false, error: postsError.message };
        }

        const results = [];
        for (const post of posts || []) {
            const result = await syncCommentCount(post.id);
            results.push(result);
        }

        console.log('Synced all comment counts');
        return { success: true, data: results };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

export {
    changePrivacyLevel, commentOnPost, createPost, createSmartUpdateData, decrementCommentCount, decrementLikeCount, decrementShareCount, deletePost, getAllPosts, getAllPostsWithPrivacy, getPostById, getPostByIdWithPrivacy,
    getPosts, getPostsByUserId, getPostsByUserIdWithPrivacy, hardDeletePost, incrementCommentCount, incrementLikeCount, incrementShareCount, likePost, syncAllCommentCounts, syncCommentCount, updatePost
};

