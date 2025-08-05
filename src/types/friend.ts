export interface FriendRequest {
    id: string;
    createdAt: string;
    requester_id: string;
    addressee_id: string;
    fullname: string;
    avatar: any;
    mutualFriends: number;
    timeAgo: string;
    status: 'pending' | 'accepted' | 'declined';
    
}