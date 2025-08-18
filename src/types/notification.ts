export interface NotificationItem {
    id: string;
    title: string;
    senderId: string;
    receiverId: string;
    data: any;
    // type: 'friend_request' | 'comment' | 'like' | 'mention' | 'other';
    created_at: Date;
}