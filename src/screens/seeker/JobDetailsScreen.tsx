import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../utils/webStorage';

interface Props {
  navigation: any;
  route: any;
}

export const JobDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { job } = route.params;
  const { user, applyForJob, applications, saveJob } = useApp();
  const [isApplied, setIsApplied] = useState(
    applications.some(app => app.jobId === job.id && app.seekerId === user?.id)
  );

  const handleApply = () => {
    Alert.alert(
      'Apply for Job',
      `Are you sure you want to apply for ${job.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            await applyForJob(job.id);
            setIsApplied(true);
            Alert.alert('Success', 'Your application has been submitted!');
          },
        },
      ]
    );
  };

  const handleSave = () => {
    saveJob(job.id);
    Alert.alert('Saved', 'Job saved to your favorites!');
  };

  const getCategoryName = (categoryId: string) => {
    const categories: any = {
      '1': 'IT & Software',
      '2': 'Marketing',
      '3': 'Sales',
      '4': 'Finance',
      '5': 'HR',
      '6': 'Design',
      '7': 'Engineering',
      '8': 'Education',
      '9': 'Healthcare',
      '10': 'Other',
    };
    return categories[categoryId] || 'Other';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Image source={{ uri: job.companyLogo }} style={styles.logo} />
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{job.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>💰</Text>
            <Text style={styles.infoText}>{job.salary}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>💼</Text>
            <Text style={styles.infoText}>{job.jobType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📂</Text>
            <Text style={styles.infoText}>{getCategoryName(job.category)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoText}>Posted: {formatDate(job.postedDate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {job.requirements.map((req: string, index: number) => (
            <View key={index} style={styles.requirementItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company</Text>
          <Text style={styles.companyDesc}>{job.company}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveIcon}>☆</Text>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
        <View style={styles.applyButtonContainer}>
          <Button
            title={isApplied ? 'Applied' : 'Apply Now'}
            onPress={handleApply}
            disabled={isApplied}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  company: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  infoContainer: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
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
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  requirementItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#2563EB',
    marginRight: 8,
  },
  requirementText: {
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  companyDesc: {
    fontSize: 15,
    color: '#555',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 8,
    marginRight: 12,
  },
  saveIcon: {
    fontSize: 20,
    color: '#2563EB',
    marginRight: 6,
  },
  saveText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  applyButtonContainer: {
    flex: 1,
  },
});