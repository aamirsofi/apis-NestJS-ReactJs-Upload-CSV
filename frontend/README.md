# CSV Import Frontend

A modern React + Vite frontend application for uploading and previewing CSV files.

## Features

- 🎨 Modern, responsive UI with Tailwind CSS
- 📤 Drag & drop file upload
- 📊 CSV data preview in a table format
- ⚡ Fast development with Vite
- 🔄 Loading states and error handling
- 📱 Mobile-friendly design

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running on `http://localhost:3000`

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development mode
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the frontend directory (optional):

```env
VITE_API_URL=http://localhost:3000
```

If not set, it defaults to `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── CsvUploader.tsx    # File upload component with drag & drop
│   │   └── CsvPreview.tsx     # CSV data preview table
│   ├── services/
│   │   └── api.ts             # API service for backend communication
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── App.tsx                 # Main application component
│   ├── main.tsx                # Application entry point
│   └── index.css               # Global styles with Tailwind
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Usage

1. Start the backend API (from the root directory):
```bash
npm run start:dev
```

2. Start the frontend (from the frontend directory):
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

4. Upload a CSV file by:
   - Dragging and dropping it onto the upload area, or
   - Clicking "Browse Files" to select a file

5. View the parsed CSV data in the preview table

## Features Overview

### File Upload
- Drag & drop support
- File browser option
- CSV file validation
- Loading indicators during upload

### Data Preview
- Responsive table display
- Shows all CSV columns and rows
- Row count display
- Option to upload another file

### Error Handling
- Clear error messages
- File type validation
- Network error handling

## Customization

### Styling
The app uses Tailwind CSS. Modify `tailwind.config.js` to customize the theme.

### API Configuration
Update the API base URL in `src/services/api.ts` or use the `VITE_API_URL` environment variable.

## Technologies Used

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **react-dropzone** - File upload component

## License

MIT

