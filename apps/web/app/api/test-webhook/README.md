# Test Webhook Endpoint

This is a simple webhook endpoint to receive and display survey response data from Formbricks.

## Files Created

1. **`route.ts`** - The webhook endpoint that receives POST requests
2. **`page.tsx`** - A dashboard page with instructions and test button

## How to Use

### 1. Start Your Dev Server

```bash
pnpm dev
```

### 2. View the Dashboard (Optional)

Open in browser: http://localhost:3000/api/test-webhook/page

### 3. Configure Webhook in Formbricks

1. Go to your survey in Formbricks
2. Navigate to: **Summary** → **Settings** → **Webhooks**
3. Click **"Add Webhook"** or **"Create Webhook"**
4. Enter webhook URL: `http://localhost:3000/api/test-webhook`
5. Select trigger: **"Response Finished"**
6. Save the webhook

### 4. Test It

1. Complete your survey
2. Watch your **terminal console** (where `pnpm dev` is running)
3. You'll see detailed output like:

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
      "rent_owed": "5500"
    },
    "variables": {
      "total_compensation": 75000
    }
  }
}

📝 Form Responses (data):
{
  "employee_name": "John Doe",
  "rent_owed": "5500"
}

📊 Individual Fields:
  employee_name: "John Doe"
  rent_owed: "5500"
==============================================
```

## Testing from External Services

If you need to test from an external service (not localhost):

### Using ngrok

1. Install ngrok: https://ngrok.com/download
2. Run: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Use as webhook: `https://abc123.ngrok.io/api/test-webhook`

## Response Data Structure

The webhook receives this JSON structure:

```typescript
{
  webhookId: string;          // ID of the webhook
  event: string;              // "responseCreated" or "responseFinished"
  data: {
    id: string;               // Response ID
    surveyId: string;         // Survey ID
    finished: boolean;        // Whether survey is complete
    createdAt: string;        // ISO timestamp
    updatedAt: string;        // ISO timestamp
    
    // User's direct answers (keyed by element IDs)
    data: {
      [elementId: string]: string | number | string[] | Record<string, any>
    };
    
    // Calculated variables from conditional logic
    variables: {
      [variableName: string]: string | number
    };
    
    // Survey info
    survey: {
      title: string;
      type: "link" | "app" | "website";
      status: "draft" | "inProgress" | "paused" | "completed";
      createdAt: string;
      updatedAt: string;
    };
    
    // Metadata
    meta: {
      source?: string;
      url?: string;
      userAgent?: string;
      // ... other metadata
    };
  }
}
```

## Next Steps: PDF Generation

Once you're receiving webhook data successfully, you can:

1. **Extract the data you need**:
   ```typescript
   const { data, variables } = payload.data;
   const employeeName = data.employee_name;
   const rentOwed = data.rent_owed;
   const totalCompensation = variables.total_compensation;
   ```

2. **Generate a PDF** using a library like:
   - `pdfkit` - Low-level PDF creation
   - `pdf-lib` - PDF manipulation
   - `@react-pdf/renderer` - React components to PDF
   - `puppeteer` - HTML to PDF

3. **Use document templates**:
   - Replace placeholders with actual data
   - Use the recall syntax concept: `{{variable_name}}`
   - Example:
     ```typescript
     let template = readFileSync('template.html', 'utf-8');
     template = template.replace(/{{employee_name}}/g, data.employee_name);
     template = template.replace(/{{rent_owed}}/g, data.rent_owed);
     ```

4. **Conditional document selection**:
   ```typescript
   let templatePath;
   if (data.property_type === 'Apartment') {
     templatePath = 'templates/apartment-lease.html';
   } else if (data.property_type === 'House') {
     templatePath = 'templates/house-lease.html';
   }
   ```

## Clean Up

When you're done testing, you can delete this folder or keep it for future reference.


