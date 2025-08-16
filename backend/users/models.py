from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email


class BusinessProfile(models.Model):
    INDUSTRY_CHOICES = [
        ('tech', 'Technology'),
        ('healthcare', 'Healthcare'),
        ('finance', 'Finance & Banking'),
        ('retail', 'Retail & E-commerce'),
        ('education', 'Education'),
        ('manufacturing', 'Manufacturing'),
        ('consulting', 'Consulting'),
        ('real_estate', 'Real Estate'),
        ('food_beverage', 'Food & Beverage'),
        ('entertainment', 'Entertainment & Media'),
        ('automotive', 'Automotive'),
        ('fashion', 'Fashion & Beauty'),
        ('travel', 'Travel & Tourism'),
        ('other', 'Other'),
    ]
    
    BUSINESS_SIZE_CHOICES = [
        ('startup', 'Startup (1-10 employees)'),
        ('small', 'Small Business (11-50 employees)'),
        ('medium', 'Medium Business (51-200 employees)'),
        ('large', 'Large Business (200+ employees)'),
        ('enterprise', 'Enterprise (1000+ employees)'),
    ]

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='business_profile')
    
    # Basic Business Information
    business_name = models.CharField(max_length=200)
    industry = models.CharField(max_length=50, choices=INDUSTRY_CHOICES)
    business_description = models.TextField()
    year_founded = models.IntegerField(null=True, blank=True)
    business_size = models.CharField(max_length=20, choices=BUSINESS_SIZE_CHOICES)
    
    # Target Market
    target_market = models.TextField(help_text="Describe your ideal customers")
    target_demographics = models.TextField(help_text="Age, gender, income level, etc.")
    geographic_markets = models.TextField(help_text="Where do you operate/sell?")
    
    # Products/Services
    products_services = models.TextField(help_text="What products or services do you offer?")
    unique_value_proposition = models.TextField(help_text="What makes you different?")
    pricing_strategy = models.TextField(help_text="How do you price your offerings?")
    
    # Competition
    main_competitors = models.TextField(help_text="Who are your main competitors?")
    competitive_advantages = models.TextField(help_text="What advantages do you have?")
    
    # Goals & Challenges
    business_goals = models.TextField(help_text="What are your main business objectives?")
    current_challenges = models.TextField(help_text="What challenges are you facing?")
    
    # Marketing & Branding
    current_marketing = models.TextField(help_text="What marketing channels do you use?")
    brand_values = models.TextField(help_text="What are your core brand values?")
    website_url = models.URLField(blank=True, null=True)
    
    # Onboarding Status
    onboarding_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.business_name} - {self.user.email}"


class SearchTerm(models.Model):
    """Search terms to monitor in AI model responses"""
    business_profile = models.ForeignKey(BusinessProfile, on_delete=models.CASCADE, related_name='search_terms')
    term = models.CharField(max_length=200, help_text="The search term to monitor")
    description = models.TextField(blank=True, help_text="Description of why this term is important")
    is_active = models.BooleanField(default=True, help_text="Whether to actively monitor this term")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['business_profile', 'term']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.term} - {self.business_profile.business_name}"


class AIModel(models.Model):
    """AI models that are being queried"""
    name = models.CharField(max_length=100, unique=True, help_text="Name of the AI model (e.g., GPT-4, Claude, Gemini)")
    provider = models.CharField(max_length=100, help_text="Provider of the model (e.g., OpenAI, Anthropic, Google)")
    version = models.CharField(max_length=50, blank=True, help_text="Model version if applicable")
    is_active = models.BooleanField(default=True, help_text="Whether this model is currently being monitored")
    
    # Cost fields (per million tokens)
    cost_per_million_input_usd = models.DecimalField(
        max_digits=10, 
        decimal_places=6, 
        null=True, 
        blank=True, 
        help_text="Cost per million input tokens in USD"
    )
    cost_per_million_output_usd = models.DecimalField(
        max_digits=10, 
        decimal_places=6, 
        null=True, 
        blank=True, 
        help_text="Cost per million output tokens in USD"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.provider})"


class SearchLog(models.Model):
    """Log of searches performed and their results"""
    
    business_profile = models.ForeignKey(BusinessProfile, on_delete=models.CASCADE, related_name='search_logs')
    search_term = models.ForeignKey(SearchTerm, on_delete=models.CASCADE, related_name='search_logs')
    ai_model = models.ForeignKey(AIModel, on_delete=models.CASCADE, related_name='search_logs')
    
    # Search details
    query = models.TextField(help_text="The actual query sent to the AI model")
    response = models.TextField(help_text="The response from the AI model")
    
    # Metadata
    search_timestamp = models.DateTimeField(auto_now_add=True)
    response_time_ms = models.IntegerField(null=True, blank=True, help_text="Response time in milliseconds")
    tokens_used = models.IntegerField(null=True, blank=True, help_text="Number of tokens used in the request")
    
    # Cost tracking
    current_cost_input_usd = models.DecimalField(
        max_digits=10, 
        decimal_places=6, 
        null=True, 
        blank=True, 
        help_text="Current cost for input tokens in USD"
    )
    current_cost_output_usd = models.DecimalField(
        max_digits=10, 
        decimal_places=6, 
        null=True, 
        blank=True, 
        help_text="Current cost for output tokens in USD"
    )
    
    # Additional context
    user_agent = models.CharField(max_length=500, blank=True, help_text="User agent of the request")
    ip_address = models.GenericIPAddressField(null=True, blank=True, help_text="IP address of the request")
    
    class Meta:
        ordering = ['-search_timestamp']
    
    def __str__(self):
        return f"{self.search_term.term} - {self.ai_model.name} - {self.search_timestamp.strftime('%Y-%m-%d %H:%M')}"


class Analysis(models.Model):
    """Analysis results for search log responses"""
    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
        ('mixed', 'Mixed'),
    ]
    
    business_profile = models.ForeignKey(BusinessProfile, on_delete=models.CASCADE, related_name='analyses')
    search_log = models.OneToOneField(SearchLog, on_delete=models.CASCADE, related_name='analysis')
    
    # Analysis results
    business_mentioned = models.BooleanField(default=False, help_text="Whether the business was mentioned in the response")
    mention_context = models.TextField(blank=True, help_text="Context around the business mention")
    sentiment = models.CharField(max_length=20, choices=SENTIMENT_CHOICES, blank=True, help_text="Sentiment of the mention")
    confidence_score = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True, help_text="Confidence in sentiment analysis (0-1)")
    
    # Analysis metadata
    analysis_model = models.CharField(max_length=100, help_text="Model used for analysis (e.g., google/gemma-2-9b-it)")
    analysis_timestamp = models.DateTimeField(auto_now_add=True)
    analysis_duration_ms = models.IntegerField(null=True, blank=True, help_text="Time taken for analysis in milliseconds")
    
    # Raw analysis response
    raw_analysis_response = models.TextField(blank=True, help_text="Raw response from the analysis model")
    
    class Meta:
        ordering = ['-analysis_timestamp']
        verbose_name_plural = "Analyses"
    
    def __str__(self):
        return f"Analysis for {self.search_log.search_term.term} - {self.analysis_timestamp.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def sentiment_color(self):
        """Return CSS color class for sentiment"""
        colors = {
            'positive': 'text-green-600',
            'neutral': 'text-gray-600',
            'negative': 'text-red-600',
            'mixed': 'text-yellow-600',
        }
        return colors.get(self.sentiment, 'text-gray-600')

