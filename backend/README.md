# CSV Import API

A NestJS-based REST API for importing and processing CSV files.

## Features

- 📤 Upload CSV files via REST API
- ✅ Automatic CSV parsing and validation
- 🔍 Type-safe responses with DTOs
- 🛡️ Input validation and error handling
- 📝 Automatic API documentation (Swagger ready)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Application

### Development mode
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

### Production mode
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Health Check
```
GET /health
```

### Upload CSV File
```
POST /csv-import/upload
Content-Type: multipart/form-data

Body:
  file: <CSV file>
```

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/csv-import/upload \
  -F "file=@path/to/your/file.csv"
```

**Example using Postman:**
1. Method: POST
2. URL: `http://localhost:3000/csv-import/upload`
3. Body → form-data
4. Key: `file` (type: File)
5. Select your CSV file

## Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "CSV file imported successfully",
  "data": [
    {
      "column1": "value1",
      "column2": "value2"
    }
  ],
  "totalRows": 1
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Only CSV files are allowed",
  "error": "Bad Request"
}
```

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── app.controller.ts       # Root controller
├── app.service.ts          # Root service
└── csv-import/
    ├── csv-import.module.ts
    ├── csv-import.controller.ts
    ├── csv-import.service.ts
    └── dto/
        └── csv-import-response.dto.ts
```

## Example CSV Format

```csv
name,email,age
John Doe,john@example.com,30
Jane Smith,jane@example.com,25
```

## Customization

You can customize the CSV parsing behavior in `src/csv-import/csv-import.service.ts`:

- Add custom validation rules
- Transform data before returning
- Add database persistence
- Add additional processing logic

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## License

MIT

