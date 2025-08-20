import { createNotification, getUnreadNotificationCount } from '@/src/services/notification/notification';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';

interface NotificationContextType {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
    createNewNotification: (
        receiverId: string,
        type: 'friend_request' | 'comment' | 'like' | 'mention' | 'other',
        title: string,
        data?: any
    ) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType>({
    unreadCount: 0,
    refreshUnreadCount: async () => {},
    createNewNotification: async () => false,
});

export const useNotification = () => useContext(NotificationContext);

interface NotificationProviderProps {
    children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const { session } = useContext(AuthContext);
    const [unreadCount, setUnreadCount] = useState<number>(0);

    const refreshUnreadCount = async () => {
        if (!session?.user?.id) {
            setUnreadCount(0);
            return;
        }

        try {
            const count = await getUnreadNotificationCount(session.user.id);
            setUnreadCount(count);
        } catch (error) {
            console.error('Error refreshing unread count:', error);
        }
    };

    const createNewNotification = async (
        receiverId: string,
        type: 'friend_request' | 'comment' | 'like' | 'mention' | 'other',
        title: string,
        data?: any
    ): Promise<boolean> => {
        if (!session?.user?.id) return false;

        try {
            const success = await createNotification(
                session.user.id,
                receiverId,
                type,
                title,
                data
            );

            if (success) {
                // Refresh unread count for both sender and receiver
                // (in a real app, you might use push notifications or websockets)
                await refreshUnreadCount();
            }

            return success;
        } catch (error) {
            console.error('Error creating notification:', error);
            return false;
        }
    };

    useEffect(() => {
        if (session?.user?.id) {
            refreshUnreadCount();
        }
    }, [session]);

    const contextValue: NotificationContextType = {
        unreadCount,
        refreshUnreadCount,
        createNewNotification,
    };

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
