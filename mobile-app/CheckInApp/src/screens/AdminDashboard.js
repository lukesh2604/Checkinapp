import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({});
  const [checkIns, setCheckIns] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, checkInsData, employeesData, locationsData] = await Promise.all([
        apiService.getAdminDashboardStats(),
        apiService.getAdminCheckIns(),
        apiService.getAdminEmployees(),
        apiService.getAdminLocations(),
      ]);
      
      setStats(statsData);
      setCheckIns(checkInsData);
      setEmployees(employeesData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color="#2563eb" />
          <Text style={styles.statNumber}>{stats.currently_checked_in || 0}</Text>
          <Text style={styles.statLabel}>Currently Checked In</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={24} color="#10b981" />
          <Text style={styles.statNumber}>{stats.todays_checkins || 0}</Text>
          <Text style={styles.statLabel}>Today's Check-ins</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="person-add" size={24} color="#f59e0b" />
          <Text style={styles.statNumber}>{stats.total_employees || 0}</Text>
          <Text style={styles.statLabel}>Total Employees</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="location" size={24} color="#ef4444" />
          <Text style={styles.statNumber}>{stats.total_locations || 0}</Text>
          <Text style={styles.statLabel}>Active Locations</Text>
        </View>
      </View>
    </View>
  );

  const renderCheckIns = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={checkIns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const dateTime = formatDateTime(item.check_in_time);
          const checkOutDateTime = item.check_out_time ? formatDateTime(item.check_out_time) : null;
          
          return (
            <View style={styles.checkInItem}>
              <View style={styles.checkInHeader}>
                <Text style={styles.employeeName}>{item.employee_name}</Text>
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
              
              <Text style={styles.locationName}>{item.location_name}</Text>
              <Text style={styles.dateText}>{dateTime.date}</Text>
              
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>In: {dateTime.time}</Text>
                <Text style={styles.timeText}>
                  Out: {checkOutDateTime ? checkOutDateTime.time : '--'}
                </Text>
              </View>
              
              {item.duration_formatted && (
                <Text style={styles.durationText}>Duration: {item.duration_formatted}</Text>
              )}
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderEmployees = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={employees}
        keyExtractor={(item) => item.employee_id}
        renderItem={({ item }) => (
          <View style={styles.employeeItem}>
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{item.full_name}</Text>
              <Text style={styles.employeeEmail}>{item.email}</Text>
              <Text style={styles.employeeId}>ID: {item.employee_id}</Text>
              {item.role && <Text style={styles.employeeRole}>{item.role}</Text>}
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderLocations = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={locations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.locationItem}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationName}>{item.name}</Text>
              <View style={[
                styles.statusBadge,
                item.is_active ? styles.statusActive : styles.statusInactive
              ]}>
                <Text style={[
                  styles.statusText,
                  item.is_active ? styles.statusTextActive : styles.statusTextInactive
                ]}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.locationAddress}>{item.address}</Text>
            <Text style={styles.locationTime}>
              Hours: {item.start_time} - {item.end_time}
            </Text>
            <Text style={styles.locationRange}>Range: {item.range_meters}m</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'checkins':
        return renderCheckIns();
      case 'employees':
        return renderEmployees();
      case 'locations':
        return renderLocations();
      default:
        return renderOverview();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.full_name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: 'Overview', icon: 'analytics' },
            { key: 'checkins', label: 'Check-ins', icon: 'time' },
            { key: 'employees', label: 'Employees', icon: 'people' },
            { key: 'locations', label: 'Locations', icon: 'location' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? '#2563eb' : '#6b7280'}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab.key && styles.tabButtonTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>
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
  tabNavigation: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#eef2ff',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    color: '#2563eb',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  checkInItem: {
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
  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  durationText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 4,
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
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusInactive: {
    backgroundColor: '#f3f4f6',
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
  statusTextActive: {
    color: '#15803d',
  },
  statusTextInactive: {
    color: '#6b7280',
  },
  employeeItem: {
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
  employeeInfo: {
    flex: 1,
  },
  employeeEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  employeeId: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  employeeRole: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
    marginTop: 4,
  },
  locationItem: {
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
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  locationTime: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  locationRange: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default AdminDashboard;