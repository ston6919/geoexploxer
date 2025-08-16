from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, BusinessProfile, SearchTerm, AIModel, SearchLog, Analysis


class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'username', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'date_joined')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('username', 'first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )
    search_fields = ('email', 'username')
    ordering = ('email',)


admin.site.register(CustomUser, CustomUserAdmin)


@admin.register(BusinessProfile)
class BusinessProfileAdmin(admin.ModelAdmin):
    list_display = ('business_name', 'user', 'industry', 'business_size', 'onboarding_completed', 'created_at')
    list_filter = ('industry', 'business_size', 'onboarding_completed', 'created_at')
    search_fields = ('business_name', 'user__email', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Business Information', {
            'fields': ('user', 'business_name', 'industry', 'business_description', 'year_founded', 'business_size')
        }),
        ('Target Market', {
            'fields': ('target_market', 'target_demographics', 'geographic_markets')
        }),
        ('Products & Services', {
            'fields': ('products_services', 'unique_value_proposition', 'pricing_strategy')
        }),
        ('Competition & Goals', {
            'fields': ('main_competitors', 'competitive_advantages', 'business_goals', 'current_challenges')
        }),
        ('Marketing & Branding', {
            'fields': ('current_marketing', 'brand_values', 'website_url')
        }),
        ('Status', {
            'fields': ('onboarding_completed', 'created_at', 'updated_at')
        }),
    )


@admin.register(SearchTerm)
class SearchTermAdmin(admin.ModelAdmin):
    list_display = ('term', 'business_profile', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at', 'business_profile__business_name')
    search_fields = ('term', 'description', 'business_profile__business_name')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('is_active',)


@admin.register(AIModel)
class AIModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'provider', 'version', 'is_active', 'cost_per_million_input_usd', 'cost_per_million_output_usd', 'created_at')
    list_filter = ('provider', 'is_active', 'created_at')
    search_fields = ('name', 'provider', 'version')
    readonly_fields = ('created_at',)
    list_editable = ('is_active',)


@admin.register(SearchLog)
class SearchLogAdmin(admin.ModelAdmin):
    list_display = ('search_term', 'ai_model', 'business_profile', 'search_timestamp', 'response_time_ms', 'tokens_used')
    list_filter = ('ai_model', 'search_timestamp', 'business_profile__business_name')
    search_fields = ('search_term__term', 'query', 'response', 'business_profile__business_name')
    readonly_fields = ('search_timestamp', 'response_time_ms', 'tokens_used')
    fieldsets = (
        ('Search Details', {
            'fields': ('business_profile', 'search_term', 'ai_model', 'query', 'response')
        }),
        ('Cost Information', {
            'fields': ('current_cost_input_usd', 'current_cost_output_usd')
        }),
        ('Metadata', {
            'fields': ('search_timestamp', 'response_time_ms', 'tokens_used', 'user_agent', 'ip_address')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('search_term', 'ai_model', 'business_profile')


@admin.register(Analysis)
class AnalysisAdmin(admin.ModelAdmin):
    list_display = ('search_log', 'business_profile', 'business_mentioned', 'sentiment', 'confidence_score', 'analysis_timestamp')
    list_filter = ('business_mentioned', 'sentiment', 'analysis_model', 'analysis_timestamp', 'business_profile__business_name')
    search_fields = ('search_log__search_term__term', 'business_profile__business_name', 'mention_context')
    readonly_fields = ('analysis_timestamp', 'analysis_duration_ms')
    fieldsets = (
        ('Analysis Details', {
            'fields': ('business_profile', 'search_log', 'analysis_model')
        }),
        ('Analysis Results', {
            'fields': ('business_mentioned', 'mention_context', 'sentiment', 'confidence_score')
        }),
        ('Metadata', {
            'fields': ('analysis_timestamp', 'analysis_duration_ms', 'raw_analysis_response')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('search_log__search_term', 'business_profile')
