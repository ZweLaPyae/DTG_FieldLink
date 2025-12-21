export type Ticket = {
  id: string;
  customerId: string;
  customerName?: string; // Made optional as it's not in the backend response
  phone?: string; // Made optional as it's not in the backend response
  serviceType?: string; // Made optional as it's not in the backend response
  splitter?: string; // Made optional as it's not in the backend response
  complaint: string;
  priorityId: string; // Corrected from priorityID to priorityId to match backend response
  sla: string;
  technician_display?: string; // Made optional as it's not in the backend response
  status: string;
  issueTime: string;
  completionTime?: string;
  startTime?: string | null; // Added to match backend response
  rootCauseId?: string | null; // Added to match backend response
  rootCauseDetails?: string | null; // Added to match backend response
  wayToFix?: string | null; // Added to match backend response
  materialsUsed?: string | null; // Added to match backend response
  totalCost?: number | null; // Added to match backend response
  attachments?: string | null; // Added to match backend response
  updates?: string | null; // Added to match backend response
};