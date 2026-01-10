# AI Calling Platform - Multi-Tenant SaaS Application

A production-ready multi-tenant SaaS web application for an AI calling platform, similar to Omnidim.io. Built with FastAPI (Python) backend and Next.js (React) frontend.

## Features

- **Multi-Tenant Architecture**: Each user is a separate tenant with complete data isolation
- **JWT Authentication**: Secure authentication with access and refresh tokens
- **User Dashboard**: Overview of phone numbers, AI agents, calls, and orders
- **Phone Number Management**: Add and manage phone numbers (ready for Knowlarity DID integration)
- **AI Agent Configuration**: Create and configure AI agents with system prompts
- **Call Logs**: Track all call records
- **Order Management**: Capture and manage customer orders/data

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Production-ready relational database
- **SQLAlchemy**: Async ORM for database operations
- **JWT**: Token-based authentication
- **Pydantic**: Data validation

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── auth.py
│   │   │       │   ├── dashboard.py
│   │   │       │   ├── phone_numbers.py
│   │   │       │   ├── ai_agents.py
│   │   │       │   ├── call_logs.py
│   │   │       │   └── orders.py
│   │   │       └── router.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── dependencies.py
│   │   │   └── security.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── phone_number.py
│   │   │   ├── ai_agent.py
│   │   │   ├── agent_phone_mapping.py
│   │   │   ├── call_log.py
│   │   │   └── order.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── phone_number.py
│   │   │   ├── ai_agent.py
│   │   │   ├── call_log.py
│   │   │   ├── order.py
│   │   │   └── dashboard.py
│   │   └── services/
│   │       ├── auth_service.py
│   │       └── dashboard_service.py
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── phone-numbers/
│   │   ├── ai-agents/
│   │   ├── call-logs/
│   │   ├── orders/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── Layout.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── auth.ts
│   ├── package.json
│   └── .env.local.example
│
└── README.md
```

## Prerequisites

- **Python 3.9+**
- **Node.js 18+** and npm/yarn
- **Supabase Account** (free tier available) - https://supabase.com/
- **Git** (optional)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-calling-platform
```

### 2. Backend Setup

#### Create Virtual Environment

```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Database Setup (Supabase)

1. **Create Supabase Account & Project:**
   - Go to https://supabase.com/
   - Sign up and create a new project
   - Save your database password!

2. **Get Connection String:**
   - In Supabase Dashboard → Project Settings → Database
   - Copy the "Connection String (URI)" 
   - Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
   - Convert to asyncpg format: `postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

3. **Create `.env` file:**

```bash
cp .env.example .env
```

4. **Update `.env` with Supabase connection:**

```env
DATABASE_URL=postgresql+asyncpg://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
SECRET_KEY=your-very-secure-secret-key-change-in-production
```

**Important:** URL encode special characters in your password! (e.g., `@` → `%40`, `#` → `%23`)

#### Database Tables

The database tables will be created automatically on first run. The application uses SQLAlchemy's `create_all()` method.

**Verify tables in Supabase:**
- Go to Supabase Dashboard → Table Editor
- You should see: users, phone_numbers, ai_agents, agent_phone_mappings, call_logs, orders

#### Start the Backend Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

API Documentation (Swagger UI): `http://localhost:8000/docs`

### 3. Frontend Setup

#### Navigate to Frontend Directory

```bash
cd ../frontend
```

#### Install Dependencies

```bash
npm install
# or
yarn install
```

#### Configure Environment Variables

1. Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

2. Update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

#### Start the Frontend Server

```bash
npm run dev
# or
yarn dev
```

The frontend will be available at `http://localhost:3000`

## Usage

### 1. Create an Account

- Navigate to `http://localhost:3000`
- Click "Sign up" or go to `/signup`
- Create a new account with email and password

### 2. Login

- Go to `/login`
- Enter your email and password
- You'll be redirected to the dashboard

### 3. Dashboard

- View statistics:
  - Connected phone numbers
  - Active AI agents
  - Total calls
  - Total orders captured

### 4. Manage Phone Numbers

- Navigate to "Phone Numbers"
- Click "Add Phone Number"
- Enter phone number, provider (default: Knowlarity), and status
- **Future**: Integration with Knowlarity DID will be added here

### 5. Configure AI Agents

- Navigate to "AI Agents"
- Click "Create AI Agent"
- Configure:
  - Agent name
  - System prompt (editable textarea)
  - Language (e.g., en, hi, es)
  - Voice name (future: AI voice integration)
  - Active status
- Link agent to phone numbers

### 6. View Call Logs

- Navigate to "Call Logs"
- View all call records
- **Future**: SIP/telephony webhook integration will populate this automatically

### 7. Manage Orders

- Navigate to "Orders"
- Click "Add Order"
- Capture customer data:
  - Customer name
  - Phone
  - Order details
  - Address
  - Call ID (optional, links to call log)

## API Endpoints

### Authentication

- `POST /api/v1/auth/signup` - Create new account
- `POST /api/v1/auth/login` - Login and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/logout` - Logout

### Dashboard

- `GET /api/v1/dashboard/stats` - Get dashboard statistics

### Phone Numbers

- `GET /api/v1/phone-numbers` - List all phone numbers
- `POST /api/v1/phone-numbers` - Create phone number
- `GET /api/v1/phone-numbers/{id}` - Get phone number
- `PUT /api/v1/phone-numbers/{id}` - Update phone number
- `DELETE /api/v1/phone-numbers/{id}` - Delete phone number

### AI Agents

- `GET /api/v1/ai-agents` - List all AI agents
- `POST /api/v1/ai-agents` - Create AI agent
- `GET /api/v1/ai-agents/{id}` - Get AI agent
- `PUT /api/v1/ai-agents/{id}` - Update AI agent
- `DELETE /api/v1/ai-agents/{id}` - Delete AI agent
- `POST /api/v1/ai-agents/{id}/link-phones` - Link agent to phone numbers
- `GET /api/v1/ai-agents/{id}/linked-phones` - Get linked phone numbers

### Call Logs

- `GET /api/v1/call-logs` - List call logs (with pagination)
- `POST /api/v1/call-logs` - Create call log
- `GET /api/v1/call-logs/{call_id}` - Get call log by call_id

### Orders

- `GET /api/v1/orders` - List orders (with pagination)
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/{id}` - Get order
- `PUT /api/v1/orders/{id}` - Update order
- `DELETE /api/v1/orders/{id}` - Delete order

## Multi-Tenancy

Every database table includes a `user_id` column to ensure complete data isolation:

- Users can only access their own data
- All API endpoints automatically filter by `current_user.id`
- Proper authorization checks are enforced at the database level
- Foreign key constraints ensure data integrity

## Database Models

### Users
- Primary tenant table
- Stores user credentials and profile information

### Phone Numbers
- Linked to users via `user_id`
- Stores phone number, provider, and status
- **Future**: Integration with Knowlarity DID

### AI Agents
- Linked to users via `user_id`
- Stores agent configuration (name, prompt, language, voice)
- **Future**: Integration with AI voice services

### Agent-Phone Mappings
- Many-to-many relationship between AI agents and phone numbers
- Allows one agent to handle multiple phone numbers

### Call Logs
- Linked to users via `user_id`
- Stores call records (call_id, caller, duration, status, timestamp)
- **Future**: Auto-populated via SIP/telephony webhooks

### Orders
- Linked to users via `user_id`
- Stores customer orders/data capture
- Can be linked to call logs via `call_id`

## Future Integration Points

### AI Voice Integration
- The `ai_agents.voice_name` field is ready for voice selection
- The `ai_agents.system_prompt` field can be used with AI services
- Integration points are clearly marked in the code with comments

### Telephony Integration
- Phone numbers table ready for Knowlarity DID integration
- Call logs table structure ready for SIP/webhook integration
- Webhook endpoints can be added to `app/api/v1/endpoints/telephony.py`

### Example Webhook Endpoint (Future)

```python
@router.post("/webhooks/call")
async def handle_call_webhook(
    webhook_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Future: Handle incoming call webhooks from telephony provider
    - Extract user from phone number
    - Create call log entry
    - Trigger AI agent based on phone number mapping
    """
    pass
```

## Security Considerations

1. **JWT Tokens**: Access tokens expire after 30 minutes (configurable)
2. **Refresh Tokens**: Refresh tokens expire after 7 days (configurable)
3. **Password Hashing**: Uses bcrypt for secure password storage
4. **CORS**: Configured for frontend origins only
5. **Environment Variables**: Sensitive data stored in `.env` files
6. **Multi-Tenancy**: Data isolation enforced at database and API level

## Production Deployment

### Backend
1. Set `DEBUG=False` in environment variables
2. Use a strong `SECRET_KEY` (generate with: `openssl rand -hex 32`)
3. Use production PostgreSQL database
4. Configure CORS origins for your domain
5. Use a production WSGI server (e.g., Gunicorn with Uvicorn workers)

### Frontend
1. Build the application: `npm run build`
2. Set `NEXT_PUBLIC_API_URL` to your production API URL
3. Deploy to Vercel, Netlify, or your preferred hosting

## Development

### Running Tests (Future)
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Formatting
```bash
# Backend
black app/
isort app/

# Frontend
npm run lint
```

## License

[Your License Here]

## Support

For issues and questions, please open an issue in the repository.

---

**Note**: This is a production-ready foundation. Future integrations (AI voice, telephony webhooks) can be added to the existing structure without major refactoring.

