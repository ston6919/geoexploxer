#!/bin/bash

echo "🚀 Setting up GEOExplorer - Django + Next.js Full Stack Application"
echo "================================================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Backend setup
echo ""
echo "🔧 Setting up Django backend..."
cd backend

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Run migrations
echo "Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
echo ""
echo "Would you like to create a superuser? (y/n)"
read -r create_superuser
if [[ $create_superuser =~ ^[Yy]$ ]]; then
    python manage.py createsuperuser
fi

echo "✅ Django backend setup complete!"
echo ""

# Frontend setup
echo "🔧 Setting up Next.js frontend..."
cd ../frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

echo "✅ Next.js frontend setup complete!"
echo ""

# Return to root directory
cd ..

echo "🎉 Setup complete! Here's how to run your application:"
echo ""
echo "Backend (Django):"
echo "  cd backend"
echo "  source venv/bin/activate  # On Windows: venv\\Scripts\\activate"
echo "  python manage.py runserver"
echo ""
echo "Frontend (Next.js):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Your application will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  Django Admin: http://localhost:8000/admin"
echo ""
echo "Happy coding! 🚀"

