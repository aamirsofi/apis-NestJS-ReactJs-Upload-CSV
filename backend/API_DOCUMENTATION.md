# API Documentation Guide

## How to Expose APIs to Other Developers

### 1. Swagger/OpenAPI Documentation (Interactive)

The API includes automatic Swagger documentation that provides an interactive interface for testing endpoints.

#### Access Swagger UI:

```
http://localhost:3000/api-docs
```

#### Features:

- **Interactive Testing**: Test all endpoints directly from the browser
- **Request/Response Examples**: See example requests and responses
- **Schema Documentation**: View data models and DTOs
- **Try It Out**: Execute API calls without writing code

#### For Other Developers:

Share this URL when the server is running:

```
http://your-server:3000/api-docs
```

---

### 2. API Base URL

**Development:**

```
http://localhost:3000
```

**Production:**

```
https://your-domain.com
```

---

### 3. Available Endpoints

#### Health Check

```
GET /health
```

#### Upload CSV File

```
POST /csv-import/upload
Content-Type: multipart/form-data
Body: file (CSV file)
```

#### Get Upload History

```
GET /csv-import/history
GET /csv-import/history?status=success
GET /csv-import/history?status=failed
GET /csv-import/history?status=processing
```

#### Get Upload by ID

```
GET /csv-import/history/:id
```

#### Get CSV Data

```
GET /csv-import/history/:id/data
```

---

### 4. Sharing with Developers

#### Option A: Local Development

1. Start the backend server:
   ```bash
   cd backend
   npm run start:dev
   ```
2. Share the Swagger URL:
   ```
   http://localhost:3000/api-docs
   ```
3. Share the base URL:
   ```
   http://localhost:3000
   ```

#### Option B: Network Access

1. Find your local IP address:

   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   ```

2. Update CORS settings in `main.ts` if needed
3. Share:
   ```
   http://YOUR_IP:3000/api-docs
   ```

#### Option C: Deploy to Cloud

Deploy to platforms like:

- **Heroku**
- **Railway**
- **Render**
- **AWS**
- **DigitalOcean**
- **Vercel** (for frontend)

Then share:

```
https://your-api-domain.com/api-docs
```

---

### 5. Export OpenAPI Specification

The OpenAPI JSON specification is available at:

```
GET http://localhost:3000/api-docs-json
```

This can be:

- Imported into Postman
- Used with API clients
- Shared as documentation
- Used for code generation

---

### 6. Postman Collection

#### Import from Swagger:

1. Open Postman
2. Click "Import"
3. Enter URL: `http://localhost:3000/api-docs-json`
4. Postman will create a collection with all endpoints

---

### 7. Example Code Snippets

#### JavaScript/TypeScript (Fetch)

```javascript
// Upload CSV
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/csv-import/upload', {
  method: 'POST',
  body: formData,
});
const data = await response.json();
```

#### cURL

```bash
# Upload CSV
curl -X POST http://localhost:3000/csv-import/upload \
  -F "file=@path/to/file.csv"

# Get History
curl http://localhost:3000/csv-import/history

# Get Upload Data
curl http://localhost:3000/csv-import/history/1234567890-abc123/data
```

#### Python (Requests)

```python
import requests

# Upload CSV
with open('file.csv', 'rb') as f:
    files = {'file': f}
    response = requests.post(
        'http://localhost:3000/csv-import/upload',
        files=files
    )
    print(response.json())
```

---

### 8. Environment Variables

Create a `.env` file for configuration:

```env
PORT=3000
NODE_ENV=development
```

For production, set:

```env
PORT=3000
NODE_ENV=production
```

---

### 9. CORS Configuration

CORS is currently enabled for all origins. To restrict:

```typescript
// In main.ts
app.enableCors({
  origin: ['http://localhost:5173', 'https://your-frontend.com'],
  credentials: true,
});
```

---

### 10. Authentication (Future Enhancement)

Currently, the API has no authentication. To add:

1. Install `@nestjs/passport` and `passport-jwt`
2. Add JWT authentication guards
3. Protect endpoints with `@UseGuards(JwtAuthGuard)`
4. Update Swagger with security schemes

---

## Quick Start for Developers

1. **View Documentation:**

   ```
   http://localhost:3000/api-docs
   ```

2. **Test Endpoints:**
   - Use Swagger UI "Try it out" feature
   - Or use Postman/Insomnia

3. **Get Base URL:**

   ```
   http://localhost:3000
   ```

4. **Check Health:**
   ```
   GET http://localhost:3000/health
   ```

---

## Support

For questions or issues:

- Check Swagger documentation: `/api-docs`
- Review API responses in Swagger UI
- Check server logs for errors
