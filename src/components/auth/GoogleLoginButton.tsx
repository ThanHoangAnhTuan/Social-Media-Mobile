import {
    GoogleSignin,
    GoogleSigninButton,
    SignInResponse,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import React, { FC, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { supabase } from '@lib/supabase';

const GoogleLoginButton: FC = () => {
    const [message, setMessage] = useState<string>('');

    GoogleSignin.configure({
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });

    const handleGoogleSignIn = async () => {
        setMessage('');
        try {
            await GoogleSignin.hasPlayServices();
            // await GoogleSignin.revokeAccess();
            // await GoogleSignin.signOut();
            const userInfo: SignInResponse = await GoogleSignin.signIn();
            console.log('userInfo:', JSON.stringify(userInfo, null, 2));
            
            if (userInfo?.data?.idToken) {
                const { error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                });
                if (error) {
                    setMessage('Đã xảy ra lỗi khi đăng nhập với Google! Vui lòng thử lại sau.');
                } else {
                    setMessage('Đăng nhập với Google thành công!');
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
