# NestJS Explained - Beginner's Guide

## What is NestJS?

**NestJS** is a Node.js framework for building server-side applications (APIs). Think of it like Express.js but with more structure and organization.

### Key Features:

- 🏗️ **Modular Architecture** - Code organized into modules
- 🔧 **TypeScript** - Type-safe code (catches errors before runtime)
- 🎯 **Decorators** - Special annotations that add functionality
- 🔌 **Dependency Injection** - Automatic dependency management
- 📦 **Built-in Features** - Validation, database, testing support

---

## Core Concepts

### 1. **Modules** (`@Module`)

A module is like a container that groups related code together.

**Example:**

```typescript
@Module({
  imports: [OtherModules], // What this module needs
  controllers: [MyController], // Handles HTTP requests
  providers: [MyService], // Business logic
})
export class MyModule {}
```

**In our project:**

- `AppModule` - Root module (ties everything together)
- `CsvImportModule` - Handles CSV-related features

### 2. **Controllers** (`@Controller`)

Controllers handle HTTP requests and responses. They're like the "receptionist" of your API.

**Example:**

```typescript
@Controller('csv-import') // Base route: /csv-import
export class CsvImportController {
  @Post('upload') // POST /csv-import/upload
  async uploadFile() {
    // Handle file upload
  }

  @Get('history') // GET /csv-import/history
  async getHistory() {
    // Return history
  }
}
```

**What it does:**

- Receives HTTP requests (GET, POST, etc.)
- Calls services to do the work
- Returns responses to the client

### 3. **Services** (`@Injectable`)

Services contain business logic - the actual work your application does.

**Example:**

```typescript
@Injectable()
export class CsvImportService {
  async parseCsv(fileBuffer: Buffer) {
    // Parse CSV file
    return parsedData;
  }
}
```

**What it does:**

- Contains reusable business logic
- Can be used by multiple controllers
- Handles data processing

### 4. **Entities** (Database Models)

Entities represent database tables. They define the structure of your data.

**Example:**

```typescript
@Entity('upload_records') // Table name
export class UploadRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string; // Auto-generated ID

  @Column()
  fileName: string; // Column in database
}
```

**What it does:**

- Maps TypeScript classes to database tables
- Defines columns and their types
- Used by TypeORM to create/manage database

---

## How Our Project Works

### Project Structure

```
backend/src/
├── main.ts                    # 🚀 Application entry point
├── app.module.ts              # 📦 Root module
├── app.controller.ts          # 🎮 Root controller
├── app.service.ts            # 🔧 Root service
└── csv-import/               # 📁 CSV Import Feature Module
    ├── csv-import.module.ts   # Module definition
    ├── csv-import.controller.ts  # HTTP endpoints
    ├── csv-import.service.ts     # CSV parsing logic
    ├── entities/
    │   └── upload-record.entity.ts  # Database model
    ├── services/
    │   └── upload-history.service.ts  # History management
    └── dto/
        └── csv-import-response.dto.ts  # Response format
```

---

## Step-by-Step: How a Request Works

### Example: Uploading a CSV File

**1. Request Arrives**

```
POST http://localhost:3000/csv-import/upload
Body: CSV file
```

**2. Controller Receives Request**

```typescript
// csv-import.controller.ts
@Post('upload')
async uploadCsv(@UploadedFile() file) {
  // file contains the uploaded CSV
}
```

**3. Controller Calls Service**

```typescript
// Controller calls service to parse CSV
const result = await this.csvImportService.parseCsv(file.buffer);
```

**4. Service Does the Work**

```typescript
// csv-import.service.ts
async parseCsv(fileBuffer: Buffer) {
  // Parse the CSV file
  const records = parse(fileBuffer.toString('utf-8'), {...});
  return records;
}
```

**5. Save to Database**

```typescript
// Controller calls history service
await this.uploadHistoryService.createUploadRecord(...);
await this.uploadHistoryService.updateUploadStatus(...);
```

**6. Return Response**

```typescript
return {
  success: true,
  data: result,
  uploadId: '...',
};
```

---

## Key Decorators Explained

### `@Module()`

Groups related code together.

```typescript
@Module({
  imports: [TypeOrmModule],           // Use database
  controllers: [CsvImportController], // Handle requests
  providers: [CsvImportService],      // Business logic
})
```

### `@Controller('route')`

Creates HTTP endpoints.

```typescript
@Controller('csv-import')  // Base URL: /csv-import
export class CsvImportController {
  @Get('history')  // GET /csv-import/history
  @Post('upload')  // POST /csv-import/upload
}
```

### `@Injectable()`

Makes a class available for dependency injection.

```typescript
@Injectable()
export class MyService {
  // Can be injected into controllers
}
```

### `@InjectRepository()`

Injects database repository for database operations.

```typescript
constructor(
  @InjectRepository(UploadRecordEntity)
  private uploadRepository: Repository<UploadRecordEntity>
) {}
```

---

## Dependency Injection (DI)

**What is it?**
A way to automatically provide dependencies to classes.

**Example:**

```typescript
// Service
@Injectable()
export class CsvImportService {
  parseCsv() { ... }
}

// Controller
@Controller('csv-import')
export class CsvImportController {
  constructor(
    private csvImportService: CsvImportService  // Automatically injected!
  ) {}

  @Post('upload')
  async upload() {
    // Use the service
    this.csvImportService.parseCsv(...);
  }
}
```

**Benefits:**

- ✅ No need to manually create instances
- ✅ Easy to test (can mock dependencies)
- ✅ Loose coupling between components

---

## Database Integration (TypeORM)

### What is TypeORM?

An Object-Relational Mapping (ORM) tool that lets you work with databases using TypeScript classes instead of SQL.

### How We Use It:

**1. Define Entity (Database Table)**

```typescript
@Entity('upload_records')
export class UploadRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;
}
```

**2. Configure Connection**

```typescript
// app.module.ts
TypeOrmModule.forRootAsync({
  type: 'postgres',
  host: 'localhost',
  database: 'csv_import',
  // ...
});
```

**3. Use Repository**

```typescript
// upload-history.service.ts
constructor(
  @InjectRepository(UploadRecordEntity)
  private uploadRepository: Repository<UploadRecordEntity>
) {}

async getAllUploads() {
  return await this.uploadRepository.find();
}
```

---

## Request Flow Diagram

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ HTTP Request
       │ POST /csv-import/upload
       ▼
┌─────────────────────┐
│   Controller        │  ← Receives request
│ (csv-import.controller)│
└──────┬──────────────┘
       │ Calls service
       ▼
┌─────────────────────┐
│   Service           │  ← Does the work
│ (csv-import.service)│
└──────┬──────────────┘
       │ Parses CSV
       ▼
┌─────────────────────┐
│  History Service    │  ← Saves to database
│ (upload-history)    │
└──────┬──────────────┘
       │ Uses repository
       ▼
┌─────────────────────┐
│   TypeORM           │  ← Database operations
│   Repository        │
└──────┬──────────────┘
       │ SQL queries
       ▼
┌─────────────────────┐
│   PostgreSQL        │  ← Database
│   Database          │
└─────────────────────┘
       │
       │ Response flows back up
       ▼
┌─────────────┐
│   Client    │  ← Gets response
└─────────────┘
```

---

## Our Project's Architecture

### 1. **main.ts** - Application Bootstrap

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Allow frontend to connect
  app.listen(3000); // Start server on port 3000
}
```

**What it does:**

- Creates the NestJS application
- Configures global settings (CORS, validation)
- Sets up Swagger documentation
- Starts the server

### 2. **app.module.ts** - Root Module

```typescript
@Module({
  imports: [
    ConfigModule,      // Environment variables
    TypeOrmModule,     // Database connection
    CsvImportModule,   // Our CSV feature
  ],
})
```

**What it does:**

- Imports all modules
- Configures database connection
- Ties everything together

### 3. **csv-import.module.ts** - Feature Module

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([UploadRecordEntity])],
  controllers: [CsvImportController],
  providers: [CsvImportService, UploadHistoryService],
})
```

**What it does:**

- Groups CSV-related code
- Registers controllers and services
- Provides database repository

### 4. **csv-import.controller.ts** - HTTP Endpoints

```typescript
@Controller('csv-import')
export class CsvImportController {
  @Post('upload')  // POST /csv-import/upload
  @Get('history')  // GET /csv-import/history
}
```

**What it does:**

- Defines API endpoints
- Handles HTTP requests
- Returns responses

### 5. **csv-import.service.ts** - Business Logic

```typescript
@Injectable()
export class CsvImportService {
  async parseCsv(fileBuffer: Buffer) {
    // Parse CSV logic
  }
}
```

**What it does:**

- Contains CSV parsing logic
- Reusable across the application

### 6. **upload-history.service.ts** - Database Operations

```typescript
@Injectable()
export class UploadHistoryService {
  constructor(
    @InjectRepository(UploadRecordEntity)
    private uploadRepository: Repository<UploadRecordEntity>,
  ) {}

  async getAllUploads() {
    return await this.uploadRepository.find();
  }
}
```

**What it does:**

- Manages database operations
- Saves/retrieves upload records
- Handles data persistence

---

## Common Patterns in Our Code

### Pattern 1: Controller → Service → Repository

```typescript
// Controller (receives request)
@Post('upload')
async upload(@UploadedFile() file) {
  // Call service
  const result = await this.service.parseCsv(file);
  return result;
}

// Service (business logic)
async parseCsv(buffer: Buffer) {
  // Do processing
  return parsedData;
}

// Repository (database)
await repository.save(data);
```

### Pattern 2: Dependency Injection

```typescript
// Service is injected into controller
constructor(
  private csvImportService: CsvImportService  // Auto-provided!
) {}
```

### Pattern 3: Decorators for Metadata

```typescript
@Post('upload')           // HTTP method
@ApiOperation({...})      // Swagger docs
@UseInterceptors(...)     // File upload handling
async upload() { ... }
```

---

## Key Benefits of NestJS

1. **Organization** - Code is well-structured and easy to find
2. **Type Safety** - TypeScript catches errors early
3. **Scalability** - Easy to add new features
4. **Testing** - Built-in testing support
5. **Documentation** - Swagger auto-generates API docs
6. **Database** - TypeORM makes database work easier

---

## Quick Reference

| Concept        | Purpose               | Example                |
| -------------- | --------------------- | ---------------------- |
| **Module**     | Groups related code   | `@Module({...})`       |
| **Controller** | Handles HTTP requests | `@Controller('route')` |
| **Service**    | Business logic        | `@Injectable()`        |
| **Entity**     | Database model        | `@Entity('table')`     |
| **Repository** | Database operations   | `repository.find()`    |
| **DTO**        | Data structure        | `class ResponseDto`    |

---

## Learning Resources

- **Official Docs**: https://docs.nestjs.com
- **TypeORM Docs**: https://typeorm.io
- **TypeScript**: https://www.typescriptlang.org/docs/

---

## Summary

**NestJS** = Structured way to build APIs

**Our Project:**

1. Receives CSV file uploads
2. Parses CSV data
3. Saves to PostgreSQL database
4. Returns parsed data
5. Tracks upload history

**Key Flow:**
Request → Controller → Service → Database → Response

Everything is organized into modules, making it easy to understand and maintain! 🚀
