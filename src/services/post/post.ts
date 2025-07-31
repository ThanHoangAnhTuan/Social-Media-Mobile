import { Session } from '@supabase/supabase-js';

import { supabase } from '@/src/lib/supabase';
import {
    CreatePostData,
    Post,
    PostsFilterOptions,
    UpdatePostData,
    // PostsFilterOptions,
    // ServiceResponse,
    // UpdatePostData,
} from '@/src/types/post';
import { ServiceResponse } from '@/src/types/response';

const createPost = async (
    session: Session,
    postData: CreatePostData
): Promise<ServiceResponse<Post>> => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .insert({
                user_id: postData.authorId,
                content: postData.content,
                location: postData.location || null,
                media: postData.media || null,
                likes: 0,
                comments: 0,
                shares: 0,
                feeling_activity: postData.feelingActivity || null,
                privacy: postData.privacy,
            })
            .select()
            .single();

        const newPost: Post = {
            id: data.id || '',
            content: postData.content,
            media: postData.media || [],
            location: postData.location || null,
            feelingActivity: postData.feelingActivity || null,
            privacy: postData.privacy || 'public',
            likes: 0,
            comments: 0,
            shares: 0,
            isLiked: false,
            createdAt: new Date(),
            author: {
                id: session.user.id,
                name: session.user.user_metadata.full_name,
                avatar: session.user.user_metadata.avatar_url,
            },
        };

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: newPost };
    } catch (error) {
        return {
            success: false,
            error: 'Đã xảy ra lỗi khi tạo bài viết! Vui lòng thử lại sau.',
        };
    }
};

const updatePost = async (
    postId: number,
    updateData: UpdatePostData,
    userId?: number
): Promise<ServiceResponse<Post>> => {
    try {
        let query = supabase
            .from('posts')
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', postId);

        // Kiểm tra quyền sở hữu nếu có userId
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
                error: 'Không tìm thấy bài post hoặc bạn không có quyền chỉnh sửa',
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

const deletePost = async (
    postId: number,
    userId?: number
): Promise<ServiceResponse<boolean>> => {
    try {
        let query = supabase
            .from('posts')
            .update({
                is_active: false,
                updated_at: new Date().toISOString(),
            })
            .eq('id', postId);

        // Kiểm tra quyền sở hữu nếu có userId
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
                error: 'Không tìm thấy bài post hoặc bạn không có quyền xóa',
            };
        }

        return { success: true, data: true };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

const hardDeletePost = async (
    postId: number,
    userId?: number
): Promise<ServiceResponse<boolean>> => {
    try {
        let query = supabase.from('posts').delete().eq('id', postId);

        // Kiểm tra quyền sở hữu nếu có userId
        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { error } = await query;

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: true };
    } catch (error) {
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

        // Kiểm tra quyền sở hữu nếu có userId
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
            .eq('is_active', true)
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
            .eq('isActive', options.isActive ?? true)
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

export {
    createPost,
    updatePost,
    deletePost,
    hardDeletePost,
    changePrivacyLevel,
    getPostById,
    getPosts,
    incrementLikeCount,
    decrementLikeCount,
    incrementCommentCount,
    incrementShareCount,
    decrementShareCount,
    decrementCommentCount,
};
