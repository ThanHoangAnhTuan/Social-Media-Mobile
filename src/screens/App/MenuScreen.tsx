import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { JSX, useContext, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { RootStackParamList } from '@navigation/RootNavigator';
import ProfileDrawerHeader from '@components/user/ProfileDrawerHeader';
import { AuthContext } from '@context/AuthContext';

interface MenuItem {
    icon: JSX.Element;
    label: string;
    subtitle?: string;
    count?: number;
    toggle?: boolean;
    onPress?: () => void;
}

interface MenuSection {
    section: string;
    items: MenuItem[];
}

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function MenuScreen() {
    const { authFunctions } = useContext(AuthContext);
    const navigation = useNavigation<NavProp>();

    const [darkMode, setDarkMode] = useState(false);

    const handleProfileNavigation = () => {
        navigation.navigate('Profile');
    };

    const handleFeatureNotAvailable = (featureName: string) => {
        Alert.alert('Thông báo', `Chức năng ${featureName} sẽ được bổ sung!`);
    };

    const menuSections: MenuSection[] = [
        {
            section: 'Profile',
            items: [
                {
                    icon: (
                        <MaterialIcons name="person" size={24} color="black" />
                    ),
                    label: 'Trang cá nhân',
                    subtitle: 'Xem và chỉnh sửa profile',
                    onPress: handleProfileNavigation,
                },
            ],
        },
        {
            section: 'Hoạt động',
            items: [
                {
                    icon: <FontAwesome6 name="heart" size={24} color="black" />,
                    label: 'Bài viết đã thích',
                    count: 24,
                    onPress: () =>
                        handleFeatureNotAvailable('Bài viết đã thích'),
                },
                {
                    icon: (
                        <MaterialIcons
                            name="bookmark"
                            size={24}
                            color="black"
                        />
                    ),
                    label: 'Đã lưu',
                    count: 12,
                    onPress: () => handleFeatureNotAvailable('Đã lưu'),
                },
                {
                    icon: (
                        <MaterialIcons
                            name="people-alt"
                            size={24}
                            color="black"
                        />
                    ),
                    label: 'Bạn bè gần đây',
                    onPress: () => handleFeatureNotAvailable('Bạn bè gần đây'),
                },
                {
                    icon: (
                        <MaterialIcons
                            name="camera-alt"
                            size={24}
                            color="black"
                        />
                    ),
                    label: 'Kỷ niệm',
                    subtitle: 'Xem lại những khoảnh khắc',
                    onPress: () => handleFeatureNotAvailable('Kỷ niệm'),
                },
            ],
        },
        {
            section: 'Cài đặt',
            items: [
                {
                    icon: (
                        <MaterialIcons
                            name="settings"
                            size={24}
                            color="black"
                        />
                    ),
                    label: 'Cài đặt chung',
                    onPress: () => handleFeatureNotAvailable('Cài đặt chung'),
                },
                {
                    icon: (
                        <MaterialIcons name="shield" size={24} color="black" />
                    ),
                    label: 'Quyền riêng tư & Bảo mật',
                    onPress: () =>
                        handleFeatureNotAvailable('Quyền riêng tư & Bảo mật'),
                },
                {
                    icon: (
                        <MaterialIcons
                            name="notifications"
                            size={24}
                            color="black"
                        />
                    ),
                    label: 'Thông báo',
                    onPress: () => handleFeatureNotAvailable('Thông báo'),
                },
                {
                    icon: <FontAwesome6 name="moon" size={24} color="black" />,
                    label: 'Chế độ tối',
                    toggle: true,
                },
                {
                    icon: (
                        <SimpleLineIcons name="globe" size={24} color="black" />
                    ),
                    label: 'Ngôn ngữ',
                    subtitle: 'Tiếng Việt',
                    onPress: () => handleFeatureNotAvailable('Ngôn ngữ'),
                },
            ],
        },
        {
            section: 'Hỗ trợ',
            items: [
                {
                    icon: (
                        <MaterialIcons
                            name="help-outline"
                            size={24}
                            color="black"
                        />
                    ),
                    label: 'Trợ giúp & Hỗ trợ',
                    onPress: () =>
                        handleFeatureNotAvailable('Trợ giúp & Hỗ trợ'),
                },
                {
                    icon: (
                        <MaterialIcons
                            name="info-outline"
                            size={24}
                            color="black"
                        />
                    ),
                    label: 'Về ứng dụng',
                    subtitle: 'Phiên bản 1.0.0',
                    onPress: () => handleFeatureNotAvailable('Về ứng dụng'),
                },
            ],
        },
    ];

    const handleSignOut = async () => {
        Alert.alert(
            'Xác nhận đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất không?',
            [
                {
                    text: 'Hủy',
                    style: 'cancel',
                },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: () => {
                        try {
                            authFunctions.signOut();
                        } catch (error) {
                            Alert.alert(
                                'Lỗi',
                                'Không thể đăng xuất. Vui lòng thử lại.'
                            );
                        }
                    },
                },
            ]
        );
    };

    const renderMenuItem = (item: MenuItem, index: number) => (
        <TouchableOpacity
            key={index}
            style={[styles.menuItem, index > 0 && styles.menuItemBorder]}
            activeOpacity={item.onPress ? 0.7 : 1}
            onPress={item.onPress}
            disabled={!item.onPress && !item.toggle}
        >
            <View style={styles.iconWrap}>{item.icon}</View>
            <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.subtitle && (
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                )}
            </View>
            {item.count !== undefined && (
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{item.count}</Text>
                </View>
            )}
            {item.toggle ? (
                <Switch
                    value={darkMode}
                    onValueChange={setDarkMode}
                    thumbColor={darkMode ? '#2563eb' : '#fff'}
                    trackColor={{
                        true: '#a5b4fc',
                        false: '#e5e7eb',
                    }}
                />
            ) : (
                item.onPress && (
                    <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color="black"
                    />
                )
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.screen}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <ProfileDrawerHeader onProfilePress={handleProfileNavigation} />

                {menuSections.map((section, sectionIndex) => (
                    <View key={sectionIndex} style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {section.section}
                        </Text>
                        <View style={styles.sectionBox}>
                            {section.items.map((item, itemIndex) =>
                                renderMenuItem(item, itemIndex)
                            )}
                        </View>
                    </View>
                ))}

                <View style={styles.section}>
                    <View style={styles.sectionBox}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleSignOut}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.iconWrap,
                                    styles.signOutIconWrap,
                                ]}
                            >
                                <MaterialIcons
                                    name="logout"
                                    size={24}
                                    color="black"
                                />
                            </View>
                            <View style={styles.menuContent}>
                                <Text
                                    style={[
                                        styles.menuLabel,
                                        styles.signOutLabel,
                                    ]}
                                >
                                    Đăng xuất
                                </Text>
                            </View>
                            <MaterialIcons
                                name="chevron-right"
                                size={24}
                                color="black"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    scroll: {
        paddingBottom: 32,
    },
    header: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#222',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: 'bold',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingLeft: 8,
    },
    sectionBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        borderWidth: 1,
        borderColor: '#f3f4f6',
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 14,
    },
    menuItemBorder: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    signOutIconWrap: {
        backgroundColor: '#fee2e2',
    },
    menuContent: {
        flex: 1,
    },
    menuLabel: {
        fontSize: 15,
        color: '#222',
        fontWeight: '500',
    },
    signOutLabel: {
        color: '#e11d48',
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    countBadge: {
        backgroundColor: '#fee2e2',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 8,
    },
    countText: {
        color: '#e11d48',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
