import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import BookingScreen from './src/screens/BookingScreen';
import MyRoomsScreen from './src/screens/MyRoomsScreen';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Booking: { code: string };
  MyRooms: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const colors = {
  primary: '#10b981',
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f1f5f9'
};

const LoadingScreen = () => (
  <View style={styles.loading}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

const AppNavigator = () => {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      {!firebaseUser ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Booking"
            component={BookingScreen}
            options={({ route }) => ({
              title: `Room ${route.params?.code || ''}`,
              headerBackTitle: 'Back'
            })}
          />
          <Stack.Screen
            name="MyRooms"
            component={MyRoomsScreen}
            options={{
              title: 'My Rooms',
              headerBackTitle: 'Back'
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  loadingText: {
    marginTop: 16,
    color: colors.primary,
    fontSize: 16
  }
});
