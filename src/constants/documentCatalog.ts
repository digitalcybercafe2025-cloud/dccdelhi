export interface DocumentConfigItem {
    name: string;
    required: boolean;
}

export interface ServiceDocumentConfig {
    subTypeKey: string;
    subTypeLabel: string;
    documents: DocumentConfigItem[];
}

export const MASTER_DOCUMENT_LIST: string[] = [
    'Passport Photo',
    'Aadhaar Card',
    'PAN Card',
    'Birth Certificate',
    'Electricity Bill',
    'Existing Voter ID',
    'Rent Agreement',
    '10th Marksheet',
    '12th Marksheet',
    'Ration Card',
    'Driving License',
    'Passport',
    'Bank Passbook',
    'Water Bill',
    'Gas Connection Bill',
    'Income Certificate',
    'Caste Certificate',
    'Domicile Certificate',
    'Signature',
    'Marriage Certificate',
    'Affidavit / Self Declaration',
    'FIR Copy (Lost)',
    'School Leaving Certificate',
    'Property Tax Receipt',
];

export const SUBTYPE_PRESETS: { key: string; label: string }[] = [
    { key: 'default', label: 'Default / All Applications' },
    { key: 'new', label: 'New (Form 6 / Fresh)' },
    { key: 'correction', label: 'Correction (Form 8 - General)' },
    { key: 'correction_name', label: 'Correction (Form 8 - Name)' },
    { key: 'correction_dob', label: 'Correction (Form 8 - DOB)' },
    { key: 'correction_address', label: 'Correction (Form 8 - Address)' },
    { key: 'correction_photo', label: 'Correction (Form 8 - Photo/Mobile)' },
    { key: 'correction_relation', label: 'Correction (Form 8 - Relation)' },
];

export const VOTER_CORRECTION_CATEGORIES: { key: string; label: string }[] = [
    { key: 'correction_name', label: 'Name' },
    { key: 'correction_dob', label: 'DOB' },
    { key: 'correction_address', label: 'Address' },
    { key: 'correction_photo', label: 'Photo/Mobile' },
    { key: 'correction_relation', label: 'Relation' },
];

export const INDIAN_STATES: string[] = [
    'Delhi',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry',
];
