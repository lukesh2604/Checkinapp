from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone
from django.db.models import Sum, Count, F, ExpressionWrapper, fields
from django.db.models.functions import TruncDate

import json
from datetime import datetime, timedelta

from .models import Employee, Location, CheckIn

@login_required(login_url='/login/')
def home(request):
    # Redirect based on user role
    if request.user.is_staff:
        return redirect('admin_dashboard')
    else:
        return redirect('employee_dashboard')

def login_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, email=email, password=password)
        
        if user is not None:
            login(request, user)
            if user.is_staff:
                return redirect('admin_dashboard')
            else:
                return redirect('employee_dashboard')
        else:
            # Add error message handling
            return render(request, 'login.html', {'error': 'Invalid credentials'})
    
    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    return redirect('login')

@login_required(login_url='/login/')
def employee_dashboard(request):
    if request.user.is_staff:
        return redirect('admin_dashboard')
    
    # Get all active locations
    locations = Location.objects.filter(is_active=True)
    
    # Get the current employee's active check-in (if any)
    active_checkin = CheckIn.objects.filter(
        employee=request.user,
        status='checked_in',
        check_out_time__isnull=True
    ).first()
    
    # Get employee's recent check-in history
    checkin_history = CheckIn.objects.filter(employee=request.user).order_by('-check_in_time')[:10]
    
    context = {
        'locations': locations,
        'active_checkin': active_checkin,
        'checkin_history': checkin_history,
    }
    
    return render(request, 'employee-dashboard.html', context)

@login_required(login_url='/login/')
def admin_dashboard(request):
    if not request.user.is_staff:
        return redirect('employee_dashboard')
    
    # Default to locations tab
    return admin_locations(request)

# Admin Dashboard tab views
@login_required(login_url='/login/')
def admin_locations(request):
    if not request.user.is_staff:
        return redirect('employee_dashboard')
    
    # Get all locations
    locations = Location.objects.all()
    
    context = {
        'active_tab': 'locations',
        'locations': locations,
    }
    
    return render(request, 'admin-dashboard.html', context)

@login_required(login_url='/login/')
def admin_employees(request):
    if not request.user.is_staff:
        return redirect('employee_dashboard')
    
    # Get all employees
    employees = Employee.objects.filter(is_staff=False)
    
    context = {
        'active_tab': 'employees',
        'employees': employees,
    }
    
    return render(request, 'admin-dashboard.html', context)

@login_required(login_url='/login/')
def admin_checkin_monitor(request):
    if not request.user.is_staff:
        return redirect('employee_dashboard')
    
    # Get check-in statistics
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
    
    # Total hours today
    total_hours = CheckIn.objects.filter(
        check_in_time__date=today,
        check_out_time__isnull=False
    ).aggregate(
        total_duration=Sum('duration')
    )['total_duration'] or timedelta()
    
    # Format total hours
    total_hours_str = f"{total_hours.seconds // 3600}h {(total_hours.seconds % 3600) // 60}m"
    
    # All check-in records
    checkin_records = CheckIn.objects.all().select_related('employee', 'location')
    
    # Get locations for dropdown filter
    locations = Location.objects.all()
    
    context = {
        'active_tab': 'check-in-monitor',
        'currently_checked_in': currently_checked_in,
        'todays_checkins': todays_checkins,
        'total_hours_str': total_hours_str,
        'total_records': CheckIn.objects.count(),
        'checkin_records': checkin_records,
        'locations': locations,
    }
    
    return render(request, 'admin-dashboard.html', context)

@login_required(login_url='/login/')
def admin_active_locations(request):
    if not request.user.is_staff:
        return redirect('employee_dashboard')
    
    # Get all locations
    locations = Location.objects.all()
    
    # Get currently checked in employees for each location
    for location in locations:
        location.active_checkins = CheckIn.objects.filter(
            location=location,
            status='checked_in',
            check_out_time__isnull=True
        ).select_related('employee')
    
    context = {
        'active_tab': 'active-locations',
        'locations': locations,
    }
    
    return render(request, 'admin-dashboard.html', context)

@login_required(login_url='/login/')
def admin_checkin_log(request):
    if not request.user.is_staff:
        return redirect('employee_dashboard')
    
    # Get all check-in records
    checkin_records = CheckIn.objects.all().select_related('employee', 'location').order_by('-check_in_time')
    
    # Get all locations for filtering
    locations = Location.objects.all()
    
    context = {
        'active_tab': 'check-in-log',
        'checkin_records': checkin_records,
        'locations': locations,
    }
    
    return render(request, 'admin-dashboard.html', context)

# API endpoints for employee check-in/check-out
@csrf_exempt
@login_required(login_url='/login/')
def employee_checkin(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            location_id = data.get('location_id')
            user_latitude = data.get('latitude')
            user_longitude = data.get('longitude')
            
            # Check if location exists
            location = get_object_or_404(Location, id=location_id)
            
            # Check if employee is already checked in somewhere
            active_checkin = CheckIn.objects.filter(
                employee=request.user,
                status='checked_in',
                check_out_time__isnull=True
            ).first()
            
            if active_checkin:
                return JsonResponse({
                    'status': 'error',
                    'message': 'You are already checked in at another location. Please check out first.'
                })
            
            # Check if employee can check in (15 minutes before shift start)
            current_time = timezone.localtime().time()
            if not location.can_check_in(current_time):
                return JsonResponse({
                    'status': 'error',
                    'message': f'You can only check in 15 minutes before your shift starts at {location.start_time.strftime("%H:%M")}'
                })
            
            # Check if employee is within range of the location
            if not user_latitude or not user_longitude:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Location information is required for check-in'
                })
                
            if not location.is_within_range(user_latitude, user_longitude):
                return JsonResponse({
                    'status': 'error',
                    'message': f'You are not within range of this location. Please move closer to {location.name}'
                })
            
            # Create check-in record
            checkin = CheckIn.objects.create(
                employee=request.user,
                location=location,
                check_in_time=timezone.now(),
                status='checked_in'
            )
            
            return JsonResponse({
                'status': 'success', 
                'message': f'Successfully checked in at {location.name}',
                'timestamp': timezone.localtime().strftime('%H:%M:%S'),
                'checkin_id': checkin.id
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
@login_required(login_url='/login/')
def employee_checkout(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_latitude = data.get('latitude')
            user_longitude = data.get('longitude')
            
            # Find active check-in for this employee
            active_checkin = CheckIn.objects.filter(
                employee=request.user,
                status='checked_in',
                check_out_time__isnull=True
            ).first()
            
            if not active_checkin:
                return JsonResponse({
                    'status': 'error',
                    'message': 'You are not currently checked in anywhere'
                })
                
            # Check if employee is within range of the location
            if not user_latitude or not user_longitude:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Location information is required for check-out'
                })
                
            location = active_checkin.location
            if not location.is_within_range(user_latitude, user_longitude):
                return JsonResponse({
                    'status': 'error',
                    'message': f'You are not within range of this location. Please move closer to {location.name} to check out'
                })
            
            # Update check-in record
            active_checkin.check_out_time = timezone.now()
            active_checkin.status = 'checked_out'
            active_checkin.save()  # Duration is calculated in the save method
            
            return JsonResponse({
                'status': 'success', 
                'message': f'Successfully checked out from {active_checkin.location.name}',
                'timestamp': timezone.localtime().strftime('%H:%M:%S'),
                'duration': str(active_checkin.duration).split('.')[0]  # Format as HH:MM:SS
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

# API endpoints for admin dashboard
@csrf_exempt
@login_required(login_url='/login/')
def add_location(request):
    if not request.user.is_staff:
        return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
        
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name')
            address = data.get('address')
            start_time = data.get('start_time')
            end_time = data.get('end_time')
            range_meters = data.get('range')
            latitude = data.get('latitude')
            longitude = data.get('longitude')
            
            if not all([name, address, start_time, end_time, range_meters, latitude, longitude]):
                return JsonResponse({
                    'status': 'error',
                    'message': 'All fields are required'
                })
            
            # Create new location
            location = Location.objects.create(
                name=name,
                address=address,
                start_time=start_time,
                end_time=end_time,
                range_meters=range_meters,
                latitude=latitude,
                longitude=longitude
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Location added successfully',
                'location_id': location.id
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
            
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
@login_required(login_url='/login/')
def add_employee(request):
    if not request.user.is_staff:
        return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
        
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            full_name = data.get('name')
            email = data.get('email')
            role = data.get('role')
            password = data.get('password', 'changeme123')  # Default password
            
            if not all([full_name, email]):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Name and email are required'
                })
            
            # Check if email already exists
            if Employee.objects.filter(email=email).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'Email already exists'
                })
            
            # Create new employee - employee_id will be auto-generated
            employee = Employee.objects.create_user(
                email=email,
                full_name=full_name,
                password=password,
                role=role
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Employee added successfully',
                'employee_id': employee.employee_id
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
            
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
@login_required(login_url='/login/')
def export_checkin_data(request):
    if not request.user.is_staff:
        return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
    
    import csv
    from django.http import HttpResponse
    
    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="checkin_data.csv"'
    
    # Create CSV writer
    writer = csv.writer(response)
    writer.writerow(['Employee', 'Email', 'Location', 'Check In Time', 'Check Out Time', 'Duration', 'Status'])
    
    # Get all check-in records
    checkins = CheckIn.objects.all().select_related('employee', 'location')
    
    # Write data rows
    for checkin in checkins:
        writer.writerow([
            checkin.employee.full_name,
            checkin.employee.email,
            checkin.location.name,
            checkin.check_in_time.strftime('%Y-%m-%d %H:%M:%S'),
            checkin.check_out_time.strftime('%Y-%m-%d %H:%M:%S') if checkin.check_out_time else 'N/A',
            str(checkin.duration).split('.')[0] if checkin.duration else 'N/A',  # Format as HH:MM:SS
            checkin.get_status_display()
        ])
    
    return response

@csrf_exempt
@login_required(login_url='/login/')
def delete_location(request, location_id):
    if not request.user.is_staff:
        return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
    
    if request.method == 'DELETE':
        try:
            location = get_object_or_404(Location, id=location_id)
            
            # Check if there are any check-ins associated with this location
            if location.check_ins.exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'Cannot delete location with existing check-in records'
                })
            
            # Delete the location
            location.delete()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Location deleted successfully'
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
@login_required(login_url='/login/')
def edit_location(request, location_id):
    if not request.user.is_staff:
        return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
    
    if request.method == 'GET':
        try:
            location = get_object_or_404(Location, id=location_id)
            return JsonResponse({
                'status': 'success',
                'location': {
                    'id': location.id,
                    'name': location.name,
                    'address': location.address,
                    'start_time': location.start_time.strftime('%H:%M'),
                    'end_time': location.end_time.strftime('%H:%M'),
                    'range_meters': location.range_meters,
                    'latitude': str(location.latitude),
                    'longitude': str(location.longitude),
                    'is_active': location.is_active
                }
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            location = get_object_or_404(Location, id=location_id)
            
            # Update fields
            location.name = data.get('name', location.name)
            location.address = data.get('address', location.address)
            location.start_time = data.get('start_time', location.start_time)
            location.end_time = data.get('end_time', location.end_time)
            location.range_meters = data.get('range', location.range_meters)
            location.latitude = data.get('latitude', location.latitude)
            location.longitude = data.get('longitude', location.longitude)
            location.is_active = data.get('is_active', location.is_active)
            
            location.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Location updated successfully'
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
@login_required(login_url='/login/')
def edit_employee(request, employee_id):
    if not request.user.is_staff:
        return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
    
    if request.method == 'GET':
        try:
            employee = get_object_or_404(Employee, employee_id=employee_id)
            return JsonResponse({
                'status': 'success',
                'employee': {
                    'id': employee.employee_id,
                    'full_name': employee.full_name,
                    'email': employee.email,
                    'role': employee.role,
                    'phone_number': employee.phone_number
                }
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            employee = get_object_or_404(Employee, employee_id=employee_id)
            
            # Update fields
            employee.full_name = data.get('name', employee.full_name)
            employee.role = data.get('role', employee.role)
            employee.phone_number = data.get('phone_number', employee.phone_number)
            
            # Only update email if it's changed and doesn't conflict
            new_email = data.get('email')
            if new_email and new_email != employee.email:
                if Employee.objects.filter(email=new_email).exists():
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Email already exists'
                    })
                employee.email = new_email
            
            # Update password if provided
            password = data.get('password')
            if password:
                employee.set_password(password)
            
            employee.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Employee updated successfully'
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)