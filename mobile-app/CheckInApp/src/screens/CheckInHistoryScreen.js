import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';

const CheckInHistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await apiService.getCheckInHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadHistory();
    setIsRefreshing(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Text style={styles.locationName}>{item.location_name}</Text>
        <View style={[
          styles.statusBadge,
          item.status === 'checked_in' ? styles.statusCheckedIn : styles.statusCheckedOut
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'checked_in' ? styles.statusTextCheckedIn : styles.statusTextCheckedOut
          ]}>
            {item.status === 'checked_in' ? 'Checked In' : 'Checked Out'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.date}>{formatDate(item.check_in_time)}</Text>
      
      <View style={styles.timeRow}>
        <View style={styles.timeItem}>
          <Ionicons name="log-in-outline" size={14} color="#10b981" />
          <Text style={styles.timeLabel}>Check In:</Text>
          <Text style={styles.timeValue}>{formatTime(item.check_in_time)}</Text>
        </View>
        
        <View style={styles.timeItem}>
          <Ionicons name="log-out-outline" size={14} color="#f97316" />
          <Text style={styles.timeLabel}>Check Out:</Text>
          <Text style={styles.timeValue}>
            {item.check_out_time ? formatTime(item.check_out_time) : '--'}
          </Text>
        </View>
      </View>
      
      {item.duration_formatted && (
        <View style={styles.durationRow}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text style={styles.durationText}>Duration: {item.duration_formatted}</Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="time" size={24} color="#2563eb" />
        <Text style={styles.headerTitle}>Check-in History</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="information-circle-outline" size={48} color="#6b7280" />
          <Text style={styles.emptyText}>No check-in history available</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderHistoryItem}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8faff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  listContainer: {
    padding: 20,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusCheckedIn: {
    backgroundColor: '#dcfce7',
  },
  statusCheckedOut: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextCheckedIn: {
    color: '#15803d',
  },
  statusTextCheckedOut: {
    color: '#b91c1c',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    marginRight: 4,
  },
  timeValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  durationText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default CheckInHistoryScreen;