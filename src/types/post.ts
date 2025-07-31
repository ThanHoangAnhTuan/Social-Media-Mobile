export interface UpdatePostData {
    content: string;
    media: MediaItem[];
    location: LocationData | null;
    feelingActivity: FeelingActivity | null;
    privacy: 'public' | 'friends' | 'private';
    authorId: string;
}

export interface PostsFilterOptions {
    userId: number;
    privacyLevel: 'public' | 'friends' | 'private';
    postType: 'text' | 'image' | 'video' | 'link';
    isActive: boolean;
    limit: number;
    offset: number;
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
    location: LocationData | null;
    feelingActivity: FeelingActivity | null;
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
    location: LocationData | null;
    feelingActivity: FeelingActivity | null;
    privacy: 'public' | 'friends' | 'private';
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
