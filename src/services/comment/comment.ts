import { supabase } from '@/src/lib/supabase';
import { Comment } from '@/src/types/post';
import { ServiceResponse } from '@/src/types/response';
import { createNotification } from '../notification/notification';
import { syncCommentCount } from '../post/post';
import { getUserAvatar } from '../user/UserInfo';

export interface CreateCommentData {
    postId: string;
    content: string;
    authorId: string;
}

export const createComment = async (
    commentData: CreateCommentData
): Promise<ServiceResponse<Comment>> => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert({
                post_id: commentData.postId,
                content: commentData.content,
                user_id: commentData.authorId,
                is_like: false, // Đánh dấu đây là comment thật, không phải like
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating comment:', error);
            return { success: false, error: error.message };
        }

        // Lấy thông tin user để tạo comment object đầy đủ
        const { data: userInfo, error: userError } = await supabase
            .from('user_info')
            .select('id, full_name, avatar')
            .eq('id', commentData.authorId)
            .single();

        if (userError) {
            console.error('Error fetching user info:', userError);
            return { success: false, error: userError.message };
        }

        const comment: Comment = {
            id: data.id,
            content: data.content,
            author: {
                id: userInfo.id,
                name: userInfo.full_name || 'Unknown User',
                avatar: getUserAvatar(userInfo.avatar) || 'https://via.placeholder.com/40',
            },
            createdAt: new Date(data.created_at),
        };

        // Tự động sync comment count cho post (thay vì increment)
        try {
            await syncCommentCount(commentData.postId);
            console.log('Comment count synced for post:', commentData.postId);
        } catch (countError) {
            console.error('Error syncing comment count:', countError);
            // Không return error vì comment đã được tạo thành công
        }

        // Tạo notification cho chủ bài viết
        try {
            // Lấy thông tin post owner
            const { data: postData, error: postError } = await supabase
                .from('posts')
                .select('user_id')
                .eq('id', commentData.postId)
                .single();

            if (!postError && postData && postData.user_id !== commentData.authorId) {
                // Chỉ tạo notification nếu người comment không phải là chủ bài viết
                await createNotification(
                    commentData.authorId,  // senderId: người comment
                    postData.user_id,      // receiverId: chủ bài viết
                    'comment',
                    `${userInfo.full_name || 'Ai đó'} đã bình luận bài viết của bạn`,
                    {
                        postId: commentData.postId,
                        commenterName: userInfo.full_name || 'Unknown User',
                        description: 'Nhấn để xem bài viết'
                    }
                );
                console.log('Comment notification created successfully');
            }
        } catch (notificationError) {
            console.error('Error creating comment notification:', notificationError);
            // Không return error vì comment đã được tạo thành công
        }

        return { success: true, data: comment };
    } catch (error) {
        console.error('Error in createComment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

export const getCommentsByPostId = async (
    postId: string
): Promise<ServiceResponse<Comment[]>> => {
    try {
        const { data: comments, error: commentsError } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .eq('is_like', false) // Chỉ lấy comments thật, không lấy likes
            .order('created_at', { ascending: true });

        if (commentsError) {
            console.error('Error fetching comments:', commentsError);
            return { success: false, error: commentsError.message };
        }

        if (!comments || comments.length === 0) {
            return { success: true, data: [] };
        }

        // Lấy thông tin tất cả users
        const userIds = [...new Set(comments.map((comment) => comment.user_id))];
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

        const formattedComments: Comment[] = comments.map((comment) => {
            const userInfo = userMap.get(comment.user_id);

            return {
                id: comment.id,
                content: comment.content,
                author: {
                    id: comment.user_id,
                    name: userInfo?.full_name || 'Unknown User',
                    avatar: getUserAvatar(userInfo?.avatar) || 'https://via.placeholder.com/40',
                },
                createdAt: new Date(comment.created_at),
            };
        });

        return { success: true, data: formattedComments };
    } catch (error) {
        console.error('Error in getCommentsByPostId:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

export const deleteComment = async (
    commentId: string,
    userId: string
): Promise<ServiceResponse<boolean>> => {
    try {
        // Lấy thông tin comment trước khi xóa để có postId
        const { data: commentData, error: fetchError } = await supabase
            .from('comments')
            .select('post_id')
            .eq('id', commentId)
            .eq('user_id', userId)
            .single();

        if (fetchError) {
            console.error('Error fetching comment for deletion:', fetchError);
            return { success: false, error: fetchError.message };
        }

        const postId = commentData.post_id;

        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting comment:', error);
            return { success: false, error: error.message };
        }

        // Tự động sync comment count cho post (thay vì decrement)
        try {
            await syncCommentCount(postId);
            console.log('Comment count synced for post:', postId);
        } catch (countError) {
            console.error('Error syncing comment count:', countError);
            // Không return error vì comment đã được xóa thành công
        }

        console.log('Comment deleted successfully');
        return { success: true, data: true };
    } catch (error) {
        console.error('Error in deleteComment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};

export const updateComment = async (
    commentId: string,
    content: string,
    userId: string
): Promise<ServiceResponse<Comment>> => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .update({
                content: content,
                updated_at: new Date().toISOString(),
            })
            .eq('id', commentId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating comment:', error);
            return { success: false, error: error.message };
        }

        // Lấy thông tin user
        const { data: userInfo, error: userError } = await supabase
            .from('user_info')
            .select('id, full_name, avatar')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('Error fetching user info:', userError);
            return { success: false, error: userError.message };
        }

        const comment: Comment = {
            id: data.id,
            content: data.content,
            author: {
                id: userInfo.id,
                name: userInfo.full_name || 'Unknown User',
                avatar: getUserAvatar(userInfo.avatar) || '',
            },
            createdAt: new Date(data.created_at),
        };

        return { success: true, data: comment };
    } catch (error) {
        console.error('Error in updateComment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        };
    }
};
