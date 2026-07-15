import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Bluetooth, AlertCircle } from 'lucide-react-native';

export default function Home() {
  const [devices, setDevices] = useState([{"id": 1, "name": "Estação Meteorológica 1"},
    {"id": 2, "name": "Estação Meteorológica 2"},
    {"id": 3, "name": "Estação Meteorológica 3"}
  ]); // Lista com um dispositivo para testar

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olá!</Text>
      <Text style={styles.subtitle}>Conecte-se a um módulo disponível:</Text>
      
      {devices.length > 0 ? (
        <FlatList 
          data={devices} 
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card}>
              <Bluetooth color="#0056b3" size={24} />
              <Text style={styles.cardText}>{item.name}</Text>
            </TouchableOpacity>
          )} 
        />
      ) : (
        <View style={styles.emptyState}>
          <AlertCircle color="#ef4444" size={48} />
          <Text style={styles.emptyText}>Nenhum módulo encontrado.</Text>
          <Text style={styles.checklist}>
            • Verifique se o módulo está na tomada.{"\n"}
            • Verifique se o Bluetooth está ativado.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#0056b3' },
  subtitle: { fontSize: 16, color: '#64748b', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  cardText: { marginLeft: 15, fontSize: 16, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 10 },
  checklist: { marginTop: 15, color: '#64748b', lineHeight: 22, textAlign: 'center' },
});