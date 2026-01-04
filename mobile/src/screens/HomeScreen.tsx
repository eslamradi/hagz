import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { subscribeToAllBookings } from '../services/bookings';
import type { Booking } from '../types';

type RootStackParamList = {
  Home: undefined;
  Booking: { code: string };
  MyRooms: undefined;
};

const colors = {
  primary: '#10b981',
  primaryDark: '#059669',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  error: '#ef4444',
  accent: '#f59e0b',
  success: '#22c55e',
  warning: '#f59e0b'
};

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userData, signOut } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToAllBookings(setBookings);
    return () => unsubscribe();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleJoinByCode = () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a booking code');
      return;
    }
    navigation.navigate('Booking', { code: code.toUpperCase() });
    setCode('');
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return 'No date';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return colors.success;
      case 'allocating': return colors.warning;
      case 'in-progress': return colors.primary;
      default: return colors.textMuted;
    }
  };

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => navigation.navigate('Booking', { code: item.code })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.codeTag}>
          <Text style={styles.codeText}>{item.code}</Text>
        </View>
        <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) + '30' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <Text style={styles.bookingTitle} numberOfLines={2}>
        {item.description || 'Football Match'}
      </Text>
      
      <View style={styles.bookingInfo}>
        <Text style={styles.infoText}>📅 {formatDate(item.playDate)}</Text>
        <Text style={styles.infoText}>👥 {item.acceptedCapacity} players</Text>
        <Text style={styles.infoText}>
          🏆 {item.numTeams} teams • {item.playMode === 'league' ? 'League' : 'Rotational'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {userData?.displayName}</Text>
          <Text style={styles.subtitle}>Find or join a match</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Code Entry */}
      <View style={styles.codeEntry}>
        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={setCode}
          placeholder="Enter room code"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          maxLength={6}
        />
        <TouchableOpacity style={styles.joinButton} onPress={handleJoinByCode}>
          <Text style={styles.joinButtonText}>Join</Text>
        </TouchableOpacity>
      </View>

      {/* My Rooms Button */}
      <TouchableOpacity
        style={styles.myRoomsButton}
        onPress={() => navigation.navigate('MyRooms')}
      >
        <Text style={styles.myRoomsText}>📋 My Rooms</Text>
        <Text style={styles.myRoomsArrow}>→</Text>
      </TouchableOpacity>

      {/* Bookings List */}
      <Text style={styles.sectionTitle}>Recent Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>⚽</Text>
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptyText}>
              Create your own room or join with a code
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4
  },
  signOutButton: {
    padding: 8
  },
  signOutText: {
    color: colors.error,
    fontSize: 14
  },
  codeEntry: {
    flexDirection: 'row',
    padding: 16,
    gap: 12
  },
  codeInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    textTransform: 'uppercase'
  },
  joinButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center'
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  myRoomsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceLight
  },
  myRoomsText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600'
  },
  myRoomsArrow: {
    color: colors.primary,
    fontSize: 18
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    padding: 16,
    paddingBottom: 8
  },
  listContent: {
    padding: 16,
    paddingTop: 0
  },
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceLight
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  codeTag: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8
  },
  codeText: {
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    fontWeight: '600'
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500'
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12
  },
  bookingInfo: {
    gap: 6
  },
  infoText: {
    fontSize: 14,
    color: colors.textMuted
  },
  emptyState: {
    alignItems: 'center',
    padding: 40
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center'
  }
});

export default HomeScreen;





