import React, { FC, useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';

import { AuthContext } from '@context/AuthContext';

const Auth: FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');

    const { authFunctions } = useContext(AuthContext);

    const handleSignIn = async () => {
        setLoading(true);
        setMessage('');
        try {
            await authFunctions.signInWithEmail(email, password);
            setMessage('Đăng nhập thành công!');
        } catch (error: any) {
            setMessage(`Lỗi đăng nhập: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        setMessage('');
        try {
            await authFunctions.signUpWithEmail(email, password);
            setMessage(
                'Đăng ký thành công! Vui lòng kiểm tra email để xác minh và đăng nhập.'
            );
        } catch (error: any) {
            setMessage(`Lỗi đăng ký: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Đăng nhập / Đăng ký</Text>
            <View>
                <TextInput
                    label="Email"
                    onChangeText={setEmail}
                    value={email}
                    placeholder="email@address.com"
                    autoCapitalize={'none'}
                    style={styles.input}
                />
            </View>
            <View>
                <TextInput
                    label="Mật khẩu"
                    onChangeText={setPassword}
                    value={password}
                    secureTextEntry={true}
                    placeholder="Mật khẩu"
                    autoCapitalize={'none'}
                    style={styles.input}
                />
            </View>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <View style={styles.buttonGroup}>
                <Button
                    mode="contained"
                    disabled={loading}
                    onPress={handleSignIn}
                    style={styles.button}
                >
                    Đăng nhập
                </Button>
                <Button
                    mode="outlined"
                    disabled={loading}
                    onPress={handleSignUp}
                    style={styles.button}
                >
                    Đăng ký
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
        gap: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        marginBottom: 10,
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    button: {
        flex: 1,
        marginHorizontal: 5,
    },
    message: {
        textAlign: 'center',
        marginTop: 10,
        color: 'red',
        fontSize: 14,
    },
});

export default Auth;
