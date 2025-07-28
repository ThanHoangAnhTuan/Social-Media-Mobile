export interface User {
    id: string;
    email?: string;
    user_metadata?: {
        full_name?: string;
        avatar_url?: string;
        gender?: string;
        birth_date?: string;
        address?: string;
        phone?: string;
    };
}

export interface FormData {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    gender: string | null;
    avatar: string | null;
    birthDate: Date | null;
}

export interface UserInfo {
    email: string | null;
    id: string | null;
    phone: string | null;
    fullName: string | null;
    address: string | null;
    gender: string | null;
    birthDate: Date | null;
    avatar: string | null;
}

export interface Session {
    user: User;
    access_token?: string;
    refresh_token?: string;
}