import { SUPABASE_URL } from '@/src/constants/Supabase';
import { supabase } from '@/src/lib/supabase';
import { acceptFriendRequest, removeFriend } from '@/src/services/friend/friend';
import { FriendRequest } from '@/src/types/friend';
import { FriendsStackParamList } from '@/src/types/route';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const handleAcceptRequest = async (request: FriendRequest) => {
        console.log("Accepting friend request:", request.id);
        const success = await acceptFriendRequest(request.id);
        console.log("Accept friend request success:", success);
        if (success) {
            setFriendRequests((prevRequests) =>
                prevRequests.filter((req) => req.id !== request.id)
            );
            await fetchFriendRequests();
        }
        // console.log('Accepted friend request with ID:', request.id);
        // console.log('Friend request accepted:', request.addressee_id);
    };

    const handleDeclineRequest = async (request: FriendRequest) => {
        const success = await removeFriend(request.id);
        if (success) {
            setFriendRequests((prevRequests) =>
                prevRequests.filter((req) => req.id !== request.id)
            );
            await fetchFriendRequests();
        }
        // console.log('Friend request declined:', request.addressee_id);
        // console.log('Declined friend request with ID:', request.id);
    };
    const fetchFriendRequests = async () => {
        const { data: { user }, error: userError, } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error('Error getting current user:', userError);
            return;
        }
        setCurrentUserId(user.id);
        const currentUserId = user.id;
        console.log("Current User ID:", currentUserId);
        const supabaseUrl = SUPABASE_URL;
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

        console.log("Query executed with addressee_id:", currentUserId);
        console.log("Friend requests query result:", userInfoList);
        console.log("Query error:", error);
        if (error) {
            console.error('Error fetching friend requests:', error);
            return;
        }
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
                requester_id: userItem.requester.id,
                addressee_id: currentUserId,
                fullname: userItem.requester.full_name,
                avatar: avatarSource,
                mutualFriends: userItem.mutual_friends || 0,
                timeAgo: userItem.time_ago || 'Vừa xong',
                status: (userItem.status || 'pending') as 'pending',
            };
        });

        console.log("Formatted friend requests:", formattedRequests);
        console.log("Number of friend requests found:", formattedRequests.length);
        setFriendRequests(formattedRequests);
    };

    const searchUsers = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const supabaseUrl = SUPABASE_URL;
        const bucket = 'uploads';

        try {
            const { data: users, error } = await supabase
                .from('user_info')
                .select('id, full_name, avatar')
                .ilike('full_name', `%${query}%`)
                .limit(10);

            if (error) {
                console.error('Error searching users:', error);
                setSearchResults([]);
                return;
            }

            const formattedUsers = users.map((user: any) => {
                let avatarSource;

                if (user.avatar?.startsWith('http')) {
                    avatarSource = { uri: user.avatar };
                } else if (user.avatar) {
                    avatarSource = {
                        uri: `${supabaseUrl}/storage/v1/object/public/${bucket}/${user.avatar}`,
                    };
                } else {
                    avatarSource = require('../../../assets/avatar.png');
                }

                return {
                    id: user.id,
                    fullname: user.full_name,
                    avatar: avatarSource,
                };
            });

            setSearchResults(formattedUsers);
        } catch (error) {
            console.error('Error searching users:', error);
            setSearchResults([]);
        }
    };

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        searchUsers(text);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
    };
    useFocusEffect(
        useCallback(() => {
            fetchFriendRequests();
        }, [])
    );

    const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
        <View style={styles.requestItem}>
            <TouchableOpacity onPress={() => navigation.navigate('PersonalContent', { userId: item.requester_id })}>
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

    const renderSearchResult = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.searchResultItem}
            onPress={() => {
                navigation.navigate('PersonalContent', { userId: item.id });
                clearSearch();
            }}
        >
            <Image source={item.avatar} style={styles.searchAvatar} />
            <View style={styles.searchUserInfo}>
                <Text style={styles.searchUserName}>{item.fullname}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={20} color="#6b7280" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm bạn bè..."
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        placeholderTextColor="#6b7280"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                            <Feather name="x" size={20} color="#6b7280" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Search Results */}
            {isSearching && searchQuery.length > 0 && (
                <View style={styles.searchResultsContainer}>
                    <Text style={styles.searchResultsTitle}>Kết quả tìm kiếm</Text>
                    {searchResults.length > 0 ? (
                        <FlatList
                            data={searchResults}
                            renderItem={renderSearchResult}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        <Text style={styles.noResultsText}>Không tìm thấy kết quả nào</Text>
                    )}
                </View>
            )}

            {/* Friend Requests Section - Only show when not searching */}
            {!isSearching && (
                <>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('FriendsRequest', { currentUserId, friendRequests })}
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
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    searchContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
        paddingVertical: 0,
    },
    clearButton: {
        padding: 4,
        marginLeft: 8,
    },
    searchResultsContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    searchResultsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    searchAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    searchUserInfo: {
        flex: 1,
    },
    searchUserName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1e293b',
    },
    noResultsText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
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
