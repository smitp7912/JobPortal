import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp, Job } from '../../context/AppContext';
import { formatDate } from '../../utils/webStorage';
import { Tooltip } from '../../components/common/Tooltip';

interface Props {
  navigation: any;
}

export const RecruiterDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, jobs, applications, deleteJob, logout, refreshApplications, refreshJobs } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshJobs(), refreshApplications()]);
    setRefreshing(false);
  }, [refreshJobs, refreshApplications]);

  const getJobId = useCallback((jobId: Job | string): string => {
    if (typeof jobId === 'object') {
      return jobId._id || jobId.id;
    }
    return jobId;
  }, []);

  const myJobs = useMemo(() => 
    jobs.filter(job => job.recruiterId === user?.id),
    [jobs, user?.id]
  );

  const applicationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    myJobs.forEach(job => {
      const jobId = job._id || job.id;
      const count = applications.filter(app => {
        const appJobId = getJobId(app.jobId);
        return appJobId === jobId;
      }).length;
      counts[jobId] = count;
      if (job.id && job.id !== jobId) {
        counts[job.id] = count;
      }
    });
    return counts;
  }, [myJobs, applications, getJobId]);

  const pendingCount = useMemo(() => 
    applications.filter(app => {
      const appJobId = getJobId(app.jobId);
      return myJobs.some(j => (j._id || j.id) === appJobId) && app.status === 'pending';
    }).length,
    [applications, myJobs, getJobId]
  );

  const approvedCount = useMemo(() => 
    applications.filter(app => {
      const appJobId = getJobId(app.jobId);
      return myJobs.some(j => (j._id || j.id) === appJobId) && app.status === 'approved';
    }).length,
    [applications, myJobs, getJobId]
  );

  const handleDeleteJob = useCallback((jobId: string) => {
    const count = applicationCounts[jobId] || 0;
    const message = count > 0 
      ? `${count} application(s) are available on this job. Are you sure you want to delete it?`
      : 'Are you sure you want to delete this job?';
    
    Alert.alert('Delete Job', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteJob(jobId) },
    ]);
  }, [deleteJob, applicationCounts]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome!</Text>
        <Text style={styles.companyName}>{user?.companyName || 'Company'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{myJobs.length}</Text>
          <Text style={styles.statLabel}>Active Jobs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending Apps</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {applications.filter(app => {
              const appJobId = getJobId(app.jobId);
              return myJobs.some(j => j.id === appJobId) && app.status === 'approved';
            }).length}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Tooltip tooltip="Post a new job opening">
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('PostJob')}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>Post New Job</Text>
          </TouchableOpacity>
        </Tooltip>
        <Tooltip tooltip="View all job applications">
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Applications')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>View Applications</Text>
          </TouchableOpacity>
        </Tooltip>
      </View>

      <View style={styles.logoutContainer}>
        <Tooltip tooltip="Logout from your account">
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪 Logout</Text>
          </TouchableOpacity>
        </Tooltip>
      </View>

      <View style={styles.jobsSection}>
        <Text style={styles.sectionTitle}>My Posted Jobs</Text>
      </View>

      <FlatList
        data={myJobs}
        keyExtractor={(item) => item._id || item.id || ''}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.jobCard}
            onPress={() => navigation.navigate('Applications', { screen: 'ApplicationsList', params: { jobId: item._id || item.id } })}
          >
            <View style={styles.jobHeader}>
              <View style={styles.jobInfo}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <Text style={styles.jobCompany}>{item.company}</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => navigation.navigate('PostJob', { job: item })}>
                  <Text style={styles.editIcon}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteJob(item._id || item.id)}>
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.jobDetails}>
              <Text style={styles.jobDetail}>📍 {item.location}</Text>
              <Text style={styles.jobDetail}>💰 {item.salary}</Text>
              <Text style={styles.jobDetail}>💼 {item.jobType}</Text>
            </View>
            <View style={styles.applicationCount}>
              <Text style={styles.applicationCountText}>
                {applicationCounts[item._id || item.id] || 0} application(s)
              </Text>
              <Text style={styles.postedDate}>Posted: {formatDate(item.postedDate)}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No jobs posted yet</Text>
            <TouchableOpacity 
              style={styles.postJobButton}
              onPress={() => navigation.navigate('PostJob')}
            >
              <Text style={styles.postJobText}>Post Your First Job</Text>
            </TouchableOpacity>
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
    backgroundColor: '#2563EB',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  companyName: {
    fontSize: 14,
    color: '#dbeafe',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  jobsSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  listContent: {
    padding: 16,
  },
  jobCard: {
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
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  jobCompany: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editIcon: {
    fontSize: 20,
  },
  deleteIcon: {
    fontSize: 20,
  },
  jobDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  jobDetail: {
    fontSize: 13,
    color: '#666',
    marginRight: 16,
    marginBottom: 4,
  },
  applicationCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  applicationCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  postedDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  postJobButton: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  postJobText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});