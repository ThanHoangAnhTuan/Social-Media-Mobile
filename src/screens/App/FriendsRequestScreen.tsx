import { acceptFriendRequest, removeFriend } from '@/src/services/friend/friend';
import { FriendRequest } from '@/src/types/friend';
import { FriendsStackParamList } from '@/src/types/route';
import { Feather } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
type FriendsRequestScreenNavigationProp = NativeStackNavigationProp<
    FriendsStackParamList,
    'FriendsRequest'
>;

const FriendsRequestScreen = () => {
    const navigation = useNavigation<FriendsRequestScreenNavigationProp>();
    const route = useRoute<any>();
    const { currentUserId, friendRequests: initialFriendRequests, fromNotification } = route.params as {
        currentUserId: string;
        friendRequests: FriendRequest[];
        fromNotification?: boolean;
    };

    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(initialFriendRequests);
    const [isUsingInitialData, setIsUsingInitialData] = useState(true);

    const handleAcceptRequest = async (request: FriendRequest) => {
        const success = await acceptFriendRequest(request.id);
        if (success) {
            setFriendRequests((prevRequests) =>
                prevRequests.filter((req) => req.id !== request.id)
            );
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
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (isUsingInitialData) {
                setFriendRequests(initialFriendRequests);
            }
        }, [isUsingInitialData])
    );

    const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
        <View style={styles.requestItem}>
            <Image source={item.avatar} style={styles.avatar} />
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
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        // console.log('Back Back');
                        navigation.goBack();
                    }}
                    style={styles.backButton}
                // activeOpacity={0.7}
                >
                    <AntDesign name="arrowleft" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
                <View style={styles.placeholder} />
            </View>

            <FlatList
                data={friendRequests}
                renderItem={renderFriendRequest}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
            />
        </SafeAreaView>
    );
};

export default FriendsRequestScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        marginRight: 8,
        marginLeft: 8,
        borderRadius: 8,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        flex: 1,
        textAlign: 'center',
        marginLeft: -32,
    },
    placeholder: {
        width: 40,
    },
    listContainer: {
        paddingBottom: 20,
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
