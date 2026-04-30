import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

interface Props {
  navigation: any;
  route: any;
}

export const ResumeViewerScreen: React.FC<Props> = ({ route }) => {
  const { url, fileName } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndConvert = async () => {
      try {
        console.log('Fetching PDF from URL:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        const blob = await response.blob();
        console.log('Blob size:', blob.size);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('FileReader result length:', reader.result?.toString().length);
          setPdfDataUri(reader.result as string);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('Failed to read file');
          setLoading(false);
        };
        reader.readAsDataURL(blob);
        
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message || 'Failed to load resume');
        setLoading(false);
      }
    };

    fetchAndConvert();
  }, [url]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading resume...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load resume</Text>
          <Text style={styles.errorDetail}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: pdfDataUri || '' }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        contentMode="desktop"
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});