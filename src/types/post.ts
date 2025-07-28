export interface Post {
    id?: number;
    user_id: number;
    content: string;
    media_urls?: string[] | null;
    location?: string | null;
    privacy_level?: 'public' | 'friends' | 'private';
    post_type?: 'text' | 'image' | 'video' | 'link';
    is_active?: boolean;
    like_count?: number;
    comment_count?: number;
    share_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface CreatePostData {
    user_id: number;
    content: string;
    media_urls?: string[];
    location?: string;
    privacy_level?: 'public' | 'friends' | 'private';
    post_type?: 'text' | 'image' | 'video' | 'link';
}

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
