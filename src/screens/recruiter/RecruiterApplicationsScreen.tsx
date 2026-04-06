import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/webStorage';

interface Props {
  navigation: any;
  route: any;
}

export const RecruiterApplicationsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, applications, jobs, updateApplicationStatus, getApplicantProfile } = useApp();
  const [selectedJobId, setSelectedJobId] = useState(route.params?.jobId || null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const myJobs = jobs.filter(job => job.recruiterId === user?.id);
  
  const allApplications = applications.filter(app => 
    myJobs.some(j => j.id === app.jobId)
  );

  const filteredApplications = allApplications.filter(app => {
    const matchesJob = !selectedJobId || app.jobId === selectedJobId;
    const matchesFilter = filter === 'all' || app.status === filter;
    return matchesJob && matchesFilter;
  });

  const getJobDetails = (jobId: string) => {
    return jobs.find(j => j.id === jobId);
  };

  const getSeekerProfile = (seekerId: string) => {
    return getApplicantProfile(seekerId);
  };

  const handleStatusUpdate = (applicationId: string, status: 'approved' | 'rejected') => {
    const action = status === 'approved' ? 'approve' : 'reject';
    Alert.alert(
      `${status === 'approved' ? 'Approve' : 'Reject'} Application`,
      `Are you sure you want to ${action} this application?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await updateApplicationStatus(applicationId, status);
            Alert.alert('Success', `Application ${status}!`);
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Applications</Text>
        <Text style={styles.subtitle}>{filteredApplications.length} application(s)</Text>
      </View>

      <View style={styles.filterSection}>
        <FlatList
          horizontal
          data={[{ id: 'all', name: 'All Jobs' }, ...myJobs]}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.jobFilter, selectedJobId === item.id && styles.jobFilterActive]}
              onPress={() => setSelectedJobId(item.id === 'all' ? null : item.id)}
            >
              <Text style={[styles.jobFilterText, selectedJobId === item.id && styles.jobFilterTextActive]}>
                {'name' in item ? item.name : item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.statusFilter}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.statusButton, filter === status && styles.statusButtonActive]}
            onPress={() => setFilter(status)}
          >
            <Text style={[styles.statusButtonText, filter === status && styles.statusButtonTextActive]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredApplications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const job = getJobDetails(item.jobId);
          const profile = getSeekerProfile(item.seekerId);
          return (
            <View style={styles.applicationCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.applicantName}>{profile?.name || 'Applicant'}</Text>
                  <Text style={styles.applicantEmail}>{item.seekerEmail}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.jobInfo}>
                <Text style={styles.jobTitle}>Applied for: {job?.title}</Text>
                <Text style={styles.appliedDate}>Applied on: {formatDate(item.appliedDate)}</Text>
              </View>

              {profile && (
                <View style={styles.profilePreview}>
                  <Text style={styles.profileTitle}>Profile Preview:</Text>
                  {profile.education && profile.education.length > 0 && (
                    <Text style={styles.profileText}>📚 {profile.education[0].degree}</Text>
                  )}
                  {profile.experience && profile.experience.length > 0 && (
                    <Text style={styles.profileText}>💼 {profile.experience[0].position}</Text>
                  )}
                  {profile.skills && profile.skills.length > 0 && (
                    <Text style={styles.profileText}>⚡ {profile.skills.slice(0, 3).join(', ')}</Text>
                  )}
                </View>
              )}

              {item.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleStatusUpdate(item.id, 'approved')}
                  >
                    <Text style={styles.actionButtonText}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleStatusUpdate(item.id, 'rejected')}
                  >
                    <Text style={styles.actionButtonText}>✕ Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No applications found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  filterSection: {
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  jobFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  jobFilterActive: {
    backgroundColor: '#2563EB',
  },
  jobFilterText: {
    fontSize: 14,
    color: '#666',
  },
  jobFilterTextActive: {
    color: '#fff',
  },
  statusFilter: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  statusButtonActive: {
    backgroundColor: '#2563EB',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  applicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  applicantEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  jobInfo: {
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  appliedDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  profilePreview: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  profileTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  profileText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});