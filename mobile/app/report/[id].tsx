import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../lib/api';

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    const poll = async () => {
      try {
        const status = await api.getAuditStatus(id);
        if (status.status === 'completed' || status.status === 'failed') {
          setPolling(false);
          setReport(status);
        }
      } catch {}
      setLoading(false);
    };
    poll();
    if (polling) {
      const interval = setInterval(poll, 2000);
      return () => clearInterval(interval);
    }
  }, [id, polling]);

  const results = report?.results || {};
  const lighthouse = results.lighthouse || {};
  const headers = results.headers || {};

  const ScoreCircle = ({ label, score }: { label: string; score: number }) => {
    const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
    return (
      <View style={[styles.scoreCircle, { borderColor: color }]}>
        <Text style={[styles.scoreValue, { color }]}>{score}</Text>
        <Text style={styles.scoreLabel}>{label}</Text>
      </View>
    );
  };

  if (loading || polling) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingIcon}>⏳</Text>
        <Text style={styles.loadingText}>Analyzing website...</Text>
        <Text style={styles.loadingSubtext}>{report?.currentStep || 'Starting...'}</Text>
      </View>
    );
  }

  if (report?.status === 'failed') {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingIcon}>❌</Text>
        <Text style={styles.loadingText}>Audit Failed</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setPolling(true); setLoading(true); }}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.url}>{report?.url}</Text>

      {/* Scores */}
      <View style={styles.scoresRow}>
        <ScoreCircle label="Overall" score={Math.round((lighthouse.performance + lighthouse.seo) / 2) || 0} />
        <ScoreCircle label="Perf" score={lighthouse.performance || 0} />
        <ScoreCircle label="SEO" score={lighthouse.seo || 0} />
      </View>

      {/* AI Summary */}
      {report?.aiSummary ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI Analysis</Text>
          <Text style={styles.sectionText}>{report.aiSummary}</Text>
        </View>
      ) : null}

      {/* Security Headers */}
      {headers.securityHeaders && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Security Headers</Text>
          {Object.entries(headers.securityHeaders).map(([name, h]: [string, any]) => (
            <View key={name} style={styles.headerItem}>
              <Text style={styles.headerStatus}>{h.present ? '✅' : '❌'}</Text>
              <Text style={styles.headerName}>{name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Open full report */}
      <TouchableOpacity style={styles.fullReportBtn} onPress={() => Linking?.openURL?.(`https://auditqit-0-eight.vercel.app/report/${id}`)}>
        <Text style={styles.fullReportText}>Open Full Report in Browser</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a', padding: 20 },
  loadingContainer: { flex: 1, backgroundColor: '#0a0e1a', justifyContent: 'center', alignItems: 'center' },
  loadingIcon: { fontSize: 48, marginBottom: 16 },
  loadingText: { fontSize: 20, fontWeight: 'bold', color: '#e2e8f0' },
  loadingSubtext: { fontSize: 13, color: '#64748b', marginTop: 8 },
  url: { fontSize: 14, color: '#94a3b8', marginBottom: 20, textAlign: 'center' },
  scoresRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24 },
  scoreCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  scoreValue: { fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace' },
  scoreLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  section: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#e2e8f0', marginBottom: 12 },
  sectionText: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },
  headerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1e293b20' },
  headerStatus: { marginRight: 10, fontSize: 14 },
  headerName: { fontSize: 13, color: '#e2e8f0', fontFamily: 'monospace' },
  retryBtn: { marginTop: 20, backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
  fullReportBtn: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center' },
  fullReportText: { color: '#6366f1', fontWeight: '600' },
});
