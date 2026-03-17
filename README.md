# YYD.AI

**AI Agent Skills Platform** - Powerful APIs for web search, cloud storage, voice cloning, and voice design.

## Features

- 🔍 **Web Search** - Intelligent web search powered by AI, delivering accurate and relevant results in real-time
- ☁️ **Cloud Storage** - Secure and scalable cloud storage with global CDN for fast access anywhere
- 🎙️ **Voice Cloning** - Clone any voice with just a few seconds of audio
- 🎯 **Voice Design** - Design and synthesize natural-sounding speech with advanced TTS technology

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Storage**: Aliyun OSS
- **Search**: Aliyun IQS
- **Voice**: Aliyun Qwen-TTS
- **Payments**: Stripe
- **Rate Limiting**: Upstash Redis

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Aliyun account
- Stripe account
- Upstash Redis account

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/qwin-ai/yydai.git
cd yydai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Configure the following services:

| Service | Required Keys |
|---------|--------------|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Aliyun | `ALIYUN_ACCESS_KEY_ID`, `ALIYUN_ACCESS_KEY_SECRET` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Upstash | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |

### 4. Run database migrations

Execute the SQL in `supabase/migrations/20240101000000_initial_schema.sql` in your Supabase SQL editor.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Authentication
- `GET /api/auth/callback` - OAuth callback handler

### API Keys
- `GET /api/v1/api-keys` - List API keys
- `POST /api/v1/api-keys` - Create new API key

### Search
- `POST /api/v1/search` - Web search API

### Storage
- `GET /api/v1/storage` - List files
- `POST /api/v1/storage` - Upload file

### Voice
- `POST /api/v1/voice/clone` - Clone voice
- `POST /api/v1/voice/design` - Design voice
- `GET /api/v1/voice/voices` - List voices

### Credits & Quota
- `GET /api/v1/credits` - Get credit balance
- `GET /api/v1/quota` - Get usage quota

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Dashboard pages
│   ├── (legal)/           # Legal pages (privacy, terms)
│   ├── (marketing)/       # Marketing pages (pricing, docs)
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/              # Auth components
│   ├── billing/           # Billing components
│   ├── dashboard/         # Dashboard components
│   ├── layout/            # Layout components
│   ├── search/            # Search components
│   ├── storage/           # Storage components
│   ├── ui/                # UI primitives
│   └── voice/             # Voice components
├── hooks/                 # Custom React hooks
├── lib/                   # Core libraries
│   ├── aliyun/            # Aliyun SDK integrations
│   ├── api-key/           # API key utilities
│   ├── auth/              # Auth utilities
│   ├── quota/             # Quota management
│   ├── stripe/            # Stripe integration
│   └── supabase/          # Supabase client
├── stores/                # Zustand stores
└── types/                 # TypeScript types
```

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint        # Run ESLint
npm run typecheck   # Run TypeScript type checking
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.