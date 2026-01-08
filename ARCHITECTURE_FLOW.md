# Survey to PDF Generation Flow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                                │
└─────────────────────────────────────────────────────────────────────┘

1. User fills out survey
   │
   ├─> Formbricks Survey (embedded in your website)
   │   - Collects responses in real-time
   │   - Evaluates conditional logic
   │   - Calculates variables
   │
   └─> User clicks "Submit"


┌─────────────────────────────────────────────────────────────────────┐
│                      FORMBRICKS BACKEND                             │
└─────────────────────────────────────────────────────────────────────┘

2. Response saved to database
   │
   ├─> Creates Response record
   │   - Stores data (user answers)
   │   - Stores variables (calculated values)
   │   - Marks as finished: true
   │
   └─> Triggers pipeline event: "responseFinished"


┌─────────────────────────────────────────────────────────────────────┐
│                         PIPELINE SYSTEM                              │
└─────────────────────────────────────────────────────────────────────┘

3. Pipeline processes the event
   │
   ├─> Checks all configured webhooks
   │   - Filters by trigger type
   │   - Filters by survey ID
   │
   └─> Sends HTTP POST to your webhook URL


┌─────────────────────────────────────────────────────────────────────┐
│                      YOUR WEBHOOK ENDPOINT                           │
│                  /api/test-webhook or /api/pdf-webhook               │
└─────────────────────────────────────────────────────────────────────┘

4. Your endpoint receives POST request
   │
   ├─> Request Body:
   │   {
   │     "webhookId": "clx123abc",
   │     "event": "responseFinished",
   │     "data": {
   │       "id": "response_id",
   │       "surveyId": "survey_id",
   │       "finished": true,
   │       "data": {
   │         "employee_name": "John Doe",    ← Direct answers
   │         "rent_owed": "5500"
   │       },
   │       "variables": {
   │         "total_compensation": 75000     ← Calculated values
   │       }
   │     }
   │   }
   │
   └─> You process this data


┌─────────────────────────────────────────────────────────────────────┐
│                      YOUR PDF GENERATION LOGIC                       │
└─────────────────────────────────────────────────────────────────────┘

5. Extract & Process Data
   │
   ├─> Step 1: Validate data
   │   if (!data.finished) return;
   │
   ├─> Step 2: Determine template
   │   const template = selectTemplate(data.data.document_type);
   │
   ├─> Step 3: Map data to template
   │   template.replace('{{employee_name}}', data.data.employee_name)
   │   template.replace('{{total_comp}}', data.variables.total_compensation)
   │
   └─> Step 4: Generate PDF
       const pdf = generatePDF(template, mappedData);


┌─────────────────────────────────────────────────────────────────────┐
│                         OUTPUT OPTIONS                               │
└─────────────────────────────────────────────────────────────────────┘

6. What to do with the PDF
   │
   ├─> Option A: Save to file system
   │   fs.writeFileSync(`output/${response.id}.pdf`, pdfBuffer)
   │
   ├─> Option B: Upload to S3
   │   s3.upload({ Bucket: 'docs', Key: '...', Body: pdfBuffer })
   │
   ├─> Option C: Send via email
   │   sendEmail({ to: user.email, attachment: pdfBuffer })
   │
   ├─> Option D: Store in database
   │   prisma.document.create({ data: { pdf: pdfBuffer } })
   │
   └─> Option E: Return as HTTP response
       return new Response(pdfBuffer, { 
         headers: { 'Content-Type': 'application/pdf' } 
       })
```

---

## Data Flow Example

### Survey Configuration
```
Block 1: Basic Information
├─ Element: employee_name (text input)
├─ Element: job_title (text input)
└─ Element: annual_salary (number input)

Block 2: Additional Details
├─ Element: start_date (date picker)
└─ Element: benefits_selected (multiple choice)

Conditional Logic:
├─ IF annual_salary > 100000
│  THEN calculate variable: total_compensation = annual_salary * 1.2
│  ELSE calculate variable: total_compensation = annual_salary * 1.1
```

### Webhook Payload Received
```json
{
  "webhookId": "webhook_xyz",
  "event": "responseFinished",
  "data": {
    "id": "response_abc123",
    "surveyId": "survey_def456",
    "finished": true,
    
    "data": {
      "employee_name": "Jane Smith",
      "job_title": "Senior Developer",
      "annual_salary": 120000,
      "start_date": "2024-02-01",
      "benefits_selected": ["health", "dental", "401k"]
    },
    
    "variables": {
      "total_compensation": 144000
    },
    
    "survey": {
      "title": "Employment Contract Generator",
      "type": "link",
      "status": "inProgress"
    }
  }
}
```

### Your Processing Code
```typescript
// 1. Extract data
const { data, variables } = payload.data;

// 2. Select template based on job title
let template;
if (data.job_title.includes('Senior')) {
  template = 'templates/senior-contract.html';
} else {
  template = 'templates/standard-contract.html';
}

// 3. Load and populate template
let html = fs.readFileSync(template, 'utf-8');
html = html.replace(/{{employee_name}}/g, data.employee_name);
html = html.replace(/{{job_title}}/g, data.job_title);
html = html.replace(/{{annual_salary}}/g, data.annual_salary);
html = html.replace(/{{start_date}}/g, data.start_date);
html = html.replace(/{{total_compensation}}/g, variables.total_compensation);

// 4. Generate PDF
const pdf = await generatePDFFromHTML(html);

// 5. Save or send
fs.writeFileSync(`contracts/${data.employee_name}.pdf`, pdf);
```

---

## Key Concepts

### 1. Element IDs vs Variables
```
┌──────────────────┬──────────────────────────────────────────┐
│  Element IDs     │  Variables                               │
├──────────────────┼──────────────────────────────────────────┤
│ Direct user      │ Calculated by conditional logic          │
│ input            │                                          │
│                  │                                          │
│ In data.data {}  │ In data.variables {}                     │
│                  │                                          │
│ Example:         │ Example:                                 │
│ "employee_name"  │ "total_compensation"                     │
│ "rent_owed"      │ "late_fees_calculated"                   │
└──────────────────┴──────────────────────────────────────────┘
```

### 2. When Webhooks Fire
```
Survey Started  →  responseCreated event
      │
User answers   →  (no event - just local state)
questions
      │
User clicks    →  responseFinished event  ← USE THIS ONE
"Submit"              │
                      └─> Your webhook receives data
```

### 3. Template Selection Logic
```
                    ┌──────────────────┐
                    │  Webhook Data    │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Read survey     │
                    │  response data   │
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
   ┌──────────▼─────────┐      ┌───────────▼──────────┐
   │ If document_type   │      │ If property_type     │
   │ === 'employment'   │      │ === 'apartment'      │
   └──────────┬─────────┘      └───────────┬──────────┘
              │                            │
   ┌──────────▼─────────┐      ┌───────────▼──────────┐
   │ Use employment     │      │ Use lease            │
   │ contract template  │      │ template             │
   └────────────────────┘      └──────────────────────┘
```

---

## Testing Flow

### 1. Local Development (localhost)
```
Your Computer
├─ Terminal 1: pnpm dev (running at localhost:3000)
│  └─> Webhook endpoint listening
│
└─ Browser: Open survey
   ├─> Fill out form
   ├─> Click submit
   └─> Check Terminal 1 for webhook logs
```

### 2. External Testing (with ngrok)
```
Your Computer                    Internet
├─ Terminal 1: pnpm dev         
│  (localhost:3000)
│
├─ Terminal 2: ngrok http 3000  ─────→  https://abc123.ngrok.io
│                                           │
└─ Formbricks webhook                       │
   config: abc123.ngrok.io/api/test-webhook ┘
```

---

## Checklist

Before generating PDFs in production:

- [ ] Webhook endpoint created and tested
- [ ] Console logs show correct data structure
- [ ] Element IDs identified for all required fields
- [ ] Variable names identified for calculated values
- [ ] PDF library chosen and installed
- [ ] Document templates prepared
- [ ] Template selection logic implemented
- [ ] Data mapping logic written
- [ ] Error handling added
- [ ] File storage solution decided
- [ ] Tested with multiple survey responses


