import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Linking
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
  getBookingByCode,
  subscribeToBooking,
  subscribeToPlayers,
  addPlayerToBooking,
  removePlayerFromBooking,
  canRemovePlayer
} from '../services/bookings';
import type { Booking, Player } from '../types';

type RootStackParamList = {
  Booking: { code: string };
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

const BookingScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'Booking'>>();
  const navigation = useNavigation();
  const { firebaseUser, userData } = useAuth();
  const { code } = route.params;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [addingSelf, setAddingSelf] = useState(true);

  const activePlayers = players.filter(p => p.status === 'active');
  const waitingPlayers = players.filter(p => p.status === 'waiting');
  const isOwner = booking ? booking.createdBy === firebaseUser?.uid : false;

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const bookingData = await getBookingByCode(code);
        if (bookingData) {
          setBooking(bookingData);
        } else {
          setError('Booking not found');
        }
      } catch (err) {
        setError('Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [code]);

  useEffect(() => {
    if (!booking?.id) return;

    const unsubscribeBooking = subscribeToBooking(booking.id, (data) => {
      if (data) setBooking(data);
    });

    const unsubscribePlayers = subscribeToPlayers(booking.id, setPlayers);

    return () => {
      unsubscribeBooking();
      unsubscribePlayers();
    };
  }, [booking?.id]);

  const handleAddPlayer = async () => {
    if (!booking) return;
    
    const nameToAdd = addingSelf && firebaseUser && userData?.displayName 
      ? userData.displayName 
      : playerName;
    
    if (!nameToAdd.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      await addPlayerToBooking(booking.id, {
        playerName: nameToAdd.trim(),
        addedBy: firebaseUser?.uid || null,
        userId: addingSelf && firebaseUser ? firebaseUser.uid : null
      });
      setPlayerName('');
    } catch (err) {
      Alert.alert('Error', 'Failed to add player');
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!booking) return;
    
    Alert.alert(
      'Remove Player',
      'Are you sure you want to remove this player?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removePlayerFromBooking(booking.id, playerId);
            } catch (err) {
              Alert.alert('Error', 'Failed to remove player');
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
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading booking...</Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>❌</Text>
        <Text style={styles.errorTitle}>{error || 'Booking Not Found'}</Text>
        <Text style={styles.errorText}>
          The booking code "{code}" doesn't exist.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderPlayer = ({ item, index }: { item: Player; index: number }) => {
    const canRemove = canRemovePlayer(item, firebaseUser?.uid || null) || isOwner;
    const isCurrentUser = item.userId === firebaseUser?.uid;

    return (
      <View style={styles.playerItem}>
        <View style={styles.playerPosition}>
          <Text style={styles.positionText}>{item.position}</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, isCurrentUser && styles.currentUserName]}>
            {item.playerName}
            {isCurrentUser && <Text style={styles.youTag}> (You)</Text>}
          </Text>
          {!item.userId && item.addedBy && (
            <Text style={styles.guestTag}>(Guest)</Text>
          )}
        </View>
        {canRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemovePlayer(item.id)}
          >
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Booking Info */}
      <View style={styles.bookingInfo}>
        <View style={styles.codeRow}>
          <View style={styles.codeTag}>
            <Text style={styles.codeText}>{booking.code}</Text>
          </View>
          <View style={[styles.statusTag, { 
            backgroundColor: booking.status === 'open' ? colors.success + '30' : colors.textMuted + '30' 
          }]}>
            <Text style={[styles.statusText, {
              color: booking.status === 'open' ? colors.success : colors.textMuted
            }]}>{booking.status}</Text>
          </View>
        </View>
        
        <Text style={styles.bookingTitle}>{booking.description || 'Football Match'}</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>📅 {formatDate(booking.playDate)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            👥 {activePlayers.length}/{booking.acceptedCapacity} players
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            🏆 {booking.numTeams} teams • {booking.playMode === 'league' ? 'League' : 'Rotational'}
          </Text>
        </View>
        
        {booking.locationUrl && (
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => Linking.openURL(booking.locationUrl)}
          >
            <Text style={styles.locationText}>📍 View Location</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add Player Form */}
      <View style={styles.addPlayerSection}>
        <Text style={styles.sectionTitle}>Add Player</Text>
        
        {firebaseUser && (
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, addingSelf && styles.toggleActive]}
              onPress={() => setAddingSelf(true)}
            >
              <Text style={[styles.toggleText, addingSelf && styles.toggleTextActive]}>
                Add Myself
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !addingSelf && styles.toggleActive]}
              onPress={() => setAddingSelf(false)}
            >
              <Text style={[styles.toggleText, !addingSelf && styles.toggleTextActive]}>
                Add Friend
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {(!firebaseUser || !addingSelf) && (
          <TextInput
            style={styles.nameInput}
            value={playerName}
            onChangeText={setPlayerName}
            placeholder={firebaseUser ? "Friend's name" : "Your name"}
            placeholderTextColor={colors.textMuted}
          />
        )}

        {addingSelf && firebaseUser && userData && (
          <View style={styles.selfInfo}>
            <Text style={styles.selfLabel}>Adding as:</Text>
            <Text style={styles.selfName}>{userData.displayName}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.addButton} onPress={handleAddPlayer}>
          <Text style={styles.addButtonText}>Add to List</Text>
        </TouchableOpacity>
      </View>

      {/* Active Players */}
      <View style={styles.playersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Players</Text>
          <View style={[styles.countTag, activePlayers.length >= booking.acceptedCapacity && styles.countFull]}>
            <Text style={styles.countText}>
              {activePlayers.length}/{booking.acceptedCapacity}
            </Text>
          </View>
        </View>

        {activePlayers.length === 0 ? (
          <Text style={styles.emptyText}>No players yet. Be the first to join!</Text>
        ) : (
          activePlayers.map((player, index) => (
            <React.Fragment key={player.id}>
              {renderPlayer({ item: player, index })}
            </React.Fragment>
          ))
        )}
      </View>

      {/* Waiting List */}
      {waitingPlayers.length > 0 && (
        <View style={styles.playersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Waiting List</Text>
            <View style={styles.countTag}>
              <Text style={styles.countText}>{waitingPlayers.length} waiting</Text>
            </View>
          </View>
          
          {waitingPlayers.map((player, index) => (
            <React.Fragment key={player.id}>
              {renderPlayer({ item: player, index })}
            </React.Fragment>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24
  },
  loadingText: {
    color: colors.primary,
    fontSize: 16
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8
  },
  errorText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  bookingInfo: {
    backgroundColor: colors.surface,
    padding: 20,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceLight
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  codeTag: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  codeText: {
    color: colors.primary,
    fontFamily: 'monospace',
    fontWeight: '600'
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500'
  },
  bookingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16
  },
  infoRow: {
    marginBottom: 8
  },
  infoText: {
    fontSize: 14,
    color: colors.textMuted
  },
  locationButton: {
    marginTop: 8
  },
  locationText: {
    color: colors.accent,
    fontSize: 14
  },
  addPlayerSection: {
    backgroundColor: colors.surface,
    padding: 20,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceLight
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center'
  },
  toggleActive: {
    backgroundColor: colors.primary
  },
  toggleText: {
    color: colors.textMuted,
    fontWeight: '500'
  },
  toggleTextActive: {
    color: '#fff'
  },
  nameInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    marginBottom: 16
  },
  selfInfo: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  selfLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4
  },
  selfName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  playersSection: {
    backgroundColor: colors.surface,
    padding: 20,
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceLight
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  countTag: {
    backgroundColor: colors.success + '30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  countFull: {
    backgroundColor: colors.warning + '30'
  },
  countText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '500'
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    padding: 20
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8
  },
  playerPosition: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  positionText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  playerName: {
    color: colors.text,
    fontSize: 16
  },
  currentUserName: {
    fontWeight: '600'
  },
  youTag: {
    color: colors.primary,
    fontSize: 12
  },
  guestTag: {
    color: colors.textMuted,
    fontSize: 12
  },
  removeButton: {
    padding: 8
  },
  removeText: {
    color: colors.error,
    fontSize: 16
  }
});

export default BookingScreen;





