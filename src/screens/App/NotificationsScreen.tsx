import { AuthContext } from '@/src/context/AuthContext';
import { NotificationItem } from '@/src/types/notification';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { supabase } from '@/src/lib/supabase'; // file config supabase
import { useFocusEffect } from '@react-navigation/native';

export default function NotificationsScreen() {
    const { session } = useContext(AuthContext);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    // useEffect(() => {
    //     if (session?.user?.id) {
    //         fetchNotifications();
    //     }
    // }, [session]);
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
        const { data, error } = await supabase
            .from('notifications') // tên bảng của bạn
            .select('*')
            .eq('receiverId', session.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
        } else {
            setNotifications(data || []);
        }
        setLoading(false);
    };

    const renderItem = ({ item }: { item: NotificationItem }) => (
        <TouchableOpacity style={styles.notificationItem}>
            <View style={styles.avatarContainer}>
                <Image
                    source={
                        typeof item.data?.avatar === 'string'
                            ? { uri: item.data.avatar }
                            : require('../../../assets/avatar.png')
                    }
                    style={styles.avatar}
                />
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.title} numberOfLines={1}>
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

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ backgroundColor: '#fff' }}
        />
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
