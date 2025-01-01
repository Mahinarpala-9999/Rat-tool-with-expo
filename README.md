# Rat-tool-with-expo
# Expo with Android Integration

## Introduction
This project is a React Native mobile application built with Expo, tailored for Android devices. It integrates Firebase to handle backend functionality and includes features such as image uploads and device information collection.

## About this Project
The project demonstrates the seamless integration of frontend and backend services using Expo and Firebase. It focuses on:

- **Firebase Integration**: Utilized for authentication, database management, and real-time updates.
- **Expo EAS Configuration**: Facilitates an efficient build and deployment pipeline.
- **Android Compatibility**: Designed specifically to work seamlessly with Android devices.

## Project Structure
Below is an overview of the key components and files:

- **`App.js`**: The main entry point of the application.
- **`firebaseConfig.js`**: Contains Firebase configuration details, including API keys and database URLs.
- **`google-services.json`**: Android-specific Firebase configuration file.
- **`assets/`**: Contains static resources such as images and fonts.
- **`.expo/`**: Stores Expo-specific configurations.
- **`eas.json`**: Configuration for Expo Application Services (EAS).
- **`package.json`**: Lists project dependencies and scripts.
- **`.gitignore`**: Specifies files and directories to exclude from version control.

## Key Features
- **Device Information Collection**: Collects details like battery status, network information, and location, which are uploaded to Firebase.
- **Image Upload Functionality**: Allows users to upload screenshots and camera images to a designated server.
- **Modular Codebase**: Ensures scalability and maintainability of the project.

## Installation
To get started, follow these steps:

1. Clone the repository:
   ```bash
   git clone <repository_url>
   ```

2. Navigate to the project directory:
   ```bash
   cd expo-with-android
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Open the Expo Go app on your Android device and scan the QR code to run the app.

## Firebase Configuration
Ensure you have a Firebase project set up. Update the `firebaseConfig.js` file with your Firebase project details:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export default firebaseConfig;
```

## Contributions
Contributions are welcome! If you would like to contribute, please fork the repository and submit a pull request with your changes.

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.

---

Developed with ❤️ using Expo and Firebase.
