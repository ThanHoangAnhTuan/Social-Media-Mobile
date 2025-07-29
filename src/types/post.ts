export interface UpdatePostData {
    content?: string;
    media_urls?: string[];
    location?: string;
    post_type?: 'text' | 'image' | 'video' | 'link';
}

export interface PostsFilterOptions {
    user_id?: number;
    privacy_level?: 'public' | 'friends' | 'private';
    post_type?: 'text' | 'image' | 'video' | 'link';
    is_active?: boolean;
    limit?: number;
    offset?: number;
}

export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface MediaItem {
    id: string;
    type: 'image' | 'video';
    uri: string;
    thumbnail?: string;
}

export interface LocationData {
    name: string;
    address: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
}

export interface FeelingActivity {
    type: 'feeling' | 'activity';
    emoji: string;
    text: string;
}

export interface Post {
    id: string;
    content: string;
    media: MediaItem[];
    location?: LocationData;
    feelingActivity?: FeelingActivity;
    privacy: 'public' | 'friends' | 'private';
    likes: number;
    comments: number;
    shares: number;
    isLiked: boolean;
    createdAt: Date;
    author: {
        id: string;
        name: string;
        avatar: string;
    };
}

export interface CreatePostData {
    content: string;
    media: MediaItem[];
    location?: LocationData;
    feelingActivity?: FeelingActivity;
    privacy: 'public' | 'friends' | 'private';
    likes: number;
    comments: number;
    shares: number;
    createdAt: Date;
    authorId: string;
}

export interface Comment {
    id: string;
    content: string;
    author: {
        id: string;
        name: string;
        avatar: string;
    };
    createdAt: Date;
}
