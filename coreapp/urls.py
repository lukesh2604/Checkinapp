from django.urls import path
from . import views
from . import api_views

# app_name = 'coreapp'

urlpatterns = [
    # Authentication URLs
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # Main routes
    path('', views.home, name='home'),
    path('employee/', views.employee_dashboard, name='employee_dashboard'),
    path('admin/', views.admin_dashboard, name='admin_dashboard'),
    
    # Mobile API endpoints
    path('api/mobile/login/', api_views.api_login, name='api_login'),
    path('api/mobile/logout/', api_views.api_logout, name='api_logout'),
    path('api/mobile/profile/', api_views.api_profile, name='api_profile'),
    path('api/mobile/locations/', api_views.api_locations, name='api_locations'),
    path('api/mobile/active-checkin/', api_views.api_active_checkin, name='api_active_checkin'),
    path('api/mobile/checkin-history/', api_views.api_checkin_history, name='api_checkin_history'),
    path('api/mobile/checkin/', api_views.api_checkin, name='api_mobile_checkin'),
    path('api/mobile/checkout/', api_views.api_checkout, name='api_mobile_checkout'),
    
    # Admin mobile API endpoints
    path('api/mobile/admin/dashboard-stats/', api_views.api_admin_dashboard_stats, name='api_admin_dashboard_stats'),
    path('api/mobile/admin/checkins/', api_views.api_admin_all_checkins, name='api_admin_all_checkins'),
    path('api/mobile/admin/employees/', api_views.api_admin_employees, name='api_admin_employees'),
    path('api/mobile/admin/locations/', api_views.api_admin_locations, name='api_admin_locations'),
    
    # Admin dashboard tab views
    path('admin/locations/', views.admin_locations, name='admin_locations'),
    path('admin/employees/', views.admin_employees, name='admin_employees'),
    path('admin/active-locations/', views.admin_active_locations, name='admin_active_locations'),
    path('admin/check-in-log/', views.admin_checkin_log, name='admin_checkin_log'),
    path('admin/check-in-monitor/', views.admin_checkin_monitor, name='admin_checkin_monitor'),
    
    # API endpoints for employee actions
    path('api/check-in/', views.employee_checkin, name='employee_checkin'),
    path('api/check-out/', views.employee_checkout, name='employee_checkout'),
    
    # API endpoints for admin actions
    path('api/add-location/', views.add_location, name='add_location'),
    path('api/delete-location/<int:location_id>/', views.delete_location, name='delete_location'),
    path('api/edit-location/<int:location_id>/', views.edit_location, name='edit_location'),
    path('api/add-employee/', views.add_employee, name='add_employee'),
    path('api/edit-employee/<str:employee_id>/', views.edit_employee, name='edit_employee'),
    path('api/export-check-in-data/', views.export_checkin_data, name='export_checkin_data'),
] 