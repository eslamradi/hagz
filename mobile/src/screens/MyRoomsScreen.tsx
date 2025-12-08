import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { subscribeToAllBookings, deleteBooking } from '../services/bookings';
import type { Booking } from '../types';

type RootStackParamList = {
  Home: undefined;
  Booking: { code: string };
  MyRooms: undefined;
  CreateRoom: undefined;
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

const MyRoomsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { firebaseUser } = useAuth();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  const myRooms = allBookings.filter(b => b.createdBy === firebaseUser?.uid);

  useEffect(() => {
    const unsubscribe = subscribeToAllBookings(setAllBookings);
    return () => unsubscribe();
  }, []);

  const handleShare = async (booking: Booking) => {
    try {
      await Share.share({
        message: `Join my football match!\n\nRoom Code: ${booking.code}\n\n${booking.description || 'Football Match'}`,
        title: '7agz - Football Booking'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDelete = (bookingId: string) => {
    Alert.alert(
      'Delete Room',
      'Are you sure you want to delete this room? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBooking(bookingId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete room');
            }
          }
        }
      ]
    );
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

  const renderRoomItem = ({ item }: { item: Booking }) => (
    <View style={styles.roomCard}>
      <TouchableOpacity
        style={styles.roomContent}
        onPress={() => navigation.navigate('Booking', { code: item.code })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.codeTag}>
            <Text style={styles.codeText}>{item.code}</Text>
          </View>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        
        <Text style={styles.roomTitle} numberOfLines={2}>
          {item.description || 'Football Match'}
        </Text>
        
        <Text style={styles.roomDate}>📅 {formatDate(item.playDate)}</Text>
        <Text style={styles.roomInfo}>
          👥 {item.acceptedCapacity} players • {item.numTeams} teams
        </Text>
      </TouchableOpacity>

      <View style={styles.roomActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleShare(item)}
        >
          <Text style={styles.actionText}>📤 Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Rooms</Text>
        <Text style={styles.subtitle}>Rooms you've created</Text>
      </View>

      {/* Note: Create room functionality would need a separate screen */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => Alert.alert(
          'Create Room',
          'To create a new room, please use the web app at 7agz.app. Full room creation will be available in a future mobile update.'
        )}
      >
        <Text style={styles.createButtonText}>+ Create New Room</Text>
      </TouchableOpacity>

      <FlatList
        data={myRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoomItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No Rooms Yet</Text>
            <Text style={styles.emptyText}>
              Create your first room to start organizing matches
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4
  },
  createButton: {
    backgroundColor: colors.primary,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  listContent: {
    padding: 16,
    paddingTop: 0
  },
  roomCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    overflow: 'hidden'
  },
  roomContent: {
    padding: 16
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '600'
  },
  statusText: {
    fontSize: 12,
    color: colors.textMuted
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8
  },
  roomDate: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4
  },
  roomInfo: {
    fontSize: 14,
    color: colors.textMuted
  },
  roomActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight
  },
  actionButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.surfaceLight
  },
  deleteButton: {
    borderRightWidth: 0
  },
  actionText: {
    color: colors.text,
    fontSize: 14
  },
  deleteText: {
    color: colors.error,
    fontSize: 14
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

export default MyRoomsScreen;




