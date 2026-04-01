# AcadAlert API + Frontend Flow

Base URL (local): `http://localhost:8000`

## 1) Upload CSV
**Endpoint**: `POST /api/upload`

**Request**
- `multipart/form-data`
- Field name: `file`
- File type: `.csv`

**Required CSV Headers**
```
student_id,student_name,attendance_percentage,internal_marks,assignment_submission_rate,semester,risk_score,risk_level
```

**Success Response**
```json
{
  "message": "File uploaded successfully",
  "fileId": "<uuid>",
  "status": "ready"
}
```

**Error Examples**
- Not a CSV
```json
{ "detail": "Only CSV files are allowed." }
```
- Missing columns
```json
{ "detail": "Missing columns: [...]" }
```

---

## 2) Run Predictions (optional)
**Endpoint**: `POST /api/predict-all/{fileId}`

**Success Response (shape)**
```json
{
  "message": "Predictions completed",
  "total": 100,
  "predictions": [
    {
      "student_id": "STU001",
      "risk_level": "LOW",
      "risk_score": 0.18,
      "predicted_at": "2026-03-31T12:00:00Z",
      "file_id": "<uuid>",
      "student_name": "Allison Hill",
      "student_data": {
        "attendance_percentage": 84.9,
        "internal_marks": 98.5,
        "assignment_submission_rate": 66.5,
        "semester": 2
      }
    }
  ]
}
```

---

## 3) Students List
**Endpoint**: `GET /api/students`

---

## 4) Student Details
**Endpoint**: `GET /api/student/{student_id}`

---

## 5) Dashboard Stats
**Endpoint**: `GET /api/dashboard/stats`

---

## 6) Reports (PDF)
**Generate**: `GET /api/report/{student_id}`

**Download**: `GET /api/download-report/{student_id}`

---

## 7) AI Improvement Plan
**Endpoint**: `POST /api/ai/plan/{student_id}`

**Request Body (optional)**:
```json
{
  "question": "How can this student improve over the next month?"
}
```

**Success Response**
```json
{
  "student_id": "STU001",
  "plan": "..."
}
```

---

## 8) Email High-Risk Report (Brevo)
**Endpoint**: `POST /api/notifications/email-report/{student_id}`

**Request Body**
```json
{
  "recipient_email": "student@example.com",
  "recipient_name": "Student Name",
  "advisor_email": "advisor@example.com"
}
```

**Success Response**
```json
{
  "message_id": "<brevo-message-id>",
  "status": "sent"
}
```

---

## 9) Auto Send High-Risk Emails
**Endpoint**: `POST /api/notifications/send-high-risk`

Sends two emails (Urgent Risk Alert + Full Report) to the configured test recipients for all students with `risk_level=HIGH`.

**Success Response**
```json
{
  "sent": [],
  "failed": []
}
```

---

## 10) Faculty Risk Config
**Get/Update**: `GET /api/config/risk` and `PUT /api/config/risk`

---

## 11) Student Portal
**Dashboard**: `GET /api/student/me/dashboard`

**Generate Report**: `GET /api/student/me/report`

**AI Plan**: `POST /api/student/me/ai-plan`

**Link Profile**: `POST /api/student/me/link`

Body:
```json
{ "student_id": "STU001" }
```

---

## UI Flow (Suggested)
1. User uploads CSV
2. Show success + `fileId`
3. Optionally call `/predict-all/{fileId}`
4. Render dashboard or table with `/students`
5. Student details with `/student/{student_id}`
6. Reports from `/report/{student_id}`
7. AI plan from `/api/ai/plan/{student_id}`
8. Send report email from `/api/notifications/email-report/{student_id}`
9. Auto email high-risk batch from `/api/notifications/send-high-risk`
10. Faculty configure weights/thresholds via `/api/config/risk`
11. Student personal dashboard via `/api/student/me/dashboard`

---

## Clerk JWT Template (Required for Roles)
Create a Clerk JWT template named `acadalert` with a custom claim:
```json
{
  "role": "{{user.public_metadata.role}}"
}
```
Then the frontend will request `getToken({ template: "acadalert" })` and the backend will read the `role` claim. citeturn0search6

Fallback: if the template is not set, the backend will try to fetch the role
from Clerk using `CLERK_SECRET_KEY`.
