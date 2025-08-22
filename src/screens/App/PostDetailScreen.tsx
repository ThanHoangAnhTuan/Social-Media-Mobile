import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    StatusBar,
    Dimensions,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthContext } from '@context/AuthContext';
import { Post, Comment, MediaItem } from '@/src/types/post';
import { RootStackParamList } from '@/src/types/route';
import { getPostById, getPostByIdWithPrivacy } from '@/src/services/post/post';
import { getCommentsByPostId, createComment, CreateCommentData } from '@/src/services/comment/comment';
import { formatDate } from '@/src/utils/dateFormat';

type PostDetailScreenRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;
type PostDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PostDetail'>;

interface PostDetailScreenProps {
    route: PostDetailScreenRouteProp;
    navigation: PostDetailScreenNavigationProp;
}

const PostDetailScreen: React.FC<PostDetailScreenProps> = ({ route, navigation }) => {
    const { postId, fromNotification } = route.params;
    const { session } = useContext(AuthContext);
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    // States cho ImageViewer
    const [showImageViewer, setShowImageViewer] = useState<boolean>(false);
    const [viewingImages, setViewingImages] = useState<MediaItem[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

    useEffect(() => {
        loadPostDetail();
        loadComments();
        
        // Show notification if came from notification
        if (fromNotification) {
            console.log('Opened from notification for post:', postId);
        }
    }, [postId, fromNotification]);

    const loadPostDetail = async () => {
        if (!session) {
            Alert.alert('Lỗi', 'Bạn cần đăng nhập để xem bài viết này');
            navigation.goBack();
            return;
        }

        try {
            const response = await getPostByIdWithPrivacy(postId, session.user.id);
            if (response.success && response.data) {
                setPost(response.data);
            } else {
                Alert.alert('Lỗi', response.error || 'Không thể tải bài viết');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error loading post detail:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải bài viết');
            navigation.goBack();
        }
    };

    const loadComments = async () => {
        try {
            setLoading(true);
            const response = await getCommentsByPostId(postId);
            if (response.success && response.data) {
                setComments(response.data);
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async () => {
        if (!commentText.trim() || !session) return;

        setSubmitting(true);
        try {
            const commentData: CreateCommentData = {
                postId: postId,
                content: commentText.trim(),
                authorId: session.user.id,
            };

            const response = await createComment(commentData);

            if (response.success) {
                setCommentText('');
                await loadComments(); // Reload comments
                // Update comment count in post
                if (post) {
                    setPost({
                        ...post,
                        comments: post.comments + 1,
                    });
                }
            } else {
                Alert.alert('Lỗi', response.error || 'Không thể gửi bình luận');
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi gửi bình luận');
        } finally {
            setSubmitting(false);
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

    const renderMediaGrid = (media: any[]) => {
        if (!media || media.length === 0) return null;

        const screenWidth = Dimensions.get('window').width; // Full screen width
        const containerHeight = 300; // Height for better display

        const renderMediaItem = (item: any, index: number) => {
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
                        <View style={styles.moreImagesOverlay}>
                            <Text style={styles.moreImagesText}>
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

    const renderComment = (comment: Comment) => (
        <View key={comment.id} style={styles.commentItem}>
            <Image 
                source={{ uri: comment.author.avatar || 'https://via.placeholder.com/40' }} 
                style={styles.commentAvatar} 
            />
            <View style={styles.commentContent}>
                <Text style={styles.commentAuthor}>{comment.author.name}</Text>
                <Text style={styles.commentText}>{comment.content}</Text>
                <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
            </View>
        </View>
    );

    if (!post && !loading) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Không thể tải bài viết</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết bài viết</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                {post && (
                    <>
                        {/* Post Content */}
                        <View style={styles.postContainer}>
                            {/* Author Info */}
                            <View style={styles.postHeader}>
                                <Image 
                                    source={{ uri: post.author.avatar || 'https://via.placeholder.com/50' }} 
                                    style={styles.authorAvatar} 
                                />
                                <View style={styles.authorInfo}>
                                    <Text style={styles.authorName}>{post.author.name}</Text>
                                    <Text style={styles.postTime}>{formatDate(post.createdAt)}</Text>
                                </View>
                            </View>

                            {/* Post Content */}
                            <Text style={styles.postContent}>{post.content}</Text>

                            {/* Post Media */}
                            {renderMediaGrid(post.media)}

                            {/* Post Stats */}
                            <View style={styles.postStats}>
                                <Text style={styles.statsText}>{post.likes} lượt thích</Text>
                                <Text style={styles.statsText}>{post.comments} bình luận</Text>
                                <Text style={styles.statsText}>{post.shares} chia sẻ</Text>
                            </View>

                            {/* Post Actions */}
                            <View style={styles.postActions}>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Feather name="heart" size={20} color="#666" />
                                    <Text style={styles.actionText}>Thích</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Feather name="message-circle" size={20} color="#666" />
                                    <Text style={styles.actionText}>Bình luận</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Feather name="share" size={20} color="#666" />
                                    <Text style={styles.actionText}>Chia sẻ</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Comments Section */}
                        <View style={styles.commentsSection}>
                            <Text style={styles.commentsTitle}>Bình luận ({comments.length})</Text>
                            
                            {loading ? (
                                <ActivityIndicator size="small" color="#1877f2" style={styles.loadingIndicator} />
                            ) : (
                                <View style={styles.commentsList}>
                                    {comments.map(renderComment)}
                                    {comments.length === 0 && (
                                        <Text style={styles.noCommentsText}>Chưa có bình luận nào</Text>
                                    )}
                                </View>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
                <Image 
                    source={{ uri: session?.user?.user_metadata?.avatar_url || 'https://via.placeholder.com/40' }} 
                    style={styles.userAvatar} 
                />
                <TextInput
                    style={styles.commentInput}
                    placeholder="Viết bình luận..."
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                />
                <TouchableOpacity 
                    onPress={handleSubmitComment}
                    style={[styles.sendButton, { opacity: commentText.trim() ? 1 : 0.5 }]}
                    disabled={!commentText.trim() || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#1877f2" />
                    ) : (
                        <Feather name="send" size={20} color="#1877f2" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Image Viewer Modal */}
            <Modal
                visible={showImageViewer}
                transparent={true}
                animationType="fade"
                statusBarTranslucent={true}
            >
                <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
                <View style={styles.imageViewerContainer}>
                    {/* Header */}
                    <View style={styles.imageViewerHeader}>
                        <TouchableOpacity
                            style={styles.imageViewerCloseButton}
                            onPress={closeImageViewer}
                        >
                            <Feather name="x" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.imageViewerCounter}>
                            {currentImageIndex + 1} / {viewingImages.length}
                        </Text>
                    </View>

                    {/* Image Display */}
                    <View style={styles.imageViewerContent}>
                        {viewingImages.length > 0 && (
                            <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={(event) => {
                                    const newIndex = Math.round(
                                        event.nativeEvent.contentOffset.x / Dimensions.get('window').width
                                    );
                                    setCurrentImageIndex(newIndex);
                                }}
                                contentOffset={{ x: currentImageIndex * Dimensions.get('window').width, y: 0 }}
                            >
                                {viewingImages.map((image, index) => (
                                    <View key={index} style={styles.imageViewerSlide}>
                                        <Image
                                            source={{ uri: image.uri }}
                                            style={styles.imageViewerImage}
                                            resizeMode="contain"
                                        />
                                        {image.type === 'video' && (
                                            <View style={styles.videoOverlay}>
                                                <Ionicons 
                                                    name="play-circle" 
                                                    size={80} 
                                                    color="rgba(255,255,255,0.9)" 
                                                />
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    {/* Navigation Arrows */}
                    {viewingImages.length > 1 && (
                        <>
                            {currentImageIndex > 0 && (
                                <TouchableOpacity
                                    style={[styles.imageViewerArrow, styles.imageViewerArrowLeft]}
                                    onPress={goToPreviousImage}
                                >
                                    <Feather name="chevron-left" size={30} color="#fff" />
                                </TouchableOpacity>
                            )}
                            {currentImageIndex < viewingImages.length - 1 && (
                                <TouchableOpacity
                                    style={[styles.imageViewerArrow, styles.imageViewerArrowRight]}
                                    onPress={goToNextImage}
                                >
                                    <Feather name="chevron-right" size={30} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingTop: 50,
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    content: {
        flex: 1,
    },
    postContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderBottomWidth: 8,
        borderBottomColor: '#f0f0f0',
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    authorAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    authorInfo: {
        flex: 1,
    },
    authorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    postTime: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    postContent: {
        fontSize: 16,
        lineHeight: 24,
        color: '#000',
        marginBottom: 12,
    },
    // Media Grid Styles - Updated for multiple images layout
    singleImageContainer: {
        marginVertical: 8,
    },
    singleImage: {
        width: '100%',
        height: 400,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    twoImagesContainer: {
        flexDirection: 'row',
        marginVertical: 8,
        gap: 4,
    },
    halfImageContainer: {
        flex: 1,
    },
    halfImage: {
        width: '100%',
        height: 250,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    threeImagesContainer: {
        flexDirection: 'row',
        marginVertical: 8,
        height: 250,
        gap: 4,
    },
    mainImageContainer: {
        flex: 2,
    },
    mainImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'cover',
    },
    sideImagesContainer: {
        flex: 1,
        marginLeft: 4,
        gap: 4,
    },
    sideImageContainer: {
        flex: 1,
    },
    sideImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'cover',
    },
    fourImagesContainer: {
        flexDirection: 'row',
        marginVertical: 8,
        height: 280,
        gap: 4,
    },
    topRowContainer: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 4,
    },
    bottomRowContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    quarterImageContainer: {
        flex: 1,
        position: 'relative',
    },
    quarterImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    moreImagesOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    moreImagesText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    postStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginBottom: 8,
    },
    statsText: {
        fontSize: 14,
        color: '#666',
    },
    postActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    actionText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    commentsSection: {
        backgroundColor: '#fff',
        padding: 15,
    },
    commentsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 15,
    },
    loadingIndicator: {
        paddingVertical: 20,
    },
    commentsList: {
        marginTop: 8,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    commentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    commentContent: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 12,
    },
    commentAuthor: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    commentText: {
        fontSize: 14,
        color: '#000',
        lineHeight: 20,
        marginBottom: 4,
    },
    commentTime: {
        fontSize: 12,
        color: '#666',
    },
    noCommentsText: {
        textAlign: 'center',
        color: '#666',
        fontStyle: 'italic',
        paddingVertical: 20,
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 14,
    },
    sendButton: {
        marginLeft: 12,
        padding: 8,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#1877f2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Styles cho new layout và ImageViewer
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
    // Layout mới cho 4+ ảnh
    mainFourImageContainer: {
        flex: 2,
    },
    mainFourImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'cover',
    },
    sideFourImagesContainer: {
        flex: 1,
        gap: 4,
        marginLeft: 4,
    },
    sideFourImageContainer: {
        flex: 1,
        position: 'relative',
    },
    sideFourImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'cover',
    },
    // ImageViewer Styles
    imageViewerContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageViewerHeader: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 1000,
    },
    imageViewerCloseButton: {
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 25,
    },
    imageViewerCounter: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    imageViewerContent: {
        flex: 1,
        width: '100%',
    },
    imageViewerSlide: {
        width: Dimensions.get('window').width,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageViewerImage: {
        width: '100%',
        height: '80%',
    },
    imageViewerArrow: {
        position: 'absolute',
        top: '50%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 25,
        padding: 15,
        zIndex: 1000,
    },
    imageViewerArrowLeft: {
        left: 20,
    },
    imageViewerArrowRight: {
        right: 20,
    },
    // New media grid styles
    mediaContainer: {
        marginVertical: 8,
        marginHorizontal: -15, // Negative margin to offset parent padding
    },
    mediaItem: {
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    mediaImage: {
        width: '100%',
        height: '100%',
    },
    // Update fourImagesContainer để sử dụng layout mới
});

export default PostDetailScreen;
