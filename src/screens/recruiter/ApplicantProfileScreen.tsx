import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../../context/AppContext';

interface Props {
  navigation: any;
  route: any;
}

interface ProfileData {
  name?: string;
  phone?: string;
  location?: string;
  email?: string;
  education?: Array<{
    institution: string;
    degree: string;
    year: string;
    _id?: string;
  }>;
  experience?: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
    _id?: string;
  }>;
  skills?: string[];
  resumeUri?: string;
  resumeUrl?: string;
  resumeFileName?: string;
}

export const ApplicantProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { seekerId } = route.params;
  const { getApplicantProfile, getApplicantResumeUrl } = useApp();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getApplicantProfile(seekerId);
      if (data) {
        if (data.profile) {
          setProfile({ ...data.profile, email: data.email });
        } else {
          setProfile(data);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [seekerId, getApplicantProfile]);

  const handleViewResume = useCallback(async () => {
    if (!profile?.resumeUrl && !profile?.resumeUri) {
      Alert.alert('No Resume', 'This applicant has not uploaded a resume');
      return;
    }

    try {
      const resumeData = await getApplicantResumeUrl(seekerId);
      const url = resumeData?.resumeUrl || profile.resumeUrl || profile.resumeUri;
      const fileName = resumeData?.resumeFileName || profile.resumeFileName;
      
      if (!url) {
        Alert.alert('Error', 'Resume URL not available');
        return;
      }

      navigation.navigate('ResumeViewer', { url, fileName });
    } catch (error) {
      Alert.alert('Error', 'Failed to open resume');
    }
  }, [profile?.resumeUrl, profile?.resumeUri, profile?.resumeFileName, seekerId, getApplicantResumeUrl, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Profile not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.name}>{profile.name || 'Unknown'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.infoText}>📧 {profile.email || 'Not provided'}</Text>
          <Text style={styles.infoText}>📱 {profile.phone || 'Not provided'}</Text>
          <Text style={styles.infoText}>📍 {profile.location || 'Not provided'}</Text>
        </View>

        {profile.education && profile.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {profile.education.map((edu: any, index: number) => (
              <View key={index} style={styles.item}>
                <Text style={styles.itemTitle}>{edu.degree}</Text>
                <Text style={styles.itemSubtitle}>{edu.institution} | {edu.year}</Text>
              </View>
            ))}
          </View>
        )}

        {profile.experience && profile.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {profile.experience.map((exp: any, index: number) => (
              <View key={index} style={styles.item}>
                <Text style={styles.itemTitle}>{exp.position}</Text>
                <Text style={styles.itemSubtitle}>{exp.company} | {exp.duration}</Text>
                <Text style={styles.itemDesc}>{exp.description}</Text>
              </View>
            ))}
          </View>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {profile.skills.map((skill: string, index: number) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {(profile.resumeUrl || profile.resumeUri) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resume</Text>
            <TouchableOpacity style={styles.resumeContainer} onPress={handleViewResume}>
              <Icon name="picture-as-pdf" size={24} color="#2563EB" />
              <View style={styles.resumeInfo}>
                <Text style={styles.resumeText}>
                  {profile.resumeFileName || '📄 Resume'}
                </Text>
                <Text style={styles.viewResumeText}>Tap to view</Text>
              </View>
              <Icon name="open-in-new" size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2563EB',
    padding: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 8,
  },
  item: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemDesc: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    color: '#0369A1',
    fontSize: 14,
  },
  resumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  resumeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resumeText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  viewResumeText: {
    color: '#2563EB',
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
});