import { supabase } from '../../lib/supabase';
import { ServiceResponse } from '../../types/response';
import { createNotification, deleteLikeNotification } from '../notification/notification';

export interface LikeData {
    userId: string;
    postId: string;
    userName: string;
}

export interface LikeCheckResult {
    isLiked: boolean;
    likeId?: string;
}

// Hàm để sync số lượng like thực tế từ bảng comments
export const syncLikeCount = async (postId: string): Promise<ServiceResponse<number>> => {
    try {
        // Đếm số like thực tế trong bảng comments (is_like = true)
        const { count, error: countError } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId)
            .eq('is_like', true);

        if (countError) {
            return { success: false, error: countError.message };
        }

        const likeCount = count || 0;

        // Cập nhật like count trong posts table
        const { error: updateError } = await supabase
            .from('posts')
            .update({ 
                likes: likeCount,
                updated_at: new Date().toISOString()
            })
            .eq('id', postId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        console.log(`Synced like count for post ${postId}: ${likeCount} likes`);
        return { success: true, data: likeCount };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

export const toggleLike = async (
    likeData: LikeData
): Promise<ServiceResponse<{ isLiked: boolean; newLikeCount: number }>> => {
    try {

        // Kiểm tra xem user đã like post này chưa bằng cách tìm trong bảng comments
        // với is_like = true (đây là cách lưu trữ like trong comments table)
        const { data: existingLike, error: checkError } = await supabase
            .from('comments')
            .select('id')
            .eq('post_id', likeData.postId)
            .eq('user_id', likeData.userId)
            .eq('is_like', true)
            .maybeSingle();

        if (checkError) {
            console.error('Check error:', checkError);
            return { success: false, error: checkError.message };
        }

        console.log('Existing like check result:', existingLike);
        const hasLiked = !!existingLike;
        let isLiked: boolean;

        // Lấy current like count từ posts
        const { data: currentPost, error: fetchError } = await supabase
            .from('posts')
            .select('likes')
            .eq('id', likeData.postId)
            .single();

        if (fetchError) {
            console.error('Fetch post error:', fetchError);
            return { success: false, error: fetchError.message };
        }

        console.log('Current post likes:', currentPost.likes);
        const currentLikes = currentPost.likes || 0;
        let newLikeCount: number;

        if (hasLiked) {
            // UNLIKE: Xóa record like khỏi bảng comments và giảm like count
            console.log('Performing unlike...');
            const { error: deleteError } = await supabase
                .from('comments')
                .delete()
                .eq('post_id', likeData.postId)
                .eq('user_id', likeData.userId)
                .eq('is_like', true);

            if (deleteError) {
                console.error('Delete error:', deleteError);
                throw new Error(`Delete error: ${deleteError.message}`);
            }

            isLiked = false;
            newLikeCount = Math.max(currentLikes - 1, 0);
        } else {
            // LIKE LẦN ĐẦU: Thêm record like vào bảng comments và tăng like count
            console.log('Performing like...');
            const { error: insertError } = await supabase
                .from('comments')
                .insert({
                    post_id: likeData.postId,
                    user_id: likeData.userId,
                    content: '', // Nội dung trống cho record like
                    is_like: true, // Đánh dấu đây là like, không phải comment
                    created_at: new Date().toISOString(),
                });

            if (insertError) {
                console.error('Insert error:', insertError);
                throw new Error(`Insert error: ${insertError.message}`);
            }

            isLiked = true;
            newLikeCount = currentLikes + 1;
        }

        // console.log('New like count:', newLikeCount);

        // Sync like count từ database để đảm bảo tính chính xác
        const syncResult = await syncLikeCount(likeData.postId);
        if (syncResult.success && syncResult.data !== undefined) {
            newLikeCount = syncResult.data;
        }

        console.log('Toggle like completed successfully:', { isLiked, newLikeCount });

        // Xử lý notification async (không block UI)
        setImmediate(async () => {
            try {
                const { data: postData } = await supabase
                    .from('posts')
                    .select('user_id')
                    .eq('id', likeData.postId)
                    .single();

                if (postData && postData.user_id !== likeData.userId) {
                    if (isLiked) {
                        // Tạo notification khi like
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
                    } else {
                        // Xóa notification khi unlike
                        await deleteLikeNotification(
                            likeData.userId,
                            postData.user_id,
                            likeData.postId
                        );
                    }
                }
            } catch (error) {
                console.error('Notification error:', error);
            }
        });

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

// Lấy trạng thái like của user cho một post (sử dụng bảng comments với is_like = true)
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
            .eq('is_like', true) // Chỉ tìm record like
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

// Lấy tất cả likes của các posts (sử dụng bảng comments với is_like = true)
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
            .eq('is_like', true); // Chỉ lấy record like

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
