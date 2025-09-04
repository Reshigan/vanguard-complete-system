/**
 * Verifi AI Mobile App - Level 3 Enterprise
 * 
 * Full-featured React Native app for iOS and Android
 * with advanced scanning, authentication, and rewards
 */

import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from 'react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SplashScreen from 'react-native-splash-screen';
import { enableScreens } from 'react-native-screens';

// Enable screens for better performance
enableScreens();

// Import screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import BiometricSetupScreen from './src/screens/auth/BiometricSetupScreen';
import ScannerScreen from './src/screens/scanner/ScannerScreen';
import ProductDetailScreen from './src/screens/product/ProductDetailScreen';
import ValidationResultScreen from './src/screens/validation/ValidationResultScreen';
import RewardsScreen from './src/screens/rewards/RewardsScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import HistoryScreen from './src/screens/history/HistoryScreen';
import LeaderboardScreen from './src/screens/social/LeaderboardScreen';
import AchievementsScreen from './src/screens/social/AchievementsScreen';
import AnalyticsScreen from './src/screens/analytics/AnalyticsScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import MapScreen from './src/screens/map/MapScreen';
import ARScannerScreen from './src/screens/scanner/ARScannerScreen';

// Import providers
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NotificationProvider } from './src/contexts/NotificationContext';

// Import services
import { initializeApp } from './src/services/AppInitializer';
import { setupNotifications } from './src/services/NotificationService';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createStackNavigator();

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Scan':
              iconName = 'qr-code-scanner';
              break;
            case 'History':
              iconName = 'history';
              break;
            case 'Rewards':
              iconName = 'card-giftcard';
              break;
            case 'Analytics':
              iconName = 'analytics';
              break;
            case 'Profile':
              iconName = 'person';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1e8e3e',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 80 : 60,
        },
        headerStyle: {
          backgroundColor: '#1e8e3e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Scan" 
        component={ScannerScreen}
        options={{ title: 'Scan Product' }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ title: 'Scan History' }}
      />
      <Tab.Screen 
        name="Rewards" 
        component={RewardsScreen}
        options={{ 
          title: 'Rewards',
          tabBarBadge: 3, // Show notification badge
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Auth Stack Navigator
const AuthStackNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1e8e3e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: 'Create Account' }}
      />
      <AuthStack.Screen 
        name="BiometricSetup" 
        component={BiometricSetupScreen}
        options={{ title: 'Setup Biometric Login' }}
      />
    </AuthStack.Navigator>
  );
};

// Main App Component
const App = () => {
  useEffect(() => {
    // Initialize app
    initializeApp();
    
    // Setup notifications
    setupNotifications();
    
    // Hide splash screen
    setTimeout(() => {
      SplashScreen.hide();
    }, 2000);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <SafeAreaProvider>
              <StatusBar 
                barStyle="light-content" 
                backgroundColor="#1e8e3e"
              />
              <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="Auth" component={AuthStackNavigator} />
                  <Stack.Screen name="Main" component={TabNavigator} />
                  <Stack.Screen 
                    name="ProductDetail" 
                    component={ProductDetailScreen}
                    options={{ 
                      headerShown: true,
                      title: 'Product Details',
                      headerStyle: {
                        backgroundColor: '#1e8e3e',
                      },
                      headerTintColor: '#fff',
                    }}
                  />
                  <Stack.Screen 
                    name="ValidationResult" 
                    component={ValidationResultScreen}
                    options={{ 
                      headerShown: true,
                      title: 'Validation Result',
                      headerStyle: {
                        backgroundColor: '#1e8e3e',
                      },
                      headerTintColor: '#fff',
                    }}
                  />
                  <Stack.Screen 
                    name="Leaderboard" 
                    component={LeaderboardScreen}
                    options={{ 
                      headerShown: true,
                      title: 'Leaderboard',
                      headerStyle: {
                        backgroundColor: '#1e8e3e',
                      },
                      headerTintColor: '#fff',
                    }}
                  />
                  <Stack.Screen 
                    name="Achievements" 
                    component={AchievementsScreen}
                    options={{ 
                      headerShown: true,
                      title: 'Achievements',
                      headerStyle: {
                        backgroundColor: '#1e8e3e',
                      },
                      headerTintColor: '#fff',
                    }}
                  />
                  <Stack.Screen 
                    name="Settings" 
                    component={SettingsScreen}
                    options={{ 
                      headerShown: true,
                      title: 'Settings',
                      headerStyle: {
                        backgroundColor: '#1e8e3e',
                      },
                      headerTintColor: '#fff',
                    }}
                  />
                  <Stack.Screen 
                    name="Notifications" 
                    component={NotificationsScreen}
                    options={{ 
                      headerShown: true,
                      title: 'Notifications',
                      headerStyle: {
                        backgroundColor: '#1e8e3e',
                      },
                      headerTintColor: '#fff',
                    }}
                  />
                  <Stack.Screen 
                    name="Map" 
                    component={MapScreen}
                    options={{ 
                      headerShown: true,
                      title: 'Counterfeit Map',
                      headerStyle: {
                        backgroundColor: '#1e8e3e',
                      },
                      headerTintColor: '#fff',
                    }}
                  />
                  <Stack.Screen 
                    name="ARScanner" 
                    component={ARScannerScreen}
                    options={{ 
                      headerShown: true,
                      title: 'AR Scanner',
                      headerStyle: {
                        backgroundColor: '#1e8e3e',
                      },
                      headerTintColor: '#fff',
                    }}
                  />
                </Stack.Navigator>
              </NavigationContainer>
            </SafeAreaProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;