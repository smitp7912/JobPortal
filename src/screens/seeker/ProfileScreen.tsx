import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/common/Button';
import api from '../../services/api';

interface Props {
  navigation: any;
}

interface Education {
  institution: string;
  degree: string;
  year: string;
}

interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
}

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateProfile, logout } = useApp();

  useEffect(() => {
    if (!user && navigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [user, navigation]);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.profile?.name || '');
  const [phone, setPhone] = useState(user?.profile?.phone || '');
  const [location, setLocation] = useState(user?.profile?.location || '');
  const [education, setEducation] = useState<Education[]>(user?.profile?.education || []);
  const [experience, setExperience] = useState<Experience[]>(user?.profile?.experience || []);
  const [skills, setSkills] = useState(user?.profile?.skills?.join(', ') || '');
  const [resumeUrl, setResumeUrl] = useState(user?.profile?.resumeUrl || '');
  const [resumeFileName, setResumeFileName] = useState(user?.profile?.resumeFileName || '');
  const [uploadingResume, setUploadingResume] = useState(false);

  const handleSave = async () => {
    const profile = {
      name,
      phone,
      location,
      education,
      experience,
      skills: skills.split(',').map((s: string) => s.trim()).filter((s: string) => s),
      resumeUrl,
      resumeFileName,
    };
    await updateProfile(profile);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
      });
      if (!result.canceled) {
        const file = result.assets[0];
        const fileName = file.name || 'resume.pdf';
        
        setUploadingResume(true);
        
        const base64Data = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const response = await api.uploadResume(user?.token, base64Data, fileName);
        
        setUploadingResume(false);
        console.log('Upload response:', response);
        if (response.resumeUrl) {
          setResumeUrl(response.resumeUrl);
          setResumeFileName(response.resumeFileName);
          Alert.alert('Success', 'Resume uploaded successfully!');
        } else {
          Alert.alert('Error', response.message || 'Failed to upload resume');
        }
      }
    } catch (error) {
      setUploadingResume(false);
      console.log('Upload error:', error);
      Alert.alert('Error', 'Failed to upload resume');
    }
  };

  const addEducation = () => {
    setEducation([...education, { institution: '', degree: '', year: '' }]);
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    setExperience([...experience, { company: '', position: '', duration: '', description: '' }]);
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  };

  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name ? name[0].toUpperCase() : 'U'}</Text>
          </View>
          <Text style={styles.userName}>{name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(true)}>
              <Text style={styles.editButton}>{isEditing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Enter location"
                />
              </View>
            </>
          ) : (
            <View>
              <Text style={styles.infoText}>📱 {phone || 'Not set'}</Text>
              <Text style={styles.infoText}>📍 {location || 'Not set'}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Resume</Text>
          </View>
          {uploadingResume ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.uploadingText}>Uploading resume...</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={pickResume}>
              <Text style={styles.uploadButtonText}>
                {resumeUrl ? '📄 Resume Uploaded' : '📤 Upload Resume (PDF)'}
              </Text>
            </TouchableOpacity>
          )}
          {resumeFileName && (
            <Text style={styles.fileNameText}>{resumeFileName}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Education</Text>
            {isEditing && <TouchableOpacity onPress={addEducation}><Text style={styles.addButton}>+ Add</Text></TouchableOpacity>}
          </View>
          {education.map((edu, index) => (
            <View key={index} style={styles.itemCard}>
              {isEditing ? (
                <>
                  <TextInput
                    style={styles.input}
                    value={edu.institution}
                    onChangeText={(v) => updateEducation(index, 'institution', v)}
                    placeholder="Institution"
                  />
                  <TextInput
                    style={styles.input}
                    value={edu.degree}
                    onChangeText={(v) => updateEducation(index, 'degree', v)}
                    placeholder="Degree"
                  />
                  <TextInput
                    style={styles.input}
                    value={edu.year}
                    onChangeText={(v) => updateEducation(index, 'year', v)}
                    placeholder="Year"
                  />
                  <TouchableOpacity onPress={() => removeEducation(index)}>
                    <Text style={styles.removeButton}>Remove</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.itemTitle}>{edu.institution}</Text>
                  <Text style={styles.itemSubtitle}>{edu.degree} - {edu.year}</Text>
                </>
              )}
            </View>
          ))}
          {education.length === 0 && <Text style={styles.emptyText}>No education added</Text>}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {isEditing && <TouchableOpacity onPress={addExperience}><Text style={styles.addButton}>+ Add</Text></TouchableOpacity>}
          </View>
          {experience.map((exp, index) => (
            <View key={index} style={styles.itemCard}>
              {isEditing ? (
                <>
                  <TextInput
                    style={styles.input}
                    value={exp.company}
                    onChangeText={(v) => updateExperience(index, 'company', v)}
                    placeholder="Company"
                  />
                  <TextInput
                    style={styles.input}
                    value={exp.position}
                    onChangeText={(v) => updateExperience(index, 'position', v)}
                    placeholder="Position"
                  />
                  <TextInput
                    style={styles.input}
                    value={exp.duration}
                    onChangeText={(v) => updateExperience(index, 'duration', v)}
                    placeholder="Duration"
                  />
                  <TextInput
                    style={[styles.input, { height: 60 }]}
                    value={exp.description}
                    onChangeText={(v) => updateExperience(index, 'description', v)}
                    placeholder="Description"
                    multiline
                  />
                  <TouchableOpacity onPress={() => removeExperience(index)}>
                    <Text style={styles.removeButton}>Remove</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.itemTitle}>{exp.position}</Text>
                  <Text style={styles.itemSubtitle}>{exp.company} | {exp.duration}</Text>
                  <Text style={styles.itemDesc}>{exp.description}</Text>
                </>
              )}
            </View>
          ))}
          {experience.length === 0 && <Text style={styles.emptyText}>No experience added</Text>}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skills</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={skills}
              onChangeText={setSkills}
              placeholder="Enter skills (comma separated)"
              multiline
            />
          ) : (
            <View style={styles.skillsContainer}>
              {user?.profile?.skills?.map((skill: string, index: number) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
              {(!user?.profile?.skills || user.profile.skills.length === 0) && (
                <Text style={styles.emptyText}>No skills added</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.logoutSection}>
          <Button title="Logout" onPress={handleLogout} variant="danger" />
        </View>
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
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  userEmail: {
    fontSize: 14,
    color: '#dbeafe',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  addButton: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  uploadButton: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  itemCard: {
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
  removeButton: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
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
  logoutSection: {
    padding: 16,
    marginTop: 10,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  uploadingText: {
    marginLeft: 8,
    color: '#2563EB',
    fontSize: 14,
  },
  fileNameText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});