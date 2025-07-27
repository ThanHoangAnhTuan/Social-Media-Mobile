import React from 'react';
import { StyleSheet, View } from 'react-native';

import Auth from '@components/auth/Auth';
import GoogleLoginButton from '@components/auth/GoogleLoginButton';

export default function LoginScreen() {
    return (
        <View style={styles.container}>
            <Auth />
            <GoogleLoginButton />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
});
