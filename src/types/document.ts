export interface Document {
  docId: string;
  ownerId: string;
  assignedTo?: string;
  cid?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: DocumentStatus;
  codingData?: CodingData;
  auditData?: AuditData;
  history: DocumentHistory[];
  queries: Query[];
  createdAt: string;
  updatedAt: string;
}

export type DocumentStatus = 
  | "UPLOADED" 
  | "ASSIGNED" 
  | "CODING_IN_PROGRESS" 
  | "CODING_COMPLETE" 
  | "UNDER_AUDIT" 
  | "APPROVED" 
  | "REJECTED" 
  | "CLAIMED";

export interface CodingData {
  icd10: string[];
  cpt: string[];
  hcpcs: string[];
  notes: string;
  diagnosisDescription: string;
  procedureNotes: string;
  codedBy: string;
  codedAt: string;
}

export interface AuditData {
  verdict: "APPROVED" | "REJECTED";
  auditorId: string;
  comments: string;
  auditedAt: string;
}

export interface DocumentHistory {
  action: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

export interface Query {
  queryId: string;
  docId: string;
  raisedBy: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  assignedTo?: string;
  response?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Claim {
  claimId: string;
  docId: string;
  status: "SUBMITTED" | "APPROVED" | "DENIED" | "PENDING";
  submittedAt: string;
  decidedAt?: string;
  amount?: number;
  payerId?: string;
}