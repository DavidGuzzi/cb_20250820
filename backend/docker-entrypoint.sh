#!/bin/bash
set -e

echo "🚀 Starting self-contained backend with PostgreSQL..."

# PostgreSQL configuration
PGDATA="/var/lib/postgresql/data"
POSTGRES_USER="${POSTGRES_USER:-gatorade_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-gatorade_dev_password}"
POSTGRES_DB="${POSTGRES_DB:-gatorade_ab_testing}"
DUMP_FILE="/docker-entrypoint-initdb.d/init_complete.sql"

# Initialize PostgreSQL data directory if it doesn't exist
if [ ! -d "$PGDATA" ]; then
    echo "📦 Initializing PostgreSQL data directory..."
    mkdir -p "$PGDATA"
    chown -R postgres:postgres "$PGDATA"
    chmod 700 "$PGDATA"

    # Initialize database cluster as postgres user with UTF-8 encoding
    su - postgres -c "/usr/lib/postgresql/*/bin/initdb -D $PGDATA --encoding=UTF8 --locale=C.UTF-8"

    echo "✅ PostgreSQL data directory initialized"
fi

# Configure PostgreSQL to accept local connections
echo "🔧 Configuring PostgreSQL..."
cat > "$PGDATA/pg_hba.conf" <<EOF
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
EOF

cat > "$PGDATA/postgresql.conf" <<EOF
listen_addresses = 'localhost'
port = 5432
max_connections = 100
shared_buffers = 128MB
client_encoding = utf8
lc_messages = 'C.UTF-8'
lc_monetary = 'C.UTF-8'
lc_numeric = 'C.UTF-8'
lc_time = 'C.UTF-8'
EOF

# Start PostgreSQL in background
echo "🐘 Starting PostgreSQL server..."
su - postgres -c "/usr/lib/postgresql/*/bin/pg_ctl -D $PGDATA -l /tmp/postgres.log start"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if su - postgres -c "psql -h localhost -U postgres -c 'SELECT 1;'" &> /dev/null; then
        echo "✅ PostgreSQL is ready!"
        break
    fi

    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to start. Logs:"
        cat /tmp/postgres.log
        exit 1
    fi

    echo "  Attempt $i/30..."
    sleep 1
done

# Create database and user
echo "👤 Creating database and user..."
su - postgres -c "psql -h localhost -U postgres" <<-EOSQL
    -- Create user if not exists
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$POSTGRES_USER') THEN
            CREATE USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';
        END IF;
    END
    \$\$;

    -- Create database if not exists with UTF-8 encoding
    SELECT 'CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER ENCODING ''UTF8'' LC_COLLATE ''C.UTF-8'' LC_CTYPE ''C.UTF-8'''
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$POSTGRES_DB')\gexec

    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
EOSQL

echo "✅ Database and user created"

# Load SQL dump
if [ -f "$DUMP_FILE" ]; then
    echo "📊 Loading database dump..."
    su - postgres -c "PGCLIENTENCODING=UTF8 psql -h localhost -U $POSTGRES_USER -d $POSTGRES_DB -f $DUMP_FILE" > /tmp/load.log 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ Database dump loaded successfully"

        # Show row counts (simple query)
        echo "📈 Counting tables..."
        TABLE_COUNT=$(su - postgres -c "psql -h localhost -U $POSTGRES_USER -d $POSTGRES_DB -t -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';\"" 2>/dev/null || echo "0")
        echo "  Tables created: $(echo $TABLE_COUNT | xargs)"
    else
        echo "⚠️  Warning: Database dump load had issues. Check /tmp/load.log"
        tail -20 /tmp/load.log
    fi
else
    echo "⚠️  No dump file found at $DUMP_FILE"
fi

echo ""
echo "✅ PostgreSQL is running and ready!"
echo "🌐 Database: $POSTGRES_DB"
echo "👤 User: $POSTGRES_USER"
echo "🔌 Connection: localhost:5432"
echo ""

# Start Flask application
echo "🚀 Starting Flask application with Gunicorn..."
exec gunicorn --bind :${PORT:-8080} --workers 1 --threads 8 --timeout 0 --access-logfile - --error-logfile - wsgi:app
