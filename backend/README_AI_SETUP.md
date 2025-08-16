# AI Integration Setup Guide

## Setting up OpenAI API Key

To use the real GPT-5 integration, you need to set up your OpenAI API key:

### Option 1: Environment Variable (Recommended)

1. **Get your OpenAI API key** from [OpenAI Platform](https://platform.openai.com/api-keys)

2. **Set the environment variable** before starting Django:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   python manage.py runserver 8000
   ```

### Option 2: .env File

1. Create a `.env` file in the backend directory:
   ```bash
   touch backend/.env
   ```

2. Add your API key to the `.env` file:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```

3. Install python-dotenv:
   ```bash
   pip install python-dotenv
   ```

4. Add to requirements.txt:
   ```
   python-dotenv>=1.0.0
   ```

### Option 3: Direct in Django Settings

Add to `backend/core/settings.py`:
```python
import os
os.environ['OPENAI_API_KEY'] = 'your-api-key-here'
```

## Testing the Integration

1. **Start the Django server** with your API key set
2. **Go to the Manual Run page** (`/manual-run`)
3. **Click "Run Search"** on any search term + AI model combination
4. **Check the results** - you should see real GPT-5 responses!

## Features

- **Real GPT-5 Integration** - Actual AI model responses
- **Business Context** - AI knows about your business
- **Sentiment Analysis** - Automatic sentiment detection
- **Business Mentions** - Tracks when your business is mentioned
- **Response Analysis** - Extracts mention context and confidence scores

## Troubleshooting

- **"OPENAI_API_KEY environment variable is required"** - Make sure you've set the API key
- **"Failed to run AI search"** - Check your API key is valid and has credits
- **Rate limiting** - OpenAI has rate limits, add delays between requests if needed
