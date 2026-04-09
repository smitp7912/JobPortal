import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { RecruiterDashboardScreen } from '../screens/recruiter/RecruiterDashboardScreen';
import { RecruiterApplicationsScreen } from '../screens/recruiter/RecruiterApplicationsScreen';
import { PostJobScreen } from '../screens/recruiter/PostJobScreen';
import { Tooltip } from '../components/common/Tooltip';

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, focused, tooltip }: { icon: string; focused: boolean; tooltip: string }) => (
  <Tooltip tooltip={tooltip}>
    <View style={styles.iconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
    </View>
  </Tooltip>
);

export const RecruiterTabs = () => {
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
        name="Dashboard"
        component={RecruiterDashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} tooltip="Dashboard - View your jobs" />,
        }}
      />
      <Tab.Screen
        name="PostJob"
        component={PostJobScreen}
        options={{
          tabBarLabel: 'Post Job',
          tabBarIcon: ({ focused }) => <TabIcon icon="➕" focused={focused} tooltip="Post Job - Create new listing" />,
        }}
      />
      <Tab.Screen
        name="Applications"
        component={RecruiterApplicationsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} tooltip="Applications - View applicants" />,
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