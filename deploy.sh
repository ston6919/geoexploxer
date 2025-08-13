#!/bin/bash

echo "🚀 Deploying GEOExploxer to DigitalOcean App Platform"
echo "====================================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Set GitHub username and repository
GITHUB_USERNAME="ston6919"
REPO_NAME="geoexploxer"

echo "✅ Using GitHub repository: $GITHUB_USERNAME/$REPO_NAME"

# Check if remote already exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "✅ GitHub remote already exists"
    # Update remote if needed
    git remote set-url origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
else
    echo "🔗 Adding GitHub remote..."
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo "❌ Failed to push to GitHub. Please check your credentials and try again."
    exit 1
fi

echo ""
echo "🎉 Your code is now on GitHub!"
echo ""
echo "🌊 Next steps to deploy on DigitalOcean:"
echo "1. Go to https://cloud.digitalocean.com/apps"
echo "2. Click 'Create App'"
echo "3. Connect your GitHub account"
echo "4. Select the '$REPO_NAME' repository"
echo "5. Follow the deployment guide in DEPLOYMENT.md"
echo ""
echo "📚 For detailed instructions, see: DEPLOYMENT.md"
echo ""
echo "💰 Estimated cost: ~$19/month for basic deployment"
echo ""
echo "Happy deploying! 🚀"
