import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { SeekerHomeScreen } from '../screens/seeker/SeekerHomeScreen';
import { SearchScreen } from '../screens/seeker/SearchScreen';
import { ApplicationsScreen } from '../screens/seeker/ApplicationsScreen';
import { SavedJobsScreen } from '../screens/seeker/SavedJobsScreen';
import { ProfileScreen } from '../screens/seeker/ProfileScreen';
import { SeekerProfileScreen } from '../screens/seeker/SeekerProfileScreen';
import { JobDetailsScreen } from '../screens/seeker/JobDetailsScreen';

const ProfileComponent = Platform.OS === 'web' ? SeekerProfileScreen : ProfileScreen;

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ApplicationsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ApplicationsList" component={ApplicationsScreen} />
    <Stack.Screen 
      name="JobDetails" 
      component={JobDetailsScreen}
      options={{ headerShown: true, title: 'Job Details' }}
    />
  </Stack.Navigator>
);

const SavedStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SavedJobsList" component={SavedJobsScreen} />
    <Stack.Screen 
      name="JobDetails" 
      component={JobDetailsScreen}
      options={{ headerShown: true, title: 'Job Details' }}
    />
  </Stack.Navigator>
);

const TabIcon = React.memo(({ icon, focused }: { icon: string; focused: boolean }) => {
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
    </View>
  );
});

export const SeekerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: styles.tabLabel,
        lazy: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={SeekerHomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🔍" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Applications"
        component={ApplicationsStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="⭐" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileComponent}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 70 : 60,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 20,
  },
  tabIconActive: {
    transform: [{ scale: 1.1 }],
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});