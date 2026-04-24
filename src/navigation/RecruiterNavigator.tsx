import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { RecruiterDashboardScreen } from '../screens/recruiter/RecruiterDashboardScreen';
import { RecruiterApplicationsScreen } from '../screens/recruiter/RecruiterApplicationsScreen';
import { PostJobScreen } from '../screens/recruiter/PostJobScreen';
import { ApplicantProfileScreen } from '../screens/recruiter/ApplicantProfileScreen';
import { JobDetailsScreen } from '../screens/seeker/JobDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ApplicationsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ApplicationsList" component={RecruiterApplicationsScreen} />
    <Stack.Screen 
      name="ApplicantProfile" 
      component={ApplicantProfileScreen}
      options={{ headerShown: true, title: 'Applicant Profile' }}
    />
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

export const RecruiterTabs = () => {
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
        name="Dashboard"
        component={RecruiterDashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="PostJob"
        component={PostJobScreen}
        options={{
          tabBarLabel: 'Post Job',
          tabBarIcon: ({ focused }) => <TabIcon icon="➕" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Applications"
        component={ApplicationsStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
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