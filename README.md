# CSV Import Application

A full-stack application for importing and processing CSV files, built with NestJS (backend) and React + Vite (frontend).

## Features

### Backend (NestJS)

- 📤 Upload CSV files via REST API
- ✅ Automatic CSV parsing and validation
- 🔍 Type-safe responses with DTOs
- 🛡️ Input validation and error handling
- 📝 Automatic API documentation (Swagger ready)

### Frontend (React + Vite)

- 🎨 Modern, responsive UI with Tailwind CSS
- 📤 Drag & drop file upload
- 📊 CSV data preview in a table format
- ⚡ Fast development with Vite
- 🔄 Loading states and error handling
- 📱 Mobile-friendly design

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install backend dependencies:

```bash
npm install
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install frontend dependencies:

```bash
npm install
```

## Running the Application

### Backend (NestJS API)

1. Navigate to the backend directory:

```bash
cd backend
```

2. Start the backend API:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

### Frontend (React App)

In a new terminal, navigate to the frontend directory and start the frontend:

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Quick Start (Both Services)

**Terminal 1 - Backend:**

```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

Then open `http://localhost:5173` in your browser!

### Production mode

**Backend:**

```bash
cd backend
npm run build
npm run start:prod
```

**Frontend:**

```bash
cd frontend
npm run build
npm run preview
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
├── backend/                # Backend (NestJS)
│   ├── src/
│   │   ├── main.ts        # Application entry point
│   │   ├── app.module.ts  # Root module
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   └── csv-import/
│   │       ├── csv-import.module.ts
│   │       ├── csv-import.controller.ts
│   │       ├── csv-import.service.ts
│   │       └── dto/
│   │           └── csv-import-response.dto.ts
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/               # Frontend (React + Vite)
    ├── src/
    │   ├── components/
    │   │   ├── CsvUploader.tsx
    │   │   └── CsvPreview.tsx
    │   ├── services/
    │   │   └── api.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

## Example CSV Format

```csv
name,email,age
John Doe,john@example.com,30
Jane Smith,jane@example.com,25
```

## Customization

You can customize the CSV parsing behavior in `backend/src/csv-import/csv-import.service.ts`:

- Add custom validation rules
- Transform data before returning
- Add database persistence
- Add additional processing logic

## Testing

**Backend:**

```bash
cd backend
npm run test          # unit tests
npm run test:e2e      # e2e tests
npm run test:cov      # test coverage
```

**Frontend:**

```bash
cd frontend
npm run lint          # linting
```

## License

MIT
