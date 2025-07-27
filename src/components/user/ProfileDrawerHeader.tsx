import React, { useContext } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AuthContext } from '@context/AuthContext';

export default function ProfileDrawerHeader({
    onProfilePress,
}: {
    onProfilePress?: () => void;
}) {
    const { session } = useContext(AuthContext);
    const avatar =
        session?.user?.user_metadata?.avatar_url ||
        'https://ui-avatars.com/api/?name=' + (session?.user?.email || 'U');

    return (
        <TouchableOpacity
            style={styles.header}
            onPress={onProfilePress}
            activeOpacity={0.7}
        >
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={styles.info}>
                <Text style={styles.name}>
                    {session?.user?.user_metadata?.full_name ||
                        session?.user?.email ||
                        'User'}
                </Text>
                <Text style={styles.email}>{session?.user?.email}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e1e5e9',
        marginRight: 16,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#222',
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
});
