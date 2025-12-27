# Database Setup Guide

## Overview

The application now uses **PostgreSQL** with **TypeORM** for persistent data storage. All upload records and CSV data are stored in the database and persist across server restarts.

## Prerequisites

1. **PostgreSQL** installed and running
   - Download: https://www.postgresql.org/download/
   - Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`

## Setup Steps

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install:

- `@nestjs/typeorm` - NestJS TypeORM integration
- `typeorm` - TypeORM ORM
- `pg` - PostgreSQL driver

### 2. Create Database

Connect to PostgreSQL and create the database:

```bash
# Using psql
psql -U postgres
CREATE DATABASE csv_import;
\q
```

Or using SQL:

```sql
CREATE DATABASE csv_import;
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=csv_import

PORT=3000
NODE_ENV=development
```

### 4. Run the Application

```bash
npm run start:dev
```

TypeORM will automatically create the database tables on first run (when `NODE_ENV !== 'production'`).

## Database Schema

### Table: `upload_records`

| Column        | Type         | Description                                             |
| ------------- | ------------ | ------------------------------------------------------- |
| `id`          | UUID         | Primary key (auto-generated)                            |
| `fileName`    | VARCHAR(255) | Name of the uploaded file                               |
| `fileSize`    | BIGINT       | Size of the file in bytes                               |
| `status`      | ENUM         | Upload status: success, failed, processing              |
| `uploadedAt`  | TIMESTAMP    | When the file was uploaded                              |
| `completedAt` | TIMESTAMP    | When processing completed (nullable)                    |
| `totalRows`   | INT          | Number of rows in CSV (nullable)                        |
| `errors`      | JSONB        | Array of error messages (nullable)                      |
| `message`     | TEXT         | Status message (nullable)                               |
| `data`        | JSONB        | Parsed CSV data (nullable, only for successful uploads) |

## Production Setup

For production, set `NODE_ENV=production` and use migrations instead of `synchronize`:

### 1. Disable Auto-Sync

In `app.module.ts`, `synchronize` is automatically disabled when `NODE_ENV=production`.

### 2. Use Migrations (Recommended)

```bash
# Generate migration
npm run typeorm migration:generate -- -n InitialSchema

# Run migrations
npm run typeorm migration:run
```

## Docker Setup (Quick Start)

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: csv_import
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run:

```bash
docker-compose up -d
```

## Cloud Database Options

### Railway

1. Create account at railway.app
2. Create PostgreSQL database
3. Copy connection string to `.env`

### Supabase

1. Create project at supabase.com
2. Get connection string from Settings > Database
3. Update `.env` with connection details

### Heroku Postgres

1. Add Heroku Postgres addon
2. Use `DATABASE_URL` environment variable

## Verification

1. Start the application:

   ```bash
   npm run start:dev
   ```

2. Check logs for database connection:

   ```
   Database connection established
   ```

3. Upload a CSV file via API

4. Check database:
   ```sql
   SELECT * FROM upload_records;
   ```

## Troubleshooting

### Connection Error

- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env`
- Ensure database exists: `\l` in psql

### Migration Issues

- Drop and recreate database if needed
- Check TypeORM logs for errors

### Data Not Persisting

- Verify `synchronize: true` in development
- Check database connection in logs
- Ensure `.env` file is loaded

## Benefits of Database Persistence

✅ **Data Persistence**: Data survives server restarts  
✅ **Scalability**: Can run multiple server instances  
✅ **Querying**: Advanced filtering and searching  
✅ **Backup**: Easy to backup and restore  
✅ **Production Ready**: Suitable for production use

## Migration from In-Memory Storage

The old in-memory storage has been replaced. All existing functionality works the same, but data now persists in PostgreSQL.
