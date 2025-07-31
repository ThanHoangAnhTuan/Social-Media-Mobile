export interface UpdateUserInfo {
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
