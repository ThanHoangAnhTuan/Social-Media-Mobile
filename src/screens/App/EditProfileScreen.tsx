import { Feather, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Session } from '@supabase/supabase-js';
import React, { JSX, useContext, useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    GetUserProfile,
    UpdateUserAvatar,
    UpdateUserProfile,
} from '@/src/services/user/UserInfo';
import { UpdateUserInfo } from '@/src/types/auth';
import { AuthContext } from '@context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
export default function EditProfileScreen(): JSX.Element {
    const navigation = useNavigation();
    const { session } = useContext(AuthContext);
    const [originalAvatar, setOriginalAvatar] = useState<string | null>(null);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null); // ảnh mới

    useEffect(() => {
        if (session?.user?.user_metadata?.avatar_url) {
            setOriginalAvatar(session.user.user_metadata.avatar_url);
        }
    }, [session]);
    const [formData, setFormData] = useState<UpdateUserInfo>({
        fullName: null,
        email: null,
        phone: null,
        address: null,
        birthDate: null,
        gender: null,
        avatar: null,
    });

    useEffect(() => {
        const fetchUserProfile = async (session: Session) => {
            try {
                const response = await GetUserProfile(session);
                const profile = response.data;
                if (!profile) {
                    throw new Error('Không tìm thấy thông tin người dùng.');
                }
                setFormData({
                    fullName: profile.fullName,
                    email: profile.email,
                    phone: profile.phone,
                    address: profile.address,
                    birthDate: profile.birthDate
                        ? new Date(profile.birthDate)
                        : null,
                    gender: profile.gender,
                    avatar: profile.avatar,
                });
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        if (session) {
            fetchUserProfile(session);
        }
    }, [session]);

    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [showGenderModal, setShowGenderModal] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [avatarLoading, setAvatarLoading] = useState<boolean>(false);
    const [showImagePickerModal, setShowImagePickerModal] =
        useState<boolean>(false);

    const genderOptions = [
        { label: 'Nam', value: 'male' },
        { label: 'Nữ', value: 'female' },
        { label: 'Khác', value: 'other' },
    ];

    const handleSave = async (): Promise<void> => {
        setLoading(true);
        try {
            if (!session) {
                Alert.alert('Lỗi', 'Bạn cần đăng nhập để cập nhật hồ sơ.');
                return;
            }

            let avatarToSave: string | null = originalAvatar;

            // Nếu user đã chọn ảnh mới thì upload
            if (selectedImageUri) {
                const response = await UpdateUserAvatar(session, selectedImageUri);
                if (!response || !response.data) throw new Error('Không thể cập nhật avatar.');
                avatarToSave = response.data.replace(/^uploads\//, '');
            }

            const updateData: Partial<UpdateUserInfo> = {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                birthDate: formData.birthDate,
                gender: formData.gender,
            };

            // Chỉ thêm avatar nếu có sự thay đổi
            if (avatarToSave !== originalAvatar) {
                updateData.avatar = avatarToSave;
            }

            await UpdateUserProfile(session.user.id, updateData);
            Alert.alert('Thành công', 'Hồ sơ đã được cập nhật!');
            navigation.goBack();
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };


    const formatDate = (date: Date | null): string => {
        return date ? date.toLocaleDateString('vi-VN') : 'Chọn ngày sinh';
    };

    const getGenderLabel = (value: string | null): string => {
        if (!value) return 'Chọn giới tính';
        const option = genderOptions.find((opt) => opt.value === value);
        return option?.label || 'Chọn giới tính';
    };

    const updateFormData = (field: keyof UpdateUserInfo, value: any) => {
        setFormData((prev: UpdateUserInfo) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleImagePicker = async (type: 'camera' | 'gallery') => {
        try {
            setShowImagePickerModal(false);
            let result;

            if (type === 'camera') {
                // Xin quyền camera
                const { status } =
                    await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Lỗi',
                        'Cần quyền truy cập camera để chụp ảnh!'
                    );
                    return;
                }

                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images', 'videos'],
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 1,
                });
                console.log('ImagePicker camera result:', result);
            } else {
                // Xin quyền thư viện ảnh
                const { status } =
                    await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh!');
                    return;
                }

                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images', 'videos'],
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 1,
                });
                console.log('ImagePicker library result:', result);
            }

            console.log(result);

            if (!result.canceled && result.assets[0]) {
                await handleUpdateAvatar(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại!');
        }
    };

    const handleUpdateAvatar = async (imageUri: string) => {
        if (!session) {
            Alert.alert('Lỗi', 'Bạn cần đăng nhập để cập nhật ảnh đại diện.');
            return;
        }

        // Nếu ảnh chưa đổi (vẫn là URL cũ hoặc path cũ)
        if (
            formData.avatar === imageUri || // URI chưa đổi
            imageUri.includes(originalAvatar || '') // URI vẫn chứa avatar cũ
        ) {
            console.log('Avatar không thay đổi, bỏ qua upload.');
            return;
        }

        setAvatarLoading(true);
        try {
            const response = await UpdateUserAvatar(session, imageUri);
            const fullPath = response.data;

            if (!fullPath) throw new Error('Không thể cập nhật ảnh đại diện.');

            const relativePath = fullPath.replace(/^uploads\//, '');

            setFormData((prev: UpdateUserInfo) => ({
                ...prev,
                avatar: relativePath,
            }));

            Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật!');
        } catch (error) {
            console.error('Error updating avatar:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại!');
        } finally {
            setAvatarLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
                </View>

                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{
                                uri:
                                    formData.avatar ||
                                    'https://via.placeholder.com/150',
                            }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity
                            style={styles.changeAvatarBtn}
                            disabled={avatarLoading}
                            onPress={() => setShowImagePickerModal(true)}
                        >
                            <Feather name="camera" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.changeAvatarText}>
                        Thay đổi ảnh đại diện
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Full Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Họ và tên</Text>
                        <View style={styles.inputContainer}>
                            <Feather
                                name="user"
                                size={20}
                                color="#6b7280"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                value={formData.fullName || ''}
                                onChangeText={(text) =>
                                    updateFormData('fullName', text)
                                }
                                placeholder="Nhập họ và tên"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <View
                            style={[
                                styles.inputContainer,
                                styles.disabledInput,
                            ]}
                        >
                            <Feather
                                name="mail"
                                size={20}
                                color="#9ca3af"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, styles.disabledText]}
                                value={formData.email || ''}
                                editable={false}
                                placeholder="Email"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                        <Text style={styles.helperText}>
                            Email không thể thay đổi
                        </Text>
                    </View>

                    {/* Phone */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Số điện thoại</Text>
                        <View style={styles.inputContainer}>
                            <Feather
                                name="phone"
                                size={20}
                                color="#6b7280"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                value={formData.phone || ''}
                                onChangeText={(text) =>
                                    updateFormData('phone', text)
                                }
                                placeholder="Nhập số điện thoại"
                                placeholderTextColor="#9ca3af"
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    {/* Gender */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Giới tính</Text>
                        <TouchableOpacity
                            style={styles.inputContainer}
                            onPress={() => setShowGenderModal(true)}
                        >
                            <MaterialIcons
                                name="person"
                                size={20}
                                color="#6b7280"
                                style={styles.inputIcon}
                            />
                            <Text
                                style={[
                                    styles.selectText,
                                    !formData.gender && styles.placeholderText,
                                ]}
                            >
                                {getGenderLabel(formData.gender)}
                            </Text>
                            <Feather
                                name="chevron-down"
                                size={20}
                                color="#6b7280"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Birth Date */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Ngày sinh</Text>
                        <TouchableOpacity
                            style={styles.inputContainer}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Feather
                                name="calendar"
                                size={20}
                                color="#6b7280"
                                style={styles.inputIcon}
                            />
                            <Text
                                style={[
                                    styles.selectText,
                                    !formData.birthDate &&
                                    styles.placeholderText,
                                ]}
                            >
                                {formatDate(formData.birthDate)}
                            </Text>
                            <Feather
                                name="chevron-down"
                                size={20}
                                color="#6b7280"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Address */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Địa chỉ</Text>
                        <View style={styles.inputContainer}>
                            <MaterialIcons
                                name="location-on"
                                size={20}
                                color="#6b7280"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, styles.multilineInput]}
                                value={formData.address || ''}
                                onChangeText={(text) =>
                                    updateFormData('address', text)
                                }
                                placeholder="Nhập địa chỉ"
                                placeholderTextColor="#9ca3af"
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    </View>
                </View>

                {/* Save Button */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            loading && styles.disabledButton,
                        ]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <Text style={styles.saveButtonText}>
                                Đang lưu...
                            </Text>
                        ) : (
                            <>
                                <Feather name="save" size={20} color="#fff" />
                                <Text style={styles.saveButtonText}>
                                    Lưu thay đổi
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Image Picker Modal */}
                <Modal
                    visible={showImagePickerModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowImagePickerModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                Chọn ảnh đại diện
                            </Text>

                            <TouchableOpacity
                                style={styles.imagePickerOption}
                                onPress={() => handleImagePicker('camera')}
                            >
                                <Feather
                                    name="camera"
                                    size={24}
                                    color="#6366f1"
                                />
                                <Text style={styles.imagePickerOptionText}>
                                    Chụp ảnh mới
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.imagePickerOption}
                                onPress={() => handleImagePicker('gallery')}
                            >
                                <Feather
                                    name="image"
                                    size={24}
                                    color="#6366f1"
                                />
                                <Text style={styles.imagePickerOptionText}>
                                    Chọn từ thư viện
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowImagePickerModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Hủy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Gender Modal */}
                <Modal
                    visible={showGenderModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowGenderModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                Chọn giới tính
                            </Text>
                            {genderOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={styles.modalOption}
                                    onPress={() => {
                                        updateFormData('gender', option.value);
                                        setShowGenderModal(false);
                                    }}
                                >
                                    <Text style={styles.modalOptionText}>
                                        {option.label}
                                    </Text>
                                    {formData.gender === option.value && (
                                        <Feather
                                            name="check"
                                            size={20}
                                            color="#6366f1"
                                        />
                                    )}
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowGenderModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Hủy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Date Picker */}
                {showDatePicker && (
                    <DateTimePicker
                        value={formData.birthDate || new Date()}
                        mode="date"
                        display="default"
                        maximumDate={new Date()}
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate && event.type === 'set') {
                                updateFormData('birthDate', selectedDate);
                            }
                        }}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#6366f1',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e1e5e9',
    },
    changeAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#6366f1',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    changeAvatarText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    form: {
        paddingHorizontal: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    disabledInput: {
        backgroundColor: '#f9fafb',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    disabledText: {
        color: '#9ca3af',
    },
    selectText: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
    },
    placeholderText: {
        color: '#9ca3af',
    },
    helperText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
        fontStyle: 'italic',
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingVertical: 30,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366f1',
        borderRadius: 12,
        paddingVertical: 16,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#374151',
    },
    modalCancelButton: {
        marginTop: 20,
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
    },
    imagePickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    imagePickerOptionText: {
        fontSize: 16,
        color: '#374151',
        marginLeft: 16,
    },
});
