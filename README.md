# 🚀 AI-Powered Legal Document Generator MVP

<div align="center">

**MyReply CEDP Legal Document Generator**

*Transform survey responses into professional legal defense documents using AI*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![Formbricks](https://img.shields.io/badge/Formbricks-Integrated-orange.svg)](https://formbricks.com/)

</div>

---

## 📋 Overview

The AI-Powered Legal Document Generator is a comprehensive solution that automates the creation of legal defense documents for eviction cases. By integrating Formbricks surveys with AI-powered OCR and LLM services, this system transforms tenant information into professional legal arguments and formatted PDF documents.

### ✨ Key Features

- **📝 Intelligent Survey Integration**: Formbricks webhook integration for real-time survey processing
- **👁️ Advanced OCR Processing**: Extract text from eviction notices and legal documents
- **🤖 AI-Powered Legal Analysis**: Generate contextual legal arguments using Large Language Models
- **📄 Professional PDF Generation**: Create formatted legal defense documents
- **🔄 Automated Workflow**: End-to-end pipeline from survey completion to document delivery
- **🌐 Web-Based Interface**: User-friendly survey interface with embedded PDF viewing

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Formbricks    │ -> │   Next.js       │ -> │   FastAPI       │
│   Survey        │    │   Webhook       │    │   Services      │
│   Response      │    │   Handler       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Survey Data   │ -> │   OCR Analysis  │ -> │   LLM Argument  │
│   Processing    │    │   (Tesseract)   │    │   Generation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────┐
                                            │   PDF Document  │
                                            │   Generation    │
                                            │   (ReportLab)   │
                                            └─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **Docker** (for database and services)
- **ngrok** (for webhook tunneling)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ishan-juneja/CEDP-MyReply-MVP.git
   cd CEDP-MyReply-MVP
   ```

2. **Setup Python Environment**
   ```bash
   cd services
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Setup Node.js Environment**
   ```bash
   npm install
   # or
   pnpm install
   ```

4. **Start Services**
   ```bash
   # Start FastAPI service
   cd services
   ./start.sh

   # Start Next.js application
   npm run dev
   ```

5. **Setup ngrok for Webhooks**
   ```bash
   ngrok http 3000
   ```

---

## 📁 Project Structure

```
CEDP-MyReply-MVP/
├── apps/
│   └── web/                    # Next.js Application
│       ├── app/
│       │   ├── api/
│       │   │   ├── myreply-webhook/    # Main webhook endpoint
│       │   │   ├── survey-results/     # Survey results display
│       │   │   └── test-webhook/       # Testing endpoint
│       └── middleware/          # Route configuration
├── services/                   # Python FastAPI Services
│   ├── api.py                  # Main FastAPI application
│   ├── eviction_ocr_llm_helper.py  # OCR and LLM logic
│   ├── requirements.txt        # Python dependencies
│   ├── start.sh               # Service startup script
│   └── temp_uploads/          # Temporary file storage
├── output/                    # Generated PDF documents
├── survey.html               # Standalone survey page
├── test-survey-page/         # Test survey interface
├── ARCHITECTURE_FLOW.md      # Technical architecture docs
├── INTEGRATION_COMPLETE.md   # Integration status
├── LEGAL_DOCUMENT_GENERATOR_README.md  # Detailed documentation
└── WEBHOOK_SETUP_GUIDE.md    # Webhook configuration guide
```

---

## 🔧 Configuration

### Formbricks Survey Setup

1. Create a new survey in Formbricks
2. Add webhook endpoint: `https://your-ngrok-url.ngrok-free.app/api/myreply-webhook`
3. Configure triggers: `responseFinished`
4. Map question IDs to legal fields

### Environment Variables

Create `.env.local` in the root directory:

```bash
# Formbricks Configuration
FORMBRICKS_SURVEY_URL=http://localhost:3000/s/your-survey-id

# FastAPI Service
FASTAPI_URL=http://localhost:8000

# LLM Configuration (Optional)
GOOGLE_API_KEY=your_google_api_key
```

---

## 🎯 Usage

### 1. Complete the Survey

Access the survey at: `http://localhost:3000/s/your-survey-id`

The survey collects:
- Tenant personal information
- Payment status details
- Eviction notice uploads
- Legal defense requirements

### 2. Automatic Processing

Upon survey completion, the system automatically:
1. **Receives webhook** from Formbricks
2. **Downloads** uploaded eviction notice
3. **Performs OCR** to extract text
4. **Analyzes** legal patterns (3-day gaps, etc.)
5. **Generates** legal arguments using LLM
6. **Creates** formatted PDF document
7. **Serves** document for download/viewing

### 3. View Results

- **Survey Results**: Visit `/api/survey-results` for raw data
- **Generated Documents**: PDFs saved in `/output/` directory
- **Webhook Logs**: Check console for processing status

---

## 🔍 API Endpoints

### Next.js Webhooks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/myreply-webhook` | POST | Main legal document generation webhook |
| `/api/survey-results` | GET/POST | Survey results display and logging |
| `/api/test-webhook` | GET | Testing endpoint |

### FastAPI Services

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/ocr` | POST | OCR text extraction from images |
| `/generate-arguments` | POST | LLM legal argument generation |
| `/generate-defense` | POST | Complete document generation pipeline |
| `/download/{filename}` | GET | Download generated PDFs |

---

## 🧪 Testing

### Test Webhook Payload

```bash
cd services
python test_webhook.py
```

### Manual Testing

```bash
# Test survey results endpoint
curl http://localhost:3000/api/survey-results

# Test PDF generation
curl -X POST http://localhost:8000/generate-defense \
  -H "Content-Type: application/json" \
  -d '{"tenant_name": "Test Tenant", "state": "CA"}'
```

### Local Survey Testing

Open `survey.html` in your browser or serve via:
```bash
python -m http.server 8080
# Visit: http://localhost:8080/survey.html
```

---

## 📊 Legal Defense Logic

The system implements comprehensive legal defense analysis:

### UP Codes Supported

- **UP001**: Full payment defense
- **UP003**: Insufficient notice (3-day gap detection)
- **UP013**: Refusal to pay defense

### Document Sections

1. **Case Information**: Defendant details and case metadata
2. **Defense Narrative**: AI-generated legal arguments
3. **Conclusion**: Standardized legal language

---

## 🛠️ Development

### Adding New Legal Defenses

1. Update `eviction_ocr_llm_helper.py` with new UP codes
2. Modify detection logic in `services/api.py`
3. Test with sample data

### Customizing PDF Templates

Edit the `create_legal_pdf` function in `services/api.py` to modify:
- Document formatting
- Legal language templates
- Layout and styling

### Extending Survey Fields

1. Add new questions to Formbricks survey
2. Update `FIELD_MAPPING` in webhook handlers
3. Modify processing logic accordingly

---

## 🚨 Troubleshooting

### Common Issues

**Webhook not triggering:**
- Check ngrok URL is current
- Verify Formbricks webhook configuration
- Check console logs for errors

**OCR failing:**
- Ensure image files are accessible
- Check Python environment has required packages
- Verify file paths in Docker containers

**PDF not generating:**
- Check `output/` directory permissions
- Verify ReportLab installation
- Check FastAPI service logs

**Survey not loading:**
- Ensure Formbricks is running
- Check survey URL is correct
- Verify CORS settings

---

## 📈 Performance & Scaling

- **Concurrent Processing**: Handles multiple survey submissions
- **File Management**: Automatic cleanup of temporary uploads
- **Error Handling**: Comprehensive logging and fallback mechanisms
- **Rate Limiting**: Built-in protection against abuse

---

## 🔒 Security Considerations

- **Input Validation**: All webhook data validated
- **File Upload Security**: Restricted file types and sizes
- **API Authentication**: Secure service communication
- **Data Privacy**: No sensitive data stored permanently

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For questions or issues:
- Check the [troubleshooting guide](#-troubleshooting)
- Review the [integration documentation](INTEGRATION_COMPLETE.md)
- Examine [webhook setup guide](WEBHOOK_SETUP_GUIDE.md)

---

<div align="center">

**Built with ❤️ for legal aid automation**

*Empowering tenants with AI-powered legal defense*

</div>

## ✨ About Formbricks

<img width="1527" alt="formbricks-sneak" src="https://github-production-user-asset-6210df.s3.amazonaws.com/675065/249441967-ccb89ea3-82b4-4bf2-8d2c-528721ec313b.png">

Formbricks provides a free and open source surveying platform. Gather feedback at every point in the user journey with beautiful in-app, website, link and email surveys. Build on top of Formbricks or leverage prebuilt data analysis capabilities.

**Try it out in the cloud at [formbricks.com](https://app.formbricks.com/auth/signup)**

## 💪 Mission: Empower your team, craft an irresistible experience.

Formbricks is both a free and open source survey platform - and a privacy-first experience management platform. Use in-app, website, link and email surveys to gather user and customer insights at every point of their journey. Leverage Formbricks Insight Platform or build your own. Life's too short for mediocre UX.

### Table of Contents

- [Features](#features)

- [Getting Started](#getting-started)

- [Cloud Version](#cloud-version)

- [Self-hosted Version](#self-hosted-version)

- [Development](#development)

- [Contribution](#contribution)

- [Contact](#contact-us)

- [Security](#security)

- [License](#license)

<a id="features"></a>

### Features

- 📲 Create **conversion-optimized surveys** with our no-code editor with several question types.

- 📚 Choose from a variety of best-practice **templates**.

- 👩🏻 Launch and **target your surveys to specific user groups** without changing your application code.

- 🔗 Create shareable **link surveys**.

- 👨‍👩‍👦 Invite your organization members to **collaborate** on your surveys.

- 🔌 Integrate Formbricks with **Slack, Notion, Zapier, n8n and more**.

- 🔒 All **open source**, transparent and self-hostable.

### Built on Open Source

- 💻 [Typescript](https://www.typescriptlang.org/)

- 🚀 [Next.js](https://nextjs.org/)

- ⚛️ [React](https://reactjs.org/)

- 🎨 [TailwindCSS](https://tailwindcss.com/)

- 📚 [Prisma](https://prisma.io/)

- 🔒 [Auth.js](https://authjs.dev/)

- 🧘‍♂️ [Zod](https://zod.dev/)

- 🐛 [Vitest](https://vitest.dev/)

<a id="getting-started"></a>

## 🚀 Getting started

We've got several options depending on your need to help you quickly get started with Formbricks.

<a id="cloud-version"></a>

### ☁️ Cloud Version

Formbricks has a hosted cloud offering with a generous free plan to get you up and running as quickly as possible. To get started, please visit [formbricks.com](https://app.formbricks.com/auth/signup).

<a id="self-hosted-version"></a>

### 🐳 Self-hosting Formbricks

Formbricks is available Open-Source under AGPLv3 license. You can host Formbricks on your own servers using Docker without a subscription.

If you opt for self-hosting Formbricks, here are a few options to consider:

#### Docker

To get started with self-hosting with Docker, take a look at our [self-hosting docs](https://formbricks.com/docs/self-hosting/deployment).

#### Community-managed One Click Hosting

##### Railway

You can deploy Formbricks on [Railway](https://railway.app) using the button below.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/PPDzCd)

##### RepoCloud

Or you can also deploy Formbricks on [RepoCloud](https://repocloud.io) using the button below.

[![Deploy on RepoCloud](https://d16t0pc4846x52.cloudfront.net/deploy.png)](https://repocloud.io/details/?app_id=254)

##### Zeabur

Or you can also deploy Formbricks on [Zeabur](https://zeabur.com) using the button below.

[![Deploy to Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/G4TUJL)

<a id="development"></a>

## 👨‍💻 Development

### Prerequisites

Here is what you need to be able to run Formbricks:

- [Node.js](https://nodejs.org/en) (Version: >=18.x)

- [Pnpm](https://pnpm.io/)

- [Docker](https://www.docker.com/) - to run PostgreSQL and MailHog

### Local Setup

To get started locally, we've got a [guide to help you](https://formbricks.com/docs/developer-docs/contributing/get-started#local-machine-setup).

### Gitpod Setup

1. Click the button below to open this project in Gitpod.

2. This will open a fully configured workspace in your browser with all the necessary dependencies already installed.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/formbricks/formbricks)

<a id="contribution"></a>

## ✍️ Contribution

We are very happy if you are interested in contributing to Formbricks 🤗

Here are a few options:

- Star this repo.

- Create issues every time you feel something is missing or goes wrong.

- Upvote issues with 👍 reaction so we know what the demand for a particular issue is to prioritize it within the roadmap.

- Note: For the time being, we can only facilitate code contributions as an exception.

## All Thanks To Our Contributors

<a href="https://github.com/formbricks/formbricks/graphs/contributors">

<img src="https://contrib.rocks/image?repo=formbricks/formbricks" />

</a>

<a id="contact-us"></a>

## 📆 Contact us

Let's have a chat about your survey needs and get you started.

<a href="https://cal.com/johannes/onboarding?utm_source=banner&utm_campaign=oss"><img alt="Book us with Cal.com" src="https://cal.com/book-with-cal-dark.svg" /></a>

<a id="license"></a>

<a id="security"></a>

## 🔒 Security

We take security very seriously. If you come across any security vulnerabilities, please disclose them by sending an email to security@formbricks.com. We appreciate your help in making our platform as secure as possible and are committed to working with you to resolve any issues quickly and efficiently. See [`SECURITY.md`](./SECURITY.md) for more information.

<a id="license"></a>

## 👩‍⚖️ License

### The AGPL Formbricks Core

The Formbricks core application is licensed under the [AGPLv3 Open Source License](https://github.com/formbricks/formbricks/blob/main/LICENSE). The core application is fully functional and includes everything you need to design & run link surveys, website surveys and in-app surveys. You can use the software for free for personal and commercial use. You're also allowed to create and distribute modified versions as long as you document the changes you make incl. date. The AGPL license requires you to publish your modified version under the AGPLv3 license as well.

### The Enterprise Edition

Additional to the AGPL licensed Formbricks core, this repository contains code licensed under an Enterprise license. The [code](https://github.com/formbricks/formbricks/tree/main/apps/web/modules/ee) and [license](https://github.com/formbricks/formbricks/blob/main/apps/web/modules/ee/LICENSE) for the enterprise functionality can be found in the `/apps/web/modules/ee` folder of this repository. This additional functionality is not part of the AGPLv3 licensed Formbricks core and is designed to meet the needs of larger teams and enterprises. This advanced functionality is already included in the Docker images, but you need an [Enterprise License Key](https://formbricks.com/docs/self-hosting/enterprise) to unlock it.

### White-Labeling Formbricks and Other Licensing Needs

We currently do not offer Formbricks white-labeled. That means that we don't sell a license which let's other companies resell Formbricks to third parties under their name nor take parts (like the survey editor) out of Formbricks to add to their own software products. Any other needs? [Send us an email](mailto:hola@formbricks.com).

### Why charge for Enterprise Features?

The Enterprise Edition allows us to fund the development of Formbricks sustainably. It guarantees that the free and open-source surveying infrastructure we're building will be around for decades to come.

<p align="right"><a href="#top">🔼 Back to top</a></p>
