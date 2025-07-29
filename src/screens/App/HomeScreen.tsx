import { AuthContext } from '@/src/context/AuthContext';
import { getUserAvatarUrl } from '@/src/services/user/UserInfo';
import { UserInfo } from '@/src/types/auth';
import { Feather, Ionicons } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useFocusEffect } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Avatar, TextInput } from 'react-native-paper';
import 'react-native-url-polyfill/auto';

export default function HomeScreen() {
    const [liked, setLiked] = useState(false);
    const { session } = useContext(AuthContext);
    const [loading, setLoading] = useState<boolean>(false);
    const [avatar, setAvatar] = useState<string>('');

    const fetchUserAvatar = async (session: Session) => {
        try {
            setLoading(true);
            const response = await getUserAvatarUrl(session);
            const avatarData = response.data;
            if (!avatarData) {
                throw new Error('Không tìm thấy thông tin người dùng.');
            }
            setAvatar(avatarData);
            console.log('Fetched user profile:', avatarData);
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (session) {
                fetchUserAvatar(session);
            }
        }, [session])
    );

    const item = [
        {
            id: '1',
            name: 'HIEUTHUHAI',
            description:
                'HIEUTHUHAI: Tôi không thú vị chắc không ai "bơm" tôi lên được đâu! - Tuổi Trẻ Online',
            avatar: require('../../../assets/post1.webp'),
            image: require('../../../assets/post1.webp'),
        },
        {
            id: '2',
            name: 'Lan',
            description: 'This is the second item.',
            avatar: require('../../../assets/boy.png'),
            image: undefined,
        },
        {
            id: '3',
            name: 'Quang Vinh',
            description: '"Let your effort speak louder than your words."',
            avatar: require('../../../assets/avatarVinh.jpg'),
            image: require('../../../assets/quangvinh.jpg'),
        },
        {
            id: '4',
            name: 'Thân Tuấn',
            description: undefined,
            avatar: require('../../../assets/avatarTuan.png'),
            image: require('../../../assets/Tuanpost.jpeg'),
        },
        {
            id: '5',
            name: 'Uyên Uyên',
            description: 'Quá mệt gòi, quá đủ gòiii !!!',
            avatar: require('../../../assets/avatarUyen.jpeg'),
            image: require('../../../assets/UyenPost.jpeg'),
        },
    ];
    type ItemType = {
        id: string;
        name: string;
        description?: string;
        avatar: any;
        image?: any;
        title?: string;
    };

    const renderItem = ({ item }: { item: ItemType }) => {
        return (
            <View style={styles.renderItem}>
                <View style={styles.info}>
                    <Image source={item.avatar} style={styles.avatar} />
                    <Text style={styles.name}>{item.name}</Text>
                </View>
                <Text>{item.description}</Text>
                {item.image && (
                    <Image
                        source={item.image}
                        style={styles.image}
                        resizeMode="cover"
                    />
                )}
                <View style={styles.btn}>
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => setLiked(!liked)}
                    >
                        <Ionicons
                            name={liked ? 'heart' : 'heart-outline'}
                            size={18}
                            color="#2563eb"
                        />
                        <Text>Like</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editBtn}>
                        <Feather
                            name="message-circle"
                            size={18}
                            color="#2563eb"
                        />
                        <Text>Comment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editBtn}>
                        <FontAwesome6 name="share" size={18} color="#2563eb" />
                        <Text>Share</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.post}>
                <Avatar.Image
                    size={50}
                    source={{ uri: avatar }}
                    style={{ marginLeft: 10, marginTop: 10 }}
                />
                <TextInput
                    mode="outlined" //là để có viền
                    placeholder="Bạn đang nghĩ gì?"
                    style={styles.postcontent}
                    theme={{ roundness: 30 }}
                />
                <TouchableOpacity
                    onPress={() => console.log('More options pressed')}
                >
                    <Image
                        source={require('../../../assets/image.png')}
                        style={{ width: 30, height: 30 }}
                    />
                </TouchableOpacity>
            </View>
            <FlatList
                data={item}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#5a6a8cff',
    },
    renderItem: {
        width: '100%',
        padding: 20,
        marginVertical: 8, // trên dưới
        // marginHorizontal: 16, //trái phải
        backgroundColor: '#f9f9f9ff',
        borderRadius: 10,
    },
    info: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#222',
    },
    btn: {
        flexDirection: 'row',
        marginTop: 10,
        // backgroundColor: '#e0f2ff',
        justifyContent: 'space-between',
        // justifyContent: 'flex-end',
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginTop: 10,
        objectFit: 'cover', //để ảnh không bị méo
    },
    post: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 10,
        // margin: 10,
    },
    postcontent: {
        flex: 1,
        marginLeft: 10,
        marginRight: 10,
        backgroundColor: '#f3f4f6',
        // borderRadius: 20,
    },
});
