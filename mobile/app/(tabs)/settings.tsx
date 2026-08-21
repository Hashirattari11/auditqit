import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.cardText}>Manage your account on the web dashboard.</Text>
        <TouchableOpacity style={styles.link} onPress={() => Linking.openURL('https://auditqit-0-eight.vercel.app/dashboard')}>
          <Text style={styles.linkText}>Open Dashboard →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        <Text style={styles.cardText}>AuditIQ v1.0.0{'\n'}AI-powered web & code audit platform</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Links</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://auditqit-0-eight.vercel.app/pricing')}>
          <Text style={styles.linkText}>Upgrade Plan →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://auditqit-0-eight.vercel.app/docs')}>
          <Text style={[styles.linkText, { marginTop: 12 }]}>API Documentation →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/Hashirattari11/auditqit')}>
          <Text style={[styles.linkText, { marginTop: 12 }]}>GitHub Repository →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a', padding: 20, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#e2e8f0', marginBottom: 24 },
  card: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#e2e8f0', marginBottom: 8 },
  cardText: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },
  link: { marginTop: 12 },
  linkText: { color: '#6366f1', fontSize: 14, fontWeight: '500' },
});
