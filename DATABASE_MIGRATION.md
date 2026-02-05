# Database Migration Guide: Docker → Deployed Database

## Your Situation
- **Source**: Docker database (currently has all your data)
- **Target**: Deployed database (empty or different data)
- **Goal**: Transfer all data from Docker to deployed database before continuing Firebase setup

## Prerequisites
- Docker database running
- Deployed database accessible
- Both databases are PostgreSQL
- `pg_dump` and `psql` tools installed (comes with PostgreSQL)

## Method 1: Using pg_dump and pg_restore (Recommended)

### Step 1: Export Data from Docker Database

```bash
# Get Docker container ID or name
docker ps

# Export data from Docker PostgreSQL
# ⚠️ IMPORTANT: Replace <docker-user> with your actual Docker DB username
# Common usernames: harry, postgres, dtg_user (check with: docker inspect <container-id> | grep POSTGRES_USER)
docker exec -t <docker-container-name-or-id> pg_dump -U <docker-user> -d dtg_ticket_db --data-only --no-owner --no-privileges > backup.sql

# Example with actual container:
docker exec -t 70c9fa6b670e pg_dump -U harry -d dtg_ticket_db --data-only --no-owner --no-privileges > backup.sql

# Or if you want schema + data:
docker exec -t <docker-container-name-or-id> pg_dump -U <docker-user> -d dtg_ticket_db --no-owner --no-privileges > backup_with_schema.sql
```

**Options explained:**
- `--data-only`: Export only data (no schema) - Use this if your deployed DB already has the schema
- `--no-owner`: Don't include ownership commands
- `--no-privileges`: Don't include privilege commands
- Remove these options if you want full backup including schema

### Step 2: Import Data to Deployed Database

```bash
# Import to deployed database
psql -h <deployed-db-host> -U <deployed-db-user> -d <deployed-db-name> -f backup.sql

# Example:
psql -h db.example.com -U dtg_user -d dtg_ticket_db -f backup.sql
```

**You'll be prompted for the password**, enter your deployed database password.

## Method 2: Direct Pipe (Faster, No Intermediate File)

### One Command to Transfer Everything:

```bash
docker exec -t <docker-container-name> pg_dump -U dtg_user -d dtg_ticket_db --data-only | psql -h <deployed-host> -U <deployed-user> -d <deployed-db-name>
```

**Example:**
```bash
docker exec -t my-postgres-container pg_dump -U dtg_user -d dtg_ticket_db --data-only | psql -h db.server.com -U dtg_user -d dtg_ticket_db
```

## Method 3: Using Prisma (For Your Project)

Since you're using Prisma, here's the project-specific approach:

### Step 1: Update DATABASE_URL to Docker Database

```bash
cd backend
```

Edit `.env` to point to Docker database:
```bash
DATABASE_URL="postgresql://dtg_user:dtg_password_22172@localhost:5433/dtg_ticket_db"
```

### Step 2: Verify Connection

```bash
npx prisma db pull
```

This confirms Prisma can connect to Docker database.

### Step 3: Generate SQL Dump

```bash
# Windows
docker exec dtg-postgres-container pg_dump -U dtg_user dtg_ticket_db --data-only --no-owner > data_export.sql

# Or use Prisma Studio to view and confirm data
npx prisma studio
```

### Step 4: Switch to Deployed Database

Edit `backend/.env`:
```bash
DATABASE_URL="postgresql://<user>:<password>@<deployed-host>:<port>/<database>"

# Example:
DATABASE_URL="postgresql://dtg_user:newpassword@db.myserver.com:5432/dtg_ticket_db"
```

### Step 5: Apply Schema to Deployed Database

```bash
# Push schema to deployed database
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

### Step 6: Import Data

```bash
# Connect to deployed database and import data
psql "postgresql://<user>:<password>@<deployed-host>:<port>/<database>" -f data_export.sql
```

## Method 4: Using GUI Tools (Easiest for Non-Developers)

### Option A: pgAdmin

1. **Install pgAdmin**: https://www.pgadmin.org/download/
2. **Connect to Docker Database**:
   - Host: `localhost`
   - Port: `5433`
   - Username: `dtg_user`
   - Password: `dtg_password_22172`
3. **Backup**:
   - Right-click database → Backup
   - Format: Plain
   - Encoding: UTF8
   - Save as: `docker_backup.sql`
4. **Connect to Deployed Database**:
   - Add new server with deployed DB credentials
5. **Restore**:
   - Right-click deployed database → Restore
   - Select `docker_backup.sql`
   - Click Restore

### Option B: DBeaver (Free, Cross-Platform)

1. **Install DBeaver**: https://dbeaver.io/download/
2. **Connect both databases** (Docker and Deployed)
3. **Use Data Transfer Tool**:
   - Select tables in Docker database
   - Right-click → Export Data
   - Choose destination: Deployed database
   - Select all tables
   - Click Start

## Detailed Step-by-Step (For Your Specific Setup)

### Finding Your Docker Container:

```bash
# List running containers
docker ps

# You're looking for something like:
# CONTAINER ID   IMAGE         NAMES
# abc123def456   postgres:15   dtg-postgres (or similar)
```

### Example Full Migration:

```bash
# 1. Find container name
docker ps
# Let's say it's: dtg-postgres-container

# 2. Export data from Docker
docker exec -t dtg-postgres-container pg_dump -U dtg_user -d dtg_ticket_db --data-only --no-owner > C:\backup\dtg_data.sql

# 3. Check the backup file
type C:\backup\dtg_data.sql
# Should see SQL INSERT statements

# 4. Update backend/.env to deployed database
# DATABASE_URL="postgresql://user:pass@deployed-host:5432/dtg_ticket_db"

# 5. Apply schema to deployed database (if needed)
cd backend
npx prisma db push

# 6. Import data to deployed database
psql "postgresql://user:pass@deployed-host:5432/dtg_ticket_db" -f C:\backup\dtg_data.sql

# 7. Verify data
npx prisma studio
# Check if data is there in deployed database
```

## Troubleshooting

### Error: "role does not exist"

**Solution**: Use `--no-owner --no-privileges` flags:
```bash
pg_dump --no-owner --no-privileges ...
```

### Error: "relation already exists"

**Cause**: Schema already exists in target database  
**Solution**: Use `--data-only` flag to export only data:
```bash
pg_dump --data-only ...
```

### Error: "duplicate key value violates unique constraint"

**Cause**: Target database already has some data with the same IDs  

**Solution 1: Clear deployed database first (recommended for clean migration)**:
```bash
# In backend directory, with DATABASE_URL pointing to deployed DB
cd backend
npx prisma migrate reset
# This will:
# 1. Drop all tables
# 2. Run migrations to recreate schema
# 3. Run seed if available

# Then import Docker data
cat backup.sql | docker exec -i <container-id> psql "postgresql://<user>:<pass>@host.docker.internal:5433/dtg_ticket_db"
```

**Solution 2: Import without clearing (keeps existing data, skips duplicates)**:
The errors are expected if deployed DB has initial data. Check what was imported:
```bash
cd backend
npx prisma studio
# Verify which records were added
```

**Solution 3: Use psql from deployed server directly**:
```bash
# SSH to deployed server
ssh root@152.42.189.255

# Copy backup file to server (from local machine first):
scp backup.sql root@152.42.189.255:/tmp/

# Then on server:
psql -U dtg_user -d dtg_ticket_db -f /tmp/backup.sql
```

### Error: "permission denied"

**Cause**: User doesn't have necessary permissions  
**Solution**: Use superuser or ensure user has proper grants:
```sql
GRANT ALL PRIVILEGES ON DATABASE dtg_ticket_db TO dtg_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dtg_user;
```

### Data imported but sequences not updated

**Symptom**: After import, new records fail with "duplicate key"  
**Solution**: Reset sequences:
```sql
SELECT setval(pg_get_serial_sequence('technicians', 'id'), (SELECT MAX(id) FROM technicians));
SELECT setval(pg_get_serial_sequence('teams', 'id'), (SELECT MAX(id) FROM teams));
SELECT setval(pg_get_serial_sequence('tickets', 'id'), (SELECT MAX(id) FROM tickets));
SELECT setval(pg_get_serial_sequence('customers', 'id'), (SELECT MAX(id) FROM customers));
-- Repeat for all tables with auto-increment IDs
```

Or use this automatic script:
```sql
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE column_default LIKE 'nextval%'
    LOOP
        EXECUTE format('SELECT setval(pg_get_serial_sequence(%L, %L), (SELECT COALESCE(MAX(%I), 1) FROM %I))',
            r.table_name, r.column_name, r.column_name, r.table_name);
    END LOOP;
END $$;
```

## After Migration Checklist

- [ ] All tables have data in deployed database
- [ ] Record counts match between Docker and deployed
- [ ] Sequences are updated (test by creating a new record)
- [ ] Relationships are intact (check foreign keys)
- [ ] Application connects successfully to deployed database
- [ ] Backend starts without errors
- [ ] Mobile app can fetch data

## Verify Data Migration

### Option 1: Using Prisma Studio

```bash
# Connect to Docker database
cd backend
# Temporarily set DATABASE_URL to Docker
npx prisma studio
# Note record counts

# Switch DATABASE_URL to deployed
npx prisma studio
# Compare record counts
```

### Option 2: Using SQL

```sql
-- Run on both databases and compare

SELECT 'technicians' as table_name, COUNT(*) FROM technicians
UNION ALL
SELECT 'teams', COUNT(*) FROM teams
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'materials', COUNT(*) FROM materials;
```

## Quick Reference Commands

### Docker Database Info:
```bash
# Connection (your actual Docker container)
Container ID: 70c9fa6b670e
Container Name: my-postgres
Host: localhost
Port: 5432 (inside container), mapped to 5432 on host
User: harry  # ⚠️ Check yours with: docker inspect <id> | grep POSTGRES_USER
Password: 292003  # ⚠️ Check yours with: docker inspect <id> | grep POSTGRES_PASSWORD  
Database: dtg_ticket_db
```

### Export Command:
```bash
# Replace <docker-user> with: harry, postgres, or dtg_user (check your container)
docker exec -t <container-name> pg_dump -U <docker-user> -d dtg_ticket_db --data-only > backup.sql

# Example:
docker exec -t 70c9fa6b670e pg_dump -U harry -d dtg_ticket_db --data-only > backup.sql
```

### Import Command (if psql installed locally):
```bash
psql "postgresql://<user>:<pass>@<host>:<port>/<database>" -f backup.sql
```

### Import Command (using Docker's psql via SSH tunnel):
```bash
# Copy backup into container
docker cp backup.sql <container-id>:/tmp/backup.sql

# Import using psql inside container
# host.docker.internal = your Windows host machine
docker exec <container-id> psql "postgresql://<user>:<pass>@host.docker.internal:5433/dtg_ticket_db" -f /tmp/backup.sql

# Or pipe directly:
cat backup.sql | docker exec -i <container-id> psql "postgresql://<user>:<pass>@host.docker.internal:5433/dtg_ticket_db"
```

## Recommendation for Your Situation

**Since you're at Step 6 of Firebase setup**, I recommend:

1. **Method 3 (Prisma)** - Most integrated with your project
2. **Takes ~10 minutes**
3. **Low risk** - You still have Docker as backup
4. **Steps**:
   ```bash
   # 1. Export from Docker
   docker exec <container-name> pg_dump -U dtg_user -d dtg_ticket_db --data-only > backup.sql
   
   # 2. Switch DATABASE_URL in backend/.env to deployed database
   
   # 3. Apply schema
   cd backend
   npx prisma db push
   
   # 4. Import data
   psql "<deployed-db-url>" -f backup.sql
   
   # 5. Verify
   npx prisma studio
   
   # 6. Continue with Firebase Step 6!
   ```

## After Successful Migration

Once data is migrated:
1. ✅ Update `backend/.env` to keep deployed DATABASE_URL
2. ✅ Test backend: `npm run dev`
3. ✅ Test mobile app connections
4. ✅ **Continue with Firebase Step 6**: Create users from deployed database
5. ✅ Keep Docker backup for a few days (just in case)

---

**Need help?** If migration fails, you still have Docker as backup - nothing is lost!
