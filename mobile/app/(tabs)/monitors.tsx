import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { api } from '../../lib/api';

export default function MonitorsScreen() {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMonitors().then(d => { setMonitors(d || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monitors</Text>
      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : monitors.length === 0 ? (
        <Text style={styles.empty}>No monitors configured yet.{'\n'}Set up monitors on the web dashboard.</Text>
      ) : (
        <FlatList
          data={monitors}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.url} numberOfLines={1}>{item.url}</Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={styles.score}>{item.last_score || '—'}</Text>
                <Text style={styles.scoreLabel}>/100</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a', padding: 20, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#e2e8f0', marginBottom: 20 },
  loading: { color: '#64748b', textAlign: 'center', marginTop: 40 },
  empty: { color: '#475569', textAlign: 'center', marginTop: 40, lineHeight: 22 },
  card: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardContent: { flex: 1 },
  name: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },
  url: { color: '#64748b', fontSize: 12, marginTop: 4 },
  scoreContainer: { alignItems: 'center', marginLeft: 12 },
  score: { fontSize: 24, fontWeight: 'bold', color: '#22c55e', fontFamily: 'monospace' },
  scoreLabel: { fontSize: 10, color: '#64748b' },
});
