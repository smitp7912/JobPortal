import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp, Job } from '../../context/AppContext';
import { formatDate } from '../../utils/webStorage';

interface Props {
  navigation: any;
  route: any;
}

export const RecruiterApplicationsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, applications, jobs, updateApplicationStatus, getApplicantProfile, refreshApplications } = useApp();
  const [selectedJobId, setSelectedJobId] = useState(route.params?.jobId || null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [seekerProfiles, setSeekerProfiles] = useState<Record<string, any>>({});
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const myJobs = useMemo(() => 
    jobs.filter(job => job.recruiterId === user?.id),
    [jobs, user?.id]
  );

  const getJobId = useCallback((jobId: Job | string): string => {
    if (typeof jobId === 'object') {
      return jobId._id || jobId.id;
    }
    return jobId;
  }, []);

  const allApplications = useMemo(() => 
    applications.filter(app => {
      const appJobId = getJobId(app.jobId);
      return myJobs.some(j => j.id === appJobId);
    }),
    [applications, myJobs, getJobId]
  );

  const filteredApplications = useMemo(() =>
    allApplications.filter(app => {
      const appJobId = getJobId(app.jobId);
      const matchesJob = !selectedJobId || appJobId === selectedJobId;
      const matchesFilter = filter === 'all' || app.status === filter;
      return matchesJob && matchesFilter;
    }),
    [allApplications, selectedJobId, filter, getJobId]
  );

  const fetchProfiles = useCallback(async () => {
    const uniqueSeekerIds = [...new Set(allApplications.map(app => app.seekerId))];
    if (uniqueSeekerIds.length === 0) return;
    
    setProfilesLoading(true);
    const newProfiles: Record<string, any> = {};
    for (const seekerId of uniqueSeekerIds) {
      if (!seekerProfiles[seekerId]) {
        const profile = await getApplicantProfile(seekerId);
        newProfiles[seekerId] = profile;
      }
    }
    if (Object.keys(newProfiles).length > 0) {
      setSeekerProfiles(prev => ({ ...prev, ...newProfiles }));
    }
    setProfilesLoading(false);
  }, [allApplications, getApplicantProfile, seekerProfiles]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshApplications();
    setSeekerProfiles({});
    await fetchProfiles();
    setRefreshing(false);
  }, [refreshApplications, fetchProfiles]);

  useEffect(() => {
    if (allApplications.length > 0) {
      fetchProfiles();
    }
  }, [allApplications, fetchProfiles]);

  const getJobDetails = (jobId: string) => {
    return jobs.find(j => j.id === jobId);
  };

  const handleStatusUpdate = async (applicationId: string, status: 'approved' | 'rejected') => {
    const action = status === 'approved' ? 'approve' : 'reject';
    Alert.alert(
      `${status === 'approved' ? 'Approve' : 'Reject'} Application`,
      `Are you sure you want to ${action} this application?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdatingId(applicationId);
            try {
              await updateApplicationStatus(applicationId, status);
              Alert.alert('Success', `Application ${status} successfully!`);
            } catch (error: any) {
              console.error('Status update error:', error);
              Alert.alert('Error', error.message || 'Failed to update status. Please try again.');
            } finally {
              setUpdatingId(null);
            }
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
        keyExtractor={(item) => item._id || item.id || ''}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const appJobId = getJobId(item.jobId);
          const job = typeof item.jobId === 'object' ? item.jobId : getJobDetails(appJobId);
          const profile = seekerProfiles[item.seekerId];
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

              <TouchableOpacity
                style={styles.viewProfileButton}
                onPress={() => navigation.navigate('ApplicantProfile', { seekerId: item.seekerId })}
              >
                <Text style={styles.viewProfileText}>View Full Profile →</Text>
              </TouchableOpacity>

              {item.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton, updatingId === (item._id || item.id) && styles.actionButtonDisabled]}
                    onPress={() => handleStatusUpdate(item._id || item.id || '', 'approved')}
                    disabled={updatingId === (item._id || item.id)}
                  >
                    <Text style={styles.actionButtonText}>
                      {updatingId === (item._id || item.id) ? '...' : '✓ Approve'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton, updatingId === (item._id || item.id) && styles.actionButtonDisabled]}
                    onPress={() => handleStatusUpdate(item._id || item.id || '', 'rejected')}
                    disabled={updatingId === (item._id || item.id)}
                  >
                    <Text style={styles.actionButtonText}>
                      {updatingId === (item._id || item.id) ? '...' : '✕ Reject'}
                    </Text>
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
  actionButtonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  viewProfileButton: {
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewProfileText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});