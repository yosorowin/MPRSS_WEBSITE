export const mockUsers = {
  admin: {
    id: "admin-1",
    email: "admin@mprss.com",
    password: "admin123",
    role: "admin",
    name: "Admin User",
  },
};
export const mockCustomers = [
  {
    id: "cust-1",
    name: "Carlos Reyes",
    email: "carlos.reyes@gmail.com",
    mobile: "+639171234567",
    registeredDate: "2024-01-15",
    motorcycles: [
      {
        id: "m1",
        brand: "Honda",
        model: "CBR600RR",
        year: 2022,
        plate: "ABC-123",
      },
    ],
    serviceHistory: 12,
    totalSpent: 212500,
    serviceHistoryDetails: [
      {
        id: "sh-1",
        date: "2026-03-15",
        serviceType: "Tire Replacement",
        amount: 22500,
      },
      {
        id: "sh-2",
        date: "2026-02-10",
        serviceType: "Oil Change",
        amount: 7500,
      },
      {
        id: "sh-3",
        date: "2026-01-20",
        serviceType: "Brake Service",
        amount: 12000,
      },
    ],
  },

  {
    id: "cust-2",
    name: "Angela Santos",
    email: "angela.santos@gmail.com",
    mobile: "+639181234567",
    registeredDate: "2024-02-20",
    motorcycles: [
      {
        id: "m2",
        brand: "Yamaha",
        model: "R1",
        year: 2023,
        plate: "XYZ-789",
      },
    ],
    serviceHistory: 8,
    totalSpent: 155000,
    serviceHistoryDetails: [
      {
        id: "sh-4",
        date: "2026-03-10",
        serviceType: "Chain Service",
        amount: 8000,
      },
      {
        id: "sh-5",
        date: "2026-02-05",
        serviceType: "Engine Tune-up",
        amount: 15000,
      },
    ],
  },

  {
    id: "cust-3",
    name: "Miguel Dela Cruz",
    email: "miguel.delacruz@gmail.com",
    mobile: "+639191234567",
    registeredDate: "2023-11-10",
    motorcycles: [
      {
        id: "m3",
        brand: "Kawasaki",
        model: "Ninja ZX-10R",
        year: 2021,
        plate: "DEF-456",
      },
    ],
    serviceHistory: 15,
    totalSpent: 289000,
    serviceHistoryDetails: [
      {
        id: "sh-6",
        date: "2026-03-12",
        serviceType: "Full Service",
        amount: 25000,
      },
      {
        id: "sh-7",
        date: "2026-02-15",
        serviceType: "Brake Replacement",
        amount: 18000,
      },
      {
        id: "sh-8",
        date: "2026-01-18",
        serviceType: "Oil Change",
        amount: 7500,
      },
    ],
  },
];

export const mockAISafetyAlerts = [
  {
    id: "alert-1",
    customerId: "cust-2",
    customerName: "Angela Santos",
    motorcycleId: "m2",
    motorcycle: "Yamaha R1",
    modification: "Aftermarket ECU Flash + Turbo Kit",
    riskLevel: "DANGEROUS",
    aiRecommendation:
      "This combination can lead to engine failure. Stock ECU not designed for forced induction. Recommend professional dyno tuning and engine reinforcement.",
    status: "New",
    createdDate: "2026-03-22",
    autoNotified: true,
  },
  {
    id: "alert-2",
    customerId: "cust-1",
    customerName: "Carlos Reyes",
    motorcycleId: "m1",
    motorcycle: "Honda CBR600RR",
    modification: "Aftermarket Brake Lines",
    riskLevel: "WARNING",
    aiRecommendation:
      "Ensure proper installation and bleeding. Incorrect installation can compromise braking performance.",
    status: "Under Review",
    createdDate: "2026-03-20",
    autoNotified: false,
  },
  {
    id: "alert-3",
    customerId: "cust-3",
    customerName: "Miguel Dela Cruz",
    motorcycleId: "m3",
    motorcycle: "Kawasaki Ninja ZX-10R",
    modification: "Suspension Lowering Kit",
    riskLevel: "WARNING",
    aiRecommendation:
      "May affect handling and ground clearance. Consider professional installation and test ride.",
    status: "Resolved",
    createdDate: "2026-03-18",
    autoNotified: false,
  },
];

export const mockCompletedServices = [
  {
    id: "srv-comp-1",
    customerId: "cust-1",
    customerName: "Carlos Reyes",
    motorcycleId: "m1",
    motorcycle: "Honda CBR600RR",
    serviceType: "Tire Replacement",
    completedDate: "2026-03-15",
    cost: 450,
    partsUsed: ["Front Tire", "Rear Tire"],
    rating: 5,
    feedback: "Excellent service!",
  },
];

export const mockInventory = [
  {
    id: "part-1",
    name: "Engine Oil 10W-40",
    brand: "Motul",
    category: "Lubricants",
    quantity: 45,
    minStock: 20,
    price: 25,
    compatibleModels: ["All Models"],
    visibleToCustomers: true,
    safetyNotes: "",
  },
  {
    id: "part-2",
    name: "Brake Pads - Front",
    brand: "Brembo",
    category: "Brake System",
    quantity: 8,
    minStock: 10,
    price: 85,
    compatibleModels: ["CBR600RR", "R1", "ZX-10R"],
    visibleToCustomers: true,
    safetyNotes: "Critical safety component",
  },
  {
    id: "part-3",
    name: "Air Filter",
    brand: "K&N",
    category: "Engine",
    quantity: 15,
    minStock: 10,
    price: 35,
    compatibleModels: ["All Models"],
    visibleToCustomers: true,
    safetyNotes: "",
  },
  {
    id: "part-4",
    name: "Chain Lubricant",
    brand: "Motul",
    category: "Lubricants",
    quantity: 5,
    minStock: 15,
    price: 18,
    compatibleModels: ["All Models"],
    visibleToCustomers: true,
    safetyNotes: "",
  },
  {
    id: "part-5",
    name: "Spark Plugs (Set of 4)",
    brand: "NGK",
    category: "Engine",
    quantity: 12,
    minStock: 8,
    price: 48,
    compatibleModels: ["CBR600RR", "R1"],
    visibleToCustomers: true,
    safetyNotes: "",
  },
];

export const mockActiveServices = [
  {
    id: "srv-1",
    customerId: "cust-3",
    customerName: "Miguel Dela Cruz",
    motorcycleId: "m3",
    motorcycle: "Kawasaki Ninja ZX-10R",
    serviceType: "Oil Change & Filter",
    requestDate: "2026-03-20",
    assignedStaff: "Juan Dela Cruz",
    estimatedCost: 150,
    estimatedTime: "2 hours",
    status: "In Progress",
    notes: "Customer requested synthetic oil",
    paymentMethod: "gcash",
    paymentStatus: "confirmed",
    paymentDate: "2026-03-20",
  },
  {
    id: "srv-2",
    customerId: "cust-1",
    customerName: "Carlos Reyes",
    motorcycleId: "m1",
    motorcycle: "Honda CBR600RR",
    serviceType: "Chain Adjustment",
    requestDate: "2026-03-19",
    assignedStaff: "Maria Santos",
    estimatedCost: 80,
    estimatedTime: "1 hour",
    status: "Waiting for Parts",
    notes: "Need to order new chain",
    paymentMethod: "cash",
    paymentStatus: "pending",
    paymentDate: "2026-03-19",
  },
  {
    id: "srv-3",
    customerId: "cust-2",
    customerName: "Angela Santos",
    motorcycleId: "m2",
    motorcycle: "Yamaha R1",
    serviceType: "Full Service",
    requestDate: "2026-03-18",
    assignedStaff: "Pedro Garcia",
    estimatedCost: 350,
    estimatedTime: "4 hours",
    status: "In Progress",
    notes: "Complete inspection and service",
    paymentMethod: "bank",
    paymentStatus: "awaiting_confirmation",
    paymentDate: "2026-03-18",
  },
];

export const mockServiceRequests = [
  {
    id: "req-1",
    customerId: "cust-1",
    customerName: "Carlos Reyes",
    motorcycleId: "m1",
    motorcycle: "Honda CBR600RR",
    serviceType: "Engine Tune-up",
    preferredDate: "2026-03-25",
    preferredTime: "10:00 AM",
    issueDescription: "Engine making unusual noise at high RPM",
    status: "pending",
    requestDate: "2026-03-22",
    paymentMethod: "gcash",
    paymentStatus: "awaiting_confirmation",
    paymentDate: "2026-03-22",
    estimatedCost: 300,
  },
  {
    id: "req-2",
    customerId: "cust-2",
    customerName: "Angela Santos",
    motorcycleId: "m2",
    motorcycle: "Yamaha R1",
    serviceType: "Brake Service",
    preferredDate: "2026-03-26",
    preferredTime: "2:00 PM",
    issueDescription: "Front brake feels soft",
    status: "pending",
    requestDate: "2026-03-21",
    paymentMethod: "bank",
    paymentStatus: "awaiting_confirmation",
    paymentDate: "2026-03-21",
    estimatedCost: 240,
  },
  {
    id: "req-3",
    customerId: "cust-3",
    customerName: "Miguel Dela Cruz",
    motorcycleId: "m3",
    motorcycle: "Kawasaki Ninja ZX-10R",
    serviceType: "Chain Maintenance",
    preferredDate: "2026-03-28",
    preferredTime: "3:00 PM",
    issueDescription: "Chain needs adjustment and lubrication",
    status: "pending",
    requestDate: "2026-03-23",
    paymentMethod: "cash",
    paymentStatus: "pending",
    paymentDate: "2026-03-23",
    estimatedCost: 100,
  },
];

export const mockShopSchedule = {
  dailyCapacity: 5,

  timeSlots: [
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM",
  ],

  bookedSlots: {
    "2026-05-20": {
      "10:00 AM": 5,
      "11:00 AM": 3,
      "2:00 PM": 4,
      "3:00 PM": 5,
    },

    "2026-05-21": {
      "10:00 AM": 2,
      "1:00 PM": 5,
    },
  },
};

export const mockMessages = [
  {
    id: "msg-1",
    customerId: "cust-1",
    customerName: "Carlos Reyes",
    unread: 2,
    messages: [
      {
        sender: "customer",
        text: "Hi, I wanted to ask about my motorcycle service request.",
        timestamp: "09:15",
      },
      {
        sender: "admin",
        text: "Hello Carlos! Sure, how can I help you?",
        timestamp: "09:18",
      },
      {
        sender: "customer",
        text: "Can you confirm if my service schedule is available?",
        timestamp: "09:20",
      },
    ],
  },
  {
    id: "msg-2",
    customerId: "cust-2",
    customerName: "Angela Santos",
    unread: 1,
    messages: [
      {
        sender: "customer",
        text: "Good morning. Is my motorcycle ready for pickup?",
        timestamp: "10:05",
      },
      {
        sender: "admin",
        text: "Good morning, Angela. We are currently finishing the service.",
        timestamp: "10:12",
      },
    ],
  },
  {
    id: "msg-3",
    customerId: "cust-3",
    customerName: "Miguel Dela Cruz",
    unread: 0,
    messages: [
      {
        sender: "customer",
        text: "Do you have an update regarding the replacement chain?",
        timestamp: "14:30",
      },
      {
        sender: "admin",
        text: "Yes. The replacement part has been requested and we will update you once it arrives.",
        timestamp: "14:45",
      },
    ],
  },
];

export const mockFeedback = [
  {
    id: "fb-1",
    serviceId: "srv-comp-1",
    customerId: "cust-1",
    customerName: "Carlos Reyes",
    serviceType: "Tire Replacement",
    rating: 5,
    comment: "Excellent service! Very professional and quick.",
    date: "2026-03-15",
  },
  {
    id: "fb-2",
    serviceId: "srv-comp-2",
    customerId: "cust-3",
    customerName: "Miguel Dela Cruz",
    serviceType: "Engine Maintenance",
    rating: 4,
    comment: "Good work, but took a bit longer than expected.",
    date: "2026-03-14",
  },
  {
    id: "fb-3",
    serviceId: "srv-comp-3",
    customerId: "cust-2",
    customerName: "Angela Santos",
    serviceType: "Chain Replacement",
    rating: 5,
    comment: "Fast and efficient. Highly recommend!",
    date: "2026-03-12",
  },
];

export const mockCommunityBuilds = [
  {
    id: "cb-1",
    userId: "cust-2",
    userName: "Angela Santos",
    motorcycleBrand: "Honda",
    motorcycleModel: "CBR600RR",
    motorcycleYear: 2022,
    buildGoal: "Performance",
    parts: [
      {
        name: "Akrapovic Exhaust System",
        category: "Exhaust",
      },
      {
        name: "K&N Air Filter",
        category: "Air Intake",
      },
      {
        name: "ECU Flash Tune",
        category: "Electronics",
      },
      {
        name: "Race Brake Pads",
        category: "Brakes",
      },
    ],
    compatibilityScore: 95,
    safetyNotes:
      "Ensure proper ECU tuning after exhaust installation. Brake upgrade recommended for increased power.",
    dateShared: "2026-03-15",
    upvotes: 124,
    downvotes: 8,
    comments: [
      {
        id: "c1",
        userId: "cust-3",
        userName: "Miguel Dela Cruz",
        text: "Great build! How much HP gain did you see?",
        timestamp: "2026-03-16 10:30",
      },
      {
        id: "c2",
        userId: "cust-2",
        userName: "Angela Santos",
        text: "Around 12-15hp at the wheel!",
        timestamp: "2026-03-16 11:20",
      },
    ],
    description:
      "Track-focused performance build with emphasis on power delivery and braking.",
    estimatedCost: 85000,
    difficultyLevel: "Advanced",
  },

  {
    id: "cb-2",
    userId: "cust-3",
    userName: "Miguel Dela Cruz",
    motorcycleBrand: "Yamaha",
    motorcycleModel: "R1",
    motorcycleYear: 2023,
    buildGoal: "Aesthetic",
    parts: [
      {
        name: "LED Headlight Kit",
        category: "Lighting",
      },
      {
        name: "Custom Paint Job",
        category: "Body",
      },
      {
        name: "Carbon Fiber Tank Pad",
        category: "Body",
      },
      {
        name: "Smoked Windscreen",
        category: "Body",
      },
    ],
    compatibilityScore: 98,
    safetyNotes:
      "Ensure LED headlights are DOT approved for street use.",
    dateShared: "2026-03-18",
    upvotes: 89,
    downvotes: 3,
    comments: [
      {
        id: "c3",
        userId: "cust-1",
        userName: "Carlos Reyes",
        text: "Looks amazing! Where did you get the paint done?",
        timestamp: "2026-03-19 14:15",
      },
    ],
    description:
      "Clean aesthetic build focusing on visual appeal while maintaining functionality.",
    estimatedCost: 45000,
    difficultyLevel: "Intermediate",
  },

  {
    id: "cb-3",
    userId: "cust-1",
    userName: "Carlos Reyes",
    motorcycleBrand: "Kawasaki",
    motorcycleModel: "Ninja ZX-10R",
    motorcycleYear: 2021,
    buildGoal: "Safety",
    parts: [
      {
        name: "ABS Brake System Upgrade",
        category: "Brakes",
      },
      {
        name: "Frame Sliders",
        category: "Protection",
      },
      {
        name: "LED Turn Signals",
        category: "Lighting",
      },
      {
        name: "Grip Heaters",
        category: "Comfort",
      },
    ],
    compatibilityScore: 100,
    safetyNotes:
      "All parts meet safety standards. Professional installation recommended for ABS system.",
    dateShared: "2026-03-20",
    upvotes: 156,
    downvotes: 2,
    comments: [
      {
        id: "c4",
        userId: "cust-2",
        userName: "Angela Santos",
        text: "Safety first! Great choices.",
        timestamp: "2026-03-21 09:00",
      },
      {
        id: "c5",
        userId: "cust-3",
        userName: "Miguel Dela Cruz",
        text: "How much did the ABS upgrade cost?",
        timestamp: "2026-03-21 10:45",
      },
      {
        id: "c6",
        userId: "cust-1",
        userName: "Carlos Reyes",
        text: "About 35k including installation",
        timestamp: "2026-03-21 11:30",
      },
    ],
    description:
      "Comprehensive safety upgrade package for street and touring riders.",
    estimatedCost: 62000,
    difficultyLevel: "Advanced",
  },

  {
    id: "cb-4",
    userId: "cust-4",
    userName: "Patricia Mendoza",
    motorcycleBrand: "Honda",
    motorcycleModel: "CB500X",
    motorcycleYear: 2023,
    buildGoal: "Performance",
    parts: [
      {
        name: "Slip-On Exhaust",
        category: "Exhaust",
      },
      {
        name: "High-Flow Air Filter",
        category: "Air Intake",
      },
      {
        name: "Fuel Controller",
        category: "Electronics",
      },
    ],
    compatibilityScore: 92,
    safetyNotes:
      "Fuel controller required for proper air/fuel ratio after intake and exhaust mods.",
    dateShared: "2026-03-12",
    upvotes: 67,
    downvotes: 5,
    comments: [],
    description:
      "Budget-friendly performance upgrades for the CB500X adventure bike.",
    estimatedCost: 28000,
    difficultyLevel: "Beginner",
  },

  {
    id: "cb-5",
    userId: "cust-5",
    userName: "Marco Villanueva",
    motorcycleBrand: "Suzuki",
    motorcycleModel: "GSX-R750",
    motorcycleYear: 2022,
    buildGoal: "Performance",
    parts: [
      {
        name: "Racing Suspension Kit",
        category: "Suspension",
      },
      {
        name: "Lightweight Battery",
        category: "Electronics",
      },
      {
        name: "Quick Shifter",
        category: "Transmission",
      },
      {
        name: "Titanium Exhaust",
        category: "Exhaust",
      },
    ],
    compatibilityScore: 88,
    safetyNotes:
      "Suspension setup requires professional tuning. Quick shifter needs ECU compatibility check.",
    dateShared: "2026-03-10",
    upvotes: 201,
    downvotes: 12,
    comments: [
      {
        id: "c7",
        userId: "cust-1",
        userName: "Carlos Reyes",
        text: "That titanium exhaust must sound incredible!",
        timestamp: "2026-03-11 16:20",
      },
    ],
    description:
      "Race-spec build designed for track days with focus on weight reduction and handling.",
    estimatedCost: 125000,
    difficultyLevel: "Advanced",
  },
];