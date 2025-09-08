#!/bin/bash
# Wrapper script que carga .env automáticamente

set -a  # Automatically export all variables
source .env 2>/dev/null || {
    echo "❌ Error: .env file not found"
    exit 1
}
set +a

# Verify OPENAI_API_KEY is loaded
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY not found in .env"
    exit 1
fi

echo "✅ Environment loaded from .env"
./deploy-app.sh "$@"