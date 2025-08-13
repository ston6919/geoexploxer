from django.urls import path
from . import views

urlpatterns = [
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/user/', views.get_user_info, name='user_info'),
    path('auth/logout/', views.logout, name='logout'),
    path('hello/', views.hello_world, name='hello_world'),
]

