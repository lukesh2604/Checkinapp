from django.urls import path
from . import views

# app_name = 'coreapp'

urlpatterns = [
    # Authentication URLs
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # Main routes
    path('', views.home, name='home'),
    path('employee/', views.employee_dashboard, name='employee_dashboard'),
    path('admin/', views.admin_dashboard, name='admin_dashboard'),
    
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