import { Session } from '@supabase/supabase-js';
import React, { createContext, FC, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@lib/supabase';
import {
    AuthContextType,
    AuthFunctions,
    AuthProviderProps,
} from '../types/context';

export const AuthContext = createContext<AuthContextType>({
    session: null,
    authFunctions: {
        signInWithEmail: async () => {},
        signUpWithEmail: async () => {},
        signOut: async () => {},
    },
});

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, currentSession) => {
                setSession(currentSession);
                setIsLoading(false);
            }
        );

        const getInitialSession = async () => {
            const {
                data: { session: initialSession },
                error,
            } = await supabase.auth.getSession();
            if (error) {
                console.error('Lỗi khi lấy session ban đầu:', error.message);
            }
            setSession(initialSession);
            setIsLoading(false);
        };

        getInitialSession();

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const authFunctions = useMemo<AuthFunctions>(
        () => ({
            signInWithEmail: async (email, password) => {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) {
                    throw error;
                }
            },
            signUpWithEmail: async (email, password) => {
                const {
                    data: { session: newSession },
                    error,
                } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) {
                    throw error;
                }
                if (!newSession) {
                    throw new Error(
                        'Đăng ký thành công! Vui lòng kiểm tra email để xác minh và đăng nhập.'
                    );
                }
            },
            signOut: async () => {
                const { error } = await supabase.auth.signOut();

                if (error) {
                    console.error('Lỗi khi đăng xuất:', error.message);
                    throw error;
                }
            },
        }),
        []
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>
                    Đang tải phiên đăng nhập...
                </Text>
            </View>
        );
    }

    return (
        <AuthContext.Provider value={{ session, authFunctions }}>
            {children}
        </AuthContext.Provider>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
    },
});
