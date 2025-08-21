export interface NotificationItem {
    id: string;
    title: string;
    senderId: string;      // Người gửi notification (người thực hiện hành động)
    receiverId: string;    // Người nhận notification (người được thông báo)
    data: any;
    type: 'friend_request' | 'comment' | 'like' | 'mention' | 'other';
    is_read?: boolean;     // Trạng thái đã đọc hay chưa
    created_at: Date;
}