
import { Service, Testimonial, Message, ServiceCategory, ServiceSpecificField } from './types';

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'cat-gov', name: 'Government', description: 'Official government documentation and certificates.', color: 'blue' },
  { id: 'cat-dig', name: 'Digital', description: 'Online registrations, tax filing, and digital services.', color: 'green' },
  { id: 'cat-aca', name: 'Academic', description: 'School, college, and university related services.', color: 'orange' }
];

export const SERVICES: Service[] = [
  {
    id: 'pan-001',
    title: 'New PAN Card',
    description: 'Apply for fresh Permanent Account Number (PAN) with easy documentation.',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
    fee: 150,
    requiredDocs: ['Aadhar Card', 'Proof of Date of Birth', 'Passport Size Photo'],
    serviceSpecificFields: [
      { label: "Date of Birth", name: "dateOfBirth", type: "date", required: true },
      { label: "Father's Name", name: "fathersName", type: "text", required: true, placeholder: "As per official records" },
      { label: "Applicant Type", name: "applicantType", type: "select", required: true, options: ["Individual", "Minor", "Company", "Trust"] }
    ],
    category: 'Government',
    color: 'blue',
    estimatedDays: '10-15 working days'
  },
  {
    id: 'voter-001',
    title: 'Voter ID Card',
    description: 'New Voter Registration or Correction in existing Voter ID card.',
    image: 'https://images.unsplash.com/photo-1623282033815-40b05d96c903?auto=format&fit=crop&q=80&w=400',
    fee: 100,
    requiredDocs: ['Aadhar Card', 'Address Proof', 'Age Proof'],
    serviceSpecificFields: [
      { label: "Date of Birth", name: "dateOfBirth", type: "date", required: true },
      { label: "Gender", name: "gender", type: "select", required: true, options: ["Male", "Female", "Other"] },
      { label: "Father's / Husband's Name", name: "relativeName", type: "text", required: true, placeholder: "Father's or Husband's full name" }
    ],
    category: 'Government',
    color: 'green',
    estimatedDays: '20-30 working days'
  },
  {
    id: 'pass-001',
    title: 'Passport Service',
    description: 'Fresh Passport application, Renewal, and PCC services assistance.',
    image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?auto=format&fit=crop&q=80&w=400',
    fee: 500,
    requiredDocs: ['Aadhar Card', 'High School Marksheet', 'Electricity Bill'],
    serviceSpecificFields: [
      { label: "Date of Birth", name: "dateOfBirth", type: "date", required: true },
      { label: "Place of Birth", name: "placeOfBirth", type: "text", required: true, placeholder: "City, State, Country" },
      { label: "Passport Type", name: "passportType", type: "select", required: true, options: ["Fresh Application", "Renewal", "Police Clearance Certificate"] }
    ],
    category: 'Government',
    color: 'orange',
    estimatedDays: '15-20 working days'
  },
  {
    id: 'itr-001',
    title: 'ITR Filing',
    description: 'Income Tax Return filing for Salaried and Business individuals.',
    image: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=400',
    fee: 999,
    requiredDocs: ['Form 16', 'PAN Card', 'Bank Statement'],
    serviceSpecificFields: [
      { label: "PAN Number", name: "panNumber", type: "text", required: true, placeholder: "e.g. ABCDE1234F" },
      { label: "Assessment Year", name: "assessmentYear", type: "select", required: true, options: ["2023-24", "2024-25", "2025-26"] },
      { label: "Filing Type", name: "filingType", type: "select", required: true, options: ["Salaried Employee", "Business / Self Employed", "Senior Citizen"] }
    ],
    category: 'Digital',
    color: 'red',
    estimatedDays: '2-3 working days'
  },
  {
    id: 'domicile-001',
    title: 'Domicile Certificate',
    description: 'State residence proof for education and government job purposes.',
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400',
    fee: 80,
    requiredDocs: ['Aadhar Card', 'Voter ID', 'Ration Card'],
    serviceSpecificFields: [
      { label: "Purpose of Certificate", name: "purpose", type: "select", required: true, options: ["Education", "Government Job", "Scholarship", "Other"] },
      { label: "Duration of Residence (Years)", name: "residenceYears", type: "number", required: true, placeholder: "Number of years in Delhi" }
    ],
    category: 'Government',
    color: 'blue',
    estimatedDays: '15-20 working days'
  },
  {
    id: 'gst-001',
    title: 'GST Registration',
    description: 'New GST Registration and Monthly Return Filing services.',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=400',
    fee: 1500,
    requiredDocs: ['PAN Card', 'Electricity Bill', 'NOC from Owner'],
    serviceSpecificFields: [
      { label: "Business Name", name: "businessName", type: "text", required: true, placeholder: "Registered business / firm name" },
      { label: "Business Type", name: "businessType", type: "select", required: true, options: ["Proprietorship", "Partnership", "Private Limited", "LLP", "Trust / NGO"] },
      { label: "PAN Number", name: "panNumber", type: "text", required: true, placeholder: "Business or Proprietor PAN" }
    ],
    category: 'Digital',
    color: 'green',
    estimatedDays: '7-10 working days'
  },
  {
    id: 'aadhaar-001',
    title: 'Aadhaar Correction',
    description: 'Update name, address, or mobile in your Aadhaar card easily.',
    image: 'https://images.unsplash.com/photo-1633526543814-9718c8922b7a?auto=format&fit=crop&q=80&w=400',
    fee: 50,
    requiredDocs: ['Aadhar Card', 'Supportive Proof'],
    serviceSpecificFields: [
      { label: "Aadhaar Number (Last 4 digits)", name: "aadhaarLast4", type: "number", required: true, placeholder: "Last 4 digits only" },
      { label: "Correction Type", name: "correctionType", type: "select", required: true, options: ["Name Correction", "Address Update", "Mobile Number Update", "Date of Birth", "Gender Correction"] }
    ],
    category: 'Government',
    color: 'blue',
    estimatedDays: '5-10 working days'
  },
  {
    id: 'driving-001',
    title: 'Driving License',
    description: 'Apply for Learning or Permanent Driving License online.',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=400',
    fee: 300,
    requiredDocs: ['Aadhar Card', 'Blood Group Report', 'Photo'],
    serviceSpecificFields: [
      { label: "Date of Birth", name: "dateOfBirth", type: "date", required: true },
      { label: "Blood Group", name: "bloodGroup", type: "select", required: true, options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
      { label: "License Type", name: "licenseType", type: "select", required: true, options: ["Learning License", "Permanent License", "International Driving Permit"] },
      { label: "Vehicle Class", name: "vehicleClass", type: "select", required: true, options: ["Two Wheeler", "Four Wheeler", "Two & Four Wheeler", "Commercial"] }
    ],
    category: 'Government',
    color: 'orange',
    estimatedDays: '30-45 working days'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Kavita Devi',
    comment: 'I got my ration card updated without any issues. The service was very smooth and professional.',
    designation: 'Homemaker',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    rating: 5,
    status: true,
    display_order: 1
  },
  {
    id: '2',
    name: 'Sanjay Kumar',
    comment: 'I received my PM Kisan installment on time, thanks to their timely support and guidance.',
    designation: 'Farmer',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    rating: 5,
    status: true,
    display_order: 2
  },
  {
    id: '3',
    name: 'Pushpa Rani',
    comment: 'Digital Cyber Cafe made it so easy to apply for my scholarship. The process was fast and the staff was very helpful!',
    designation: 'Make-up Artist',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    rating: 5,
    status: true,
    display_order: 3
  }
];

export const MESSAGES: any[] = [
  {
    id: '1',
    title: 'HAPPY DIWALI ✨ OFFERS',
    description: 'दिवाली के इस अवसर पर हर फ़ॉर्म अभी ₹50 की छूट में भरें। यह ऑफ़र केवल सीमित दिनों के लिए मान्य है।',
    icon: '🪔',
    badge: 'LIVE',
    active: true,
    status: true,
    type: 'Special'
  },
  {
    id: '2',
    title: 'TODAY OFFER ! PAN CARD MADE ₹199 ONLY',
    description: 'आज ही PAN Card apply करें, सिर्फ ₹199 में। सीमित समय के लिए ऑफर है। जल्द आवेदन करें।',
    icon: '🪪',
    badge: 'LIVE',
    active: true,
    status: true,
    type: 'Important'
  }
];

export const CAROUSEL_IMAGES = [
  'https://picsum.photos/seed/cafe1/1200/500',
  'https://picsum.photos/seed/cafe2/1200/500',
  'https://picsum.photos/seed/cafe3/1200/500',
  'https://picsum.photos/seed/cafe4/1200/500'
];
