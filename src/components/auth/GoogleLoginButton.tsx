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
        webClientId:
            '871402188361-1b4l9okp1c61pseijsu6i5tf7ievbg7t.apps.googleusercontent.com',
    });

    const handleGoogleSignIn = async () => {
        setMessage('');
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo: SignInResponse = await GoogleSignin.signIn();
            if (userInfo?.data?.idToken) {
                const { error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                });
                if (error) {
                    setMessage(`Lỗi đăng nhập với Google: ${error.message}`);
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
