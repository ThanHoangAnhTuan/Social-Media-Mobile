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

export {
    AddFriendRequest
};
