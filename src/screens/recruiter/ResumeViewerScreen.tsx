import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';

interface Props {
  navigation: any;
  route: any;
}

type DownloadStatus = 'idle' | 'downloading' | 'completed' | 'error';

export const ResumeViewerScreen: React.FC<Props> = ({ route }) => {
  const { url, fileName } = route.params;
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('idle');
  const [localUri, setLocalUri] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isWeb = Platform.OS === 'web';
  // Removed isRawUrl check - always use download flow for consistent behavior

  console.log('[DEBUG] ResumeViewerScreen - url:', url);
  console.log('[DEBUG] ResumeViewerScreen - fileName from params:', fileName);

  const getLocalFileName = () => 'resume.pdf';

  const downloadResume = async () => {
    try {
      setDownloadStatus('downloading');
      setErrorMessage('');

      const fileName = getLocalFileName();
      
      // Use documentDirectory for more reliable storage
      const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      
      // Delete existing file if any
      const existingFileUri = `${docDir}${fileName}`;
      try {
        const existingInfo = await FileSystem.getInfoAsync(existingFileUri);
        if (existingInfo.exists) {
          await FileSystem.deleteAsync(existingFileUri, { idempotent: true });
        }
      } catch (e) {
        // Ignore - file might not exist
      }
      
      const fileUri = existingFileUri;
      console.log('[DEBUG] Downloading to:', fileUri);
      console.log('[DEBUG] Using filename:', fileName);
      
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      console.log('[DEBUG] Download status:', downloadResult.status);
      console.log('[DEBUG] Downloaded URI:', downloadResult.uri);

      if (downloadResult.status === 200) {
        const downloadedUri = downloadResult.uri;
        setLocalUri(downloadedUri);
        
        // Get file info to verify
        const fileInfo = await FileSystem.getInfoAsync(downloadedUri);
        console.log('[DEBUG] File info:', fileInfo);
        console.log('[DEBUG] localUri set to:', downloadedUri);
        console.log('[DEBUG] localUri ends with:', downloadedUri.split('/').pop());
        
        setDownloadStatus('completed');
        
        // Show success with exact filename
        const savedPath = downloadResult.uri;
        Alert.alert(
          '✅ Download Complete', 
          `File saved as: ${fileName}\n\nLocation: ${savedPath}\n\nYou can find this file in your app's documents folder.`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Download failed with status: ' + downloadResult.status);
      }
    } catch (error: any) {
      console.error('Download error:', error);
      setErrorMessage(error.message || 'Failed to download resume');
      setDownloadStatus('error');
      Alert.alert('❌ Error', 'Failed to download resume: ' + error.message);
    }
  };

  const openResume = async () => {
    if (!localUri) {
      Alert.alert('Error', 'Please download the resume first');
      return;
    }

    console.log('[DEBUG] openResume - localUri:', localUri);
    console.log('[DEBUG] openResume - filename in path:', localUri.split('/').pop());

    try {
      await FileSystem.openAsync(localUri);
    } catch (error: any) {
      console.error('Open error:', error);
      Alert.alert('Error', 'Could not open the resume: ' + error.message);
    }
  };

  const saveToDevice = async () => {
    if (!localUri) {
      Alert.alert('Error', 'Please download the resume first');
      return;
    }

    try {
      const fileName = getLocalFileName();
      const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const destUri = `${docDir}${fileName}`;
      
      console.log('[DEBUG] saveToDevice - from:', localUri);
      console.log('[DEBUG] saveToDevice - to:', destUri);
      console.log('[DEBUG] saveToDevice - filename:', fileName);
      
      // Copy to ensure we have it in document directory
      await FileSystem.copyAsync({
        from: localUri,
        to: destUri
      });

      console.log('[DEBUG] saveToDevice - success');
      
      // Verify the file
      const fileInfo = await FileSystem.getInfoAsync(destUri);
      console.log('[DEBUG] saveToDevice - file info:', fileInfo);
      
      Alert.alert(
        '✅ Saved!', 
        `File: ${fileName}\n\nSaved to app documents.\nAccess via Files app > Browse > JobPortal2`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Could not save to device: ' + error.message);
    }
  };

  const openInBrowser = () => {
    const { Linking } = require('react-native');
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open URL');
    });
  };

  // Web: Use fetch-as-blob for reliable download
  if (isWeb) {
    const handleWebDownload = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch file');
        }
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = getLocalFileName();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } catch (error: any) {
        console.error('Download error:', error);
        Alert.alert('Error', 'Failed to download resume. Please try opening in a new tab.');
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.containerCenter}>
          <Text style={styles.icon}>📄</Text>
          <Text style={styles.title}>Resume</Text>
          <Text style={styles.fileName}>{fileName}</Text>
          <Text style={styles.description}>
            Download the resume to your device
          </Text>
          <TouchableOpacity style={styles.downloadButton} onPress={handleWebDownload}>
            <Text style={styles.downloadButtonText}>📥 Download Resume</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Mobile: Download and open flow
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerCenter}>
        {/* Idle State - Show Download Button */}
        {downloadStatus === 'idle' && (
          <>
            <Text style={styles.icon}>📄</Text>
            <Text style={styles.title}>Resume</Text>
            <Text style={styles.fileName}>{fileName}</Text>
            <Text style={styles.description}>
              Download the resume to view it
            </Text>
            <TouchableOpacity style={styles.downloadButton} onPress={downloadResume}>
              <Text style={styles.downloadButtonText}>📥 Download Resume</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Downloading State */}
        {downloadStatus === 'downloading' && (
          <>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.downloadingText}>Downloading resume...</Text>
          </>
        )}

        {/* Completed State - Show Open & Save Buttons */}
        {downloadStatus === 'completed' && (
          <>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Download Complete!</Text>
            <Text style={styles.fileName}>{fileName}</Text>
            <TouchableOpacity style={styles.openButton} onPress={openResume}>
              <Text style={styles.openButtonText}>📄 Open Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveToDevice}>
              <Text style={styles.saveButtonText}>💾 Save to Device</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.downloadAgainButton} 
              onPress={downloadResume}
            >
              <Text style={styles.downloadAgainText}>Download Again</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Error State */}
        {downloadStatus === 'error' && (
          <>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorTitle}>Download Failed</Text>
            <Text style={styles.errorDescription}>{errorMessage}</Text>
            <TouchableOpacity style={styles.downloadButton} onPress={downloadResume}>
              <Text style={styles.downloadButtonText}>🔄 Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.fallbackButton} 
              onPress={openInBrowser}
            >
              <Text style={styles.fallbackButtonText}>📥 Open in Browser</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  downloadButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 16,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  openButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 16,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadAgainButton: {
    marginTop: 16,
  },
  downloadAgainText: {
    color: '#666',
    fontSize: 14,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  fallbackButton: {
    marginTop: 12,
  },
  fallbackButtonText: {
    color: '#2563EB',
    fontSize: 14,
  },
});

export default ResumeViewerScreen;