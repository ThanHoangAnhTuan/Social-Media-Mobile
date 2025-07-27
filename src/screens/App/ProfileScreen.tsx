import { Feather } from '@expo/vector-icons';
import React, { useContext } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '@context/AuthContext';

export default function ProfileScreen() {
    const { session } = useContext(AuthContext);
    const avatar =
        session?.user?.user_metadata?.avatar_url ||
        'https://ui-avatars.com/api/?name=' + (session?.user?.email || 'U');
    const name =
        session?.user?.user_metadata?.full_name ||
        session?.user?.email ||
        'User';
    const email = session?.user?.email || '';

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image source={{ uri: avatar }} style={styles.avatar} />
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.email}>{email}</Text>
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
                <View style={styles.infoRow}>
                    <Feather
                        name="user"
                        size={18}
                        color="#888"
                        style={styles.infoIcon}
                    />
                    <Text style={styles.infoLabel}>Tên:</Text>
                    <Text style={styles.infoValue}>{name}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Feather
                        name="mail"
                        size={18}
                        color="#888"
                        style={styles.infoIcon}
                    />
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{email}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.editBtn}>
                <Feather name="edit-2" size={18} color="#2563eb" />
                <Text style={styles.editBtnText}>Chỉnh sửa hồ sơ</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        paddingTop: 32,
    },
    header: {
        alignItems: 'center',
        marginBottom: 28,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#e1e5e9',
        marginBottom: 12,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#222',
    },
    email: {
        fontSize: 15,
        color: '#666',
        marginTop: 2,
    },
    section: {
        width: '92%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        width: '75%',
    },
    infoIcon: {
        marginRight: 8,
    },
    infoLabel: {
        fontSize: 15,
        color: '#444',
        marginRight: 6,
        minWidth: 60,
    },
    infoValue: {
        fontSize: 15,
        color: '#222',
        fontWeight: '500',
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e7ff',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 18,
        marginTop: 10,
    },
    editBtnText: {
        color: '#2563eb',
        fontWeight: 'bold',
        fontSize: 15,
        marginLeft: 8,
    },
    
});
