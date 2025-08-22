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
    View,
    StatusBar
} from 'react-native';

import { PRIVACY_OPTIONS } from '@/src/constants/Post';
import { AuthContext } from '@/src/context/AuthContext';
import { createComment, deleteComment, getCommentsByPostId } from '@/src/services/comment/comment';
import { acceptFriendRequest, AddFriendRequest, getFriendsCount, getFriendshipStatus, getUserPhotos, removeFriend } from '@/src/services/friend/friend';
import { getPostsLikeStatus, toggleLike } from '@/src/services/like/like';
import { deletePost, getPostById, getPostsByUserId, updatePost } from '@/src/services/post/post';
import * as UserService from '@/src/services/user/UserInfo';
import { GetUserProfile, GetUserProfileById, UpdateUserAvatar, UpdateUserCoverPhoto, UpdateUserProfile } from '@/src/services/user/UserInfo';
import { UpdateUserInfo, UserInfo } from '@/src/types/auth';
import { Comment, MediaItem, Post, UpdatePostData } from '@/src/types/post';
import { FriendsStackParamList, ProfileStackParamList } from '@/src/types/route';
import * as ImagePicker from 'expo-image-picker';

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
    const navigation = useNavigation<any>();
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
    
    // States cho ImageViewer
    const [showImageViewer, setShowImageViewer] = useState<boolean>(false);
    const [viewingImages, setViewingImages] = useState<MediaItem[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

    // States for editing posts
    const [showEditPostModal, setShowEditPostModal] = useState<boolean>(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [editPostContent, setEditPostContent] = useState<string>('');
    const [editPostPrivacy, setEditPostPrivacy] = useState<'public' | 'friends' | 'private'>('public');

    // States for like/comment functionality
    const [isLiking, setIsLiking] = useState<Set<string>>(new Set());

    // Get the userId from route params, or use current user's ID
    const targetUserId = route.params?.userId || session?.user?.id;
    const isOwnProfile = targetUserId === session?.user?.id;
    const [showImagePickerModal, setShowImagePickerModal] =
        useState<boolean>(false);
    // Fetch user profile and posts
    const fetchUserProfile = async (session: Session) => {
        try {

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

    // Functions cho ImageViewer
    const openImageViewer = useCallback((images: MediaItem[], startIndex: number = 0) => {
        setViewingImages(images);
        setCurrentImageIndex(startIndex);
        setShowImageViewer(true);
    }, []);

    const closeImageViewer = useCallback(() => {
        setShowImageViewer(false);
        setViewingImages([]);
        setCurrentImageIndex(0);
    }, []);

    const goToNextImage = useCallback(() => {
        if (currentImageIndex < viewingImages.length - 1) {
            setCurrentImageIndex(currentImageIndex + 1);
        }
    }, [currentImageIndex, viewingImages.length]);

    const goToPreviousImage = useCallback(() => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex(currentImageIndex - 1);
        }
    }, [currentImageIndex]);
    const handleEditPost = (post: Post) => {
        setEditingPost(post);
        setEditPostContent(post.content);
        setEditPostPrivacy(post.privacy);
        setShowEditPostModal(true);
    };

    const handleSaveEditPost = async () => {
        if (!editingPost || !session) {
            Alert.alert('Lỗi', 'Thông tin không hợp lệ');
            return;
        }

        if (!editPostContent.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập nội dung bài viết');
            return;
        }

        try {
            const updateData: UpdatePostData = {
                content: editPostContent,
                privacy: editPostPrivacy,
                media: editingPost.media, // Keep existing media for now
            };

            const response = await updatePost(editingPost.id, updateData, session);

            if (response.success && response.data) {
                // Update local posts state
                const updatedPosts = posts.map((post) =>
                    post.id === editingPost.id ? response.data! : post
                );
                setPosts(updatedPosts);

                setShowEditPostModal(false);
                setEditingPost(null);
                setEditPostContent('');
                setEditPostPrivacy('public');

                Alert.alert('Thành công', 'Đã cập nhật bài viết');
            } else {
                Alert.alert('Lỗi', response.error || 'Không thể cập nhật bài viết');
            }
        } catch (error) {
            console.error('Error updating post:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật bài viết. Vui lòng thử lại sau.');
        }
    };

    const handleDeletePost = async (postId: string) => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa bài viết này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        if (!session) {
                            Alert.alert('Lỗi', 'Bạn cần đăng nhập để xóa bài viết');
                            return;
                        }

                        try {
                            const response = await deletePost(postId, session);

                            if (response.success) {
                                // Remove the post from local state
                                setPosts(posts.filter((post) => post.id !== postId));
                                Alert.alert('Thành công', 'Đã xóa bài viết');
                            } else {
                                Alert.alert('Lỗi', response.error || 'Không thể xóa bài viết');
                            }
                        } catch (error) {
                            console.error('Error deleting post:', error);
                            Alert.alert('Lỗi', 'Không thể xóa bài viết. Vui lòng thử lại sau.');
                        }
                    },
                },
            ]
        );
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

                // Debug media for each post
                response.data.forEach((post, index) => {
                    console.log(`Post ${index + 1} (ID: ${post.id}) media:`, post.media);
                    if (post.media && post.media.length > 0) {
                        post.media.forEach((mediaItem, mediaIndex) => {
                            console.log(`  Media ${mediaIndex + 1}:`, {
                                id: mediaItem.id,
                                type: mediaItem.type,
                                uri: mediaItem.uri
                            });
                        });
                    }
                });

                // Get like status for all posts if user is logged in
                if (session?.user?.id) {
                    const posts = response.data;
                    const postIds = posts.map(post => post.id);
                    const likeStatusResponse = await getPostsLikeStatus(postIds, session.user.id);

                    if (likeStatusResponse.success && likeStatusResponse.data) {
                        const likeStatus = likeStatusResponse.data;

                        // Update isLiked based on database
                        const postsWithLikeStatus = posts.map(post => ({
                            ...post,
                            isLiked: likeStatus[post.id] || false
                        }));

                        setPosts(postsWithLikeStatus);
                    } else {
                        // Fallback nếu không lấy được like status
                        setPosts(posts);
                        console.log('Loaded posts without like status');
                    }
                } else {
                    setPosts(response.data);
                }
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

    const handleNavigateToProfile = (userId: string) => {
        navigation.navigate('Personal', { userId });
    };

    const handleNavigateToProfileFromComment = (userId: string) => {
        setShowCommentsModal(false);
        setTimeout(() => {
            navigation.navigate('Personal', { userId });
        }, 100);
    };

    // Render media grid for posts
    const renderMediaGrid = (media: MediaItem[]) => {
        console.log('renderMediaGrid called with media:', media);

        if (!media || media.length === 0) {
            console.log('No media found or media is empty');
            return null;
        }

        const screenWidth = Dimensions.get('window').width; // Full screen width
        const containerHeight = 300; // Increased height

        const renderMediaItem = (item: MediaItem, index: number) => {
            const isVideo = item.type === 'video';

            // Calculate dimensions based on media count
            let itemStyle = {};

            if (media.length === 1) {
                itemStyle = {
                    width: screenWidth,
                    height: containerHeight,
                    marginRight: 0,
                    marginBottom: 0,
                };
            } else if (media.length === 2) {
                itemStyle = {
                    width: (screenWidth - 2) / 2,
                    height: containerHeight,
                    marginRight: index === 0 ? 2 : 0,
                    marginBottom: 0,
                };
            } else if (media.length === 3) {
                if (index === 0) {
                    itemStyle = {
                        width: screenWidth,
                        height: containerHeight * 0.6,
                        marginRight: 0,
                        marginBottom: 2,
                    };
                } else {
                    itemStyle = {
                        width: (screenWidth - 2) / 2,
                        height: containerHeight * 0.4 - 2,
                        marginRight: index === 1 ? 2 : 0,
                        marginBottom: 0,
                    };
                }
            } else {
                // 4 or more images - 2x2 grid
                const itemWidth = (screenWidth - 2) / 2;
                const itemHeight = (containerHeight - 2) / 2;
                
                if (index === 0) {
                    itemStyle = {
                        width: itemWidth,
                        height: itemHeight,
                        marginRight: 2,
                        marginBottom: 2,
                    };
                } else if (index === 1) {
                    itemStyle = {
                        width: itemWidth,
                        height: itemHeight,
                        marginRight: 0,
                        marginBottom: 2,
                    };
                } else if (index === 2) {
                    itemStyle = {
                        width: itemWidth,
                        height: itemHeight,
                        marginRight: 2,
                        marginBottom: 0,
                    };
                } else {
                    itemStyle = {
                        width: itemWidth,
                        height: itemHeight,
                        marginRight: 0,
                        marginBottom: 0,
                    };
                }
            }

            return (
                <TouchableOpacity 
                    key={item.id} 
                    style={[styles.mediaItem, itemStyle]}
                    onPress={() => openImageViewer(media, index)}
                >
                    <Image
                        source={{
                            uri: item.uri || 'https://via.placeholder.com/300x200?text=Image+Not+Found'
                        }}
                        style={styles.mediaImage}
                        resizeMode="cover"
                        onLoad={() => console.log('Image loaded successfully:', item.uri)}
                        onError={(error) => console.log('Image load error:', error.nativeEvent.error, 'for URI:', item.uri)}
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
                </TouchableOpacity>
            );
        };

        return (
            <View style={[styles.mediaContainer, { 
                height: media.length === 1 ? containerHeight : 
                       media.length === 2 ? containerHeight : 
                       media.length === 3 ? containerHeight : containerHeight,
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'flex-start'
            }]}>
                {media.slice(0, 4).map((item, index) => renderMediaItem(item, index))}
            </View>
        );
    };

    // Handle post interactions
    const handleLikePost = async (postId: string) => {
        if (!session) {
            Alert.alert('Lỗi', 'Bạn cần đăng nhập để thích bài viết');
            return;
        }

        // Prevent multiple simultaneous likes
        if (isLiking.has(postId)) {
            return;
        }
        // Mark as processing
        setIsLiking(prev => new Set(prev).add(postId));
        try {
            // Gọi API toggle like
            const userName = session.user.user_metadata.full_name || 'Unknown User';
            
            const result = await toggleLike({
                userId: session.user.id,
                postId: postId,
                userName: userName
            });

            console.log('Toggle like result:', result);

            if (result.success && result.data) {
                // Cập nhật với data chính xác từ server
                setPosts(currentPosts =>
                    currentPosts.map((post) =>
                        post.id === postId
                            ? {
                                ...post,
                                isLiked: result.data!.isLiked,
                                likes: result.data!.newLikeCount,
                            }
                            : post
                    )
                );
                // console.log('Posts updated successfully');
            } else {
                console.error('Toggle like failed:', result.error);
                Alert.alert('Lỗi', result.error || 'Không thể thực hiện like');
            }
        } catch (error) {
            console.error('Error liking post:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi thích bài viết');
        } finally {
            // Remove from processing set
            // console.log('Removing like processing for post:', postId);
            setIsLiking(prev => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                // console.log('New isLiking set size:', newSet.size);
                return newSet;
            });
        }
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
        try {
            setLoading(true);
            const response = await getCommentsByPostId(postId);

            if (response.success && response.data) {
                setComments(response.data);
                console.log('Loaded comments:', response.data.length);
            } else {
                console.error('Error loading comments:', response.error);
                setComments([]);
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !selectedPost || !session) {
            if (!session) {
                Alert.alert('Lỗi', 'Bạn cần đăng nhập để bình luận');
            }
            return;
        }

        try {
            // Tạo comment trong database
            const commentData = {
                postId: selectedPost.id,
                content: newComment.trim(),
                authorId: session.user.id,
            };

            const response = await createComment(commentData);

            if (response.success && response.data) {
                // Thêm comment mới vào danh sách local
                setComments(currentComments => [...currentComments, response.data!]);
                setNewComment('');

                // Refresh post data to get updated comment count from database
                if (selectedPost) {
                    try {
                        const postResponse = await getPostById(selectedPost.id);
                        if (postResponse.success && postResponse.data) {
                            const updatedPost = postResponse.data;
                            
                            // Update posts list with fresh data from database
                            setPosts(currentPosts =>
                                currentPosts.map((post) =>
                                    post.id === selectedPost.id ? updatedPost : post
                                )
                            );

                            // Update selectedPost as well
                            setSelectedPost(updatedPost);
                        }
                    } catch (refreshError) {
                        // console.error('Error refreshing post data:', refreshError);
                        // Fallback to manual increment if refresh fails
                        setPosts(currentPosts =>
                            currentPosts.map((post) =>
                                post.id === selectedPost.id
                                    ? { ...post, comments: post.comments + 1 }
                                    : post
                            )
                        );
                    }
                }
            } else {
                Alert.alert('Lỗi', response.error || 'Không thể tạo bình luận');
            }
        } catch (error) {
            console.error('Error creating comment:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tạo bình luận');
        }
    };

    const handleDeleteComment = async (commentId: string, comment: Comment) => {
        if (!session) {
            Alert.alert('Lỗi', 'Bạn cần đăng nhập để xóa bình luận');
            return;
        }

        // Kiểm tra quyền xóa comment (chỉ chủ comment hoặc chủ post mới được xóa)
        const canDelete = comment.author.id === session.user.id ||
            (selectedPost && selectedPost.author.id === session.user.id);

        if (!canDelete) {
            Alert.alert('Lỗi', 'Bạn không có quyền xóa bình luận này');
            return;
        }

        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa bình luận này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await deleteComment(commentId, comment.author.id);

                            if (response.success) {
                                // Remove comment from local state
                                setComments(currentComments =>
                                    currentComments.filter(c => c.id !== commentId)
                                );

                                // Refresh post data to get updated comment count from database
                                if (selectedPost) {
                                    try {
                                        const postResponse = await getPostById(selectedPost.id);
                                        if (postResponse.success && postResponse.data) {
                                            const updatedPost = postResponse.data;

                                            // Update posts list with fresh data from database
                                            setPosts(currentPosts =>
                                                currentPosts.map((post) =>
                                                    post.id === selectedPost.id ? updatedPost : post
                                                )
                                            );

                                            // Update selectedPost as well
                                            setSelectedPost(updatedPost);
                                        }
                                    } catch (refreshError) {
                                        // console.error('Error refreshing post data:', refreshError);
                                        // Fallback to manual decrement if refresh fails
                                        setPosts(currentPosts =>
                                            currentPosts.map((post) =>
                                                post.id === selectedPost.id
                                                    ? { ...post, comments: Math.max(post.comments - 1, 0) }
                                                    : post
                                            )
                                        );
                                    }
                                }

                                Alert.alert('Thành công', 'Đã xóa bình luận');
                            } else {
                                Alert.alert('Lỗi', response.error || 'Không thể xóa bình luận');
                            }
                        } catch (error) {
                            console.error('Error deleting comment:', error);
                            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xóa bình luận');
                        }
                    },
                },
            ]
        );
    };

    // Helper function to refresh post data
    const refreshPostData = async (postId: string) => {
        try {
            const response = await getPostsByUserId(targetUserId || '');
            if (response.success && response.data) {
                setPosts(response.data);
                return response.data.find(p => p.id === postId);
            }
        } catch (error) {
            console.error('Error refreshing post data:', error);
        }
        return null;
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
                        <TouchableOpacity onPress={() => handleNavigateToProfile(post.author.id)}>
                            <Image
                                source={{ uri: post.author.avatar }}
                                style={styles.authorAvatar}
                            />
                        </TouchableOpacity>
                        <View style={styles.authorDetails}>
                            <View style={styles.authorNameContainer}>
                                <TouchableOpacity onPress={() => handleNavigateToProfile(post.author.id)}>
                                    <Text style={styles.authorName}>
                                        {post.author.name}
                                    </Text>
                                </TouchableOpacity>
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
                    {/* Add Edit and Delete buttons for own posts */}
                    {isOwnProfile && session?.user?.id === post.author.id && (
                        <View style={styles.postActions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleEditPost(post)}
                            >
                                <Feather name="edit-2" size={16} color="#6b7280" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleDeletePost(post.id)}
                            >
                                <Feather name="trash-2" size={16} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}
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
    const renderComment = ({ item: comment }: { item: Comment }) => {
        // Check if current user can delete this comment
        const canDelete = session && (
            comment.author.id === session.user.id ||
            (selectedPost && selectedPost.author.id === session.user.id)
        );

        return (
            <View style={styles.commentItem}>
                <TouchableOpacity onPress={() => handleNavigateToProfileFromComment(comment.author.id)}>
                    <Image
                        source={{ uri: comment.author.avatar }}
                        style={styles.commentAvatar}
                    />
                </TouchableOpacity>
                <View style={styles.commentContent}>
                    <View style={styles.commentBubble}>
                        <TouchableOpacity onPress={() => handleNavigateToProfileFromComment(comment.author.id)}>
                            <Text style={styles.commentAuthor}>{comment.author.name}</Text>
                        </TouchableOpacity>
                        <Text style={styles.commentText}>{comment.content}</Text>
                    </View>
                    <View style={styles.commentFooter}>
                        <Text style={styles.commentDate}>
                            {formatDate(comment.createdAt)}
                        </Text>
                        {canDelete && (
                            <TouchableOpacity
                                style={styles.deleteCommentButton}
                                onPress={() => handleDeleteComment(comment.id, comment)}
                            >
                                <Feather name="trash-2" size={12} color="#ef4444" />
                                <Text style={styles.deleteCommentText}>Xóa</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

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

                    {/* Edit Post Modal */}
                    <Modal
                        visible={showEditPostModal}
                        animationType="slide"
                        presentationStyle="pageSheet"
                        onRequestClose={() => setShowEditPostModal(false)}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowEditPostModal(false);
                                        setEditingPost(null);
                                        setEditPostContent('');
                                        setEditPostPrivacy('public');
                                    }}
                                >
                                    <Text style={styles.commentsModalCancelButton}>Hủy</Text>
                                </TouchableOpacity>
                                <Text style={styles.commentsModalTitle}>Chỉnh sửa bài viết</Text>
                                <TouchableOpacity onPress={handleSaveEditPost}>
                                    <Text style={styles.editModalSaveButton}>Lưu</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.editModalContent}>
                                {/* Content Input */}
                                <TextInput
                                    style={styles.editContentInput}
                                    placeholder="Bạn đang nghĩ gì?"
                                    placeholderTextColor="#6b7280"
                                    multiline
                                    value={editPostContent}
                                    onChangeText={setEditPostContent}
                                />

                                {/* Privacy Section */}
                                <View style={styles.editPrivacySection}>
                                    <Text style={styles.editPrivacyLabel}>Quyền riêng tư:</Text>
                                    <View style={styles.editPrivacyOptions}>
                                        {PRIVACY_OPTIONS.map((option) => (
                                            <TouchableOpacity
                                                key={option.value}
                                                style={[
                                                    styles.editPrivacyOption,
                                                    editPostPrivacy === option.value &&
                                                    styles.editPrivacyOptionSelected,
                                                ]}
                                                onPress={() => setEditPostPrivacy(option.value as any)}
                                            >
                                                <Feather
                                                    name={option.icon as any}
                                                    size={16}
                                                    color={option.color}
                                                />
                                                <Text style={styles.editPrivacyOptionText}>
                                                    {option.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </ScrollView>
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

            {/* ImageViewer Modal */}
            <Modal
                visible={showImageViewer}
                transparent={true}
                animationType="fade"
                onRequestClose={closeImageViewer}
            >
                <StatusBar hidden />
                <View style={styles.imageViewerContainer}>
                    <TouchableOpacity 
                        style={styles.imageViewerCloseButton}
                        onPress={closeImageViewer}
                    >
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>

                    <View style={styles.imageViewerContent}>
                        <Image
                            source={{ uri: viewingImages[currentImageIndex]?.uri }}
                            style={styles.imageViewerImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Navigation buttons */}
                    {viewingImages.length > 1 && (
                        <>
                            {currentImageIndex > 0 && (
                                <TouchableOpacity 
                                    style={[styles.imageViewerNavButton, styles.imageViewerNavLeft]}
                                    onPress={goToPreviousImage}
                                >
                                    <Ionicons name="chevron-back" size={30} color="white" />
                                </TouchableOpacity>
                            )}

                            {currentImageIndex < viewingImages.length - 1 && (
                                <TouchableOpacity 
                                    style={[styles.imageViewerNavButton, styles.imageViewerNavRight]}
                                    onPress={goToNextImage}
                                >
                                    <Ionicons name="chevron-forward" size={30} color="white" />
                                </TouchableOpacity>
                            )}
                        </>
                    )}

                    {/* Image counter */}
                    {viewingImages.length > 1 && (
                        <View style={styles.imageViewerCounter}>
                            <Text style={styles.imageViewerCounterText}>
                                {currentImageIndex + 1} / {viewingImages.length}
                            </Text>
                        </View>
                    )}
                </View>
            </Modal>
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
        marginHorizontal: -16, // Negative margin to offset parent padding
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
    // ImageViewer styles
    imageViewerContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageViewerCloseButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 8,
    },
    imageViewerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    imageViewerImage: {
        width: '100%',
        height: '100%',
    },
    imageViewerNavButton: {
        position: 'absolute',
        top: '50%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 25,
        padding: 10,
        marginTop: -25,
    },
    imageViewerNavLeft: {
        left: 20,
    },
    imageViewerNavRight: {
        right: 20,
    },
    imageViewerCounter: {
        position: 'absolute',
        bottom: 50,
        left: '50%',
        transform: [{ translateX: -50 }],
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    imageViewerCounterText: {
        color: 'white',
        fontSize: 16,
    },
    // Post action styles
    postActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        marginLeft: 4,
        borderRadius: 4,
    },

    // Edit Post Modal styles
    editModalSaveButton: {
        fontSize: 16,
        color: '#1877f2',
        fontWeight: '600',
    },
    editModalContent: {
        flex: 1,
        padding: 16,
    },
    editContentInput: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    editPrivacySection: {
        marginBottom: 20,
    },
    editPrivacyLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
    },
    editPrivacyOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    editPrivacyOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: '#f8fafc',
    },
    editPrivacyOptionSelected: {
        backgroundColor: '#1877f2',
        borderColor: '#1877f2',
    },
    editPrivacyOptionText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '500',
    },

    // Comment styles
    commentFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    deleteCommentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        borderRadius: 4,
    },
    deleteCommentText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#ef4444',
        fontWeight: '500',
    },
});