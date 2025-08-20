import { supabase } from '../../lib/supabase';
import { ServiceResponse } from '../../types/response';
import { createNotification } from '../notification/notification';

export interface LikeData {
    userId: string;
    postId: string;
    userName: string;
}

export interface LikeCheckResult {
    isLiked: boolean;
    likeId?: string;
}

// Toggle like: tối ưu tốc độ chỉ với code, không cần SQL files  
export const toggleLike = async (
    likeData: LikeData
): Promise<ServiceResponse<{ isLiked: boolean; newLikeCount: number }>> => {
    try {
        
        // Kiểm tra trạng thái hiện tại - chắc chắn không có duplicate
        const { data: existingLikes, error: checkError } = await supabase
            .from('comments')
            .select('id')
            .eq('post_id', likeData.postId)
            .eq('user_id', likeData.userId)
            .eq('is_like', true);

        if (checkError) {
            console.error('Check error:', checkError);
            return { success: false, error: checkError.message };
        }

        const hasLike = existingLikes && existingLikes.length > 0;
        
        // Cleanup duplicates nếu có
        if (existingLikes && existingLikes.length > 1) {
            await supabase
                .from('comments')
                .delete()
                .eq('post_id', likeData.postId)
                .eq('user_id', likeData.userId)
                .eq('is_like', true);
        }
        
        let isLiked: boolean;

        // Thực hiện toggle đúng - KHÔNG TẠO DUPLICATE
        if (hasLike) {
            // Unlike - xóa tất cả likes của user cho post này
            const { error: deleteError } = await supabase
                .from('comments')
                .delete()
                .eq('post_id', likeData.postId)
                .eq('user_id', likeData.userId)
                .eq('is_like', true);
            
            if (deleteError) {
                throw new Error(`Delete error: ${deleteError.message}`);
            }
            isLiked = false;
        } else {
            // Like - thêm mới (chỉ khi chưa có)
            const { error: insertError } = await supabase
                .from('comments')
                .insert({
                    post_id: likeData.postId,
                    user_id: likeData.userId,
                    content: '',
                    is_like: true,
                    created_at: new Date().toISOString(),
                });
            
            if (insertError) {
                throw new Error(`Insert error: ${insertError.message}`);
            }
            isLiked = true;
        }

        // Đếm likes và cập nhật posts table
        const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', likeData.postId)
            .eq('is_like', true);

        const newLikeCount = count || 0;
        
        // Cập nhật count trong posts table
        await supabase
            .from('posts')
            .update({ likes: newLikeCount })
            .eq('id', likeData.postId);

        // Notification async (không block UI)
        if (isLiked) {
            setImmediate(async () => {
                try {
                    const { data: postData } = await supabase
                        .from('posts')
                        .select('user_id')
                        .eq('id', likeData.postId)
                        .single();

                    if (postData && postData.user_id !== likeData.userId) {
                        await createNotification(
                            likeData.userId,
                            postData.user_id,
                            'like',
                            `${likeData.userName} đã thích bài viết của bạn`,
                            {
                                postId: likeData.postId,
                                likerName: likeData.userName,
                                description: 'Nhấn để xem bài viết'
                            }
                        );
                    }
                } catch (error) {
                    console.error('Notification error:', error);
                }
            });
        }

        return { 
            success: true, 
            data: { isLiked, newLikeCount } 
        };

    } catch (error) {
        console.error('Error in toggleLike:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

// Lấy trạng thái like của user cho một post
export const checkUserLikedPost = async (
    userId: string,
    postId: string
): Promise<ServiceResponse<LikeCheckResult>> => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select('id')
            .eq('user_id', userId)
            .eq('post_id', postId)
            .eq('is_like', true)
            .maybeSingle();

        if (error) {
            console.error('Error checking like status:', error);
            return { success: false, error: error.message };
        }

        return {
            success: true,
            data: {
                isLiked: !!data,
                likeId: data?.id
            }
        };
    } catch (error) {
        console.error('Error in checkUserLikedPost:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

// Lấy tất cả likes của các posts (dùng cho HomeScreen load initial)
export const getPostsLikeStatus = async (
    postIds: string[],
    userId: string
): Promise<ServiceResponse<{ [postId: string]: boolean }>> => {
    try {
        if (postIds.length === 0) {
            return { success: true, data: {} };
        }

        const { data, error } = await supabase
            .from('comments')
            .select('post_id')
            .in('post_id', postIds)
            .eq('user_id', userId)
            .eq('is_like', true);

        if (error) {
            console.error('Error fetching posts like status:', error);
            return { success: false, error: error.message };
        }

        // Convert array to object for quick lookup
        const likeStatus: { [postId: string]: boolean } = {};
        postIds.forEach(postId => {
            likeStatus[postId] = false;
        });

        data?.forEach(like => {
            likeStatus[like.post_id] = true;
        });

        return { success: true, data: likeStatus };
    } catch (error) {
        console.error('Error in getPostsLikeStatus:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};
