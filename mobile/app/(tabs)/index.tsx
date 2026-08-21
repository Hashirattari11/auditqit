import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';

export default function HomeScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);
  const [error, setError] = useState('');
  const router = useRouter();

  const startAudit = async (isGitHub: boolean) => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const finalUrl = url.startsWith('http') ? url : `https://${url}`;
      const result = isGitHub
        ? await api.startGitHubAudit(finalUrl)
        : await api.startAudit(finalUrl);
      if (result.auditId) {
        router.push(`/report/${result.auditId}`);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to start audit');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AuditIQ</Text>
      <Text style={styles.subtitle}>Analyze any website or GitHub repo</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter URL (e.g., https://example.com)"
        placeholderTextColor="#64748b"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.btnPrimary} onPress={() => startAudit(false)} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>🌐 Audit Website</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnSecondary} onPress={() => startAudit(true)} disabled={loading}>
        <Text style={styles.btnSecondaryText}>🐙 Scan GitHub Repo</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent Audits</Text>
      <FlatList
        data={recent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.auditCard} onPress={() => router.push(`/report/${item.id}`)}>
            <Text style={styles.auditUrl} numberOfLines={1}>{item.url}</Text>
            <Text style={styles.auditStatus}>{item.status}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No recent audits</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#e2e8f0', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 16, fontSize: 16, color: '#e2e8f0', marginBottom: 12 },
  error: { color: '#ef4444', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  btnPrimary: { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnSecondary: { borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 30 },
  btnSecondaryText: { color: '#94a3b8', fontSize: 16, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginBottom: 12 },
  auditCard: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  auditUrl: { flex: 1, color: '#e2e8f0', fontSize: 14 },
  auditStatus: { color: '#64748b', fontSize: 12, marginLeft: 8 },
  empty: { color: '#475569', textAlign: 'center', marginTop: 20 },
});
