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
        const { error } = await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', friendshipId);

        if (error) {
            console.error('Error accepting friend request:', error);
            return false;
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

export {
    acceptFriendRequest, AddFriendRequest,
    getFriendsCount, getFriendshipStatus, getUserPhotos, removeFriend
};

