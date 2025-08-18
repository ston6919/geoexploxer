from django.urls import path
from . import views

urlpatterns = [
    path('', views.api_root, name='api_root'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/user/', views.get_user_info, name='user_info'),
    path('auth/logout/', views.logout, name='logout'),
    # Password reset endpoints
    path('auth/password-reset/', views.password_reset_request, name='password_reset_request'),
    path('auth/password-reset-confirm/', views.password_reset_confirm, name='password_reset_confirm'),
    path('hello/', views.hello_world, name='hello_world'),
    path('business/profile/', views.business_profile, name='business_profile'),
    path('business/onboarding-status/', views.onboarding_status, name='onboarding_status'),
    path('search-terms/', views.search_terms, name='search_terms'),
    path('search-terms/<int:pk>/', views.search_term_detail, name='search_term_detail'),
    path('search-logs/', views.search_logs, name='search_logs'),
    path('search-analytics/', views.search_analytics, name='search_analytics'),
    path('ai-models/', views.ai_models, name='ai_models'),
    path('run-ai-search/', views.run_ai_search, name='run_ai_search'),
    path('run-ai-search', views.run_ai_search, name='run_ai_search_no_slash'),
]

