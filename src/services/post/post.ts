import { supabase } from '@/src/lib/supabase';
import {
    Post,
    PostsFilterOptions,
    ServiceResponse,
    UpdatePostData,
} from '@/src/types/post';

const createPost = async (postData: Post): Promise<ServiceResponse<Post>> => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .insert({
                user_id: postData.author.id,
                content: postData.content,
                location: postData.location || null,
                media: postData.media || null,
                likes: 0,
                comments: 0,
                shares: 0,
                feeling_activity: postData.feelingActivity || null,
                privacy: postData.privacy || 'public',
            })
            .select()
            .single();
        console.log('createPost data:', data)
        console.log('createPost error:', error);

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
    options: PostsFilterOptions = {}
): Promise<ServiceResponse<Post[]>> => {
    try {
        let query = supabase
            .from('posts')
            .select('*')
            .eq('is_active', options.is_active ?? true)
            .order('created_at', { ascending: false });

        // Áp dụng các filter
        if (options.user_id) {
            query = query.eq('user_id', options.user_id);
        }

        if (options.privacy_level) {
            query = query.eq('privacy_level', options.privacy_level);
        }

        if (options.post_type) {
            query = query.eq('post_type', options.post_type);
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
