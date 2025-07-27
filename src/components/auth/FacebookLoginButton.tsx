import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { supabase } from '@lib/supabase';

export default function FacebookLoginButton() {
    async function signInWithFacebook() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
        });
        if (error) {
            console.error('Facebook sign-in error: ', error);
            return;
        }
        console.log('Facebook sign-in data: ', data);
    }

    return (
        <TouchableOpacity style={styles.button} onPress={signInWithFacebook}>
            <View style={styles.iconContainer}>
                <Image
                    source={{
                        uri: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png',
                    }}
                    style={styles.icon}
                />
            </View>
            <Text style={styles.text}>Đăng nhập với Facebook</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1877F3',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
        marginVertical: 8,
    },
    iconContainer: {
        marginRight: 10,
    },
    icon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
