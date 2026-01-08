# Webhook Testing & PDF Generation Setup

I've created two webhook endpoints for you to test and understand how survey data flows from Formbricks to your backend.

## 📁 Files Created

### 1. Test Webhook Endpoint
- **Location**: `/apps/web/app/api/test-webhook/`
- **Purpose**: Simple endpoint to view webhook data in console
- **Files**:
  - `route.ts` - The webhook endpoint
  - `page.tsx` - Dashboard UI with instructions
  - `README.md` - Detailed documentation

### 2. PDF Generation Endpoint (Example)
- **Location**: `/apps/web/app/api/pdf-webhook/`
- **Purpose**: Example showing how to generate PDFs from survey data
- **Files**:
  - `route.ts` - PDF generation webhook endpoint

---

## 🚀 Quick Start

### Step 1: Start Your Dev Server

```bash
pnpm dev
```

Your server should now be running at `http://localhost:3000`

### Step 2: View the Test Dashboard (Optional)

Open in your browser:
```
http://localhost:3000/api/test-webhook/page
```

### Step 3: Configure Webhook in Formbricks

1. **Go to your survey** in Formbricks (the one you created)
2. Navigate to: **Summary** → **Settings** → **Webhooks**
3. Click **"Add Webhook"** or **"Create Webhook"**
4. Enter webhook URL: 
   ```
   http://localhost:3000/api/test-webhook
   ```
5. Select trigger: **"Response Finished"**
6. Save the webhook

### Step 4: Test It!

1. **Complete your survey** (either through preview or the actual link)
2. **Watch your terminal** where `pnpm dev` is running
3. You'll see detailed output showing:
   - Full webhook payload
   - Individual form field values
   - Calculated variables
   - Survey metadata

---

## 📊 Understanding the Output

When you complete a survey, you'll see console output like this:

```
==============================================
📥 WEBHOOK RECEIVED
==============================================
Timestamp: 2024-01-15T10:35:22.123Z

📋 Full Payload:
{
  "webhookId": "clx123abc",
  "event": "responseFinished",
  "data": {
    "id": "clx456def",
    "surveyId": "clx789ghi",
    "finished": true,
    "data": {
      "employee_name": "John Doe",
      "rent_owed": "5500",
      "property_type": "Apartment"
    },
    "variables": {
      "total_compensation": 75000,
      "late_fees": 150
    }
  }
}

📝 Form Responses (data):
{
  "employee_name": "John Doe",
  "rent_owed": "5500",
  "property_type": "Apartment"
}

📊 Individual Fields:
  employee_name: "John Doe"
  rent_owed: "5500"
  property_type: "Apartment"

🔢 Calculated Variables:
{
  "total_compensation": 75000,
  "late_fees": 150
}
==============================================
```

---

## 🔑 Key Data Fields Explained

### `data.data` - User's Direct Answers
This object contains the actual answers to your survey questions, keyed by **element IDs**:
```typescript
{
  "element_id_1": "answer value",
  "element_id_2": 5500,
  "element_id_3": ["option1", "option2"]
}
```

### `data.variables` - Calculated Values
This object contains values calculated by your **conditional logic** rules:
```typescript
{
  "variable_name": 75000,
  "another_variable": "calculated text"
}
```

### Other Fields
- `id` - Unique response ID
- `surveyId` - Which survey this response is for
- `finished` - Whether the user completed the entire survey
- `createdAt` / `updatedAt` - Timestamps
- `survey` - Survey metadata (title, type, status)
- `meta` - Additional context (source, URL, user agent)

---

## 📄 Using Data for PDF Generation

### Step 1: Extract the Data You Need

```typescript
const { data, variables } = payload.data;

// Get individual fields
const employeeName = data.employee_name;
const rentOwed = data.rent_owed;
const propertyType = data.property_type;

// Get calculated variables
const totalCompensation = variables.total_compensation;
const lateFees = variables.late_fees;
```

### Step 2: Select the Right Document Template

```typescript
let templatePath;

// Use survey responses to determine which template
if (propertyType === 'Apartment') {
  templatePath = 'templates/apartment-lease.pdf';
} else if (propertyType === 'House') {
  templatePath = 'templates/house-lease.pdf';
} else {
  templatePath = 'templates/generic-lease.pdf';
}
```

### Step 3: Populate Template Fields

```typescript
// Read your template
let template = readFileSync(templatePath, 'utf-8');

// Replace placeholders (using recall-like syntax)
template = template.replace(/{{employee_name}}/g, data.employee_name);
template = template.replace(/{{rent_owed}}/g, data.rent_owed);
template = template.replace(/{{total_compensation}}/g, variables.total_compensation);
```

---

## 🔧 Next Steps for Production

### 1. Choose a PDF Library

Install one of these:

```bash
# Option 1: pdf-lib (recommended for filling forms)
pnpm add pdf-lib

# Option 2: pdfkit (for generating from scratch)
pnpm add pdfkit @types/pdfkit

# Option 3: React PDF (if you want to use React)
pnpm add @react-pdf/renderer

# Option 4: Puppeteer (HTML to PDF)
pnpm add puppeteer
```

### 2. Update the PDF Webhook Route

- The example code in `/api/pdf-webhook/route.ts` shows you the structure
- Uncomment the PDF generation code once you install a library
- Add your actual template logic

### 3. Handle File Storage

Decide where to save generated PDFs:
- **Local file system** (for testing)
- **AWS S3** or similar cloud storage
- **Database** (as binary data)
- **Email attachment** (send directly to user)

### 4. Test with ngrok (Optional)

If you need to test from external services:

```bash
# Install ngrok
npm install -g ngrok

# Expose your localhost
ngrok http 3000

# Use the ngrok URL in your webhook
# Example: https://abc123.ngrok.io/api/test-webhook
```

---

## 🧪 Testing the Endpoint

### Method 1: Complete Your Survey
Just fill out and submit your survey. The webhook will be called automatically.

### Method 2: Use the Test Button
Go to `http://localhost:3000/api/test-webhook/page` and click "Send Test Webhook"

### Method 3: Use curl or Postman

```bash
curl -X POST http://localhost:3000/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "webhookId": "test_123",
    "event": "responseFinished",
    "data": {
      "id": "test_response",
      "surveyId": "test_survey",
      "finished": true,
      "data": {
        "employee_name": "John Doe",
        "rent_owed": "5500"
      },
      "variables": {
        "total_compensation": 75000
      }
    }
  }'
```

---

## 💡 Tips

1. **Keep the terminal visible** where `pnpm dev` is running - that's where all the webhook data logs
2. **Element IDs are unique** - use them to access specific form fields
3. **Variables are for calculated values** - set them using conditional logic in your survey
4. **Test with different responses** - see how the data structure changes
5. **Check the `finished` flag** - only generate PDFs for completed surveys

---

## 📚 Example Use Cases

### Use Case 1: Lease Agreement
```typescript
// Determine document type from survey
if (data.document_type === 'lease') {
  // Use lease template
  // Fill in: tenant name, rent amount, property address
  // Calculate: late fees, total due
}
```

### Use Case 2: Employment Contract
```typescript
// Determine seniority level
if (data.job_level === 'senior') {
  templatePath = 'templates/senior-contract.pdf';
  // Include stock options, bonus structure
}
```

### Use Case 3: Custom Report
```typescript
// Generate report based on multiple conditions
const sections = [];
if (data.include_financial) sections.push('financial-section');
if (data.include_legal) sections.push('legal-section');
// Build composite document
```

---

## 🐛 Troubleshooting

### Webhook not firing?
1. Check that your survey status is `inProgress` (not `draft`)
2. Verify the webhook URL is correct
3. Make sure `pnpm dev` is running
4. Check webhook settings in Formbricks

### Not seeing console output?
1. Look at the terminal where `pnpm dev` is running (not browser console)
2. Make sure you're completing the survey (not just previewing)
3. Check if the webhook trigger is set to "Response Finished"

### Getting errors?
1. Check the webhook response in Formbricks webhook settings
2. Look for error messages in the terminal
3. Verify your survey has all required fields filled

---

## 📞 Need Help?

- Check the README files in each endpoint folder
- Review the inline comments in the code
- Test with the dashboard at `/api/test-webhook/page`

---

**Happy Testing! 🎉**

Once you see the data flowing correctly, you can start building your PDF generation logic.


