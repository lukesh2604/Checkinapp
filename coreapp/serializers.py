from rest_framework import serializers
from .models import Employee, Location, CheckIn

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['email', 'full_name', 'employee_id', 'role', 'phone_number']
        read_only_fields = ['employee_id']

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name', 'address', 'start_time', 'end_time', 'range_meters', 
                 'latitude', 'longitude', 'is_active']

class CheckInSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    duration_formatted = serializers.SerializerMethodField()

    class Meta:
        model = CheckIn
        fields = ['id', 'employee', 'employee_name', 'location', 'location_name', 
                 'check_in_time', 'check_out_time', 'status', 'duration', 'duration_formatted']
        read_only_fields = ['employee', 'duration']

    def get_duration_formatted(self, obj):
        if obj.duration:
            total_seconds = int(obj.duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            return f"{hours}h {minutes}m"
        return None

class CheckInCreateSerializer(serializers.Serializer):
    location_id = serializers.IntegerField()
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)

class CheckOutSerializer(serializers.Serializer):
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)