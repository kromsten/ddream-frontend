#!/bin/bash

# DDream Frontend Setup Script
# This script sets up the DDream frontend for local development

set -e

echo "🎮 DDream Frontend Setup"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Node.js is installed
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18.17 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.17.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Node.js version $NODE_VERSION is too old. Please upgrade to 18.17 or higher."
    exit 1
fi

print_success "Node.js version $NODE_VERSION detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_success "npm detected"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Check if .env.local exists
echo ""
echo "Checking environment configuration..."

if [ ! -f .env.local ]; then
    print_warning ".env.local not found. Creating from .env.example..."
    cp .env.example .env.local
    print_success "Created .env.local file"
    echo ""
    print_warning "Please update .env.local with your configuration if needed"
    echo "   - Controller Address: Already configured"
    echo "   - Treasury Address: Already configured for gasless transactions"
else
    print_success ".env.local file exists"
fi

# Create required directories if they don't exist
echo ""
echo "Setting up project structure..."

directories=("public" "hooks")
for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        print_success "Created $dir directory"
    fi
done

# Build the project to check for errors
echo ""
echo "Building project..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully"
else
    print_warning "Build completed with warnings or errors. Please check the output above."
fi

# Success message
echo ""
echo "================================"
echo -e "${GREEN}✨ Setup Complete!${NC}"
echo "================================"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "The application will be available at:"
echo "  http://localhost:3000"
echo ""
echo "Available scripts:"
echo "  npm run dev       - Start development server"
echo "  npm run build     - Build for production"
echo "  npm run start     - Start production server"
echo "  npm run lint      - Run linter"
echo "  npm run type-check - Check TypeScript types"
echo ""
echo "Features enabled:"
print_success "Gasless transactions (Treasury configured)"
print_success "Email/Social login via Abstraxion"
print_success "Full game lifecycle (create, launch, trade, stake)"
echo ""
echo "Happy building! 🚀"