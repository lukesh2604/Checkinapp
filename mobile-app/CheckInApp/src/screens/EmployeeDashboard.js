import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const [locations, setLocations] = useState([]);
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Getting your location...');

  useEffect(() => {
    loadData();
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLocationStatus('Location found');
    } catch (error) {
      setLocationStatus('Error getting location');
      console.error('Location error:', error);
    }
  };

  const loadData = async () => {
    try {
      const [locationsData, activeCheckInData] = await Promise.all([
        apiService.getLocations(),
        apiService.getActiveCheckIn(),
      ]);
      
      setLocations(locationsData);
      setActiveCheckIn(activeCheckInData.active_checkin || null);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleCheckIn = async () => {
    if (!selectedLocation) {
      setShowLocationModal(true);
      return;
    }

    if (!userLocation) {
      Alert.alert('Error', 'Please allow location access to check in');
      getUserLocation();
      return;
    }

    try {
      const result = await apiService.checkIn(
        selectedLocation.id,
        userLocation.latitude,
        userLocation.longitude
      );
      
      Alert.alert('Success', result.message);
      await loadData();
    } catch (error) {
      Alert.alert('Check-in Failed', error.message);
    }
  };

  const handleCheckOut = async () => {
    if (!userLocation) {
      Alert.alert('Error', 'Please allow location access to check out');
      getUserLocation();
      return;
    }

    try {
      const result = await apiService.checkOut(
        userLocation.latitude,
        userLocation.longitude
      );
      
      Alert.alert('Success', result.message);
      await loadData();
      setSelectedLocation(null);
    } catch (error) {
      Alert.alert('Check-out Failed', error.message);
    }
  };

  const selectLocation = (location) => {
    setSelectedLocation(location);
    setShowLocationModal(false);
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Employee Check-in</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.full_name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Location Status */}
      <View style={styles.locationStatus}>
        <Ionicons name="location-outline" size={16} color="#6b7280" />
        <Text style={styles.locationStatusText}>{locationStatus}</Text>
      </View>

      {/* Check-in Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="location" size={20} color="#2563eb" />
          <Text style={styles.cardTitle}>Location Check-in</Text>
        </View>

        {activeCheckIn ? (
          // Currently checked in
          <View style={styles.activeCheckIn}>
            <Text style={styles.activeCheckInLabel}>Currently checked in at:</Text>
            <Text style={styles.activeCheckInLocation}>{activeCheckIn.location_name}</Text>
            <Text style={styles.activeCheckInTime}>
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              {' '}Checked in at {formatTime(activeCheckIn.check_in_time)}
            </Text>
          </View>
        ) : (
          // Location selection
          <>
            {selectedLocation ? (
              <View style={styles.selectedLocation}>
                <View>
                  <Text style={styles.selectedLocationLabel}>Selected Location:</Text>
                  <Text style={styles.selectedLocationName}>{selectedLocation.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedLocation(null)}>
                  <Ionicons name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.locationSelector}
                onPress={() => setShowLocationModal(true)}
              >
                <Ionicons name="search" size={16} color="#6b7280" />
                <Text style={styles.locationSelectorText}>Select a location...</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.checkInButton,
              (activeCheckIn || !selectedLocation) && styles.buttonDisabled,
            ]}
            onPress={handleCheckIn}
            disabled={activeCheckIn || !selectedLocation}
          >
            <Ionicons name="log-in-outline" size={16} color="white" />
            <Text style={styles.buttonText}>Check In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.checkOutButton,
              !activeCheckIn && styles.buttonDisabled,
            ]}
            onPress={handleCheckOut}
            disabled={!activeCheckIn}
          >
            <Ionicons name="log-out-outline" size={16} color="white" />
            <Text style={styles.buttonText}>Check Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={locations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.locationItem}
                onPress={() => selectLocation(item)}
              >
                <View>
                  <Text style={styles.locationItemName}>{item.name}</Text>
                  <Text style={styles.locationItemAddress}>{item.address}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
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
    justifyContent: 'space-between',
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
    color: '#2563eb',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    margin: 20,
    padding: 12,
    borderRadius: 8,
  },
  locationStatusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  activeCheckIn: {
    backgroundColor: '#eef2ff',
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  activeCheckInLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeCheckInLocation: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563eb',
    marginTop: 4,
  },
  activeCheckInTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  selectedLocation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  selectedLocationLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedLocationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563eb',
    marginTop: 4,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  locationSelectorText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  checkInButton: {
    backgroundColor: '#2563eb',
  },
  checkOutButton: {
    backgroundColor: '#f97316',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  locationItemAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
});

export default EmployeeDashboard;