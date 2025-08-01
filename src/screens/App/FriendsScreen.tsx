import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    Image,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { FriendsStackParamList } from '@/src/types/route';

type FriendsScreenNavigationProp = NativeStackNavigationProp<
    FriendsStackParamList,
    'FriendsContent'
>;

interface FriendRequest {
    id: string;
    name: string;
    avatar: any;
    mutualFriends: number;
    timeAgo: string;
}

const mockFriendRequests: FriendRequest[] = [
    {
        id: '1',
        name: 'Nguyễn Trung Kiên',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 0,
        timeAgo: '6 ngày',
    },
    {
        id: '2',
        name: 'Trần Mạnh Tài',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 0,
        timeAgo: '6 tuần',
    },
    {
        id: '3',
        name: 'Bao Hai',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 0,
        timeAgo: '4 tuần',
    },
    {
        id: '4',
        name: 'Lưu Nhi',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 0,
        timeAgo: '16 tuần',
    },
    {
        id: '5',
        name: 'Mơ Hoàng',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 2,
        timeAgo: '23 tuần',
    },
    {
        id: '6',
        name: 'Lê Ngọc Quỳnh',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 0,
        timeAgo: '3 tuần',
    },
    {
        id: '7',
        name: 'Phạm Văn Nam',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 1,
        timeAgo: '2 tuần',
    },
    {
        id: '8',
        name: 'Hoàng Thị Lan',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 3,
        timeAgo: '1 tuần',
    },
    {
        id: '9',
        name: 'Vũ Minh Đức',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 0,
        timeAgo: '5 ngày',
    },
    {
        id: '10',
        name: 'Ngô Thị Mai',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 2,
        timeAgo: '3 ngày',
    },
];

export default function FriendsScreen() {
    const navigation = useNavigation<FriendsScreenNavigationProp>();

    const handleAcceptRequest = (id: string) => {
        console.log('Accept');
    };

    const handleDeclineRequest = (id: string) => {
        console.log('Decline');
    };

    const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
        <View style={styles.requestItem}>
            <Image source={item.avatar} style={styles.avatar} />
            <View style={styles.requestInfo}>
                <Text style={styles.name}>{item.name}</Text>
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
                        onPress={() => handleAcceptRequest(item.id)}
                    >
                        <Text style={styles.acceptButtonText}>Xác nhận</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.declineButton}
                        onPress={() => handleDeclineRequest(item.id)}
                    >
                        <Text style={styles.declineButtonText}>Xóa</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('FriendsRequest')}
                >
                    <Text style={styles.seeAllText}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={mockFriendRequests}
                renderItem={renderFriendRequest}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
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
