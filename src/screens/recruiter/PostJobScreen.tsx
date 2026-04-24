import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp, Job } from '../../context/AppContext';
import { Button } from '../../components/common/Button';
import { CATEGORIES, JOB_TYPES } from '../../data/constants';

interface Props {
  navigation: any;
  route: any;
}

export const PostJobScreen: React.FC<Props> = ({ navigation, route }) => {
  const { postJob, updateJob, user } = useApp();
  const editJob = route.params?.job as Job | undefined;
  const isEditing = !!editJob;
  
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState(user?.companyName || '');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (editJob) {
      setTitle(editJob.title || '');
      setCompany(editJob.company || '');
      setDescription(editJob.description || '');
      setLocation(editJob.location || '');
      setSalary(editJob.salary || '');
      setSelectedCategory(editJob.category || '');
      setSelectedJobType(editJob.jobType || '');
      setRequirements(editJob.requirements?.join(', ') || '');
    }
  }, [editJob]);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Job' : 'Post a New Job',
    });
  }, [navigation, isEditing]);

  const requirementsList = useMemo(() => 
    requirements.split(',').map(r => r.trim()).filter(r => r),
    [requirements]
  );

  const handleSubmit = useCallback(async () => {
    if (!title || !company || !description || !location || !salary || !selectedCategory || !selectedJobType) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        const jobId = editJob._id || editJob.id;
        await updateJob(jobId, {
          title,
          company,
          description,
          location,
          salary,
          category: selectedCategory,
          jobType: selectedJobType,
          requirements: requirementsList,
        });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setTitle('');
        setCompany(user?.companyName || '');
        setDescription('');
        setLocation('');
        setSalary('');
        setSelectedCategory('');
        setSelectedJobType('');
        setRequirements('');
        setTimeout(() => navigation.goBack(), 1000);
      } else {
        await postJob({
          title,
          company,
          companyLogo: `https://placehold.co/100x100/2563EB/FFFFFF?text=${encodeURIComponent(company.charAt(0))}`,
          description,
          location,
          salary,
          category: selectedCategory,
          jobType: selectedJobType,
          requirements: requirementsList,
        });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setTitle('');
        setCompany(user?.companyName || '');
        setDescription('');
        setLocation('');
        setSalary('');
        setSelectedCategory('');
        setSelectedJobType('');
        setRequirements('');
      }
    } catch (error: any) {
      console.error('Job error:', error);
      Alert.alert('Error', error.message || `Failed to ${isEditing ? 'update' : 'post'} job. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [title, company, description, location, salary, selectedCategory, selectedJobType, requirementsList, postJob, updateJob, navigation, user, isEditing, editJob]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? 'Edit Job' : 'Post a New Job'}</Text>
          <Text style={styles.subtitle}>{isEditing ? 'Update job details' : 'Find the perfect candidate'}</Text>
        </View>

        {showSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>Job posted successfully!</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Senior Developer"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              value={company}
              onChangeText={setCompany}
              placeholder="Your company name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Bangalore, Karnataka"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Salary Range *</Text>
            <TextInput
              style={styles.input}
              value={salary}
              onChangeText={setSalary}
              placeholder="e.g. 10-15 LPA"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionsRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.optionChip, selectedCategory === cat.id && styles.optionChipActive]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text style={[styles.optionText, selectedCategory === cat.id && styles.optionTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Type *</Text>
            <View style={styles.optionsRow}>
              {JOB_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.optionChip, selectedJobType === type && styles.optionChipActive]}
                  onPress={() => setSelectedJobType(type)}
                >
                  <Text style={[styles.optionText, selectedJobType === type && styles.optionTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the job role and responsibilities..."
              multiline
              numberOfLines={5}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Requirements (comma separated)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={requirements}
              onChangeText={setRequirements}
              placeholder="e.g. React Native, TypeScript, 3+ years experience"
              multiline
              numberOfLines={3}
            />
          </View>

          <Button title={isEditing ? 'Update Job' : 'Post Job'} onPress={handleSubmit} loading={loading} />
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
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextActive: {
    color: '#fff',
  },
  successBanner: {
    backgroundColor: '#10B981',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  successText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});