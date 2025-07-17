from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
import uuid
from datetime import datetime, timedelta
import math

class UserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        
        # Generate employee_id if not provided
        if 'employee_id' not in extra_fields or not extra_fields['employee_id']:
            # Generate a unique ID with EMP prefix and 6 digits
            extra_fields['employee_id'] = f"EMP{uuid.uuid4().hex[:6].upper()}"
        
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, full_name, password, **extra_fields)

class Employee(AbstractUser):
    username = None
    email = models.EmailField(unique=True, primary_key=True)
    full_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    employee_id = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=50, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']
    
    objects = UserManager()
    
    def __str__(self):
        return self.full_name
    
    def save(self, *args, **kwargs):
        # Generate employee_id if it's not set
        if not self.employee_id:
            self.employee_id = f"EMP{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

class Location(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    range_meters = models.IntegerField(default=100, help_text="Check-in range in meters")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    def can_check_in(self, current_time=None):
        """
        Check if employee can check in based on location's start time
        Employees can check in only 15 minutes before start time
        """
        if current_time is None:
            current_time = timezone.localtime().time()
            
        # Convert start_time to datetime.time if it's not already
        if isinstance(self.start_time, datetime):
            start_time = self.start_time.time()
        else:
            start_time = self.start_time
            
        # Calculate 15 minutes before start time
        start_datetime = datetime.combine(datetime.today(), start_time)
        allowed_check_in_time = (start_datetime - timedelta(minutes=15)).time()
        
        return current_time >= allowed_check_in_time
    
    def is_within_range(self, user_lat, user_lng):
        """
        Check if the user is within the specified range of the location
        using the Haversine formula to calculate distance
        """
        if self.latitude is None or self.longitude is None:
            return False
            
        # Convert decimal degrees to radians
        user_lat_rad = math.radians(float(user_lat))
        user_lng_rad = math.radians(float(user_lng))
        loc_lat_rad = math.radians(float(self.latitude))
        loc_lng_rad = math.radians(float(self.longitude))
        
        # Haversine formula
        dlon = loc_lng_rad - user_lng_rad
        dlat = loc_lat_rad - user_lat_rad
        a = math.sin(dlat/2)**2 + math.cos(user_lat_rad) * math.cos(loc_lat_rad) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        r = 6371000  # Earth radius in meters
        distance = c * r
        
        return distance <= self.range_meters

class CheckIn(models.Model):
    STATUS_CHOICES = [
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='check_ins')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='check_ins')
    check_in_time = models.DateTimeField()
    check_out_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='checked_in')
    duration = models.DurationField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-check_in_time']
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.location.name} - {self.check_in_time.date()}"
    
    def save(self, *args, **kwargs):
        # Calculate duration if check_out_time exists
        if self.check_out_time and self.check_in_time:
            self.duration = self.check_out_time - self.check_in_time
        super().save(*args, **kwargs)
