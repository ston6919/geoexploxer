from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, BusinessProfile, SearchTerm, AIModel, SearchLog, Analysis

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('id', 'date_joined')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2', 'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class BusinessProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessProfile
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

    def create(self, validated_data):
        # If user is already in validated_data (passed from view), use it
        # Otherwise, try to get it from context
        if 'user' not in validated_data:
            if 'request' in self.context:
                validated_data['user'] = self.context['request'].user
            else:
                raise serializers.ValidationError("User is required")
        return super().create(validated_data)


class SearchTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchTerm
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'business_profile')

    def create(self, validated_data):
        # Automatically associate with the current user's business profile
        if 'business_profile' not in validated_data:
            user = self.context['request'].user
            print(f"DEBUG: User ID: {user.id}, Email: {user.email}")
            try:
                business_profile = user.business_profile
                print(f"DEBUG: Found business profile: {business_profile.business_name} (ID: {business_profile.id})")
                validated_data['business_profile'] = business_profile
            except BusinessProfile.DoesNotExist:
                print("DEBUG: Business profile does not exist for user")
                raise serializers.ValidationError("Business profile not found. Please complete onboarding first.")
            except Exception as e:
                print(f"DEBUG: Unexpected error accessing business profile: {e}")
                raise serializers.ValidationError(f"Error accessing business profile: {str(e)}")
        
        print(f"DEBUG: Final validated_data: {validated_data}")
        return super().create(validated_data)


class AIModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIModel
        fields = '__all__'
        read_only_fields = ('created_at',)


class SearchLogSerializer(serializers.ModelSerializer):
    search_term = SearchTermSerializer(read_only=True)
    ai_model = AIModelSerializer(read_only=True)
    business_profile = BusinessProfileSerializer(read_only=True)

    class Meta:
        model = SearchLog
        fields = '__all__'
        read_only_fields = ('search_timestamp', 'created_at', 'updated_at')

    def to_representation(self, instance):
        """Custom representation to include analysis data"""
        data = super().to_representation(instance)
        
        # Add analysis data if it exists
        try:
            if hasattr(instance, 'analysis') and instance.analysis:
                analysis_data = {
                    'id': instance.analysis.id,
                    'business_mentioned': instance.analysis.business_mentioned,
                    'mention_context': instance.analysis.mention_context,
                    'sentiment': instance.analysis.sentiment,
                    'confidence_score': instance.analysis.confidence_score,
                    'analysis_timestamp': instance.analysis.analysis_timestamp.isoformat(),
                    'analysis_model': instance.analysis.analysis_model,
                    'analysis_duration_ms': instance.analysis.analysis_duration_ms,
                    'raw_analysis_response': instance.analysis.raw_analysis_response
                }
                data['analysis'] = analysis_data
            else:
                data['analysis'] = None
        except Exception as e:
            print(f"DEBUG: Error including analysis in serializer: {e}")
            data['analysis'] = None
            
        return data

    def create(self, validated_data):
        # Automatically associate with the current user's business profile
        if 'business_profile' not in validated_data:
            user = self.context['request'].user
            try:
                validated_data['business_profile'] = user.business_profile
            except BusinessProfile.DoesNotExist:
                raise serializers.ValidationError("Business profile not found. Please complete onboarding first.")
        return super().create(validated_data)


class AnalysisSerializer(serializers.ModelSerializer):
    search_log = SearchLogSerializer(read_only=True)
    business_profile = BusinessProfileSerializer(read_only=True)
    
    class Meta:
        model = Analysis
        fields = '__all__'
        read_only_fields = ('analysis_timestamp',)

