import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
    DrawerContentScrollView,
    DrawerItemList,
} from '@react-navigation/drawer';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AuthContext } from '@context/AuthContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { UserInfo } from '@/src/types/auth';
import { Session } from '@supabase/supabase-js';
import { GetUserProfile } from '@/src/services/user/UserInfo';

const CustomDrawerContent = (props: any) => {
    const { session, authFunctions } = useContext(AuthContext);

    const navigation = useNavigation();
    const [profile, setProfile] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchUserProfile = async (session: Session) => {
        try {
            setLoading(true);
            const profileData = await GetUserProfile(session);
            setProfile(profileData);
            console.log('Fetched user profile:', profileData);
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            if (session) {
                fetchUserProfile(session);
            }
        }, [session])
    );

    return (
        <DrawerContentScrollView
            {...props}
            contentContainerStyle={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.profileContainer}>
                    <Image
                        source={{ uri: profile?.avatar || 'https://via.placeholder.com/80' }}
                        style={styles.avatar}
                    />
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                            {profile?.fullName || ''}
                        </Text>
                        <Text style={styles.userEmail}>
                            {profile?.email || ''}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Drawer Items */}
            <View style={styles.drawerItems}>
                <DrawerItemList {...props} />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => {
                        if (authFunctions.signOut) {
                            authFunctions.signOut();
                        }
                    }}
                >
                    <MaterialIcons name="logout" size={24} color="#666" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </DrawerContentScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        backgroundColor: '#f8f9fa',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#ddd',
    },
    userInfo: {
        marginLeft: 15,
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
    drawerItems: {
        flex: 1,
        paddingTop: 20,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    logoutText: {
        marginLeft: 32,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
});

export default CustomDrawerContent;
