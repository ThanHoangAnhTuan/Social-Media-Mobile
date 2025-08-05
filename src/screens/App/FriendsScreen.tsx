import { SUPABASE_URL } from '@/src/constants/Supabase';
import { supabase } from '@/src/lib/supabase';
import { AddFriendRequest } from '@/src/services/friend/friend';
import { FriendRequest } from '@/src/types/friend';
import { FriendsStackParamList } from '@/src/types/route';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
type FriendsScreenNavigationProp = NativeStackNavigationProp<
    FriendsStackParamList,
    'FriendsContent'
>;

export default function FriendsScreen() {
    const navigation = useNavigation<FriendsScreenNavigationProp>();
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

    const handleAcceptRequest = (request: FriendRequest) => {
        AddFriendRequest(
            request.addressee_id,
            request.requester_id,
            'accepted',
        );
        if (request.status === 'pending') {
            setFriendRequests((prevRequests) =>
                prevRequests.filter((req) => req.id !== request.id)
            );

        }
        // console.log('Accepted friend request with ID:', request.id);
        // console.log('Friend request accepted:', request.addressee_id);
    };

    const handleDeclineRequest = (request: FriendRequest) => {
        AddFriendRequest(
            request.addressee_id,
            request.requester_id,
            'declined',
        );
        // console.log('Declined friend request with ID:', request.id);
    };
    useEffect(() => {
        const fetchFriendRequests = async () => {
            const { data: userInfoList, error } = await supabase
                .from('user_info')
                .select('*')
                .order('created_at', { ascending: false });
            console.log("user", userInfoList);
            if (error) {
                console.error('Error fetching friend requests:', error);
                return;
            }
            const { data: { user }, error: userError, } = await supabase.auth.getUser();

            if (userError || !user) {
                console.error('Error getting current user:', userError);
                return;
            }

            const currentUserId = user.id;
            const supabaseUrl = SUPABASE_URL;
            const bucket = 'uploads';

            const formattedRequests = userInfoList.map((userItem: any) => {
                let avatarSource;

                if (userItem.avatar?.startsWith('http')) {
                    avatarSource = { uri: userItem.avatar };
                } else if (userItem.avatar) {
                    avatarSource = {
                        uri: `${supabaseUrl}/storage/v1/object/public/${bucket}/${userItem.avatar}`,
                    };
                } else {
                    avatarSource = require('../../../assets/avatar.png');
                }

                return {
                    id: userItem.id,
                    createdAt: userItem.created_at || new Date().toISOString(),
                    requester_id: userItem.id,
                    addressee_id: currentUserId,
                    fullname: userItem.full_name,
                    avatar: avatarSource,
                    mutualFriends: userItem.mutual_friends || 0,
                    timeAgo: userItem.time_ago || 'Vừa xong',
                    status: 'pending' as 'pending',

                };
            });

            setFriendRequests(formattedRequests);
        };

        fetchFriendRequests();
    }, []);

    const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
        <View style={styles.requestItem}>
            <TouchableOpacity onPress={() => navigation.navigate('PersonalScreen', { userId: item.requester_id })}>
                <Image source={item.avatar} style={styles.avatar} />
            
            </TouchableOpacity>
            <View style={styles.requestInfo}>
                <Text style={styles.name}>{item.fullname}</Text>
                {item.mutualFriends > 0 && (
                    <View style={styles.mutualFriendsContainer}>
                        <View style={styles.mutualFriendsIcon}>
                            <Feather name="users" size={12} color="#6b7280" />
                        </View>
                        <Text style={styles.mutualFriendsText}>
                            {item.mutualFriends} bạn chung • {item.timeAgo}
                        </Text>
                    </View>
                )}
                {item.mutualFriends === 0 && (
                    <Text style={styles.timeAgo}>{item.timeAgo}</Text>
                )}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleAcceptRequest(item)}
                    >
                        <Text style={styles.acceptButtonText}>Xác nhận</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.declineButton}
                        onPress={() => handleDeclineRequest(item)}
                    >
                        <Text style={styles.declineButtonText}>Xóa</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View >
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('FriendsRequest')}
                >
                    <Text style={styles.seeAllText}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={friendRequests}
                renderItem={renderFriendRequest}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    seeAllText: {
        fontSize: 16,
        color: '#3b82f6',
        fontWeight: '500',
    },
    requestItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
    },
    requestInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    mutualFriendsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    mutualFriendsIcon: {
        marginRight: 4,
    },
    mutualFriendsText: {
        fontSize: 13,
        color: '#6b7280',
    },
    timeAgo: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    acceptButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    declineButton: {
        backgroundColor: '#e5e7eb',
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
    },
    declineButtonText: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '600',
    },
});
