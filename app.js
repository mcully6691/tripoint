import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const NEARBY_USERS = [
  { id: '1', name: 'Alex', distance: '12m', vibe: 'Coffee & Code', w3w: '///filled.count.soap' },
  { id: '2', name: 'Sarah', distance: '45m', vibe: 'Casual Chat', w3w: '///index.home.raft' },
  { id: '3', name: 'Jordan', distance: '80m', vibe: 'Co-working', w3w: '///lamp.nest.gear' },
];

function RadarScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TriPoint Radar</Text>
        <Text style={styles.subtitle}>Proximity Grid Active (3x3m)</Text>
      </View>
      <FlatList
        data={NEARBY_USERS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardVibe}>{item.vibe}</Text>
              <Text style={styles.cardW3w}>{item.w3w}</Text>
            </View>
            <Text style={styles.cardDistance}>{item.distance}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function MatrixScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vibe & Intent Matrix</Text>
        <Text style={styles.subtitle}>Select what you're up for right now</Text>
      </View>
      <View style={styles.grid}>
        {['☕ Coffee', '🍻 Drinks', '💻 Work', '⚡ Networking'].map((vibe, idx) => (
          <TouchableOpacity key={idx} style={styles.gridBox}>
            <Text style={styles.gridText}>{vibe}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: '#0F172A', borderTopColor: '#1E293B' },
      }}
    >
      <Tab.Screen name="Radar" component={RadarScreen} />
      <Tab.Screen name="Matrix" component={MatrixScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  cardVibe: {
    fontSize: 14,
    color: '#38BDF8',
    marginTop: 2,
  },
  cardW3w: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  cardDistance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34D399',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  gridBox: {
    backgroundColor: '#1E293B',
    width: '48%',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  gridText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});