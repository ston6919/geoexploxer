import os
import time
import json
from typing import Dict, Any, Optional
import requests
from .models import Analysis


class AnalysisService:
    """Service for analyzing AI responses using OpenRouter and Gemma model"""
    
    def __init__(self):
        self.openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
        if not self.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is required")
        
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "google/gemma-2-9b-it"

    def analyze_response(self, response: str, business_context: str, business_profile, search_log) -> Analysis:
        """
        Analyze an AI response for business mentions and sentiment using Gemma

        Args:
            response: The AI model response to analyze
            business_context: Business context (e.g., "Rivermate - We enable businesses...")
            business_profile: The business profile object
            search_log: The search log object

        Returns:
            Analysis object with analysis results
        """
        start_time = time.time()
        
        try:
            # Extract business name from context - use business profile name directly
            business_name = business_profile.business_name if business_profile else ""
            
            # Debug logging
            print(f"DEBUG: Analysis - Business context: '{business_context}'")
            print(f"DEBUG: Analysis - Extracted business name: '{business_name}'")
            print(f"DEBUG: Analysis - Business profile name: '{business_profile.business_name}'")
            print(f"DEBUG: Analysis - Response length: {len(response)} characters")

            # Create the analysis prompt
            analysis_prompt = self._create_analysis_prompt(response, business_name)
            
            # Debug logging
            print(f"DEBUG: Analysis - Prompt being sent to OpenRouter:")
            print("=" * 80)
            print(analysis_prompt)
            print("=" * 80)

            # Call OpenRouter API
            analysis_result = self._call_openrouter(analysis_prompt)
            
            # Debug logging
            print(f"DEBUG: Analysis - OpenRouter response:")
            print("=" * 80)
            print(analysis_result)
            print("=" * 80)

            # Parse the analysis result
            analysis_data = self._parse_analysis_result(analysis_result, business_name, response)
            
            # Calculate analysis duration
            analysis_duration_ms = int((time.time() - start_time) * 1000)
            
            # Create and save Analysis object
            analysis = Analysis.objects.create(
                business_profile=business_profile,
                search_log=search_log,
                business_mentioned=analysis_data['business_mentioned'],
                mention_context=analysis_data['mention_context'],
                sentiment=analysis_data['sentiment'],
                confidence_score=analysis_data['confidence_score'],
                analysis_model=self.model,
                analysis_duration_ms=analysis_duration_ms,
                raw_analysis_response=analysis_result
            )
            
            return analysis

        except Exception as e:
            print(f"Error in analysis service: {e}")
            # Fallback to basic analysis
            analysis_data = self._fallback_analysis(response, business_context)
            
            # Create Analysis object with fallback data
            analysis_duration_ms = int((time.time() - start_time) * 1000)
            analysis = Analysis.objects.create(
                business_profile=business_profile,
                search_log=search_log,
                business_mentioned=analysis_data['business_mentioned'],
                mention_context=analysis_data['mention_context'],
                sentiment=analysis_data['sentiment'],
                confidence_score=analysis_data['confidence_score'],
                analysis_model='fallback',
                analysis_duration_ms=analysis_duration_ms,
                raw_analysis_response=f"Fallback analysis due to error: {str(e)}"
            )
            
            return analysis
    
    def _create_analysis_prompt(self, response: str, business_name: str) -> str:
        """Create the prompt for the analysis model"""
        return f"""You are an expert business analyst. Analyze the following AI response for mentions of the business "{business_name}" and determine the sentiment.

RESPONSE TO ANALYZE:
{response}

BUSINESS NAME: {business_name}

IMPORTANT: You must respond with ONLY valid JSON. Do not include any other text before or after the JSON.

Respond with this exact JSON format:
{{
    "business_mentioned": true/false,
    "mention_context": "exact text around the mention (if mentioned)",
    "sentiment": "positive/negative/neutral",
    "confidence_score": 0.0-1.0,
    "reasoning": "brief explanation of your analysis"
}}

Rules:
1. Only mark business_mentioned as true if "{business_name}" is explicitly mentioned in the response
2. If mentioned, extract the exact text around the mention (about 100 characters before and after)
3. Sentiment should be based on how the business is described/mentioned
4. Confidence score should reflect how certain you are about the sentiment
5. Provide clear reasoning for your analysis
6. Respond with ONLY the JSON object, no other text"""
    
    def _call_openrouter(self, prompt: str) -> str:
        """Call OpenRouter API with the analysis prompt"""
        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://geoexplorer.com",
            "X-Title": "GEOExplorer Analysis"
        }
        
        data = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.1,  # Low temperature for consistent analysis
            "max_tokens": 500
        }
        
        response = requests.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code != 200:
            raise Exception(f"OpenRouter API error: {response.status_code} - {response.text}")
        
        result = response.json()
        return result['choices'][0]['message']['content']
    
    def _parse_analysis_result(self, analysis_text: str, business_name: str, original_response: str) -> Dict[str, Any]:
        """Parse the JSON response from the analysis model"""
        try:
            # Try to extract JSON from the response
            import re
            json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
            if json_match:
                analysis_json = json.loads(json_match.group())
            else:
                # If no JSON found, try to parse the whole response
                analysis_json = json.loads(analysis_text)
            
            # Validate and return the analysis
            return {
                'business_mentioned': analysis_json.get('business_mentioned', False),
                'mention_context': analysis_json.get('mention_context', ''),
                'sentiment': analysis_json.get('sentiment', 'neutral'),
                'confidence_score': float(analysis_json.get('confidence_score', 0.5)),
                'reasoning': analysis_json.get('reasoning', ''),
                'analysis_model': self.model
            }
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            print(f"Error parsing analysis result: {e}")
            print(f"Raw analysis text: {analysis_text}")
            # Fallback to basic analysis
            return self._fallback_analysis(original_response, business_name)
    
    def _fallback_analysis(self, response: str, business_context: str) -> Dict[str, Any]:
        """Fallback analysis if the AI analysis fails"""
        business_mentioned = False
        mention_context = ""
        
        if business_context:
            business_name = business_context.split()[0] if business_context else ""
            if business_name and business_name.lower() in response.lower():
                business_mentioned = True
                # Simple context extraction
                import re
                pattern = re.compile(re.escape(business_name.lower()), re.IGNORECASE)
                match = pattern.search(response)
                if match:
                    start_pos = match.start()
                    context_start = max(0, start_pos - 100)
                    context_end = min(len(response), start_pos + len(business_name) + 100)
                    mention_context = response[context_start:context_end].strip()
        
        return {
            'business_mentioned': business_mentioned,
            'mention_context': mention_context,
            'sentiment': 'neutral',
            'confidence_score': 0.5,
            'reasoning': 'Fallback analysis used due to AI analysis failure',
            'analysis_model': 'fallback'
        }


# Global instance
analysis_service = AnalysisService()
