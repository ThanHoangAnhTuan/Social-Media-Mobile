import {
    GoogleSignin,
    GoogleSigninButton,
    SignInResponse,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import React, { FC, useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthContext } from '@/src/context/AuthContext';
import { UpdateUserProfile } from '@/src/services/user/UserInfo';
import { supabase } from '@lib/supabase';
import { Session } from '@supabase/supabase-js';


const GoogleLoginButton: FC = () => {
    const { session } = useContext(AuthContext);
    const [message, setMessage] = useState<string>('');

    GoogleSignin.configure({
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        forceCodeForRefreshToken: true, // Forces account picker
    });

    const saveGoogleAvatarToStorage = async (session: Session): Promise<string | null> => {
        const avatarUrl = session.user.user_metadata?.avatar_url;
        const userId = session.user.id;

        if (!avatarUrl?.startsWith('https')) return null;

        try {
            const { data: existing } = await supabase
                .from('user_info')
                .select('avatar')
                .eq('id', userId)
                .single();

            if (existing?.avatar?.startsWith('avatars/')) {
                return existing.avatar;
            }

            const response = await fetch(avatarUrl);
            const arrayBuffer = await response.arrayBuffer();

            const fileName = `avatars/${Date.now()}.png`;

            const { error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(fileName, arrayBuffer, {
                    contentType: 'image/png',
                    upsert: true,
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return null;
            }

            await supabase
                .from('user_info')
                .upsert({ id: userId, avatar: fileName }, { onConflict: 'id' });

            return fileName;
        } catch (err) {
            console.error('saveGoogleAvatarToStorage error:', err);
            return null;
        }
    };


    const handleGoogleSignIn = async () => {
        setMessage('');
        try {
            await GoogleSignin.hasPlayServices();
            // Force sign out to show account picker
            await GoogleSignin.signOut();
            const userInfo: SignInResponse = await GoogleSignin.signIn();
            // console.log("1");
            // console.log('userInfo:', JSON.stringify(userInfo, null, 2));

            if (userInfo?.data?.idToken) {
                const { error, data } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                });
                if (error) {
                    setMessage('Đã xảy ra lỗi khi đăng nhập với Google! Vui lòng thử lại sau.');
                } else {
                    console.log('data:', JSON.stringify(data, null, 2));

                    if (data.session?.user.id) {
                        const storedAvatar = await saveGoogleAvatarToStorage(data.session);

                        const formData = {
                            fullName: data.session.user.user_metadata.full_name || null,
                            email: data.session.user.email || null,
                            phone: data.session.user.phone || null,
                            address: null,
                            birthDate: null,
                            gender: null,
                            avatar: storedAvatar,
                        };

                        await UpdateUserProfile(data.session.user.id, formData);
                        setMessage('Đăng nhập với Google thành công!');
                    }

                }
            } else {
                throw new Error('Không tìm thấy ID token!');
            }
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                setMessage('Đăng nhập bị hủy bỏ.');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                setMessage('Đang tiến hành đăng nhập.');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                setMessage(
                    'Dịch vụ Google Play không khả dụng hoặc đã lỗi thời.'
                );
            } else {
                console.log(error);

                setMessage(
                    'Đã xảy ra lỗi khi đăng nhập với Google! Vui lòng thử lại sau.'
                );
            }
        }
    };

    return (
        <View style={styles.container}>
            <GoogleSigninButton
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={handleGoogleSignIn}
            />
            {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginTop: 20,
    },
    message: {
        textAlign: 'center',
        marginTop: 10,
        color: 'red',
        fontSize: 14,
    },
});

export default GoogleLoginButton;
