export const translations = {
  en: {
    title: "GramSetu",
    subtitle: "Your Complaint, Our Resolve. (Empowering villagers, resolving complaints transparently)",
    citizenDash: "Citizen Dashboard",
    adminDash: "Sarpanch Admin Dashboard",
    deptDash: "Department Dashboard",
    submitNew: "Submit Grievance",
    trackStatus: "Track Complaint",
    voiceInput: "Voice Input (Hindi/English)",
    offlineKiosk: "Offline Kiosk Mode (Queue Offline, Syncs when Online)",
    name: "Name",
    mobile: "Mobile Number",
    village: "Village Name",
    desc: "Describe your issue",
    photo: "Attach Photo / Document (Optional)",
    submit: "Submit Complaint",
    trackingId: "Complaint ID",
    status: "Current Status",
    submitted: "Submitted",
    inProcess: "In Process",
    resolved: "Resolved",
    comments: "Departmental Updates & Comments",
    feedback: "Grievance Resolution Feedback",
    rateUs: "How would you rate the resolution quality?",
    submitFeedback: "Submit Feedback",
    adminActions: "Admin & Allocation Actions",
    deptClean: "Cleaning & Sanitation",
    deptWater: "Water Supply",
    deptElec: "Electricity & Lights",
    deptRoad: "Roads & Paths",
    exportData: "Export Analytics Report",
    assignedTo: "Assigned To",
    commentsHeading: "Internal/Public Comments",
    public: "Public",
    internal: "Internal",
    addComment: "Post Comment",
    logout: "Logout",
    login: "Sign In / Register",
    roleCitizen: "Villager (Citizen)",
    roleAdmin: "Sarpanch / Admin",
    roleDept: "Department Operator",
    authSubtitle: "Select your role to login or register",
    noComplaints: "No complaints found.",
    aiSuggested: "AI Suggested Department",
    downloadReceipt: "Download Receipt"
  },
  hi: {
    title: "ग्रामसेतु",
    subtitle: "आपकी शिकायत, हमारा संकल्प (ग्रामीणों का सशक्तिकरण, शिकायतों का पारदर्शी समाधान)",
    citizenDash: "नागरिक डैशबोर्ड",
    adminDash: "सरपंच / व्यवस्थापक डैशबोर्ड",
    deptDash: "विभाग डैशबोर्ड",
    submitNew: "शिकायत दर्ज करें",
    trackStatus: "शिकायत की स्थिति देखें",
    voiceInput: "आवाज इनपुट (हिंदी/अंग्रेजी)",
    offlineKiosk: "ऑफ़लाइन कियोस्क मोड (ऑफ़लाइन कतार, ऑनलाइन होने पर सिंक)",
    name: "नाम",
    mobile: "मोबाइल नंबर",
    village: "गांव का नाम",
    desc: "अपनी समस्या का विवरण दें",
    photo: "फोटो / दस्तावेज संलग्न करें (वैकल्पिक)",
    submit: "शिकायत सबमिट करें",
    trackingId: "शिकायत संख्या (ID)",
    status: "वर्तमान स्थिति",
    submitted: "जमा किया गया",
    inProcess: "प्रक्रिया में",
    resolved: "समाधान हो गया",
    comments: "विभागीय अपडेट और टिप्पणियां",
    feedback: "शिकायत समाधान फीडबैक",
    rateUs: "आप समाधान की गुणवत्ता को कैसे रेट करेंगे?",
    submitFeedback: "प्रतिक्रिया सबमिट करें",
    adminActions: "प्रशासनिक कार्य",
    deptClean: "सफाई एवं स्वच्छता",
    deptWater: "जलापूर्ति",
    deptElec: "बिजली और लाइट",
    deptRoad: "सड़कें और रास्ते",
    exportData: "एनालिटिक्स रिपोर्ट निर्यात करें",
    assignedTo: "सौंपा गया",
    commentsHeading: "आंतरिक/सार्वजनिक टिप्पणियां",
    public: "सार्वजनिक",
    internal: "आंतरिक",
    addComment: "टिप्पणी पोस्ट करें",
    logout: "लॉगआउट",
    login: "साइन इन / रजिस्टर",
    roleCitizen: "ग्रामीण (नागरिक)",
    roleAdmin: "सरपंच / व्यवस्थापक",
    roleDept: "विभाग ऑपरेटर",
    authSubtitle: "लॉगिन या पंजीकरण करने के लिए अपनी भूमिका चुनें",
    noComplaints: "कोई शिकायत नहीं मिली।",
    aiSuggested: "एआई द्वारा सुझाया गया विभाग",
    downloadReceipt: "रसीद डाउनलोड करें"
  }
};

export const keywords = {
  electricity: ['light', 'bijli', 'power', 'wire', 'transformer', 'electricity', 'meter', 'current', 'spark', 'blackout', 'shading', 'pole', 'खंभा', 'बिजली', 'तार'],
  water: ['water', 'pani', 'leakage', 'tap', 'well', 'tanker', 'pipeline', 'dirty', 'borewell', 'पानी', 'नजला', 'नल', 'कुआं', 'टैंकर'],
  roads: ['road', 'sadak', 'pothole', 'street', 'highway', 'gaddha', 'bridge', 'pavement', 'सड़क', 'गड्ढा', 'रास्ता'],
  cleaning: ['garbage', 'kachra', 'drainage', 'cleaning', 'waste', 'dump', 'smell', 'mosquito', 'safai', 'litter', 'dustbin', 'sweep', 'गंदगी', 'कचरा', 'सफाई', 'नाली']
};

export function classifyComplaint(description) {
  if (!description) return null;
  const text = description.toLowerCase();
  let maxScore = 0;
  let bestDept = null;
  for (const [dept, list] of Object.entries(keywords)) {
    let score = 0;
    for (const word of list) {
      if (text.includes(word)) score += 1;
    }
    if (score > maxScore) {
      maxScore = score;
      bestDept = dept;
    }
  }
  return bestDept;
}
