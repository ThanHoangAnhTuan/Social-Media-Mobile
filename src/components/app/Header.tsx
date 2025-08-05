import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
const Header = () => {
    return (
        <View style={styles.container}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                    source={require('../../../assets/logo.png')}
                    style={styles.logo}
                />
                <Text style={styles.name}>
                    Social Media App
                </Text>
            </View>
            <View style={styles.btn}>

                <TouchableOpacity>
                    <Feather name="plus-circle" size={25} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity>
                    <Feather name="search" size={25} color="#fff" style={{ marginLeft: 10 }} />
                </TouchableOpacity>
                <TouchableOpacity>
                    {/* <Feather name="message-circle" size={25} color="#fff" style={{ marginLeft: 10 }} /> */}
                    <Image
                        source={require('../../../assets/chat.png')}
                        style={{ width: 20, height: 20, marginLeft: 10 }}
                    />
                </TouchableOpacity>

            </View>
        </View>
    )
}

export default Header

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#b7ffdfff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        paddingTop: 30,
        justifyContent: 'space-between',
    },
    logo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        boxShadow: 'rgba(0, 0, 0, 0.35) 0px 5px 15px',
    },
    name: {
        color: '#fff',
        fontSize: 18,
        marginLeft: 10,
        fontWeight: 'bold',
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
    }
})