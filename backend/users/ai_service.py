import os
import openai
from django.conf import settings
from typing import Dict, Any, Optional
import time
from .analysis_service import analysis_service

class AIService:
    def __init__(self):
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the OpenAI client with API key"""
        api_key = os.getenv('OPENAI_API_KEY')
        print(f"DEBUG: Loading OpenAI API key: {api_key[:10]}..." if api_key else "DEBUG: No API key found")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.client = openai.OpenAI(api_key=api_key)
    
    def query_model(self, model_name: str, query: str, business_context: Optional[str] = None, ai_model_obj=None) -> Dict[str, Any]:
        """
        Query an AI model with a search term and optional business context
        """
        if not self.client:
            raise ValueError("AI client not initialized")

        start_time = time.time()

        # Build the prompt - just use the query directly
        prompt = query

        try:
            # Check if this is GPT-5 (which uses a different endpoint)
            if model_name.lower() == "gpt-5":
                # Use the responses endpoint for GPT-5
                response = self.client.responses.create(
                    model=model_name,
                    input=prompt,
                    reasoning={"effort": "low"}
                )
                
                end_time = time.time()
                response_time_ms = int((end_time - start_time) * 1000)

                # For GPT-5, the response structure is different
                # Let's check what we get back
                print(f"DEBUG: GPT-5 response structure: {type(response)}")
                print(f"DEBUG: GPT-5 response attributes: {dir(response)}")
                print(f"DEBUG: GPT-5 response content: {response}")
                
                # Print the entire response as JSON for debugging
                import json
                try:
                    response_dict = response.model_dump() if hasattr(response, 'model_dump') else response.__dict__
                    print("=" * 80)
                    print("FULL GPT-5 RESPONSE JSON:")
                    print("=" * 80)
                    print(json.dumps(response_dict, indent=2, default=str))
                    print("=" * 80)
                except Exception as e:
                    print(f"Could not serialize response to JSON: {e}")
                    print(f"Raw response: {response}")

                # GPT-5 response has a different structure - extract the text content
                # The response has an 'output' list with messages containing text
                if hasattr(response, 'output') and response.output:
                    # Find the output message (not the reasoning item)
                    output_message = None
                    for item in response.output:
                        if hasattr(item, 'type') and item.type == 'message':
                            output_message = item
                            break
                    
                    if output_message and hasattr(output_message, 'content') and output_message.content:
                        # Get the text content from the first content item
                        content_item = output_message.content[0]
                        if hasattr(content_item, 'text'):
                            ai_response = content_item.text
                        else:
                            ai_response = str(content_item)
                    else:
                        ai_response = str(output_message) if output_message else str(response)
                else:
                    ai_response = str(response)

                # Copy pricing from AI model (without calculating actual cost)
                current_cost_input_usd = None
                current_cost_output_usd = None
                tokens_used = getattr(response.usage, 'total_tokens', 0) if hasattr(response, 'usage') else 0
                
                if ai_model_obj:
                    current_cost_input_usd = ai_model_obj.cost_per_million_input_usd
                    current_cost_output_usd = ai_model_obj.cost_per_million_output_usd

                return {
                    'response': ai_response,
                    'response_time_ms': response_time_ms,
                    'tokens_used': tokens_used,
                    'current_cost_input_usd': current_cost_input_usd,
                    'current_cost_output_usd': current_cost_output_usd
                }
            else:
                # Use the chat completions endpoint for other models
                response = self.client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=1000,
                    temperature=0.7
                )

                end_time = time.time()
                response_time_ms = int((end_time - start_time) * 1000)

                # Extract the response
                ai_response = response.choices[0].message.content

                # Copy pricing from AI model (without calculating actual cost)
                current_cost_input_usd = None
                current_cost_output_usd = None
                tokens_used = response.usage.total_tokens
                
                if ai_model_obj:
                    current_cost_input_usd = ai_model_obj.cost_per_million_input_usd
                    current_cost_output_usd = ai_model_obj.cost_per_million_output_usd

                return {
                    'response': ai_response,
                    'response_time_ms': response_time_ms,
                    'tokens_used': tokens_used,
                    'current_cost_input_usd': current_cost_input_usd,
                    'current_cost_output_usd': current_cost_output_usd
                }

        except Exception as e:
            raise Exception(f"Error querying AI model: {str(e)}")


# Global instance
ai_service = AIService()

# Global instance
ai_service = AIService()
