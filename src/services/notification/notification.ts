import { supabase } from "@/src/lib/supabase";
import { NotificationItem } from "@/src/types/notification";

export const createNotification = async (
    senderId: string,
    receiverId: string,
    type: 'friend_request' | 'comment' | 'like' | 'mention' | 'other',
    title: string,
    data?: any
): Promise<boolean> => {
    try {
        // Không tạo notification nếu sender và receiver là cùng một người
        if (senderId === receiverId) {
            console.log('Skipping notification: sender and receiver are the same');
            return true;
        }

        const { error } = await supabase
            .from('notifications')
            .insert({
                senderId: senderId,      // Người gửi (người thực hiện hành động)
                receiverId: receiverId,  // Người nhận (người được thông báo)
                type: type,
                title: title,
                data: JSON.stringify(data || {}), // Ensure JSON string
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error creating notification:', error);
            return false;
        }

        console.log('Notification created successfully');
        return true;
    } catch (error) {
        console.error('Error in createNotification:', error);
        return false;
    }
};

export const getNotifications = async (userId: string): Promise<NotificationItem[]> => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('receiverId', userId)  // Lấy notifications mà user này là người nhận
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }

        // Parse JSON data field
        const parsedData = (data || []).map(notification => ({
            ...notification,
            data: typeof notification.data === 'string' 
                ? JSON.parse(notification.data) 
                : notification.data
        }));

        return parsedData;
    } catch (error) {
        console.error('Error in getNotifications:', error);
        return [];
    }
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
    try {
        // Thử query với is_read column
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('receiverId', userId)
            .or('is_read.is.null,is_read.eq.false');

        if (error) {
            console.error('Error fetching unread notification count:', error);
            // Fallback: đếm tất cả notifications nếu không có cột is_read
            const { count: totalCount, error: fallbackError } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('receiverId', userId);
                
            if (fallbackError) {
                console.error('Fallback count also failed:', fallbackError);
                return 0;
            }
            return totalCount || 0;
        }

        return count || 0;
    } catch (error) {
        console.error('Error in getUnreadNotificationCount:', error);
        return 0;
    }
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
    try {
        // Kiểm tra xem notification có tồn tại không trước
        const { data: notification, error: checkError } = await supabase
            .from('notifications')
            .select('id, is_read')
            .eq('id', notificationId)
            .single();

        if (checkError) {
            console.error('Error checking notification:', checkError);
            return false;
        }

        if (!notification) {
            console.error('Notification not found');
            return false;
        }

        // Cập nhật trạng thái đã đọc
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in markNotificationAsRead:', error);
        return false;
    }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
    try {
        // Thử cập nhật tất cả notifications của user thành đã đọc
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('receiverId', userId);

        if (error) {
            console.error('Error marking all notifications as read:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in markAllNotificationsAsRead:', error);
        return false;
    }
};

export const deleteNotification = async (notificationId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) {
            console.error('Error deleting notification:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in deleteNotification:', error);
        return false;
    }
};

// Xóa notification like cụ thể khi user unlike
export const deleteLikeNotification = async (
    senderId: string,
    receiverId: string,
    postId: string
): Promise<boolean> => {
    try {
        // Không xóa nếu sender và receiver là cùng một người
        if (senderId === receiverId) {
            console.log('Skipping delete notification: sender and receiver are the same');
            return true;
        }

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('senderId', senderId)
            .eq('receiverId', receiverId)
            .eq('type', 'like')
            .ilike('data', `%"postId":"${postId}"%`); // Tìm notification có chứa postId trong data

        if (error) {
            console.error('Error deleting like notification:', error);
            return false;
        }

        console.log('Like notification deleted successfully');
        return true;
    } catch (error) {
        console.error('Error in deleteLikeNotification:', error);
        return false;
    }
};