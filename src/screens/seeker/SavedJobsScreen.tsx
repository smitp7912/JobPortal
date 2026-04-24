import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JobCard } from '../../components/common/JobCard';
import { useApp } from '../../context/AppContext';

interface Props {
  navigation: any;
}

export const SavedJobsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, getSavedJobs, applyForJob, applications, saveJob } = useApp();
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  
  const savedJobs = useMemo(() => {
    return getSavedJobs();
  }, [user?.profile?.savedJobs, getSavedJobs]);

  const getApplicationStatus = useCallback((jobId: string): 'pending' | 'approved' | 'rejected' | null => {
    if (!applications || !Array.isArray(applications)) return null;
    const app = applications.find(app => {
      if (!app || !app.jobId || !app.seekerId) return false;
      const jobIdValue = typeof app.jobId === 'object' ? app.jobId._id || app.jobId.id : app.jobId;
      return jobIdValue === jobId && app.seekerId === user?.id;
    });
    return app?.status || null;
  }, [applications, user?.id]);

  const handleApply = useCallback(async (jobId: string) => {
    const status = getApplicationStatus(jobId);
    if (status) return;
    setApplyingJobId(jobId);
    await applyForJob(jobId);
    setApplyingJobId(null);
  }, [applyForJob, getApplicationStatus]);

  const handleSave = useCallback(async (jobId: string) => {
    await saveJob(jobId);
  }, [saveJob]);

  const isSaved = useCallback((jobId: string) => {
    const seeker = user?.profile;
    return seeker?.savedJobs?.includes(jobId);
  }, [user?.profile]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Jobs</Text>
        <Text style={styles.subtitle}>{savedJobs.length} job(s) saved</Text>
      </View>

      <FlatList
        data={savedJobs}
        keyExtractor={(item) => item._id || item.id || ''}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => navigation.navigate('Saved', { screen: 'JobDetails', params: { job: item } })}
            showApplyButton
            onApply={() => handleApply(item.id)}
            applicationStatus={getApplicationStatus(item.id)}
            isApplying={applyingJobId === item.id}
            onSave={() => handleSave(item.id)}
            isSaved={isSaved(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved jobs</Text>
            <Text style={styles.emptySubtext}>Save jobs you're interested in to view them here</Text>
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
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});