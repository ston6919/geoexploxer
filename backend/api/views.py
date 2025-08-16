from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from users.serializers import UserSerializer, RegisterSerializer, LoginSerializer, BusinessProfileSerializer, SearchTermSerializer, AIModelSerializer, SearchLogSerializer
from users.models import BusinessProfile, SearchTerm, AIModel, SearchLog
from users.ai_service import ai_service

User = get_user_model()


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def api_root(request):
    """API root endpoint showing available endpoints"""
    return Response({
        'message': 'GEOExplorer API',
        'endpoints': {
            'auth': {
                'register': '/api/auth/register/',
                'login': '/api/auth/login/',
                'user': '/api/auth/user/',
                'logout': '/api/auth/logout/',
            },
            'business': {
                'profile': '/api/business/profile/',
                'onboarding_status': '/api/business/onboarding-status/',
            },
            'test': {
                'hello': '/api/hello/',
            }
        },
        'status': 'running'
    })


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer


class LoginView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        user = authenticate(email=email, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        else:
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_info(request):
    """Get current user information"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout(request):
    """Logout user (blacklist refresh token)"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Successfully logged out'})
    except Exception:
        return Response({'message': 'Successfully logged out'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def hello_world(request):
    """Protected endpoint that returns hello world message"""
    return Response({
        'message': f'Hello World! Welcome {request.user.username}!',
        'user': UserSerializer(request.user).data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def onboarding_status(request):
    """Check if user has completed onboarding"""
    try:
        profile = request.user.business_profile
        return Response({
            'onboarding_completed': profile.onboarding_completed,
            'has_profile': True
        })
    except BusinessProfile.DoesNotExist:
        return Response({
            'onboarding_completed': False,
            'has_profile': False
        })


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def business_profile(request):
    """Handle business profile creation and updates"""
    print(f"DEBUG: Business profile request from user ID: {request.user.id}, Email: {request.user.email}")
    
    if request.method == 'GET':
        try:
            profile = request.user.business_profile
            print(f"DEBUG: Found business profile: {profile.business_name} (ID: {profile.id})")
            serializer = BusinessProfileSerializer(profile)
            return Response(serializer.data)
        except BusinessProfile.DoesNotExist:
            print("DEBUG: Business profile does not exist for user")
            return Response({'message': 'No business profile found'}, status=status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'POST':
        try:
            profile = request.user.business_profile
            serializer = BusinessProfileSerializer(profile, data=request.data, partial=True)
        except BusinessProfile.DoesNotExist:
            serializer = BusinessProfileSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def search_terms(request):
    """Manage search terms for the current user's business"""
    print(f"DEBUG: Search terms request from user ID: {request.user.id}, Email: {request.user.email}")
    
    if request.method == 'GET':
        try:
            business_profile = request.user.business_profile
            print(f"DEBUG: Found business profile for search terms: {business_profile.business_name} (ID: {business_profile.id})")
            search_terms = SearchTerm.objects.filter(business_profile=business_profile)
            serializer = SearchTermSerializer(search_terms, many=True)
            return Response(serializer.data)
        except BusinessProfile.DoesNotExist:
            print("DEBUG: Business profile does not exist for search terms")
            return Response(
                {"error": "Business profile not found. Please complete onboarding first."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    elif request.method == 'POST':
        print(f"DEBUG: Creating search term with data: {request.data}")
        serializer = SearchTermSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            print("DEBUG: Serializer is valid, saving...")
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print(f"DEBUG: Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def search_term_detail(request, pk):
    """Manage a specific search term"""
    try:
        business_profile = request.user.business_profile
        search_term = get_object_or_404(SearchTerm, pk=pk, business_profile=business_profile)
    except BusinessProfile.DoesNotExist:
        return Response(
            {"error": "Business profile not found. Please complete onboarding first."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = SearchTermSerializer(search_term)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = SearchTermSerializer(search_term, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        search_term.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_models(request):
    """Get list of available AI models"""
    models = AIModel.objects.filter(is_active=True)
    serializer = AIModelSerializer(models, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def search_logs(request):
    """View and create search logs"""
    try:
        business_profile = request.user.business_profile
    except BusinessProfile.DoesNotExist:
        return Response(
            {"error": "Business profile not found. Please complete onboarding first."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        search_logs = SearchLog.objects.filter(business_profile=business_profile)
        
        # Filter by search term if provided
        search_term_id = request.query_params.get('search_term')
        if search_term_id:
            search_logs = search_logs.filter(search_term_id=search_term_id)
        
        # Filter by AI model if provided
        ai_model_id = request.query_params.get('ai_model')
        if ai_model_id:
            search_logs = search_logs.filter(ai_model_id=ai_model_id)
        
        # Filter by sentiment if provided
        sentiment = request.query_params.get('sentiment')
        if sentiment:
            search_logs = search_logs.filter(sentiment=sentiment)
        
        # Filter by business mentioned if provided
        business_mentioned = request.query_params.get('business_mentioned')
        if business_mentioned is not None:
            business_mentioned = business_mentioned.lower() == 'true'
            search_logs = search_logs.filter(business_mentioned=business_mentioned)
        
        serializer = SearchLogSerializer(search_logs, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = SearchLogSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_analytics(request):
    """Get analytics for search logs"""
    try:
        business_profile = request.user.business_profile
    except BusinessProfile.DoesNotExist:
        return Response(
            {"error": "Business profile not found. Please complete onboarding first."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    from django.db.models import Count, Q
    from django.utils import timezone
    from datetime import timedelta
    
    # Get date range from query params (default to last 30 days)
    days = int(request.query_params.get('days', 30))
    start_date = timezone.now() - timedelta(days=days)
    
    search_logs = SearchLog.objects.filter(
        business_profile=business_profile,
        search_timestamp__gte=start_date
    )
    
    # Total searches
    total_searches = search_logs.count()
    
    # Business mentions
    business_mentions = search_logs.filter(business_mentioned=True).count()
    mention_rate = (business_mentions / total_searches * 100) if total_searches > 0 else 0
    
    # Sentiment breakdown
    sentiment_counts = search_logs.filter(business_mentioned=True).values('sentiment').annotate(
        count=Count('sentiment')
    )
    
    # Top search terms
    top_terms = search_logs.values('search_term__term').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Top AI models
    top_models = search_logs.values('ai_model__name').annotate(
        count=Count('id')
    ).order_by('-count')[:5]
    
    analytics = {
        'total_searches': total_searches,
        'business_mentions': business_mentions,
        'mention_rate': round(mention_rate, 2),
        'sentiment_breakdown': list(sentiment_counts),
        'top_search_terms': list(top_terms),
        'top_ai_models': list(top_models),
        'date_range': f"Last {days} days"
    }
    
    return Response(analytics)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_ai_search(request):
    """Run a search term against an AI model and return the result"""
    try:
        business_profile = request.user.business_profile
    except BusinessProfile.DoesNotExist:
        return Response(
            {"error": "Business profile not found. Please complete onboarding first."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get parameters from request
    search_term_id = request.data.get('search_term_id') or request.data.get('search_term')
    ai_model_id = request.data.get('ai_model_id') or request.data.get('ai_model')
    
    if not search_term_id or not ai_model_id:
        return Response(
            {"error": "Both search_term and ai_model are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get the search term and AI model
        search_term = SearchTerm.objects.get(id=search_term_id, business_profile=business_profile)
        ai_model = AIModel.objects.get(id=ai_model_id, is_active=True)
    except (SearchTerm.DoesNotExist, AIModel.DoesNotExist):
        return Response(
            {"error": "Search term or AI model not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        # Build business context
        business_context = f"{business_profile.business_name} - {business_profile.business_description}"
        
        print(f"DEBUG: Calling AI service with model: {ai_model.name}, query: {search_term.term}")
        
        # Query the AI model
        ai_result = ai_service.query_model(
            model_name=ai_model.name,
            query=search_term.term,
            business_context=business_context,
            ai_model_obj=ai_model
        )
        
        print(f"DEBUG: AI service returned: {ai_result}")
        
        # Create search log entry
        try:
            search_log = SearchLog.objects.create(
                business_profile=business_profile,
                search_term=search_term,
                ai_model=ai_model,
                query=f"Search for information about: {search_term.term}",
                response=ai_result['response'],
                response_time_ms=ai_result['response_time_ms'],
                tokens_used=ai_result['tokens_used'],
                current_cost_input_usd=ai_result.get('current_cost_input_usd'),
                current_cost_output_usd=ai_result.get('current_cost_output_usd')
            )
            print(f"DEBUG: SearchLog created successfully with ID: {search_log.id}")
            
            # Create analysis entry
            try:
                from users.analysis_service import analysis_service
                analysis = analysis_service.analyze_response(
                    ai_result['response'], 
                    business_context, 
                    business_profile, 
                    search_log
                )
                print(f"DEBUG: Analysis created successfully with ID: {analysis.id}")
            except Exception as analysis_error:
                print(f"DEBUG: Error creating Analysis: {analysis_error}")
                print(f"DEBUG: Analysis error type: {type(analysis_error)}")
                # Don't fail the entire request if analysis fails
                # Create a fallback analysis object
                try:
                    from users.models import Analysis
                    analysis = Analysis.objects.create(
                        business_profile=business_profile,
                        search_log=search_log,
                        business_mentioned=False,
                        mention_context="",
                        sentiment="neutral",
                        confidence_score=0.5,
                        analysis_model='fallback',
                        analysis_duration_ms=0,
                        raw_analysis_response=f"Analysis failed: {str(analysis_error)}"
                    )
                    print(f"DEBUG: Fallback analysis created with ID: {analysis.id}")
                except Exception as fallback_error:
                    print(f"DEBUG: Even fallback analysis failed: {fallback_error}")
                
        except Exception as create_error:
            print(f"DEBUG: Error creating SearchLog: {create_error}")
            print(f"DEBUG: Error type: {type(create_error)}")
            raise create_error
        
        # Return the result
        try:
            serializer = SearchLogSerializer(search_log)
            print(f"DEBUG: Serializer data: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as serializer_error:
            print(f"DEBUG: Error in serializer: {serializer_error}")
            print(f"DEBUG: Serializer error type: {type(serializer_error)}")
            # Return a simplified response if serializer fails
            return Response({
                'id': search_log.id,
                'search_term': search_term.term,
                'ai_model': ai_model.name,
                'response': ai_result['response'],
                'search_timestamp': search_log.search_timestamp.isoformat()
            }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"Error running AI search: {e}")
        return Response(
            {"error": f"Failed to run AI search: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

