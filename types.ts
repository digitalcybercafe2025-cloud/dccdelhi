
import type { ServiceDocumentConfig } from './src/constants/documentCatalog';

export enum ApplicationStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  VERIFYING = 'VERIFYING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export enum EnquiryStatus {
  PENDING = 'Pending',
  CONTACTED = 'Contacted',
  CLOSED = 'Closed'
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  color: 'green' | 'blue' | 'red' | 'orange';
}

export interface ServiceSpecificField {
  label: string;
  name: string;
  type: 'text' | 'date' | 'select' | 'number' | 'tel';
  required?: boolean;
  placeholder?: string;
  options?: string[]; // For select type
}

export interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
  fee: number;
  requiredDocs: string[];
  mandatoryDocs?: string[];
  idProofs?: string[];
  addressProofs?: string[];
  otherDocs?: string[];
  documentConfigs?: ServiceDocumentConfig[];
  serviceSpecificFields?: ServiceSpecificField[]; // Dynamic per-service fields
  category: string;
  externalLink?: string;
  color: 'green' | 'blue' | 'red' | 'orange';
  estimatedDays: string;
  active?: boolean;
}

export interface ApplicationDocument {
  name: string;
  url: string;
  base64?: string;
  type: string;
  size?: string;
}

export interface Application {
  id: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  mobile: string;
  address: string;
  status: ApplicationStatus;
  paymentId: string;
  amount: number;
  timestamp: number;
  documents: ApplicationDocument[];
  lastUpdate: number;
  remarks?: string;
  certificateUrl?: string;
  paymentStatus: 'PAID' | 'FAILED' | 'REFUNDED';
}

export interface Testimonial {
  id: string;
  name: string;
  comment: string;
  rating: number;
  designation: string;
  photo?: string;
  photo_url?: string;
  status: boolean;
  display_order: number;
}

export interface Message {
  id: string;
  text: string;
  active: boolean;
  type: 'info' | 'urgent' | 'promo';
  displayOrder?: number;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'SMS' | 'WhatsApp';
  content: string;
  trigger: 'SUBMISSION' | 'PAYMENT' | 'STATUS_UPDATE';
  active: boolean;
}

export interface Enquiry {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  status: EnquiryStatus;
}

export type ThemeColor = 'blue' | 'green' | 'red' | 'orange';

export interface AboutContent {
  title: string;
  subtitle: string;
  description: string;
  missionTitle?: string;
  mission: string;
  visionTitle?: string;
  vision: string;
  experience: string;
  imageUrl: string;
  address?: string;
  phone?: string;
  expertise?: string[];
  isVisible: boolean;
}
