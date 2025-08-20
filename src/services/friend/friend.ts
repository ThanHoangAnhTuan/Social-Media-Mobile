import { SUPABASE_URL } from "@/src/constants/Supabase";
import { supabase } from "@/src/lib/supabase";

const AddFriendRequest = async (
    requesterId: string,
    addresseeId: string,
    status: string = 'pending',
    createdAt: string = new Date().toISOString()
) => {
    const { data, error } = await supabase
        .from('friendships')
        .insert([
            {
                requester_id: requesterId,
                addressee_id: addresseeId,
                status: status,
                created_at: createdAt,
            },
        ])
        .select('*');
    if (error) {
        console.error('Error adding friend request:', error);
        return null;
    }
    
    // Tạo notification cho người nhận lời mời kết bạn
    if (data && data.length > 0) {
        try {
            // Lấy thông tin người gửi để tạo notification
            const { data: senderInfo } = await supabase
                .from('user_info')
                .select('full_name')
                .eq('id', requesterId)
                .single();
            
            const senderName = senderInfo?.full_name || 'Someone';
            
            // Tạo notification
            const { error: notificationError } = await supabase
                .from('notifications')
                .insert({
                    senderId: requesterId,    // senderId: người gửi lời mời
                    receiverId: addresseeId,  // receiverId: người nhận lời mời
                    type: 'friend_request',
                    title: `${senderName} đã gửi lời mời kết bạn`,
                    data: {
                        friendshipId: data[0].id,
                        senderName: senderName,
                        description: 'Nhấn để xem chi tiết'
                    },
                    created_at: new Date().toISOString()
                });

            if (notificationError) {
                console.error('Error creating notification:', notificationError);
            }
        } catch (notificationError) {
            console.error('Error creating notification:', notificationError);
        }
    }
    
    console.log('Friend request added successfully:', data);
    return data;
};

const getFriendsCount = async (userId: string): Promise<number> => {
    try {
        console.log("Counting friends for user ID:", userId);
        const { count, error } = await supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
            .eq('status', 'accepted');

        if (error) {
            console.error('Error counting friends:', error);
            return 0;
        }

        console.log("Friends count result:", count);
        return count || 0;
    } catch (error) {
        console.error('Error in getFriendsCount:', error);
        return 0;
    }
};

const getUserPhotos = async (userId: string): Promise<string[]> => {
    try {
        // Lấy tất cả posts có media của user
        const { data: posts, error } = await supabase
            .from('posts')
            .select('media')
            .eq('user_id', userId)
            .not('media', 'is', null);

        if (error) {
            console.error('Error fetching user photos:', error);
            return [];
        }

        // Extract URLs từ media array của tất cả posts
        const photos: string[] = [];
        (posts || []).forEach((post: any) => {
            if (post.media && Array.isArray(post.media)) {
                post.media.forEach((mediaItem: any) => {
                    if (mediaItem.type === 'image' && mediaItem.uri) {
                        photos.push(mediaItem.uri);
                    }
                });
            }
        });

        return photos;
    } catch (error) {
        console.error('Error in getUserPhotos:', error);
        return [];
    }
};

const getFriendshipStatus = async (currentUserId: string, targetUserId: string): Promise<{
    status: 'none' | 'pending' | 'accepted' | 'received_request';
    friendshipId?: string;
}> => {
    try {
        const { data, error } = await supabase
            .from('friendships')
            .select('*')
            .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`);

        if (error) {
            console.error('Error fetching friendship status:', error);
            return { status: 'none' };
        }

        if (!data || data.length === 0) {
            return { status: 'none' };
        }

        const friendship = data[0];
        
        if (friendship.status === 'accepted') {
            return { status: 'accepted', friendshipId: friendship.id };
        } else if (friendship.status === 'pending') {
            // Check if current user sent the request or received it
            if (friendship.requester_id === currentUserId) {
                return { status: 'pending', friendshipId: friendship.id };
            } else {
                return { status: 'received_request', friendshipId: friendship.id };
            }
        }

        return { status: 'none' };
    } catch (error) {
        console.error('Error in getFriendshipStatus:', error);
        return { status: 'none' };
    }
};

const acceptFriendRequest = async (friendshipId: string): Promise<boolean> => {
    try {
        console.log("Attempting to accept friend request with ID:", friendshipId);
        
        // Lấy thông tin friendship trước khi update
        const { data: friendshipData } = await supabase
            .from('friendships')
            .select('requester_id, addressee_id')
            .eq('id', friendshipId)
            .single();
        
        const { error } = await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', friendshipId);

        if (error) {
            console.error('Error accepting friend request:', error);
            return false;
        }

        // Tạo notification cho người gửi lời mời (requester) 
        // để thông báo rằng lời mời đã được chấp nhận
        if (friendshipData) {
            try {
                const { data: accepterInfo } = await supabase
                    .from('user_info')
                    .select('full_name')
                    .eq('id', friendshipData.addressee_id)
                    .single();
                
                const accepterName = accepterInfo?.full_name || 'Someone';
                
                // Tạo notification
                const { error: notificationError } = await supabase
                    .from('notifications')
                    .insert({
                        senderId: friendshipData.addressee_id,  // senderId: người chấp nhận lời mời
                        receiverId: friendshipData.requester_id, // receiverId: người đã gửi lời mời
                        type: 'other',
                        title: `${accepterName} đã chấp nhận lời mời kết bạn của bạn`,
                        data: {
                            friendshipId: friendshipId,
                            accepterName: accepterName,
                            description: 'Các bạn đã trở thành bạn bè!'
                        },
                        created_at: new Date().toISOString()
                    });

                if (notificationError) {
                    console.error('Error creating notification:', notificationError);
                }
            } catch (notificationError) {
                console.error('Error creating notification:', notificationError);
            }
        }

        console.log("Successfully accepted friend request with ID:", friendshipId);
        return true;
    } catch (error) {
        console.error('Error in acceptFriendRequest:', error);
        return false;
    }
};

const removeFriend = async (friendshipId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('friendships')
            .delete()
            .eq('id', friendshipId);

        if (error) {
            console.error('Error removing friend:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in removeFriend:', error);
        return false;
    }
};

const getFriendRequests = async (currentUserId: string) => {
    try {
        const { data: userInfoList, error } = await supabase
            .from('friendships')
            .select(`id,
                requester_id,
                addressee_id,
                status,
                created_at,
                requester:user_info!friendships_requester_id_fkey (
                id, full_name, avatar
            )`)
            .eq('addressee_id', currentUserId)
            .or('status.eq.pending,status.is.null')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching friend requests:', error);
            return { data: [], error };
        }

        const bucket = 'uploads';
        const formattedRequests = userInfoList.map((userItem: any) => {
            let avatarSource;
            const requesterAvatar = userItem.requester?.avatar;

            if (requesterAvatar?.startsWith('http')) {
                avatarSource = { uri: requesterAvatar };
            } else if (requesterAvatar) {
                avatarSource = {
                    uri: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${requesterAvatar}`,
                };
            } else {
                avatarSource = require('../../../assets/avatar.png');
            }

            return {
                id: userItem.id,
                createdAt: userItem.created_at || new Date().toISOString(),
                requester_id: userItem.requester.id,
                addressee_id: currentUserId,
                fullname: userItem.requester.full_name,
                avatar: avatarSource,
                mutualFriends: userItem.mutual_friends || 0,
                timeAgo: userItem.time_ago || 'Vừa xong',
                status: (userItem.status || 'pending') as 'pending',
            };
        });

        return { data: formattedRequests, error: null };
    } catch (error) {
        console.error('Error in getFriendRequests:', error);
        return { data: [], error };
    }
};

export {
    acceptFriendRequest, AddFriendRequest, getFriendRequests, getFriendsCount, getFriendshipStatus, getUserPhotos, removeFriend
};

