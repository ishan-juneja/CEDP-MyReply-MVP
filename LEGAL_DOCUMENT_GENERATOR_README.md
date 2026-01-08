# Legal Document Generator

An AI-powered survey-to-document automation system that transforms Formbricks survey responses into professional legal documents using OCR, LLM processing, and automated PDF generation.

## 🎯 What It Does

This system creates a seamless pipeline from **survey completion → document generation**:

### Core Workflow
1. **User fills out legal survey** (e.g., eviction defense questionnaire)
2. **System validates responses** and applies business logic
3. **AI processes uploaded documents** (OCR on eviction notices)
4. **LLM generates legal arguments** based on user circumstances
5. **Professional PDF is created** and delivered instantly

### Current Implementation
- **Colorado Eviction Defense Documents** - Generates tenant defense responses
- **OCR Integration** - Extracts text from uploaded eviction notices
- **LLM-Powered Legal Arguments** - Uses AI to create defense narratives
- **Webhook Automation** - Triggers on survey completion
- **Real-time Progress Tracking** - Shows generation status to users

## 🚀 Deployment Guide

### Prerequisites
- **Node.js** >= 18.x
- **pnpm** package manager
- **Python** 3.8+ (for AI services)
- **Docker** (for easy deployment)
- **PostgreSQL** and **Redis** (included in Docker setup)

### Option 1: Docker Deployment (Recommended)

#### 1. Clone and Setup
```bash
git clone <repository-url>
cd formbricks
```

#### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings:
# - Database URLs
# - API keys (Google Gemini, etc.)
# - Webhook URLs
# - Storage configuration
```

#### 3. Launch Services
```bash
# Start Formbricks + Database + Redis
docker-compose -f docker/docker-compose.yml up -d

# Start Python AI service
cd services
chmod +x start.sh
./start.sh
```

#### 4. Access the Application
- **Formbricks Admin**: http://localhost:3000
- **Python API**: http://localhost:8000
- **Test Survey**: http://localhost:3000/s/[survey-id]

### Option 2: Local Development Setup

#### 1. Install Dependencies
```bash
# Install Node.js dependencies
pnpm install

# Setup Python environment
cd services
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 2. Database Setup
```bash
# Start local databases
pnpm db:up

# Run migrations
pnpm db:migrate:dev
```

#### 3. Configure Environment Variables
```bash
# Copy and edit environment files
cp .env.example .env
cp services/.env.example services/.env
```

#### 4. Start Services
```bash
# Terminal 1: Formbricks (Next.js)
pnpm dev

# Terminal 2: Python AI Service
cd services && ./start.sh

# Terminal 3: Database (if not using Docker)
docker-compose -f docker-compose.dev.yml up
```

### Option 3: Production Deployment

#### Using Railway (One-Click)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/PPDzCd)

#### Using Docker Compose (Production)
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  formbricks:
    image: ghcr.io/formbricks/formbricks:latest
    environment:
      - WEBAPP_URL=https://your-domain.com
      - DATABASE_URL=postgresql://...
      # ... other env vars
    depends_on:
      - postgres
      - redis

  legal-ai-service:
    build: ./services
    environment:
      - GEMINI_API_KEY=your-key
    ports:
      - "8000:8000"
```

## 🔗 Current Integrations

### AI & ML Services
- **Google Gemini AI** - Legal argument generation
- **OCR Processing** - Text extraction from images
  - Primary: Tesseract OCR
  - Fallback: EasyOCR
- **PDF Generation** - ReportLab library

### Formbricks Features
- **Webhook System** - Real-time event processing
- **Conditional Logic** - Survey branching and calculations
- **File Uploads** - Document processing pipeline
- **Response Validation** - Data quality assurance

### External Services
- **PostgreSQL** - Data persistence with vector extensions
- **Redis** - Caching and rate limiting
- **AWS S3** - File storage (configurable)
- **Email Services** - SMTP integration

### Webhook Endpoints
- `POST /api/myreply-webhook` - Main legal document generation
- `POST /api/test-webhook` - Testing and debugging
- `POST /api/pdf-webhook` - PDF generation examples

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Survey   │ -> │  Formbricks Web  │ -> │   Webhook POST   │
│  (HTML/JS)      │    │   Application     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Data Validation│ -> │   AI Processing  │ -> │  PDF Generation │
│   & Extraction  │    │   (Python API)   │    │   (ReportLab)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   File Storage  │    │   User Delivery  │    │   Progress UI   │
│   (S3/Local)    │    │   (Download)     │    │   (Real-time)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Components

#### 1. Survey Interface (`survey.html`)
- Embedded Formbricks survey with custom styling
- Real-time completion detection
- Progress visualization
- PDF delivery interface

#### 2. Webhook Processor (`/api/myreply-webhook/route.ts`)
- Survey response validation
- Business logic gates
- API orchestration
- Error handling

#### 3. AI Service (`services/api.py`)
- OCR text extraction
- LLM argument generation
- PDF creation
- Fallback mechanisms

## 📊 API Endpoints

### Formbricks Webhooks
```typescript
POST /api/myreply-webhook
Content-Type: application/json

{
  "webhookId": "webhook_123",
  "event": "responseFinished",
  "data": {
    "id": "response_456",
    "finished": true,
    "data": {
      "colorado_resident": "Yes",
      "payment_status": "paid_full_option_id",
      "eviction_notice": "uploaded_file_url"
    },
    "variables": {
      "calculated_field": "value"
    }
  }
}
```

### Python AI Service
```python
POST /generate-defense
Content-Type: application/json

{
  "tenant_name": "John Doe",
  "tenant_address": "123 Main St",
  "eviction_notice_url": "https://...",
  "payment_status": "Paid full amount",
  "state": "Colorado",
  "up_codes": ["UP003", "UP001"],
  "response_id": "resp_123"
}

Response:
{
  "pdf_url": "/download/generated_doc.pdf",
  "analysis": {
    "up_codes_applied": ["UP003"],
    "legal_arguments": "...",
    "ocr_text_length": 1250
  }
}
```

## 🔮 Building for the Future

### Immediate Extensions

#### 1. Multi-State Legal Documents
```typescript
// Add state-specific templates
const templates = {
  'Colorado': 'co-eviction-defense.pdf',
  'California': 'ca-unlawful-detainer.pdf',
  'Texas': 'tx-forcible-entry.pdf'
};

// State-specific legal codes
const legalCodes = {
  'Colorado': ['UP001', 'UP003', 'UP013'],
  'California': ['CCP 1161', 'CCP 1161a'],
  'Texas': ['TPTCA 24.005', 'TPTCA 92.019']
};
```

#### 2. Document Type Expansion
```typescript
// Support multiple document types
enum DocumentType {
  EVICTION_DEFENSE = 'eviction-defense',
  LEASE_AGREEMENT = 'lease-agreement',
  CONTRACT_REVIEW = 'contract-review',
  SMALL_CLAIMS = 'small-claims-response'
}

// Template selection logic
function selectTemplate(surveyData: SurveyResponse): string {
  switch (surveyData.document_type) {
    case 'eviction': return 'eviction-defense.pdf';
    case 'contract': return 'contract-review.pdf';
    case 'lease': return 'lease-agreement.pdf';
    default: return 'generic-legal.pdf';
  }
}
```

#### 3. Advanced AI Features
```python
# Multi-modal processing
def process_document(file_url: str) -> Dict:
    # OCR for text extraction
    text = extract_text_from_image(file_url)

    # LLM analysis for legal insights
    analysis = analyze_legal_content(text)

    # Generate multiple document sections
    sections = generate_document_sections(analysis)

    return {
        'extracted_text': text,
        'legal_analysis': analysis,
        'document_sections': sections
    }

# Predictive analytics
def predict_case_outcome(factors: Dict) -> Dict:
    # ML model for success probability
    # Based on historical data and legal precedents
    return {
        'success_probability': 0.75,
        'key_factors': ['payment_attempted', 'notice_timely'],
        'recommended_actions': ['file_counterclaim']
    }
```

### Advanced Integrations

#### 1. Legal Research Integration
```typescript
// Connect to legal databases
interface LegalResearchAPI {
  searchPrecedents(query: string): Promise<Case[]>;
  getStatutes(state: string, topic: string): Promise<Statute[]>;
  analyzeCase(facts: string): Promise<LegalAnalysis>;
}

// Usage in webhook
const precedents = await legalAPI.searchPrecedents(
  `eviction defense ${tenant.situation}`
);
```

#### 2. Court Filing Automation
```typescript
// Direct court system integration
interface CourtFilingAPI {
  validateDocument(doc: PDFDocument): Promise<ValidationResult>;
  submitFiling(doc: PDFDocument, court: CourtInfo): Promise<FilingResult>;
  checkStatus(filingId: string): Promise<FilingStatus>;
}

// Automated filing workflow
async function fileDocumentAutomatically(document: PDFDocument) {
  const validation = await courtAPI.validateDocument(document);
  if (validation.isValid) {
    const result = await courtAPI.submitFiling(document, courtInfo);
    return result.filingNumber;
  }
}
```

#### 3. Multi-Language Support
```typescript
// Internationalization
const i18nConfig = {
  supportedLanguages: ['en', 'es', 'zh', 'vi'],
  legalTerminology: {
    'eviction': {
      'es': 'desalojo',
      'zh': '驱逐',
      'vi': 'trục xuất'
    }
  }
};

// LLM-powered translation
async function translateLegalDocument(
  document: string,
  targetLanguage: string
): Promise<string> {
  return await llm.translate(document, {
    domain: 'legal',
    targetLanguage,
    preserveLegalTerms: true
  });
}
```

### Scalability Enhancements

#### 1. Microservices Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  API Gateway    │ -> │   Orchestrator  │ -> │  Document Gen   │
│  (Next.js)      │    │   Service       │    │   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   OCR Service   │    │   LLM Service   │
                       │  (Python)       │    │   (Python)      │
                       └─────────────────┘    └─────────────────┘
```

#### 2. Queue-Based Processing
```typescript
// Message queue for async processing
interface QueueMessage {
  surveyResponse: SurveyResponse;
  webhookId: string;
  priority: 'high' | 'normal' | 'low';
}

// Redis-based queue
const documentQueue = new RedisQueue('document-generation');

// Async processing
app.post('/webhook', async (req, res) => {
  await documentQueue.add({
    surveyResponse: req.body.data,
    webhookId: req.body.webhookId,
    priority: 'normal'
  });

  res.json({ status: 'queued', estimatedTime: '30s' });
});
```

#### 3. Database Optimizations
```sql
-- Vector search for similar cases
CREATE INDEX ON legal_documents USING ivfflat (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL;

-- Full-text search on legal content
CREATE INDEX ON legal_documents USING gin(to_tsvector('english', content));

-- Partitioning for performance
CREATE TABLE legal_documents_y2024 PARTITION OF legal_documents
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### Monitoring & Analytics

#### 1. Comprehensive Logging
```typescript
// Structured logging
const logger = new StructuredLogger({
  service: 'legal-document-generator',
  version: process.env.npm_package_version
});

// Track document generation metrics
logger.info('document_generated', {
  documentType: 'eviction-defense',
  processingTime: 2500,
  ocrConfidence: 0.92,
  llmTokens: 1250,
  success: true
});
```

#### 2. Performance Monitoring
```typescript
// Real-time metrics
const metrics = {
  documentsGenerated: new Counter(),
  processingTime: new Histogram(),
  errorRate: new Gauge(),
  ocrAccuracy: new Histogram()
};

// Health checks
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    metrics: metrics.getSnapshot()
  });
});
```

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/new-document-type`)
3. **Implement** your changes
4. **Add tests** for new functionality
5. **Submit** a pull request

### Code Quality
- **TypeScript** for type safety
- **ESLint** + **Prettier** for code formatting
- **Vitest** for testing
- **Prisma** for database management

### Testing Strategy
```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# AI service tests
cd services && python -m pytest

# Integration tests
pnpm test:integration
```

## 📋 Roadmap

### Phase 1 (Current)
- ✅ Colorado eviction defense documents
- ✅ OCR processing for uploaded notices
- ✅ LLM-powered legal argument generation
- ✅ PDF creation and delivery

### Phase 2 (Next 3 Months)
- 🔄 Multi-state legal document support
- 🔄 Additional document types (contracts, leases)
- 🔄 Advanced AI features (case prediction)
- 🔄 Court filing integration

### Phase 3 (6+ Months)
- 🔄 International language support
- 🔄 Legal research integration
- 🔄 Mobile app companion
- 🔄 Enterprise white-labeling

## 📞 Support

- **Documentation**: [Formbricks Docs](https://formbricks.com/docs)
- **Issues**: [GitHub Issues](https://github.com/formbricks/formbricks/issues)
- **Discussions**: [GitHub Discussions](https://github.com/formbricks/formbricks/discussions)
- **Discord**: [Formbricks Community](https://discord.gg/3YFcABF2wJ)

## 📄 License

This project combines:
- **Formbricks Core**: AGPLv3 License
- **Enterprise Features**: Commercial License
- **Custom Legal AI**: MIT License

See individual `LICENSE` files for details.

---

**Built with ❤️ using Formbricks, Next.js, FastAPI, and Google Gemini AI**
