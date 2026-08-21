import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';

export default function HistoryScreen() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.getRecentAudits().then(d => { setAudits(d.audits || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audit History</Text>
      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <FlatList
          data={audits}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/report/${item.id}`)}>
              <View style={styles.cardContent}>
                <Text style={styles.url} numberOfLines={1}>{item.url}</Text>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.badge, item.status === 'completed' ? styles.badgeGreen : styles.badgeAmber]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No audits yet</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a', padding: 20, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#e2e8f0', marginBottom: 20 },
  loading: { color: '#64748b', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardContent: { flex: 1 },
  url: { color: '#e2e8f0', fontSize: 14, fontWeight: '500' },
  date: { color: '#64748b', fontSize: 12, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeGreen: { backgroundColor: '#22c55e20' },
  badgeAmber: { backgroundColor: '#eab30820' },
  badgeText: { fontSize: 11, color: '#94a3b8' },
  empty: { color: '#475569', textAlign: 'center', marginTop: 40 },
});
