import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JobCard } from '../../components/common/JobCard';
import { Logo } from '../../components/common/Logo';
import { useApp } from '../../context/AppContext';
import { CATEGORIES } from '../../data/constants';

interface Props {
  navigation: any;
}

export const SeekerHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { jobs, user, applyForJob, applications, saveJob } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  const filteredJobs = useMemo(() => 
    jobs.filter(job => {
      const matchesSearch = !searchQuery || 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.location || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === null || selectedCategory === '' || job.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }), [jobs, searchQuery, selectedCategory]
  );

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
    if (!applications || !Array.isArray(applications)) return;
    const status = getApplicationStatus(jobId);
    if (status) return;
    setApplyingJobId(jobId);
    await applyForJob(jobId);
    setApplyingJobId(null);
  }, [applyForJob, getApplicationStatus, applications]);

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
        <Logo size="small" color="#fff" />
        <View style={styles.headerRight}>
          <Text style={styles.greeting}>Hello, {user?.profile?.name || 'Job Seeker'}!</Text>
          <Text style={styles.subtitle}>Find your dream job</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs, companies..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={[{ id: null, name: 'All', icon: 'briefcase' }, ...CATEGORIES]}
          keyExtractor={(item) => item.id || 'all'}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategory === item.id && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text style={[styles.categoryText, selectedCategory === item.id && styles.categoryTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item._id || item.id || ''}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => navigation.navigate('Applications', { screen: 'JobDetails', params: { job: item } })}
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
            <Text style={styles.emptyText}>No jobs found</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#dbeafe',
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 20,
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