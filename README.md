# GEOExplorer - Django + Next.js Full Stack Application

A full-stack web application built with Django backend and Next.js frontend, featuring user authentication and a protected dashboard.

## Project Structure

```
GEOExplorer/
├── backend/          # Django backend API
│   ├── manage.py
│   ├── requirements.txt
│   ├── core/         # Django project settings
│   ├── api/          # Django app for API endpoints
│   └── users/        # Django app for user management
├── frontend/         # Next.js frontend
│   ├── package.json
│   ├── next.config.js
│   ├── pages/        # Next.js pages
│   ├── components/   # React components
│   └── styles/       # CSS styles
└── README.md
```

## Features

- User registration and authentication
- Protected routes
- Django REST API backend
- Next.js frontend with modern UI
- JWT token-based authentication

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Create a superuser (optional):
   ```bash
   python manage.py createsuperuser
   ```

6. Start the Django server:
   ```bash
   python manage.py runserver
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3020`

## API Endpoints

- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `GET /api/auth/user/` - Get current user info
- `POST /api/auth/logout/` - User logout

## Technologies Used

- **Backend**: Django 4.2, Django REST Framework, Django CORS Headers
- **Frontend**: Next.js 13, React, Tailwind CSS
- **Authentication**: JWT tokens
- **Database**: SQLite (default Django database)

Your application will be available at:
  Frontend: http://localhost:3020
  Backend API: http://localhost:8000
  Django Admin: http://localhost:8000/admin
