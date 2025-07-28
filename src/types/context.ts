import { Session } from '@supabase/supabase-js';

export interface AuthFunctions {
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

export interface AuthContextType {
    session: Session | null;
    authFunctions: AuthFunctions;
}

export interface AuthProviderProps {
    children: React.ReactNode;
}
