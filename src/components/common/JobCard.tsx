import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Image } from 'react-native';
import { Job } from '../../context/AppContext';
import { formatDate } from '../../utils/webStorage';

interface JobCardProps {
  job: Job;
  onPress: () => void;
  showApplyButton?: boolean;
  onApply?: () => void;
  isApplied?: boolean;
  isSaved?: boolean;
  onSave?: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onPress,
  showApplyButton,
  onApply,
  isApplied,
  isSaved,
  onSave,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Image source={{ uri: job.companyLogo }} style={styles.logo} />
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>
        </View>
        {onSave && (
          <TouchableOpacity onPress={onSave} style={styles.saveButton}>
            <Text style={styles.saveIcon}>{isSaved ? '★' : '☆'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.details}>
        <Text style={styles.detailText}>📍 {job.location}</Text>
        <Text style={styles.detailText}>💰 {job.salary}</Text>
        <Text style={styles.detailText}>💼 {job.jobType}</Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>{job.description}</Text>

      <View style={styles.footer}>
        <Text style={styles.postedDate}>Posted: {formatDate(job.postedDate)}</Text>
        {showApplyButton && onApply && (
          <TouchableOpacity 
            style={[styles.applyButton, isApplied && styles.appliedButton]} 
            onPress={onApply}
            disabled={isApplied}
          >
            <Text style={styles.applyButtonText}>
              {isApplied ? 'Applied' : 'Apply Now'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  company: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  saveButton: {
    padding: 8,
  },
  saveIcon: {
    fontSize: 24,
    color: '#FFD700',
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#555',
    marginRight: 16,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postedDate: {
    fontSize: 12,
    color: '#999',
  },
  applyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  appliedButton: {
    backgroundColor: '#10B981',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});