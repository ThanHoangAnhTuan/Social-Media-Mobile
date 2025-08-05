import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NotificationItem {
    id: string;
    avatar: any;
    title: string;
    description: string;
    time: string;
}

const notifications: NotificationItem[] = [
    {
        id: '1',
        avatar: require('../../../assets/avatar.png'),
        title: 'LCK Việt Nam',
        description: 'đang phát trực tiếp: "Bình Luận Tiếng Việt: DNF vs DRX | T1 vs NS | Tuần 10 Ngày 5 | LCK 202..."',
        time: '3 giờ',
    },
    {
        id: '2',
        avatar: require('../../../assets/avatar.png'),
        title: 'Thế giới Kpop',
        description: 'vừa bình luận về một nội dung bạn có thể quan tâm.',
        time: '3 giờ',
    },
    {
        id: '3',
        avatar: require('../../../assets/avatar.png'),
        title: 'Tốt lắm!',
        description: 'Bạn đã hoàn thành cấp độ 1 rồi. Hãy bắt đầu chinh phục cấp độ 2 nhé.',
        time: '5 giờ',
    },
    {
        id: '4',
        avatar: require('../../../assets/avatar.png'),
        title: 'Bạn đã đạt được huy hiệu fan đẳng lên',
        description: 'vì tương tác với Bin. Hãy nhận ngay nhé.',
        time: '19 giờ',
    },
    {
        id: '5',
        avatar: require('../../../assets/avatar.png'),
        title: 'Bạn đã đạt được huy hiệu fan đẳng lên',
        description: 'vì tương tác với Wayne Chinkokway. Hãy nhận ngay nhé.',
        time: '19 giờ',
    },
    {
        id: '6',
        avatar: require('../../../assets/avatar.png'),
        title: 'Starbucks Vietnam',
        description: 'đã tạo một sự kiện mà bạn có thể sẽ muốn tham gia.',
        time: '1 ngày',
    },
    {
        id: '7',
        avatar: require('../../../assets/avatar.png'),
        title: 'Ngọt như glucozo',
        description: 'gần đây đã chia sẻ 2 bài viết.',
        time: '1 ngày',
    },
    {
        id: '8',
        avatar: require('../../../assets/avatar.png'),
        title: 'Hãy xem bài viết hàng đầu trong Learn Tech Anywhere',
        description: 'gợi ý này dựa trên hoạt động gần đây của bạn.',
        time: '1 ngày',
    },
];

export default function NotificationsScreen() {
    const renderNotification = ({ item }: { item: NotificationItem }) => (
        <TouchableOpacity style={styles.notificationItem}>
            <View style={styles.avatarContainer}>
                <Image
                    source={typeof item.avatar === 'string' ? { uri: item.avatar } : item.avatar}
                    style={styles.avatar}
                />
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                </Text>
                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>
                <Text style={styles.time}>{item.time}</Text>
            </View>

            <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                style={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 16,
    },
    headerButton: {
        padding: 4,
    },
    filterContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F8F9FA',
    },
    filterText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    list: {
        flex: 1,
    },
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
    redDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FF3B30',
        borderWidth: 2,
        borderColor: '#fff',
    },
    iconBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    iconText: {
        fontSize: 12,
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
