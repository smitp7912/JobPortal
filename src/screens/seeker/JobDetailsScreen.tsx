import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/webStorage';
import { Tooltip } from '../../components/common/Tooltip';
import { DEFAULT_LOGO, getValidLogoUrl } from '../../utils/logoUtils';

interface Props {
  navigation: any;
  route: any;
}

export const JobDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { job: rawJob } = route.params;
  const { user, applyForJob, applications, saveJob } = useApp();
  const [isApplying, setIsApplying] = useState(false);
  const [imageError, setImageError] = useState(false);

  const job = useMemo(() => {
    if (!rawJob) return null;
    return {
      ...rawJob,
      companyLogo: getValidLogoUrl(rawJob.companyLogo)
    };
  }, [rawJob]);

  useEffect(() => {
    console.log('JobDetails rawJob.companyLogo:', rawJob?.companyLogo);
    console.log('JobDetails fixed companyLogo:', job?.companyLogo);
  }, [rawJob?.companyLogo, job?.companyLogo]);

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Job not found</Text>
      </SafeAreaView>
    );
  }

  const logoUrl = useMemo(() => {
    const url = getValidLogoUrl(job.companyLogo);
    return url;
  }, [job.companyLogo]);

  const applicationStatus = useMemo((): 'pending' | 'approved' | 'rejected' | null => {
    if (!applications || !Array.isArray(applications)) return null;
    const app = applications.find(app => {
      if (!app || !app.jobId || !app.seekerId) return false;
      const jobIdValue = typeof app.jobId === 'object' ? app.jobId._id || app.jobId.id : app.jobId;
      return jobIdValue === job.id && app.seekerId === user?.id;
    });
    return app?.status || null;
  }, [applications, job.id, user?.id]);

  const isApplied = applicationStatus !== null;
  const isDisabled = applicationStatus !== null && applicationStatus !== undefined;

  const isSaved = useMemo(() => 
    user?.profile?.savedJobs?.includes(job.id) || false
  , [user?.profile?.savedJobs, job.id]);

  const getButtonText = () => {
    switch (applicationStatus) {
      case 'approved': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Applied';
      default: return 'Apply Now';
    }
  };

  const getButtonStyle = () => {
    switch (applicationStatus) {
      case 'approved': return styles.acceptedButton;
      case 'rejected': return styles.rejectedButton;
      case 'pending': return styles.pendingButton;
      default: return styles.applyButton;
    }
  };

  const handleApply = async () => {
    if (isApplying || isDisabled) return;
    if (!user?.token) {
      Alert.alert('Error', 'Please login to apply for jobs');
      return;
    }
    setIsApplying(true);
    const response: any = await applyForJob(job.id);
    setIsApplying(false);
    if (response && typeof response === 'object' && 'message' in response) {
      const message = response.message as string;
      if (message === 'Application submitted successfully') {
        Alert.alert('Success', 'Your application has been submitted!');
      } else if (message.includes('already')) {
        Alert.alert('Info', 'You have already applied for this job');
      } else if (message === 'Invalid token' || message === 'Unauthorized') {
        Alert.alert('Error', 'Session expired. Please login again.');
      } else {
        Alert.alert('Error', message || 'Failed to apply. Please try again.');
      }
    }
  };

  const handleSave = async () => {
    if (!user?.token) {
      Alert.alert('Error', 'Please login to save jobs');
      return;
    }
    await saveJob(job.id);
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
      '11': 'System',
    };
    return categories[categoryId] || 'Other';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Image 
            source={{ uri: imageError ? DEFAULT_LOGO : logoUrl }} 
            style={styles.logo}
            onError={(e) => {
              console.log('Image load error:', e.nativeEvent.error);
              setImageError(true);
            }}
            onLoad={() => setImageError(false)}
          />
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
        <Tooltip tooltip={isSaved ? "Remove from saved jobs" : "Save this job for later"}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveIcon}>{isSaved ? '★' : '☆'}</Text>
            <Text style={styles.saveText}>{isSaved ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>
        </Tooltip>
        <View style={styles.applyButtonContainer}>
          <TouchableOpacity
            style={[styles.applyButton, getButtonStyle(), isApplying && styles.applyingButton]}
            onPress={handleApply}
            disabled={isDisabled || isApplying}
          >
            {isApplying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.applyButtonText}>{getButtonText()}</Text>
            )}
          </TouchableOpacity>
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
  applyButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  acceptedButton: {
    backgroundColor: '#10B981',
  },
  rejectedButton: {
    backgroundColor: '#EF4444',
  },
  pendingButton: {
    backgroundColor: '#F59E0B',
  },
  applyingButton: {
    backgroundColor: '#93C5FD',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});