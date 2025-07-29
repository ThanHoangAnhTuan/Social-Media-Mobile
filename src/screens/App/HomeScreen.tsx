import {
    Feather,
    MaterialIcons,
    Ionicons,
    FontAwesome5,
} from '@expo/vector-icons';
import React, { JSX, useContext, useState, useEffect } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    TextInput,
    Modal,
    Alert,
    FlatList,
    Share,
    Dimensions,
    Platform,
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import { AuthContext } from '@context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
    Comment,
    FeelingActivity,
    LocationData,
    MediaItem,
    Post,
} from '@/src/types/post';
import {
    ACTIVITIES,
    BACKGROUND_COLORS,
    FEELINGS,
    PRIVACY_OPTIONS,
} from '@/src/constants/Post';
import { createPost } from '@/src/services/post/post';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen(): JSX.Element {
    const { session } = useContext(AuthContext);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [showCommentsModal, setShowCommentsModal] = useState<boolean>(false);
    const [showMediaPicker, setShowMediaPicker] = useState<boolean>(false);
    const [showLocationPicker, setShowLocationPicker] =
        useState<boolean>(false);
    const [showFeelingPicker, setShowFeelingPicker] = useState<boolean>(false);
    const [showBackgroundPicker, setShowBackgroundPicker] =
        useState<boolean>(false);

    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState<string>('');

    const [postContent, setPostContent] = useState<string>('');
    const [postPrivacy, setPostPrivacy] = useState<
        'public' | 'friends' | 'private'
    >('public');
    const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
    const [selectedLocation, setSelectedLocation] =
        useState<LocationData | null>(null);
    const [selectedFeelingActivity, setSelectedFeelingActivity] =
        useState<FeelingActivity | null>(null);
    const [selectedBackground, setSelectedBackground] =
        useState<string>('transparent');

    const mockPosts: Post[] = [
        {
            id: '1',
            content: 'Hôm nay thật là một ngày tuyệt vời! 🌞',
            media: [
                {
                    id: '1',
                    type: 'image',
                    uri: 'https://picsum.photos/400/300?random=1',
                },
                {
                    id: '2',
                    type: 'image',
                    uri: 'https://picsum.photos/400/300?random=2',
                },
                {
                    id: '3',
                    type: 'video',
                    uri: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    thumbnail: 'https://picsum.photos/400/300?random=3',
                },
                {
                    id: '4',
                    type: 'image',
                    uri: 'https://picsum.photos/400/300?random=4',
                },
                {
                    id: '5',
                    type: 'video',
                    uri: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    thumbnail: 'https://picsum.photos/400/300?random=5',
                },
                {
                    id: '6',
                    type: 'image',
                    uri: 'https://picsum.photos/400/300?random=6',
                },
            ],
            location: {
                name: 'Quận 1, TP.HCM',
                address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
                coordinates: { latitude: 10.762622, longitude: 106.660172 },
            },
            feelingActivity: { type: 'feeling', emoji: '😄', text: 'vui vẻ' },
            privacy: 'public',
            likes: 24,
            comments: 8,
            shares: 3,
            isLiked: true,
            createdAt: new Date('2024-01-20'),
            author: {
                id: 'user1',
                name: 'Nguyễn Văn A',
                avatar: 'https://picsum.photos/100/100?random=user1',
            },
        },
        {
            id: '2',
            content: 'Cuối tuần rồi! 🎉',
            media: [],
            feelingActivity: {
                type: 'activity',
                emoji: '🎵',
                text: 'đang nghe nhạc',
            },
            privacy: 'friends',
            likes: 15,
            comments: 12,
            shares: 7,
            isLiked: false,
            createdAt: new Date('2024-01-19'),
            author: {
                id: 'user1',
                name: 'Nguyễn Văn A',
                avatar: 'https://picsum.photos/100/100?random=user1',
            },
        },
    ];

    useEffect(() => {
        loadPosts();
        requestPermissions();
    }, []);

    const requestPermissions = async () => {
        const { status: mediaStatus } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        const { status: cameraStatus } =
            await ImagePicker.requestCameraPermissionsAsync();
        const { status: locationStatus } =
            await Location.requestForegroundPermissionsAsync();

        if (mediaStatus !== 'granted' || cameraStatus !== 'granted') {
            Alert.alert(
                'Cần quyền truy cập',
                'Ứng dụng cần quyền truy cập camera và thư viện ảnh để hoạt động.'
            );
        }
    };

    const loadPosts = async () => {
        setLoading(true);
        try {
            setTimeout(() => {
                setPosts(mockPosts);
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error loading posts:', error);
            setLoading(false);
        }
    };

    const resetForm = () => {
        setPostContent('');
        setPostPrivacy('public');
        setSelectedMedia([]);
        setSelectedLocation(null);
        setSelectedFeelingActivity(null);
        setSelectedBackground('transparent');
    };

    const handleCreatePost = async () => {
        if (!postContent.trim() && selectedMedia.length === 0) {
            Alert.alert('Lỗi', 'Vui lòng nhập nội dung hoặc chọn ảnh/video');
            return;
        }

        const newPost: Post = {
            id: Date.now().toString(),
            content: postContent,
            media: selectedMedia,
            location: selectedLocation || undefined,
            feelingActivity: selectedFeelingActivity || undefined,
            privacy: postPrivacy,
            likes: 0,
            comments: 0,
            shares: 0,
            isLiked: false,
            createdAt: new Date(),
            author: {
                id: '6b890279-bcbd-4c5e-adc3-6a92e8ec90bb',
                name: 'Nguyễn Văn A',
                avatar: 'https://picsum.photos/100/100?random=user1',
            },
        };

        setPosts([newPost, ...posts]);
        try {
            const response = await createPost(newPost);
            if (response.success) {
                if (response.data) {
					console.log("createPost response:", response.data);
                    setPosts([response.data, ...posts]);
                }
            } else {
                Alert.alert('Lỗi', response.error);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tạo bài viết. Vui lòng thử lại sau.');
        }
        resetForm();
        setShowCreateModal(false);
        Alert.alert('Thành công', 'Đã tạo bài viết mới');
    };

    const handleEditPost = async () => {
        if (
            !selectedPost ||
            (!postContent.trim() && selectedMedia.length === 0)
        )
            return;

        const updatedPosts = posts.map((post) =>
            post.id === selectedPost.id
                ? {
                      ...post,
                      content: postContent,
                      privacy: postPrivacy,
                      media: selectedMedia,
                      location: selectedLocation || undefined,
                      feelingActivity: selectedFeelingActivity || undefined,
                      backgroundColor:
                          selectedBackground !== 'transparent'
                              ? selectedBackground
                              : undefined,
                      textColor:
                          selectedBackground !== 'transparent'
                              ? '#ffffff'
                              : undefined,
                  }
                : post
        );

        setPosts(updatedPosts);
        setShowEditModal(false);
        setSelectedPost(null);
        resetForm();
        Alert.alert('Thành công', 'Đã cập nhật bài viết');
    };

    const handlePickMedia = async (type: 'camera' | 'library') => {
        setShowMediaPicker(false);

        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            quality: 0.8,
        };

        let result;
        if (type === 'camera') {
            result = await ImagePicker.launchCameraAsync(options);
        } else {
            result = await ImagePicker.launchImageLibraryAsync(options);
        }

        if (!result.canceled && result.assets) {
            const newMedia: MediaItem[] = result.assets.map(
                (asset: any, index: any) => ({
                    id: `${Date.now()}_${index}`,
                    type: asset.type === 'video' ? 'video' : 'image',
                    uri: asset.uri,
                    thumbnail: asset.type === 'video' ? asset.uri : undefined,
                })
            );

            setSelectedMedia([...selectedMedia, ...newMedia]);
        }
    };

    const handleGetLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({});
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                setSelectedLocation({
                    name: `${addr.district}, ${addr.city}`,
                    address: `${addr.street}, ${addr.district}, ${addr.city}`,
                    coordinates: {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    },
                });
            }
            setShowLocationPicker(false);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại');
        }
    };

    const removeMediaItem = (id: string) => {
        setSelectedMedia(selectedMedia.filter((item) => item.id !== id));
    };

    const openEditModal = (post: Post) => {
        setSelectedPost(post);
        setPostContent(post.content);
        setPostPrivacy(post.privacy);
        setSelectedMedia(post.media);
        setSelectedLocation(post.location || null);
        setSelectedFeelingActivity(post.feelingActivity || null);
        setShowEditModal(true);
    };

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
                <View
                    key={item.id}
                    style={[styles.mediaItem, itemStyle]}
                >
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
                {media
                    .slice(0, 4)
                    .map((item, index) => renderMediaItem(item, index))}
            </View>
        );
    };

    const renderCreateFormMedia = () => {
        if (selectedMedia.length === 0) return null;

        return (
            <ScrollView
                horizontal
                style={styles.selectedMediaContainer}
                showsHorizontalScrollIndicator={false}
            >
                {selectedMedia.map((item) => (
                    <View key={item.id} style={styles.selectedMediaItem}>
                        <Image
                            source={{ uri: item.uri }}
                            style={styles.selectedMediaImage}
                        />
                        <TouchableOpacity
                            style={styles.removeMediaButton}
                            onPress={() => removeMediaItem(item.id)}
                        >
                            <Feather name="x" size={16} color="#fff" />
                        </TouchableOpacity>
                        {item.type === 'video' && (
                            <View style={styles.videoIndicator}>
                                <Ionicons
                                    name="videocam"
                                    size={16}
                                    color="#fff"
                                />
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        );
    };

    const renderPost = ({ item: post }: { item: Post }) => {
        const privacyInfo = PRIVACY_OPTIONS.find(
            (opt) => opt.value === post.privacy
        );

        return (
            <View style={[styles.postCard]}>
                {/* Post Header */}
                <View style={[styles.postHeader, { borderRadius: 12 }]}>
                    <View style={styles.authorInfo}>
                        <Image
                            source={{ uri: post.author.avatar }}
                            style={styles.authorAvatar}
                        />
                        <View style={styles.authorDetails}>
                            <View style={styles.authorNameContainer}>
                                <Text style={[styles.authorName]}>
                                    {post.author.name}
                                </Text>
                                {post.feelingActivity && (
                                    <Text style={[styles.feelingText]}>
                                        {post.feelingActivity.type === 'feeling'
                                            ? 'đang cảm thấy'
                                            : ''}{' '}
                                        {post.feelingActivity.emoji}{' '}
                                        {post.feelingActivity.text}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.postMeta}>
                                <Text style={[styles.postDate]}>
                                    {formatDate(post.createdAt)}
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
                                    <Text style={[styles.locationText]}>
                                        {post.location.name}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.postActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => openEditModal(post)}
                        >
                            <Feather name="edit-2" size={16} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDeletePost(post.id)}
                        >
                            <Feather name="trash-2" size={16} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Post Content with Background */}
                <View>
                    <Text style={[styles.postContent]}>{post.content}</Text>
                </View>

                {/* Post Media */}
                {renderMediaGrid(post.media)}

                {/* Post Stats */}
                <View style={styles.postStats}>
                    <Text style={styles.statsText}>
                        {post.likes} lượt thích
                    </Text>
                    <Text style={styles.statsText}>
                        {post.comments} bình luận
                    </Text>
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
                        <Feather
                            name="message-circle"
                            size={20}
                            color="#6b7280"
                        />
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

    const handleDeletePost = (postId: string) => {
        Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa bài viết này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: () => {
                    setPosts(posts.filter((post) => post.id !== postId));
                    Alert.alert('Thành công', 'Đã xóa bài viết');
                },
            },
        ]);
    };

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
                id: 'user1',
                name: 'Nguyễn Văn A',
                avatar: 'https://picsum.photos/100/100?random=user1',
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

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderComment = ({ item: comment }: { item: Comment }) => (
        <View style={styles.commentItem}>
            <Image
                source={{ uri: comment.author.avatar }}
                style={styles.commentAvatar}
            />
            <View style={styles.commentContent}>
                <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor}>
                        {comment.author.name}
                    </Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                </View>
                <Text style={styles.commentDate}>
                    {formatDate(comment.createdAt)}
                </Text>
            </View>
        </View>
    );

    const CreatePostForm = () => (
        <ScrollView style={styles.modalContent}>
            {/* Post Input */}
            <TextInput
                style={[
                    styles.contentInput,
                    selectedBackground !== 'transparent' && {
                        backgroundColor: selectedBackground,
                        color: '#ffffff',
                        borderColor: 'transparent',
                    },
                ]}
                placeholder="Bạn đang nghĩ gì?"
                placeholderTextColor={
                    selectedBackground !== 'transparent'
                        ? 'rgba(255,255,255,0.7)'
                        : '#6b7280'
                }
                multiline
                value={postContent}
                onChangeText={setPostContent}
            />

            {/* Selected Media */}
            {renderCreateFormMedia()}

            {/* Selected Location */}
            {selectedLocation && (
                <View style={styles.selectedItem}>
                    <Feather name="map-pin" size={16} color="#6366f1" />
                    <Text style={styles.selectedItemText}>
                        {selectedLocation.name}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedLocation(null)}>
                        <Feather name="x" size={16} color="#6b7280" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Selected Feeling/Activity */}
            {selectedFeelingActivity && (
                <View style={styles.selectedItem}>
                    <Text style={styles.selectedItemEmoji}>
                        {selectedFeelingActivity.emoji}
                    </Text>
                    <Text style={styles.selectedItemText}>
                        {selectedFeelingActivity.type === 'feeling'
                            ? 'Đang cảm thấy'
                            : ''}{' '}
                        {selectedFeelingActivity.text}
                    </Text>
                    <TouchableOpacity
                        onPress={() => setSelectedFeelingActivity(null)}
                    >
                        <Feather name="x" size={16} color="#6b7280" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Post Options */}
            <View style={styles.postOptions}>
                <Text style={styles.postOptionsTitle}>Thêm vào bài viết</Text>

                <View style={styles.optionButtons}>
                    <TouchableOpacity
                        style={styles.optionButton}
                        onPress={() => setShowMediaPicker(true)}
                    >
                        <Ionicons name="image" size={24} color="#45b7d1" />
                        <Text style={styles.optionButtonText}>Ảnh/Video</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.optionButton}
                        onPress={() => setShowLocationPicker(true)}
                    >
                        <Feather name="map-pin" size={24} color="#f39c12" />
                        <Text style={styles.optionButtonText}>Vị trí</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.optionButton}
                        onPress={() => setShowFeelingPicker(true)}
                    >
                        <Feather name="smile" size={24} color="#e74c3c" />
                        <Text style={styles.optionButtonText}>Cảm xúc</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.optionButton}
                        onPress={() => setShowBackgroundPicker(true)}
                    >
                        <Ionicons
                            name="color-palette"
                            size={24}
                            color="#9b59b6"
                        />
                        <Text style={styles.optionButtonText}>Nền</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Privacy Section */}
            <View style={styles.privacySection}>
                <Text style={styles.privacyLabel}>Quyền riêng tư:</Text>
                <View style={styles.privacyOptions}>
                    {PRIVACY_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.privacyOption,
                                postPrivacy === option.value &&
                                    styles.privacyOptionSelected,
                            ]}
                            onPress={() => setPostPrivacy(option.value as any)}
                        >
                            <Feather
                                name={option.icon as any}
                                size={16}
                                color={option.color}
                            />
                            <Text style={styles.privacyOptionText}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            {/*Header */}
            <View style={styles.Header}>
                <Image
                    source={{ 
                        uri: session?.user?.user_metadata?.avatar_url
                    }}
                    style={styles.userAvatar}
                />
                <TouchableOpacity
                    style={styles.Input}
                    onPress={() => setShowCreateModal(true)}
                >
                    <Text style={styles.InputText}>Bạn đang nghĩ gì?</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.ImageButton}
                    // onPress={() => setShowCreateModal(true)}
                >
                    <Ionicons name="image" size={24} color="#45b7d1" />
                </TouchableOpacity>
            </View>

            {/* Posts List */}
            <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.postsList}
                refreshing={loading}
                onRefresh={loadPosts}
            />

            {/* Create Post Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            onPress={() => {
                                setShowCreateModal(false);
                                resetForm();
                            }}
                        >
                            <Text style={styles.modalCancelButton}>Hủy</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Tạo bài viết</Text>
                        <TouchableOpacity onPress={handleCreatePost}>
                            <Text style={styles.modalSaveButton}>Đăng</Text>
                        </TouchableOpacity>
                    </View>
                    <CreatePostForm />
                </View>
            </Modal>

            {/* Edit Post Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            onPress={() => {
                                setShowEditModal(false);
                                resetForm();
                            }}
                        >
                            <Text style={styles.modalCancelButton}>Hủy</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            Chỉnh sửa bài viết
                        </Text>
                        <TouchableOpacity onPress={handleEditPost}>
                            <Text style={styles.modalSaveButton}>Lưu</Text>
                        </TouchableOpacity>
                    </View>
                    <CreatePostForm />
                </View>
            </Modal>

            {/* Media Picker Modal */}
            <Modal
                visible={showMediaPicker}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.overlayModal}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.pickerTitle}>Chọn ảnh/video</Text>

                        <TouchableOpacity
                            style={styles.pickerOption}
                            onPress={() => handlePickMedia('camera')}
                        >
                            <Feather name="camera" size={24} color="#6366f1" />
                            <Text style={styles.pickerOptionText}>
                                Chụp ảnh/quay video
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.pickerOption}
                            onPress={() => handlePickMedia('library')}
                        >
                            <Feather name="image" size={24} color="#6366f1" />
                            <Text style={styles.pickerOptionText}>
                                Chọn từ thư viện
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.pickerCancel}
                            onPress={() => setShowMediaPicker(false)}
                        >
                            <Text style={styles.pickerCancelText}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Location Picker Modal */}
            <Modal
                visible={showLocationPicker}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.overlayModal}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.pickerTitle}>Thêm vị trí</Text>

                        <TouchableOpacity
                            style={styles.pickerOption}
                            onPress={handleGetLocation}
                        >
                            <Feather name="map-pin" size={24} color="#6366f1" />
                            <Text style={styles.pickerOptionText}>
                                Sử dụng vị trí hiện tại
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.pickerCancel}
                            onPress={() => setShowLocationPicker(false)}
                        >
                            <Text style={styles.pickerCancelText}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Feeling/Activity Picker Modal */}
            <Modal
                visible={showFeelingPicker}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            onPress={() => setShowFeelingPicker(false)}
                        >
                            <Text style={styles.modalCancelButton}>Hủy</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            Cảm xúc & Hoạt động
                        </Text>
                        <View style={{ width: 50 }} />
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <View style={styles.feelingSection}>
                            <Text style={styles.feelingSectionTitle}>
                                Cảm xúc
                            </Text>
                            <View style={styles.feelingGrid}>
                                {FEELINGS.map((feeling, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.feelingItem}
                                        onPress={() => {
                                            setSelectedFeelingActivity({
                                                type: 'feeling',
                                                emoji: feeling.emoji,
                                                text: feeling.text,
                                            });
                                            setShowFeelingPicker(false);
                                        }}
                                    >
                                        <Text style={styles.feelingEmoji}>
                                            {feeling.emoji}
                                        </Text>
                                        <Text style={styles.feelingText}>
                                            {feeling.text}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.feelingSection}>
                            <Text style={styles.feelingSectionTitle}>
                                Hoạt động
                            </Text>
                            <View style={styles.feelingGrid}>
                                {ACTIVITIES.map((activity, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.feelingItem}
                                        onPress={() => {
                                            setSelectedFeelingActivity({
                                                type: 'activity',
                                                emoji: activity.emoji,
                                                text: activity.text,
                                            });
                                            setShowFeelingPicker(false);
                                        }}
                                    >
                                        <Text style={styles.feelingEmoji}>
                                            {activity.emoji}
                                        </Text>
                                        <Text style={styles.feelingText}>
                                            {activity.text}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* Background Picker Modal */}
            <Modal
                visible={showBackgroundPicker}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.overlayModal}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.pickerTitle}>
                            Chọn nền bài viết
                        </Text>

                        <ScrollView style={styles.backgroundGrid}>
                            {BACKGROUND_COLORS.map((bg, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.backgroundOption,
                                        selectedBackground === bg.color &&
                                            styles.backgroundOptionSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedBackground(bg.color);
                                        setShowBackgroundPicker(false);
                                    }}
                                >
                                    <View
                                        style={[
                                            styles.backgroundPreview,
                                            {
                                                backgroundColor:
                                                    bg.color === 'transparent'
                                                        ? '#f3f4f6'
                                                        : bg.color,
                                            },
                                        ]}
                                    />
                                    <Text style={styles.backgroundName}>
                                        {bg.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.pickerCancel}
                            onPress={() => setShowBackgroundPicker(false)}
                        >
                            <Text style={styles.pickerCancelText}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Comments Modal */}
            <Modal
                visible={showCommentsModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            onPress={() => setShowCommentsModal(false)}
                        >
                            <Text style={styles.modalCancelButton}>Đóng</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Bình luận</Text>
                        <View style={{ width: 50 }} />
                    </View>

                    <FlatList
                        data={comments}
                        renderItem={renderComment}
                        keyExtractor={(item) => item.id}
                        style={styles.commentsList}
                    />

                    <View style={styles.commentInputContainer}>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Viết bình luận..."
                            value={newComment}
                            onChangeText={setNewComment}
                        />
                        <TouchableOpacity
                            style={styles.commentSendButton}
                            onPress={handleAddComment}
                        >
                            <Feather name="send" size={20} color="#6366f1" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    Header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        gap: 12,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    Input: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'center',
    },
    InputText: {
        fontSize: 16,
        color: '#6b7280',
    },
    ImageButton: {
        padding: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: 50,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    createButton: {
        backgroundColor: '#6366f1',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    postsList: {},
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
    postActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: 'transparent',
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
    gridMedia: {
        width: (screenWidth - 68) / 2,
        height: 150,
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
    selectedMediaContainer: {
        marginBottom: 16,
    },
    selectedMediaItem: {
        width: 80,
        height: 80,
        marginRight: 8,
        borderRadius: 8,
        position: 'relative',
    },
    selectedMediaImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    removeMediaButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#ef4444',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoIndicator: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 4,
        padding: 2,
    },
    selectedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    selectedItemText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#1e293b',
    },
    selectedItemEmoji: {
        fontSize: 16,
    },
    postOptions: {
        marginBottom: 20,
    },
    postOptionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
    },
    optionButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        minWidth: '47%',
    },
    optionButtonText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '500',
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
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    modalCancelButton: {
        fontSize: 16,
        color: '#6b7280',
    },
    modalSaveButton: {
        fontSize: 16,
        color: '#6366f1',
        fontWeight: '600',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    contentInput: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    privacySection: {
        marginBottom: 20,
    },
    privacyLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
    },
    privacyOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    privacyOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: '#f8fafc',
    },
    privacyOptionSelected: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
    },
    privacyOptionText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '500',
    },
    overlayModal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerModal: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        margin: 20,
        minWidth: screenWidth - 40,
        maxHeight: screenWidth * 0.8,
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 20,
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        marginBottom: 12,
    },
    pickerOptionText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#1e293b',
    },
    pickerCancel: {
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    pickerCancelText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
    },
    feelingSection: {
        marginBottom: 24,
    },
    feelingSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
    },
    feelingGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    feelingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        minWidth: '45%',
    },
    feelingEmoji: {
        fontSize: 20,
        marginRight: 8,
    },
    backgroundGrid: {
        maxHeight: 200,
    },
    backgroundOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        marginBottom: 8,
    },
    backgroundOptionSelected: {
        borderColor: '#6366f1',
        backgroundColor: '#f0f9ff',
    },
    backgroundPreview: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    backgroundName: {
        fontSize: 16,
        color: '#1e293b',
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
});
