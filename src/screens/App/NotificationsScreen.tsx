import { SUPABASE_URL } from '@/src/constants/Supabase';
import { AuthContext } from '@/src/context/AuthContext';
import { useNotification } from '@/src/context/NotificationContext';
import { supabase } from '@/src/lib/supabase'; // file config supabase
import { getFriendRequests } from '@/src/services/friend/friend';
import { getNotifications, markNotificationAsRead } from '@/src/services/notification/notification';
import { NotificationItem } from '@/src/types/notification';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useContext, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function NotificationsScreen() {
    const { session } = useContext(AuthContext);
    const { refreshUnreadCount } = useNotification();
    const navigation = useNavigation<any>();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            if (session?.user?.id) {
                fetchNotifications();
            }
        }, [session])
    );

    const fetchNotifications = async () => {
        setLoading(true);
        if (!session?.user?.id) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        // console.log('Fetching notifications for user:', session.user.id);

        try {
            const notificationData = await getNotifications(session.user.id);
            // console.log('Notifications fetched:', notificationData.length);

            if (!notificationData || notificationData.length === 0) {
                // console.log('No notifications found');
                setNotifications([]);
                setLoading(false);
                return;
            }

            // Lấy thông tin người gửi cho mỗi notification
            const enrichedNotifications = await Promise.all(
                notificationData.map(async (notification: any) => {
                    // console.log('Processing notification:', notification);

                    const senderId = notification.senderId;

                    // Lấy thông tin người gửi
                    const { data: senderInfo } = await supabase
                        .from('user_info')
                        .select('full_name, avatar')
                        .eq('id', senderId)
                        .single();

                    // console.log('Sender info for', senderId, ':', senderInfo);

                    const avatarPath = senderInfo?.avatar;

                    return {
                        ...notification,
                        created_at: new Date(notification.created_at),
                        data: {
                            ...notification.data,
                            avatar: avatarPath,
                            senderName: senderInfo?.full_name || 'Unknown User',
                            description: notification.data?.description || 'Nhấn để xem chi tiết'
                        }
                    };
                })
            );

            // console.log('Enriched notifications:', enrichedNotifications);
            setNotifications(enrichedNotifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
        }

        setLoading(false);
    };

    const handleNotificationPress = async (item: NotificationItem) => {
        // Mark notification as read if not already read (handle undefined as unread)
        const isRead = item.is_read === true;
        if (!isRead) {
            try {
                const success = await markNotificationAsRead(item.id);
                if (success) {
                    // Update local state
                    setNotifications(prevNotifications =>
                        prevNotifications.map(notification =>
                            notification.id === item.id
                                ? { ...notification, is_read: true }
                                : notification
                        )
                    );
                    // Refresh unread count in context
                    await refreshUnreadCount();
                }
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }

        // Handle navigation based on notification type
        try {
            switch (item.type) {
                case 'friend_request':
                    // Navigate to friends screen (Friends tab)
                    // console.log('Navigate to friend requests');
                    // Get current friend requests
                    const currentUserId = session?.user?.id;
                    if (currentUserId) {
                        const friendRequestsResponse = await getFriendRequests(currentUserId);
                        navigation.navigate('Friends', {
                            screen: 'FriendsRequest',
                            params: {
                                currentUserId,
                                friendRequests: friendRequestsResponse.data || [],
                                fromNotification: true
                            }
                        });
                    }
                    break;

                case 'like':
                case 'comment':
                    // Navigate directly to PostDetailScreen
                    let postId = item.data?.postId;
                    
                    // Handle malformed data - if data is an object with numeric keys, reconstruct it
                    if (!postId && typeof item.data === 'object') {
                        try {
                            // Check if data has numeric keys (malformed JSON)
                            const keys = Object.keys(item.data);
                            if (keys.some(key => !isNaN(Number(key)))) {
                                // Reconstruct the string from numeric keys
                                const reconstructedString = keys
                                    .filter(key => !isNaN(Number(key)))
                                    .sort((a, b) => Number(a) - Number(b))
                                    .map(key => item.data[key])
                                    .join('');
                                
                                console.log('Reconstructed string:', reconstructedString);
                                
                                // Parse the reconstructed JSON string
                                const parsedData = JSON.parse(reconstructedString);
                                postId = parsedData.postId;
                                console.log('Parsed postId:', postId);
                            }
                        } catch (error) {
                            console.error('Error parsing malformed notification data:', error);
                        }
                    }
                    
                    if (postId) {
                        console.log('Navigate to PostDetail:', postId);
                        console.log('Original notification data:', item.data);
                        navigation.navigate('PostDetail', { 
                            postId: postId,
                            fromNotification: true 
                        });
                    } else {
                        console.warn('No postId found in notification:', item);
                        console.warn('Full notification data:', JSON.stringify(item.data, null, 2));
                        // Fallback to Home if no postId
                        navigation.navigate('Home');
                        Alert.alert('Thông báo', 'Không thể tìm thấy bài viết này');
                    }
                    break;

                default:
                    // console.log('Handle other notification types');
                    // For unknown types, just navigate to Home
                    navigation.navigate('Home');
            }
        } catch (error) {
            console.error('Navigation error:', error);
            Alert.alert('Lỗi', 'Không thể điều hướng đến trang được yêu cầu');
        }
    };

    const renderItem = ({ item }: { item: NotificationItem }) => {
        // Debug avatar
        const avatarPath = item.data?.avatar;
        // console.log('Rendering notification avatar:', avatarPath);

        let avatarSource;
        if (avatarPath && typeof avatarPath === 'string') {
            if (avatarPath.startsWith('http')) {
                avatarSource = { uri: avatarPath };
            } else {
                avatarSource = { uri: `${SUPABASE_URL}/storage/v1/object/public/uploads/${avatarPath}` };
            }
        } else {
            avatarSource = require('../../../assets/avatar.png');
        }

        // Xử lý trạng thái đã đọc (undefined hoặc null được coi là chưa đọc)
        const isRead = item.is_read === true;

        // console.log('Final avatar source:', avatarSource);

        return (
            <TouchableOpacity
                style={[
                    styles.notificationItem,
                    !isRead && styles.unreadNotification
                ]}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={styles.avatarContainer}>
                    <Image
                        source={avatarSource}
                        style={styles.avatar}
                        onError={(error) => {
                            console.log('Avatar load error:', error.nativeEvent.error);
                        }}
                        onLoad={() => {
                            console.log('Avatar loaded successfully for:', item.data?.senderName);
                        }}
                    />
                    {!isRead && <View style={styles.unreadDot} />}
                </View>

                <View style={styles.contentContainer}>
                    <Text style={[styles.title, !isRead && styles.unreadText]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={styles.description} numberOfLines={2}>
                        {item.data?.description || ''}
                    </Text>
                    <Text style={styles.time}>
                        {new Date(item.created_at).toLocaleString('vi-VN')}
                    </Text>
                </View>

                <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    if (notifications.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Ionicons name="notifications-outline" size={64} color="#ccc" />
                <Text style={{ fontSize: 18, color: '#666', marginTop: 16, textAlign: 'center' }}>
                    Chưa có thông báo nào
                </Text>
                <Text style={{ fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' }}>
                    Các thông báo về lời mời kết bạn, lượt thích và bình luận sẽ hiển thị ở đây
                </Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ backgroundColor: '#fff' }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    notificationItem: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#F0F0F0',
    },
    unreadNotification: {
        backgroundColor: '#f8f9ff',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E5E5E5',
    },
    unreadDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#007AFF',
        borderWidth: 2,
        borderColor: '#fff',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 2,
    },
    unreadText: {
        fontWeight: '700',
        color: '#000',
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 18,
        marginBottom: 4,
    },
    time: {
        fontSize: 13,
        color: '#999',
    },
    moreButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
