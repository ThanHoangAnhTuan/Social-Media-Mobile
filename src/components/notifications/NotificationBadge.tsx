import { useNotification } from '@/src/context/NotificationContext';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface NotificationBadgeProps {
    children: React.ReactNode;
}

export default function NotificationBadge({ children }: NotificationBadgeProps) {
    const { unreadCount, refreshUnreadCount } = useNotification();

    useFocusEffect(
        useCallback(() => {
            refreshUnreadCount();
        }, [refreshUnreadCount])
    );

    return (
        <View style={styles.container}>
            {children}
            {unreadCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount.toString()}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#ff3b30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
