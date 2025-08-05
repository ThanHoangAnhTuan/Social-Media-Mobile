import { Feather, MaterialIcons } from '@expo/vector-icons';
import React, { JSX, useContext, useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
} from 'react-native';
import { Session } from '@supabase/supabase-js';

import { UserInfo } from '@/src/types/auth';
import { AuthContext } from '@context/AuthContext';
import { GetUserProfile } from '@/src/services/user/UserInfo';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { InfoRowProps } from '@/src/types/screen';

export default function ProfileScreen(): JSX.Element {
    const { session } = useContext(AuthContext);
    const navigation = useNavigation();
    const [profile, setProfile] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchUserProfile = async (session: Session) => {
        try {
            setLoading(true);
            const response = await GetUserProfile(session);
            const profileData = response.data;
            if (!profileData) {
                throw new Error('Không tìm thấy thông tin người dùng.');
            }
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

    const InfoRow: React.FC<InfoRowProps> = ({
        icon,
        iconType = 'feather',
        label,
        value,
        iconColor = '#6366f1',
    }) => (
        <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
                {iconType === 'feather' ? (
                    <Feather name={icon as any} size={20} color={iconColor} />
                ) : (
                    <MaterialIcons
                        name={icon as any}
                        size={20}
                        color={iconColor}
                    />
                )}
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || 'Chưa cập nhật'}</Text>
            </View>
        </View>
    );

    const formatGender = (gender: string | null): string => {
        if (!gender) return 'Chưa cập nhật';
        switch (gender) {
            case 'male':
                return 'Nam';
            case 'female':
                return 'Nữ';
            case 'other':
                return 'Khác';
            default:
                return gender;
        }
    };

    const formatDate = (date: string | Date | null): string => {
        if (!date) return 'Chưa cập nhật';
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            return dateObj.toLocaleDateString('vi-VN');
        } catch (error) {
            return 'Chưa cập nhật';
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
        >
            {/* Header với gradient background */}
            <View style={styles.headerContainer}>
                <View style={styles.headerGradient}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{
                                uri:
                                    profile?.avatar ||
                                    'https://via.placeholder.com/150',
                            }}
                            style={styles.avatar}
                        />
                        <View style={styles.avatarBadge}>
                            <Feather name="camera" size={14} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.name}>
                        {profile?.fullName || 'Người dùng'}
                    </Text>
                    <Text style={styles.email}>
                        {profile?.email || 'Chưa có email'}
                    </Text>
                </View>
            </View>

            {/* Thông tin cá nhân */}
            <View style={styles.content}>
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons
                            name="person"
                            size={24}
                            color="#6366f1"
                        />
                        <Text style={styles.sectionTitle}>
                            Thông tin cá nhân
                        </Text>
                    </View>

                    <InfoRow
                        icon="user"
                        label="Họ và tên"
                        value={profile?.fullName || ''}
                        iconColor="#10b981"
                    />
                    <InfoRow
                        icon="mail"
                        label="Email"
                        value={profile?.email || ''}
                        iconColor="#f59e0b"
                    />
                    <InfoRow
                        icon="person"
                        iconType="material"
                        label="Giới tính"
                        value={formatGender(profile?.gender || null)}
                        iconColor="#ec4899"
                    />
                    <InfoRow
                        icon="calendar"
                        label="Ngày sinh"
                        value={formatDate(profile?.birthDate || null)}
                        iconColor="#8b5cf6"
                    />
                </View>

                {/* Thông tin liên hệ */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons
                            name="contact-phone"
                            size={24}
                            color="#6366f1"
                        />
                        <Text style={styles.sectionTitle}>
                            Thông tin liên hệ
                        </Text>
                    </View>

                    <InfoRow
                        icon="phone"
                        label="Số điện thoại"
                        value={profile?.phone || ''}
                        iconColor="#06b6d4"
                    />
                    <InfoRow
                        icon="location-on"
                        iconType="material"
                        label="Địa chỉ"
                        value={profile?.address || ''}
                        iconColor="#ef4444"
                    />
                </View>

                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() =>
                            navigation.navigate('EditProfile' as never)
                        }
                    >
                        <Feather name="edit-2" size={20} color="#fff" />
                        <Text style={styles.editBtnText}>Chỉnh sửa hồ sơ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
    },
    headerContainer: {
        height: 280,
        position: 'relative',
    },
    headerGradient: {
        flex: 1,
        backgroundColor: '#6366f1',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#e1e5e9',
        borderWidth: 4,
        borderColor: '#fff',
    },
    avatarBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: '#10b981',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    name: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        textAlign: 'center',
    },
    email: {
        fontSize: 16,
        color: '#e2e8f0',
        opacity: 0.9,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginLeft: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 8,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 2,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '600',
    },
    actionContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366f1',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    editBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    settingsBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderWidth: 2,
        borderColor: '#6366f1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    settingsBtnText: {
        color: '#6366f1',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    
});
