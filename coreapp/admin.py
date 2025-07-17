from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Employee, Location, CheckIn

class EmployeeAdmin(UserAdmin):
    list_display = ('email', 'full_name', 'employee_id', 'phone_number', 'is_staff')
    search_fields = ('email', 'full_name', 'employee_id')
    readonly_fields = ('date_joined',)
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'phone_number', 'employee_id', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'employee_id', 'password1', 'password2'),
        }),
    )

class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'start_time', 'end_time', 'is_active')
    search_fields = ('name', 'address')
    list_filter = ('is_active',)

class CheckInAdmin(admin.ModelAdmin):
    list_display = ('employee', 'location', 'check_in_time', 'check_out_time', 'status', 'duration')
    search_fields = ('employee__full_name', 'employee__email', 'location__name')
    list_filter = ('status', 'location')
    date_hierarchy = 'check_in_time'

admin.site.register(Employee, EmployeeAdmin)
admin.site.register(Location, LocationAdmin)
admin.site.register(CheckIn, CheckInAdmin)
