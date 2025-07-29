import React from 'react';
import {
    Text,
    View,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { FriendsStackParamList } from '@/src/types/route';
import AntDesign from '@expo/vector-icons/AntDesign';
type FriendsRequestScreenNavigationProp = NativeStackNavigationProp<
    FriendsStackParamList,
    'FriendsRequest'
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
    {
        id: '11',
        name: 'Đặng Văn Hùng',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 1,
        timeAgo: '1 ngày',
    },
    {
        id: '12',
        name: 'Lý Thị Hương',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 0,
        timeAgo: '2 ngày',
    },
    {
        id: '13',
        name: 'Nguyễn Văn Bình',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 4,
        timeAgo: '4 ngày',
    },
    {
        id: '14',
        name: 'Trần Thị Nga',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 0,
        timeAgo: '1 tuần',
    },
    {
        id: '15',
        name: 'Phạm Minh Tuấn',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 2,
        timeAgo: '2 tuần',
    },
    {
        id: '16',
        name: 'Hoàng Văn Long',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 1,
        timeAgo: '3 tuần',
    },
    {
        id: '17',
        name: 'Nguyễn Thị Linh',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 0,
        timeAgo: '5 tuần',
    },
    {
        id: '18',
        name: 'Vũ Văn Dũng',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 3,
        timeAgo: '7 tuần',
    },
    {
        id: '19',
        name: 'Lê Thị Kim',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 0,
        timeAgo: '8 tuần',
    },
    {
        id: '20',
        name: 'Đỗ Văn Thành',
        avatar: require('../../../assets/avatar.png'),
        mutualFriends: 1,
        timeAgo: '10 tuần',
    },
];

const FriendsRequestScreen = () => {
    const navigation = useNavigation<FriendsRequestScreenNavigationProp>();

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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        console.log('Back Back');
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
                data={mockFriendRequests}
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
