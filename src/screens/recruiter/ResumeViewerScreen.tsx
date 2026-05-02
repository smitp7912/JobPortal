import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Button } from '../../components/common/Button';

interface Props {
  navigation: any;
  route: any;
}

export const ResumeViewerScreen: React.FC<Props> = ({ route }) => {
  const { url, fileName } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptPreview, setAttemptPreview] = useState(true);

  const isWeb = Platform.OS === 'web';
  const isRawUrl = url.includes('/raw/upload/');

  const openInBrowser = () => {
    Linking.openURL(url).catch(() => {
      setError('Could not open URL');
    });
  };

  // Handle raw URL case - can't preview, must download
  if (isRawUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.rawContainer}>
          <Text style={styles.rawIcon}>📄</Text>
          <Text style={styles.rawTitle}>Resume</Text>
          <Text style={styles.rawFileName}>{fileName}</Text>
          <Text style={styles.rawDescription}>
            This resume cannot be previewed in the app.{'\n'}
            Please open it in your PDF viewer.
          </Text>
          <Button
            title="📥 Open in PDF Viewer"
            onPress={openInBrowser}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Web fallback - just show link
  if (isWeb) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.webContainer}>
          <Text style={styles.title}>Resume</Text>
          <Text style={styles.fileName}>{fileName}</Text>
          <Button
            title="📄 Open Resume PDF"
            onPress={openInBrowser}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  // Mobile: use WebView with direct PDF URL
  if (!attemptPreview) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>Cannot Preview</Text>
          <Text style={styles.fallbackText}>
            Could not load PDF in app
          </Text>
          <Button
            title="📥 Open in PDF Viewer"
            onPress={openInBrowser}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading resume...</Text>
        </View>
      )}
      
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.log('WebView error:', nativeEvent.error);
          if (nativeEvent.error?.includes('net') || nativeEvent.error?.includes('failed')) {
            setAttemptPreview(false);
          } else {
            setError('Could not load PDF');
          }
          setLoading(false);
        }}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        )}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
      
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <Button
            title="Open Externally"
            onPress={openInBrowser}
          />
        </View>
      )}
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginTop: 16,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 8,
  },
  // Raw URL styles
  rawContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  rawIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  rawTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  rawFileName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  rawDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
});

export default ResumeViewerScreen;