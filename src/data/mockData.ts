import { User, UserRole } from '@/types/user';
import { Document, DocumentStatus, Claim } from '@/types/document';

export const mockUsers: User[] = [
  {
    userId: "provider-1",
    name: "Dr. Sarah Johnson",
    email: "provider@cyptrix.com",
    role: "PROVIDER",
    active: true,
    metadata: { 
      password: "Provider$123",
      specialty: "Internal Medicine",
      npi: "1234567890"
    },
    createdAt: "2024-01-15T08:00:00Z",
    lastLogin: "2024-09-06T09:30:00Z"
  },
  {
    userId: "employee-1", 
    name: "Mike Chen",
    email: "employee@cyptrix.com",
    role: "EMPLOYEE",
    active: true,
    metadata: { 
      password: "Employee$123",
      department: "Medical Coding",
      certifications: ["CPC", "CCS"]
    },
    createdAt: "2024-02-01T08:00:00Z",
    lastLogin: "2024-09-06T08:45:00Z"
  },
  {
    userId: "auditor-1",
    name: "Lisa Rodriguez",
    email: "auditor@cyptrix.com", 
    role: "AUDITOR",
    active: true,
    metadata: { 
      password: "Auditor$123",
      department: "Quality Assurance",
      certifications: ["RHIA", "CCS-P"]
    },
    createdAt: "2024-01-20T08:00:00Z",
    lastLogin: "2024-09-06T07:15:00Z"
  },
  {
    userId: "admin-1",
    name: "Robert Kim",
    email: "admin@cyptrix.com",
    role: "ADMIN", 
    active: true,
    metadata: { 
      password: "Admin$123",
      department: "System Administration",
      permissions: ["all"]
    },
    createdAt: "2024-01-01T08:00:00Z",
    lastLogin: "2024-09-06T06:00:00Z"
  }
];

export const mockDocuments: Document[] = [
  {
    docId: "doc-1",
    ownerId: "provider-1",
    assignedTo: "employee-1",
    cid: "QmXYZ123...",
    fileName: "patient_chart_001.pdf",
    fileType: "application/pdf",
    fileSize: 2456789,
    status: "CODING_IN_PROGRESS",
    codingData: {
      icd10: ["Z00.00"],
      cpt: ["99213"],
      hcpcs: [],
      notes: "Annual wellness visit",
      diagnosisDescription: "Encounter for general adult medical examination without abnormal findings",
      procedureNotes: "Office visit, established patient, level 3",
      codedBy: "employee-1",
      codedAt: "2024-09-06T10:30:00Z"
    },
    history: [
      {
        action: "UPLOADED",
        performedBy: "provider-1", 
        timestamp: "2024-09-05T14:30:00Z",
        details: "Document uploaded by provider"
      },
      {
        action: "ASSIGNED",
        performedBy: "auditor-1",
        timestamp: "2024-09-06T08:00:00Z", 
        details: "Assigned to Mike Chen for coding"
      }
    ],
    queries: [],
    createdAt: "2024-09-05T14:30:00Z",
    updatedAt: "2024-09-06T10:30:00Z"
  },
  {
    docId: "doc-2",
    ownerId: "provider-1", 
    assignedTo: "employee-1",
    cid: "QmABC456...",
    fileName: "procedure_note_002.pdf",
    fileType: "application/pdf", 
    fileSize: 1876543,
    status: "UNDER_AUDIT",
    codingData: {
      icd10: ["M25.511", "M79.3"],
      cpt: ["20610"],
      hcpcs: ["J1040"],
      notes: "Knee injection for osteoarthritis",
      diagnosisDescription: "Pain in right shoulder, Panniculitis, unspecified",
      procedureNotes: "Arthrocentesis, aspiration and/or injection, major joint",
      codedBy: "employee-1",
      codedAt: "2024-09-05T16:45:00Z"
    },
    history: [
      {
        action: "UPLOADED",
        performedBy: "provider-1",
        timestamp: "2024-09-04T11:15:00Z"
      },
      {
        action: "CODING_COMPLETE", 
        performedBy: "employee-1",
        timestamp: "2024-09-05T16:45:00Z"
      },
      {
        action: "SUBMITTED_FOR_AUDIT",
        performedBy: "employee-1", 
        timestamp: "2024-09-05T16:50:00Z"
      }
    ],
    queries: [],
    createdAt: "2024-09-04T11:15:00Z",
    updatedAt: "2024-09-05T16:50:00Z"
  }
];

export const mockClaims: Claim[] = [
  {
    claimId: "claim-1",
    docId: "doc-3",
    status: "SUBMITTED",
    submittedAt: "2024-09-01T10:00:00Z",
    amount: 150.00,
    payerId: "ANTHEM001"
  },
  {
    claimId: "claim-2", 
    docId: "doc-4",
    status: "APPROVED",
    submittedAt: "2024-08-28T14:30:00Z",
    decidedAt: "2024-09-03T09:15:00Z",
    amount: 275.50,
    payerId: "BCBS002"
  },
  {
    claimId: "claim-3",
    docId: "doc-5", 
    status: "DENIED",
    submittedAt: "2024-08-25T16:20:00Z",
    decidedAt: "2024-09-02T11:45:00Z", 
    amount: 320.00,
    payerId: "MEDICARE001"
  }
];

export const mockNotifications = [
  {
    id: "notif-1",
    userId: "employee-1",
    title: "New Document Assigned",
    message: "You have been assigned a new document for coding: patient_chart_001.pdf",
    type: "assignment",
    read: false,
    createdAt: "2024-09-06T08:00:00Z"
  },
  {
    id: "notif-2", 
    userId: "auditor-1",
    title: "Document Ready for Audit",
    message: "Document procedure_note_002.pdf is ready for audit review",
    type: "audit",
    read: false,
    createdAt: "2024-09-05T16:50:00Z"
  },
  {
    id: "notif-3",
    userId: "provider-1",
    title: "Claim Approved", 
    message: "Your claim #claim-2 has been approved for $275.50",
    type: "claim",
    read: true,
    createdAt: "2024-09-03T09:15:00Z"
  }
];

export const mockProductivity = {
  "employee-1": {
    userId: "employee-1",
    date: "2024-09-06",
    loginAt: "08:45:00Z",
    breaks: [
      {
        startAt: "10:30:00Z",
        endAt: "10:45:00Z",
        reason: "Coffee break"
      },
      {
        startAt: "12:00:00Z", 
        endAt: "13:00:00Z",
        reason: "Lunch"
      }
    ],
    activeMinutes: 420,
    documentsProcessed: 3
  }
};