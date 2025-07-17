from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import Employee, Location, CheckIn
from .serializers import (
    EmployeeSerializer, LocationSerializer, CheckInSerializer,
    CheckInCreateSerializer, CheckOutSerializer
)

@api_view(['POST'])
@permission_classes([])
def api_login(request):
    """API endpoint for mobile app login"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'error': 'Email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(email=email, password=password)
    
    if user:
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': EmployeeSerializer(user).data,
            'is_staff': user.is_staff
        })
    else:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def api_logout(request):
    """API endpoint for mobile app logout"""
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Successfully logged out'})
    except:
        return Response({'message': 'Logged out'})

@api_view(['GET'])
def api_profile(request):
    """Get current user profile"""
    return Response(EmployeeSerializer(request.user).data)

@api_view(['GET'])
def api_locations(request):
    """Get all active locations"""
    locations = Location.objects.filter(is_active=True)
    return Response(LocationSerializer(locations, many=True).data)

@api_view(['GET'])
def api_active_checkin(request):
    """Get user's active check-in if any"""
    active_checkin = CheckIn.objects.filter(
        employee=request.user,
        status='checked_in',
        check_out_time__isnull=True
    ).first()
    
    if active_checkin:
        return Response(CheckInSerializer(active_checkin).data)
    else:
        return Response({'active_checkin': None})

@api_view(['GET'])
def api_checkin_history(request):
    """Get user's check-in history"""
    checkins = CheckIn.objects.filter(
        employee=request.user
    ).order_by('-check_in_time')[:20]
    
    return Response(CheckInSerializer(checkins, many=True).data)

@api_view(['POST'])
def api_checkin(request):
    """Check in to a location"""
    serializer = CheckInCreateSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    location_id = serializer.validated_data['location_id']
    user_latitude = serializer.validated_data['latitude']
    user_longitude = serializer.validated_data['longitude']
    
    try:
        location = get_object_or_404(Location, id=location_id)
        
        # Check if employee is already checked in somewhere
        active_checkin = CheckIn.objects.filter(
            employee=request.user,
            status='checked_in',
            check_out_time__isnull=True
        ).first()
        
        if active_checkin:
            return Response({
                'error': 'You are already checked in at another location. Please check out first.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if employee can check in (15 minutes before shift start)
        current_time = timezone.localtime().time()
        if not location.can_check_in(current_time):
            return Response({
                'error': f'You can only check in 15 minutes before your shift starts at {location.start_time.strftime("%H:%M")}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if employee is within range of the location
        if not location.is_within_range(user_latitude, user_longitude):
            return Response({
                'error': f'You are not within range of this location. Please move closer to {location.name}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create check-in record
        checkin = CheckIn.objects.create(
            employee=request.user,
            location=location,
            check_in_time=timezone.now(),
            status='checked_in'
        )
        
        return Response({
            'message': f'Successfully checked in at {location.name}',
            'checkin': CheckInSerializer(checkin).data
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def api_checkout(request):
    """Check out from current location"""
    serializer = CheckOutSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user_latitude = serializer.validated_data['latitude']
    user_longitude = serializer.validated_data['longitude']
    
    try:
        # Find active check-in for this employee
        active_checkin = CheckIn.objects.filter(
            employee=request.user,
            status='checked_in',
            check_out_time__isnull=True
        ).first()
        
        if not active_checkin:
            return Response({
                'error': 'You are not currently checked in anywhere'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        location = active_checkin.location
        if not location.is_within_range(user_latitude, user_longitude):
            return Response({
                'error': f'You are not within range of this location. Please move closer to {location.name} to check out'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update check-in record
        active_checkin.check_out_time = timezone.now()
        active_checkin.status = 'checked_out'
        active_checkin.save()
        
        return Response({
            'message': f'Successfully checked out from {active_checkin.location.name}',
            'checkin': CheckInSerializer(active_checkin).data
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Admin API endpoints
@api_view(['GET'])
def api_admin_dashboard_stats(request):
    """Get admin dashboard statistics"""
    if not request.user.is_staff:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    today = timezone.now().date()
    
    # Currently checked in employees count
    currently_checked_in = CheckIn.objects.filter(
        status='checked_in',
        check_out_time__isnull=True
    ).count()
    
    # Today's check-ins count
    todays_checkins = CheckIn.objects.filter(
        check_in_time__date=today
    ).count()
    
    # Total employees
    total_employees = Employee.objects.filter(is_staff=False).count()
    
    # Total locations
    total_locations = Location.objects.filter(is_active=True).count()
    
    return Response({
        'currently_checked_in': currently_checked_in,
        'todays_checkins': todays_checkins,
        'total_employees': total_employees,
        'total_locations': total_locations
    })

@api_view(['GET'])
def api_admin_all_checkins(request):
    """Get all check-in records for admin"""
    if not request.user.is_staff:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    checkins = CheckIn.objects.all().select_related('employee', 'location').order_by('-check_in_time')[:50]
    return Response(CheckInSerializer(checkins, many=True).data)

@api_view(['GET'])
def api_admin_employees(request):
    """Get all employees for admin"""
    if not request.user.is_staff:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    employees = Employee.objects.filter(is_staff=False)
    return Response(EmployeeSerializer(employees, many=True).data)

@api_view(['GET'])
def api_admin_locations(request):
    """Get all locations for admin"""
    if not request.user.is_staff:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    locations = Location.objects.all()
    return Response(LocationSerializer(locations, many=True).data)