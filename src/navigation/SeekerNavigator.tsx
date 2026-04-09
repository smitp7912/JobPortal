import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { SeekerHomeScreen } from '../screens/seeker/SeekerHomeScreen';
import { SearchScreen } from '../screens/seeker/SearchScreen';
import { ApplicationsScreen } from '../screens/seeker/ApplicationsScreen';
import { SavedJobsScreen } from '../screens/seeker/SavedJobsScreen';
import { ProfileScreen } from '../screens/seeker/ProfileScreen';
import { Tooltip } from '../components/common/Tooltip';

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, focused, tooltip }: { icon: string; focused: boolean; tooltip: string }) => (
  <Tooltip tooltip={tooltip}>
    <View style={styles.iconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
    </View>
  </Tooltip>
);

export const SeekerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={SeekerHomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} tooltip="Home - Browse jobs" />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🔍" focused={focused} tooltip="Search - Find jobs" />,
        }}
      />
      <Tab.Screen
        name="Applications"
        component={ApplicationsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} tooltip="Applications - Your applications" />,
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedJobsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="⭐" focused={focused} tooltip="Saved - Saved jobs" />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} tooltip="Profile - Your profile" />,
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
    paddingBottom: 8,
    paddingTop: 8,
    height: 60,
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