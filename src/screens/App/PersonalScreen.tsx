import { Feather, Ionicons } from '@expo/vector-icons';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import React, { JSX, useCallback, useContext, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import { PRIVACY_OPTIONS } from '@/src/constants/Post';
import { AuthContext } from '@/src/context/AuthContext';
import { acceptFriendRequest, AddFriendRequest, getFriendsCount, getFriendshipStatus, getUserPhotos, removeFriend } from '@/src/services/friend/friend';
import { getPostsByUserId } from '@/src/services/post/post';
import * as UserService from '@/src/services/user/UserInfo';
import { GetUserProfile, GetUserProfileById, UpdateUserAvatar, UpdateUserCoverPhoto, UpdateUserProfile } from '@/src/services/user/UserInfo';
import { UpdateUserInfo, UserInfo } from '@/src/types/auth';
import { Comment, MediaItem, Post } from '@/src/types/post';
import { FriendsStackParamList, ProfileStackParamList } from '@/src/types/route';
import * as ImagePicker from 'expo-image-picker';

// Debug: Check if GetUserProfileById is imported correctly
// console.log('GetUserProfileById function:', typeof GetUserProfileById);

const { width: screenWidth } = Dimensions.get('window');
const photoSize = (screenWidth - 6) / 3; // 3 columns with 2px margin

type PersonalScreenRouteProp = RouteProp<FriendsStackParamList, 'PersonalContent'> |
    RouteProp<ProfileStackParamList, 'Personal'>;

export default function PersonalScreen(): JSX.Element {
    const [formData, setFormData] = useState<UpdateUserInfo>({
        fullName: null,
        email: null,
        phone: null,
        address: null,
        birthDate: null,
        gender: null,
        avatar: null,
        coverPhoto: null,
    });
    const [avatarLoading, setAvatarLoading] = useState<boolean>(false);
    const [originalAvatar, setOriginalAvatar] = useState<string | null>(null);
    const { session } = useContext(AuthContext);
    const route = useRoute<PersonalScreenRouteProp>();
    const navigation = useNavigation();
    const [posts, setPosts] = useState<Post[]>([]);
    const [userProfile, setUserProfile] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [showCommentsModal, setShowCommentsModal] = useState<boolean>(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState<string>('');
    const [friendsCount, setFriendsCount] = useState<number>(0);
    const [userPhotos, setUserPhotos] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'posts' | 'photos'>('posts');
    const [friendshipStatus, setFriendshipStatus] = useState<{
        status: 'none' | 'pending' | 'accepted' | 'received_request';
        friendshipId?: string;
    }>({ status: 'none' });
    const [showFriendDropdown, setShowFriendDropdown] = useState<boolean>(false);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [confirmAction, setConfirmAction] = useState<'add' | 'accept' | 'remove' | null>(null);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null); // ảnh mới
    const [coverPhotoUri, setCoverPhotoUri] = useState<string | null>(null); // ảnh bìa mới
    const [coverPhotoLoading, setCoverPhotoLoading] = useState<boolean>(false);
    const [imagePickerType, setImagePickerType] = useState<'avatar' | 'cover'>('avatar'); // loại ảnh đang chọn

    // Get the userId from route params, or use current user's ID
    const targetUserId = route.params?.userId || session?.user?.id;
    const isOwnProfile = targetUserId === session?.user?.id;
    const [showImagePickerModal, setShowImagePickerModal] =
        useState<boolean>(false);
    // Fetch user profile and posts
    const fetchUserProfile = async (session: Session) => {
        try {
            // console.log('fetchUserProfile called for userId:', targetUserId, 'isOwnProfile:', isOwnProfile);
            // console.log('UserService:', Object.keys(UserService));
            // console.log('GetUserProfileById direct:', typeof GetUserProfileById);
            // console.log('UserService.GetUserProfileById:', typeof UserService.GetUserProfileById);

            if (isOwnProfile) {
                const response = await GetUserProfile(session);
                if (response.success && response.data) {
                    // console.log('Own profile loaded successfully:', response.data.fullName);
                    setUserProfile(response.data);
                }
            } else {
                // Lấy thông tin user khác theo userId
                if (targetUserId) {
                    // console.log('Fetching profile for other user:', targetUserId);

                    // Try both ways to call the function
                    let response;
                    try {
                        response = await GetUserProfileById(targetUserId);
                    } catch (error) {
                        // console.log('Direct import failed, trying UserService import:', error);
                        response = await UserService.GetUserProfileById(targetUserId);
                    }

                    if (response.success && response.data) {
                        // console.log('Other user profile loaded successfully:', response.data.fullName);
                        setUserProfile(response.data);
                    } else {
                        console.error('Error fetching user profile by ID:', response.error);
                        setUserProfile({
                            id: targetUserId,
                            fullName: 'Người dùng khác',
                            email: null,
                            phone: null,
                            address: null,
                            gender: null,
                            birthDate: null,
                            avatar: null,
                            coverPhoto: null,
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const fetchFriendsCount = async () => {
        if (!targetUserId) return;
        try {
            const count = await getFriendsCount(targetUserId);
            setFriendsCount(count);
        } catch (error) {
            console.error('Error fetching friends count:', error);
        }
    };

    const fetchUserPhotos = async () => {
        if (!targetUserId) return;
        try {
            const photos = await getUserPhotos(targetUserId);
            setUserPhotos(photos);
        } catch (error) {
            console.error('Error fetching user photos:', error);
        }
    };

    const fetchFriendshipStatus = async () => {
        if (!targetUserId || !session?.user?.id || isOwnProfile) return;
        try {
            const status = await getFriendshipStatus(session.user.id, targetUserId);
            setFriendshipStatus(status);
        } catch (error) {
            console.error('Error fetching friendship status:', error);
        }
    };

    const handleFriendAction = (action: 'add' | 'accept' | 'remove') => {
        setConfirmAction(action);
        setShowConfirmModal(true);
        setShowFriendDropdown(false);
    };

    const confirmFriendAction = async () => {
        if (!session?.user?.id || !targetUserId) return;

        try {
            let success = false;

            switch (confirmAction) {
                case 'add':
                    const result = await AddFriendRequest(session.user.id, targetUserId);
                    success = result !== null;
                    if (success) {
                        setFriendshipStatus({ status: 'pending' });
                    }
                    break;

                case 'accept':
                    if (friendshipStatus.friendshipId) {
                        success = await acceptFriendRequest(friendshipStatus.friendshipId);
                        if (success) {
                            setFriendshipStatus({ status: 'accepted', friendshipId: friendshipStatus.friendshipId });
                            // Refresh friends count
                            fetchFriendsCount();
                        }
                    }
                    break;

                case 'remove':
                    if (friendshipStatus.friendshipId) {
                        success = await removeFriend(friendshipStatus.friendshipId);
                        if (success) {
                            setFriendshipStatus({ status: 'none' });
                            // Refresh friends count
                            fetchFriendsCount();
                        }
                    }
                    break;
            }

            if (!success) {
                console.error('Friend action failed');
                // You could show an error toast here
            }
        } catch (error) {
            console.error('Error in friend action:', error);
        } finally {
            setShowConfirmModal(false);
            setConfirmAction(null);
        }
    };

    const getConfirmModalContent = () => {
        switch (confirmAction) {
            case 'add':
                return {
                    title: 'Gửi lời mời kết bạn',
                    message: 'Bạn có muốn gửi lời mời kết bạn đến người này không?',
                    confirmText: 'Gửi lời mời'
                };
            case 'accept':
                return {
                    title: 'Chấp nhận kết bạn',
                    message: 'Bạn có muốn chấp nhận lời mời kết bạn từ người này không?',
                    confirmText: 'Chấp nhận'
                };
            case 'remove':
                return {
                    title: 'Hủy kết bạn',
                    message: 'Bạn có chắc chắn muốn hủy kết bạn với người này không?',
                    confirmText: 'Hủy kết bạn'
                };
            default:
                return {
                    title: '',
                    message: '',
                    confirmText: ''
                };
        }
    };


    // Fallback mock loader for posts
    const loadPosts = (session: Session) => {
        setPosts([]);
    };

    const fetchUserPosts = async (session: Session) => {
        try {
            setLoading(true);

            if (!targetUserId) {
                console.error('No target user ID available');
                setLoading(false);
                return;
            }

            // Try to get posts from API first
            const response = await getPostsByUserId(targetUserId);
            console.log('fetchUserPosts response:', response);
            if (response.success && response.data) {
                console.log('Posts data received:', response.data);
                setPosts(response.data);
            } else {
                console.error('Error fetching posts:', response.error);
                // Use mock data as fallback
                loadPosts(session);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            // Use mock data as fallback
            loadPosts(session);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (): Promise<void> => {
        setLoading(true);
        try {
            if (!session) {
                Alert.alert('Lỗi', 'Bạn cần đăng nhập để cập nhật hồ sơ.');
                return;
            }

            let avatarToSave: string | null = originalAvatar;

            // Nếu user đã chọn ảnh mới thì upload
            if (selectedImageUri) {
                const response = await UpdateUserAvatar(session, selectedImageUri);
                if (!response || !response.data) throw new Error('Không thể cập nhật avatar.');
                avatarToSave = response.data.replace(/^uploads\//, '');
            }

            const updateData: Partial<UpdateUserInfo> = {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                birthDate: formData.birthDate,
                gender: formData.gender,
            };

            // Chỉ thêm avatar nếu có sự thay đổi
            if (avatarToSave !== originalAvatar) {
                updateData.avatar = avatarToSave;
            }

            await UpdateUserProfile(session.user.id, updateData);
            Alert.alert('Thành công', 'Hồ sơ đã được cập nhật!');
            navigation.goBack();
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };


    const handleImagePicker = async (type: 'camera' | 'gallery') => {
        try {
            setShowImagePickerModal(false);
            let result;

            if (type === 'camera') {
                // Xin quyền camera
                const { status } =
                    await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Lỗi',
                        'Cần quyền truy cập camera để chụp ảnh!'
                    );
                    return;
                }

                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images', 'videos'],
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 1,
                });
                // console.log('ImagePicker camera result:', result);
            } else {
                // Xin quyền thư viện ảnh
                const { status } =
                    await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh!');
                    return;
                }

                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images', 'videos'],
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 1,
                });
                // console.log('ImagePicker library result:', result);
            }

            // console.log(result);

            if (!result.canceled && result.assets[0]) {
                if (imagePickerType === 'avatar') {
                    await handleUpdateAvatar(result.assets[0].uri);
                } else if (imagePickerType === 'cover') {
                    await handleUpdateCoverPhoto(result.assets[0].uri);
                }
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại!');
        }
    };

    const handleUpdateAvatar = async (imageUri: string) => {
        if (!session) {
            Alert.alert('Lỗi', 'Bạn cần đăng nhập để cập nhật ảnh đại diện.');
            return;
        }

        setAvatarLoading(true);
        try {
            // console.log('Uploading new avatar:', imageUri);
            const response = await UpdateUserAvatar(session, imageUri);
            const fullPath = response.data;

            if (!fullPath) throw new Error('Không thể cập nhật ảnh đại diện.');

            const relativePath = fullPath.replace(/^uploads\//, '');

            setFormData((prev: UpdateUserInfo) => ({
                ...prev,
                avatar: relativePath,
            }));

            Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật!');

            // Refresh user profile to show updated avatar
            if (session) {
                await fetchUserProfile(session);
            }
        } catch (error) {
            console.error('Error updating avatar:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại!');
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleUpdateCoverPhoto = async (imageUri: string) => {
        if (!session) {
            Alert.alert('Lỗi', 'Bạn cần đăng nhập để cập nhật ảnh bìa.');
            return;
        }

        setCoverPhotoLoading(true);
        try {
            console.log('Uploading new cover photo:', imageUri);
            const response = await UpdateUserCoverPhoto(session, imageUri);

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Không thể cập nhật ảnh bìa.');
            }

            const coverPhotoUrl = response.data;
            setCoverPhotoUri(coverPhotoUrl);

            // Update formData as well
            setFormData((prev: UpdateUserInfo) => ({
                ...prev,
                coverPhoto: coverPhotoUrl,
            }));

            Alert.alert('Thành công', 'Ảnh bìa đã được cập nhật!');

            // Refresh user profile to get updated data
            if (session) {
                await fetchUserProfile(session);
            }

        } catch (error) {
            console.error('Error updating cover photo:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật ảnh bìa. Vui lòng thử lại!');
        } finally {
            setCoverPhotoLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (!session) return;

        setRefreshing(true);
        try {
            await Promise.all([
                fetchUserProfile(session),
                fetchUserPosts(session),
                fetchFriendsCount(),
                fetchUserPhotos(),
                fetchFriendshipStatus()
            ]);
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (session) {
                fetchUserProfile(session);
                fetchUserPosts(session);
                fetchFriendsCount();
                fetchUserPhotos();
                fetchFriendshipStatus();
            }
        }, [session, targetUserId])
    );

    // Render media grid for posts
    const renderMediaGrid = (media: MediaItem[]) => {
        if (media.length === 0) return null;

        const renderMediaItem = (item: MediaItem, index: number) => {
            const isVideo = item.type === 'video';

            // Calculate dimensions based on media count
            let itemStyle = {};
            if (media.length === 1) {
                itemStyle = styles.singleMedia;
            } else if (media.length === 2) {
                itemStyle = styles.doubleMedia;
            } else if (media.length === 3) {
                itemStyle = index === 0 ? styles.tripleMediaLarge : styles.tripleMediaSmall;
            } else {
                itemStyle = styles.quadMedia;
            }

            return (
                <View key={item.id} style={[styles.mediaItem, itemStyle]}>
                    <Image
                        source={{ uri: item.uri }}
                        style={styles.mediaImage}
                        resizeMode="cover"
                    />
                    {isVideo && (
                        <View style={styles.videoOverlay}>
                            <Ionicons
                                name="play-circle"
                                size={40}
                                color="rgba(255,255,255,0.8)"
                            />
                        </View>
                    )}
                    {/* Show "+X" overlay for 4th image if there are more than 4 images */}
                    {index === 3 && media.length > 4 && (
                        <View style={styles.moreMediaOverlay}>
                            <Text style={styles.moreMediaText}>
                                +{media.length - 4}
                            </Text>
                        </View>
                    )}
                </View>
            );
        };

        return (
            <View style={styles.mediaContainer}>
                {media.slice(0, 4).map((item, index) => renderMediaItem(item, index))}
            </View>
        );
    };

    // Handle post interactions
    const handleLikePost = (postId: string) => {
        const updatedPosts = posts.map((post) =>
            post.id === postId
                ? {
                    ...post,
                    isLiked: !post.isLiked,
                    likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                }
                : post
        );
        setPosts(updatedPosts);
    };

    const handleSharePost = async (post: Post) => {
        try {
            await Share.share({
                message: `${post.content}\n\nChia sẻ từ ứng dụng`,
                title: 'Chia sẻ bài viết',
            });

            const updatedPosts = posts.map((p) =>
                p.id === post.id ? { ...p, shares: p.shares + 1 } : p
            );
            setPosts(updatedPosts);
        } catch (error) {
            console.error('Error sharing post:', error);
        }
    };

    const openCommentsModal = (post: Post) => {
        setSelectedPost(post);
        setShowCommentsModal(true);
        loadComments(post.id);
    };

    const loadComments = async (postId: string) => {
        // Mock comments for now - replace with actual API call
        const mockComments: Comment[] = [
            {
                id: '1',
                content: 'Bài viết rất hay!',
                author: {
                    id: 'user2',
                    name: 'Trần Thị B',
                    avatar: 'https://picsum.photos/100/100?random=user2',
                },
                createdAt: new Date(),
            },
        ];
        setComments(mockComments);
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !selectedPost) return;

        const comment: Comment = {
            id: Date.now().toString(),
            content: newComment,
            author: {
                id: userProfile?.id || 'user1',
                name: userProfile?.fullName || 'Người dùng',
                avatar: userProfile?.avatar || 'https://picsum.photos/100/100?random=user1',
            },
            createdAt: new Date(),
        };

        setComments([...comments, comment]);
        setNewComment('');

        const updatedPosts = posts.map((post) =>
            post.id === selectedPost.id
                ? { ...post, comments: post.comments + 1 }
                : post
        );
        setPosts(updatedPosts);
    };

    const formatDate = (date: Date | string | undefined | null) => {
        console.log('formatDate input:', { date, type: typeof date });

        if (!date) {
            console.log('formatDate: No date provided');
            return 'Không có thông tin thời gian';
        }

        let dateObj: Date;
        if (typeof date === 'string') {
            dateObj = new Date(date);
        } else if (date instanceof Date) {
            dateObj = date;
        } else {
            console.log('formatDate: Invalid date type');
            return 'Thời gian không hợp lệ';
        }

        if (isNaN(dateObj.getTime())) {
            console.log('formatDate: Invalid date object');
            return 'Thời gian không hợp lệ';
        }

        const result = dateObj.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        console.log('formatDate result:', result);
        return result;
    };    // renderPhotoGrid function removed - using FlatList directly

    // Render individual post
    const renderPost = ({ item: post }: { item: Post }) => {
        const privacyInfo = PRIVACY_OPTIONS.find((opt) => opt.value === post.privacy);

        return (
            <View style={styles.postCard}>
                {/* Post Header */}
                <View style={styles.postHeader}>
                    <View style={styles.authorInfo}>
                        <Image
                            source={{ uri: post.author.avatar }}
                            style={styles.authorAvatar}
                        />
                        <View style={styles.authorDetails}>
                            <View style={styles.authorNameContainer}>
                                <Text style={styles.authorName}>
                                    {post.author.name}
                                </Text>
                                {post.feelingActivity && (
                                    <Text style={styles.feelingText}>
                                        {post.feelingActivity.type === 'feeling'
                                            ? 'đang cảm thấy'
                                            : ''}{' '}
                                        {post.feelingActivity.emoji}{' '}
                                        {post.feelingActivity.text}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.postMeta}>
                                <Text style={styles.postDate}>
                                    {(() => {
                                        console.log('Post date debug:', {
                                            postId: post.id,
                                            createdAt: post.createdAt,
                                            updatedAt: post.updatedAt,
                                            createdAtType: typeof post.createdAt,
                                            updatedAtType: typeof post.updatedAt
                                        });
                                        return formatDate(post.updatedAt || post.createdAt);
                                    })()}
                                    {post.updatedAt && post.updatedAt !== post.createdAt && (
                                        <Text style={styles.editedText}> • Đã chỉnh sửa</Text>
                                    )}
                                </Text>
                                <View style={styles.privacyIndicator}>
                                    <Feather
                                        name={privacyInfo?.icon as any}
                                        size={12}
                                        color={privacyInfo?.color}
                                    />
                                </View>
                            </View>
                            {post.location && (
                                <View style={styles.locationInfo}>
                                    <Feather name="map-pin" size={12} />
                                    <Text style={styles.locationText}>
                                        {post.location.name}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Post Content */}
                <View>
                    <Text style={styles.postContent}>{post.content}</Text>
                </View>

                {/* Post Media */}
                {renderMediaGrid(post.media)}

                {/* Post Stats */}
                <View style={styles.postStats}>
                    <Text style={styles.statsText}>{post.likes} lượt thích</Text>
                    <Text style={styles.statsText}>{post.comments} bình luận</Text>
                    <Text style={styles.statsText}>{post.shares} chia sẻ</Text>
                </View>

                {/* Post Interactions */}
                <View style={styles.postInteractions}>
                    <TouchableOpacity
                        style={[
                            styles.interactionButton,
                            post.isLiked && styles.likedButton,
                        ]}
                        onPress={() => handleLikePost(post.id)}
                    >
                        <Ionicons
                            name={post.isLiked ? 'heart' : 'heart-outline'}
                            size={20}
                            color={post.isLiked ? '#ef4444' : '#6b7280'}
                        />
                        <Text
                            style={[
                                styles.interactionText,
                                post.isLiked && styles.likedText,
                            ]}
                        >
                            Thích
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.interactionButton}
                        onPress={() => openCommentsModal(post)}
                    >
                        <Feather name="message-circle" size={20} color="#6b7280" />
                        <Text style={styles.interactionText}>Bình luận</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.interactionButton}
                        onPress={() => handleSharePost(post)}
                    >
                        <Feather name="share" size={20} color="#6b7280" />
                        <Text style={styles.interactionText}>Chia sẻ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Render comment
    const renderComment = ({ item: comment }: { item: Comment }) => (
        <View style={styles.commentItem}>
            <Image
                source={{ uri: comment.author.avatar }}
                style={styles.commentAvatar}
            />
            <View style={styles.commentContent}>
                <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor}>{comment.author.name}</Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                </View>
                <Text style={styles.commentDate}>
                    {formatDate(comment.createdAt)}
                </Text>
            </View>
        </View>
    );

    if (!session) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Vui lòng đăng nhập để xem trang cá nhân</Text>
            </View>
        );
    }

    return (
        <ScrollView
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                />
            }
        >
            <TouchableWithoutFeedback onPress={() => setShowFriendDropdown(false)}>
                <View style={styles.container}>
                    {/* Header Section with Cover Photo */}
                    <View style={styles.coverSection}>
                        {/* Cover Photo */}
                        <Image
                            source={{
                                uri: userProfile?.coverPhoto || coverPhotoUri || 'https://picsum.photos/400/200?random=cover'
                            }}
                            style={styles.coverImage}
                        />

                        {/* Cover Photo Loading Overlay */}
                        {coverPhotoLoading && (
                            <View style={styles.coverLoadingOverlay}>
                                <Text style={styles.loadingText}>Đang tải ảnh bìa...</Text>
                            </View>
                        )}

                        {/* Navigation Header Overlay */}
                        <View style={styles.navigationHeader}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Feather name="arrow-left" size={24} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.headerActions}>
                                {isOwnProfile && (
                                    <TouchableOpacity
                                        style={styles.headerActionButton}
                                        onPress={() => {
                                            setImagePickerType('cover');
                                            setShowImagePickerModal(true);
                                        }}
                                    >
                                        <Feather name="camera" size={20} color="#fff" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={styles.headerActionButton}>
                                    <Feather name="more-horizontal" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Profile Avatar positioned over cover */}
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{
                                    uri: userProfile?.avatar ||
                                        (isOwnProfile ? session.user.user_metadata?.avatar_url : null) ||
                                        'https://picsum.photos/100/100?random=user1'
                                }}
                                style={styles.profileAvatar}
                            />
                            {isOwnProfile && (
                                <TouchableOpacity
                                    style={styles.avatarCameraButton}
                                    onPress={() => {
                                        setImagePickerType('avatar');
                                        setShowImagePickerModal(true);
                                    }}
                                >
                                    <Feather name="camera" size={16} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Profile Info Section */}
                    <View style={styles.profileInfoSection}>
                        {/* Name and Actions Row */}
                        {/* Debug: isOwnProfile = {String(isOwnProfile)}, targetUserId = {targetUserId}, sessionUserId = {session?.user?.id} */}
                        {isOwnProfile ? (
                            /* For own profile: Name on top, edit button below */
                            <View style={styles.ownProfileContainer}>
                                <View style={styles.nameContainer}>
                                    <Text style={styles.profileName}>
                                        {userProfile?.fullName ||
                                            session?.user?.user_metadata?.full_name ||
                                            'Người dùng khác'}
                                    </Text>
                                    <Text style={styles.friendsCount}>{friendsCount} người bạn</Text>
                                </View>
                                <View style={styles.editProfileButtonContainer}>
                                    <TouchableOpacity
                                        style={styles.editProfileButton}
                                        onPress={() => (navigation as any).navigate('EditProfile')}
                                    >
                                        <Feather name="edit-2" size={16} color="#000" />
                                        <Text style={styles.editProfileButtonText}>Chỉnh sửa trang cá nhân</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            /* For other profiles: Name and friend actions in row */
                            <View style={styles.nameAndActionsRow}>
                                <View style={styles.nameContainer}>
                                    <Text style={styles.profileName}>
                                        {userProfile?.fullName || 'Đang tải...'}
                                    </Text>
                                    <Text style={styles.friendsCount}>{friendsCount} người bạn</Text>
                                </View>

                                <View style={styles.actionButtonsContainer}>
                                    <View style={styles.friendActionsContainer}>
                                        {friendshipStatus.status === 'accepted' && (
                                            <View style={styles.friendButtonContainer}>
                                                <TouchableOpacity
                                                    style={styles.friendsButton}
                                                    onPress={() => setShowFriendDropdown(!showFriendDropdown)}
                                                >
                                                    <Feather name="user-check" size={16} color="#000" />
                                                    <Text style={styles.friendsButtonText}>Bạn bè</Text>
                                                    <Feather name="chevron-down" size={16} color="#000" />
                                                </TouchableOpacity>
                                                {showFriendDropdown && (
                                                    <View style={styles.dropdownMenu}>
                                                        <TouchableOpacity
                                                            style={styles.dropdownItem}
                                                            onPress={() => handleFriendAction('remove')}
                                                        >
                                                            <Feather name="user-x" size={16} color="#e74c3c" />
                                                            <Text style={styles.dropdownText}>Hủy kết bạn</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        {friendshipStatus.status === 'received_request' && (
                                            <TouchableOpacity
                                                style={styles.acceptFriendButton}
                                                onPress={() => handleFriendAction('accept')}
                                            >
                                                <Feather name="user-plus" size={16} color="#fff" />
                                                <Text style={styles.acceptFriendButtonText}>Xác nhận</Text>
                                            </TouchableOpacity>
                                        )}

                                        {friendshipStatus.status === 'pending' && (
                                            <TouchableOpacity style={styles.pendingButton} disabled>
                                                <Feather name="clock" size={16} color="#6b7280" />
                                                <Text style={styles.pendingButtonText}>Đã gửi lời mời</Text>
                                            </TouchableOpacity>
                                        )}

                                        {friendshipStatus.status === 'none' && (
                                            <TouchableOpacity
                                                style={styles.addFriendButton}
                                                onPress={() => handleFriendAction('add')}
                                            >
                                                <Feather name="user-plus" size={16} color="#fff" />
                                                <Text style={styles.addFriendButtonText}>Thêm bạn bè</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Navigation Tabs */}
                        <View style={styles.tabsContainer}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
                                onPress={() => setActiveTab('posts')}
                            >
                                <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>Bài viết</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'photos' && styles.activeTab]}
                                onPress={() => setActiveTab('photos')}
                            >
                                <Text style={[styles.tabText, activeTab === 'photos' && styles.activeTabText]}>Ảnh</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Content Section */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Đang tải...</Text>
                        </View>
                    ) : activeTab === 'posts' ? (
                        <FlatList
                            key="posts-list" // Add unique key for posts list
                            data={posts}
                            keyExtractor={(item) => item.id}
                            renderItem={renderPost}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={false}
                            style={{ flex: 1 }}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyContainer}>
                                    <Feather name="file-text" size={64} color="#9ca3af" />
                                    <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
                                    <Text style={styles.emptySubText}>
                                        {isOwnProfile ? 'Hãy chia sẻ khoảnh khắc đầu tiên của bạn!' : 'Người dùng này chưa có bài viết nào.'}
                                    </Text>
                                </View>
                            )}
                        />
                    ) : (
                        <FlatList
                            key="photos-grid" // Add unique key for photos grid
                            data={userPhotos}
                            numColumns={3}
                            keyExtractor={(item, index) => `photo-${index}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.photoItem}>
                                    <Image source={{ uri: item }} style={styles.photoImage} />
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            contentContainerStyle={styles.photosGrid}
                            style={{ flex: 1 }}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyContainer}>
                                    <Feather name="image" size={64} color="#9ca3af" />
                                    <Text style={styles.emptyText}>Chưa có ảnh nào</Text>
                                    <Text style={styles.emptySubText}>
                                        {isOwnProfile ? 'Hãy chia sẻ ảnh đầu tiên của bạn!' : 'Người dùng này chưa có ảnh nào.'}
                                    </Text>
                                </View>
                            )}
                        />
                    )}

                    {/* Comments Modal */}
                    <Modal
                        visible={showCommentsModal}
                        animationType="slide"
                        onRequestClose={() => setShowCommentsModal(false)}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.commentsModalTitle}>Bình luận</Text>
                                <TouchableOpacity
                                    onPress={() => setShowCommentsModal(false)}
                                >
                                    <Text style={styles.commentsModalCancelButton}>Đóng</Text>
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={comments}
                                keyExtractor={(item) => item.id}
                                renderItem={renderComment}
                                style={styles.commentsList}
                                showsVerticalScrollIndicator={false}
                            />

                            <View style={styles.commentInputContainer}>
                                <TextInput
                                    style={styles.commentInput}
                                    placeholder="Viết bình luận..."
                                    value={newComment}
                                    onChangeText={setNewComment}
                                    multiline
                                />
                                <TouchableOpacity
                                    style={styles.commentSendButton}
                                    onPress={handleAddComment}
                                >
                                    <Feather name="send" size={20} color="#1877f2" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Image Picker Modal */}
                    <Modal
                        visible={showImagePickerModal}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowImagePickerModal(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>
                                    {imagePickerType === 'avatar' ? 'Chọn ảnh đại diện' : 'Chọn ảnh bìa'}
                                </Text>

                                <TouchableOpacity
                                    style={styles.imagePickerOption}
                                    onPress={() => handleImagePicker('camera')}
                                >
                                    <Feather
                                        name="camera"
                                        size={24}
                                        color="#6366f1"
                                    />
                                    <Text style={styles.imagePickerOptionText}>
                                        Chụp ảnh mới
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.imagePickerOption}
                                    onPress={() => handleImagePicker('gallery')}
                                >
                                    <Feather
                                        name="image"
                                        size={24}
                                        color="#6366f1"
                                    />
                                    <Text style={styles.imagePickerOptionText}>
                                        Chọn từ thư viện
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ paddingVertical: 12, alignItems: 'center' }}
                                    onPress={() => setShowImagePickerModal(false)}
                                >
                                    <Text style={styles.modalCancelButton}>Hủy</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Confirm Action Modal */}
                    <Modal
                        visible={showConfirmModal}
                        animationType="fade"
                        transparent={true}
                        onRequestClose={() => setShowConfirmModal(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.confirmModalContainer}>
                                <Text style={styles.confirmModalTitle}>
                                    {getConfirmModalContent().title}
                                </Text>
                                <Text style={styles.confirmModalMessage}>
                                    {getConfirmModalContent().message}
                                </Text>
                                <View style={styles.confirmModalButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setShowConfirmModal(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>Hủy</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.confirmButton, confirmAction === 'remove' && styles.dangerButton]}
                                        onPress={confirmFriendAction}
                                    >
                                        <Text style={[styles.confirmButtonText, confirmAction === 'remove' && styles.dangerButtonText]}>
                                            {getConfirmModalContent().confirmText}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </View>
            </TouchableWithoutFeedback>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    coverSection: {
        position: 'relative',
        height: 250,
    },
    coverImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    coverLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    navigationHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        // paddingTop: 50,
        zIndex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerActionButton: {
        padding: 8,
        marginLeft: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    avatarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 16,
        alignItems: 'center',
    },
    avatarCameraButton: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: '#4267B2',
        borderRadius: 12,
        padding: 4,
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileInfoSection: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        // paddingTop: 40,
        paddingBottom: 16,
    },
    friendsCount: {
        fontSize: 15,
        color: '#65676b',
        marginBottom: 0,
        // textAlign: 'center',
        width: '100%',
    },
    nameAndActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        // marginBottom: 16,
    },
    nameContainer: {
        // alignItems: 'center',
        marginBottom: 16,
        minHeight: 60,
        // justifyContent: 'center',
    },
    ownProfileContainer: {
        marginBottom: 16,
        width: '100%',
        // alignItems: 'center',
    },
    editProfileButtonContainer: {
        marginTop: 8,
        width: '100%',
        alignItems: 'center',
    },
    actionButtonsContainer: {
        minWidth: 140,
        maxWidth: 180,
    },
    addStoryButton: {
        flex: 1,
        backgroundColor: '#1877f2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    addStoryButtonText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 6,
        fontSize: 15,
    },
    editProfileButton: {
        backgroundColor: '#e4e6ea',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        width: '100%',
    },
    editProfileButtonText: {
        color: '#000',
        fontWeight: '600',
        marginLeft: 6,
        fontSize: 15,
    },
    tabsContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#dadde1',
        paddingTop: 8,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#1877f2',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#65676b',
    },
    activeTabText: {
        color: '#1877f2',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    headerRightSpace: {
        width: 40, // Same width as back button for centering
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 20,
        // paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    profileAvatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#fff',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
        // textAlign: 'center',
        lineHeight: 28,
        minHeight: 28,
        width: '100%',
    },
    profileEmail: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
    },
    postsCount: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 8,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
        marginTop: 100,
    },
    postsList: {
        paddingBottom: 20,
    },
    postCard: {
        backgroundColor: '#fff',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    authorAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    authorDetails: {
        flex: 1,
    },
    authorNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 2,

    },
    authorName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1c1e21',
        marginRight: 4,
    },
    feelingText: {
        fontSize: 15,
        color: '#1c1e21',
    },
    postMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postDate: {
        fontSize: 13,
        color: '#65676b',
        marginRight: 4,
    },
    editedText: {
        fontSize: 11,
        color: '#8a8d91',
        fontStyle: 'italic',
    },
    privacyIndicator: {
        marginLeft: 4,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    locationText: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 4,
    },
    postContent: {
        fontSize: 15,
        color: '#1c1e21',
        lineHeight: 20,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    mediaContainer: {
        marginBottom: 0,
        borderRadius: 0,
        overflow: 'hidden',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
        backgroundColor: '#f0f2f5',
    },
    mediaItem: {
        position: 'relative',
    },
    singleMedia: {
        width: '100%',
        height: 400,
    },
    doubleMedia: {
        width: '49.5%',
        height: 250,
    },
    tripleMediaLarge: {
        width: '66%',
        height: 300,
    },
    tripleMediaSmall: {
        width: '32%',
        height: 148,
        marginBottom: 4,
    },
    quadMedia: {
        width: '49.5%',
        height: 200,
    },
    mediaImage: {
        width: '100%',
        height: '100%',
        borderRadius: 0,
    },
    videoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 0,
    },
    moreMediaOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 0,
    },
    moreMediaText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    postStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderTopWidth: 0.5,
        borderTopColor: '#dadde1',
        borderBottomWidth: 0.5,
        borderBottomColor: '#dadde1',
        marginTop: 8,
    },
    statsText: {
        fontSize: 13,
        color: '#65676b',
    },
    postInteractions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    interactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 6,
        flex: 1,
    },
    likedButton: {
        backgroundColor: 'transparent',
    },
    interactionText: {
        marginLeft: 6,
        fontSize: 13,
        color: '#65676b',
        fontWeight: '600',
    },
    likedText: {
        color: '#1877f2',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    commentsModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    commentsModalCancelButton: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
    },
    commentsList: {
        flex: 1,
        padding: 16,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    commentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 12,
    },
    commentContent: {
        flex: 1,
    },
    commentBubble: {
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        padding: 12,
        marginBottom: 4,
    },
    commentAuthor: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    commentText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 18,
    },
    commentDate: {
        fontSize: 12,
        color: '#64748b',
        marginLeft: 12,
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        backgroundColor: '#fff',
    },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
        fontSize: 14,
    },
    commentSendButton: {
        padding: 8,
    },
    photosGrid: {
        padding: 2,
    },
    photoItem: {
        width: photoSize,
        height: photoSize,
        margin: 1,
    },
    photoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
    },
    // Friend action styles
    friendActionsContainer: {
        flex: 1,
    },
    friendButtonContainer: {
        position: 'relative',
    },
    friendsButton: {
        backgroundColor: '#e4e6ea',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6,
        flex: 1,
    },
    friendsButtonText: {
        color: '#000',
        fontWeight: '600',
        fontSize: 15,
    },
    dropdownMenu: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1000,
        marginTop: 4,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
    },
    dropdownText: {
        fontSize: 14,
        color: '#e74c3c',
        fontWeight: '500',
    },
    acceptFriendButton: {
        backgroundColor: '#1877f2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6,
        // flex: 1,
        width: '70%',
        marginLeft: 5,
    },
    acceptFriendButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    pendingButton: {
        backgroundColor: '#e4e6ea',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6,
        opacity: 0.7,
        flex: 1,
    },
    pendingButtonText: {
        color: '#6b7280',
        fontWeight: '600',
        fontSize: 15,
    },
    addFriendButton: {
        backgroundColor: '#1877f2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        borderRadius: 8,
        gap: 6,
    },
    addFriendButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    confirmModalContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        minWidth: 300,
        maxWidth: '90%',
    },
    confirmModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'center',
    },
    confirmModalMessage: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    confirmModalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#e4e6ea',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#000',
        fontWeight: '600',
        fontSize: 14,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: '#1877f2',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    dangerButton: {
        backgroundColor: '#e74c3c',
    },
    dangerButtonText: {
        color: '#fff',
    },

    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#374151',
    },
    modalCancelButton: {
        marginTop: 20,
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
    },
    imagePickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    imagePickerOptionText: {
        fontSize: 16,
        color: '#374151',
        marginLeft: 16,
    },
});