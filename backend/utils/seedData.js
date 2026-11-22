require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const FeeInvoice = require('../models/FeeInvoice');
const Payment = require('../models/Payment');
const Menu = require('../models/Menu');
const Complaint = require('../models/Complaint');
const Rebate = require('../models/Rebate');
const MealAttendance = require('../models/MealAttendance');
const Notification = require('../models/Notification');
const connectDB = require('../config/db');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed]: Cleaning existing collections...');

    await User.deleteMany({});
    await FeeInvoice.deleteMany({});
    await Payment.deleteMany({});
    await Menu.deleteMany({});
    await Complaint.deleteMany({});
    await Rebate.deleteMany({});
    await MealAttendance.deleteMany({});
    await Notification.deleteMany({});

    console.log('[Seed]: Creating Users & Students...');

    // 1. Admin & Staff
    const admin = await User.create({
      name: 'Ramesh Sharma (Mess Bhaiya)',
      email: 'bhaiya@smartmess.in',
      password: 'password123',
      role: 'admin',
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      hostelBlock: 'Mess Admin Office',
      roomNumber: 'Office 1',
      bedNumber: 'Desk-A',
      dietPreference: 'Veg',
      studentId: 'STAFF-01',
      messStatus: 'Active',
      balanceDue: 0,
      monthlyMessPlan: 0,
    });

    const warden = await User.create({
      name: 'Prof. K. N. Verma (Mess Warden)',
      email: 'warden@smartmess.in',
      password: 'password123',
      role: 'staff',
      phone: '+91 98111 22334',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      hostelBlock: 'Warden Office',
      roomNumber: 'Office 2',
      bedNumber: 'Desk-B',
      dietPreference: 'Veg',
      studentId: 'WARDEN-01',
      messStatus: 'Active',
      balanceDue: 0,
      monthlyMessPlan: 0,
    });

    // 2. Students
    const student1 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@student.in',
      password: 'password123',
      role: 'student',
      phone: '+91 98234 56789',
      studentId: 'SM-2024-001',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
      hostelName: 'Tagore Central Boys Hostel',
      blockFloor: 'Block A / 2nd Floor',
      hostelBlock: 'Block A',
      roomNumber: '204',
      bedNumber: 'Bed-A',
      dietPreference: 'Veg',
      messStatus: 'Active',
      balanceDue: 3800,
      monthlyMessPlan: 3800,
    });

    const student2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@student.in',
      password: 'password123',
      role: 'student',
      phone: '+91 98456 78901',
      studentId: 'SM-2024-042',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      hostelName: 'Sarojini Naidu Girls Hostel',
      blockFloor: 'Block B / 3rd Floor',
      hostelBlock: 'Girls Hostel 1',
      roomNumber: '312',
      bedNumber: 'Bed-B',
      dietPreference: 'Veg',
      messStatus: 'Active',
      balanceDue: 0,
      monthlyMessPlan: 3800,
    });

    const student3 = await User.create({
      name: 'Aman Preet Singh',
      email: 'aman@student.in',
      password: 'password123',
      role: 'student',
      phone: '+91 99123 45678',
      studentId: 'SM-2024-118',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
      hostelName: 'Tagore Central Boys Hostel',
      blockFloor: 'Block B / 1st Floor',
      hostelBlock: 'Block B',
      roomNumber: '105',
      bedNumber: 'Bed-A',
      dietPreference: 'Non-Veg',
      messStatus: 'Active',
      balanceDue: 1800,
      monthlyMessPlan: 4200,
    });

    const student4 = await User.create({
      name: 'Sneha Jain',
      email: 'sneha@student.in',
      password: 'password123',
      role: 'student',
      phone: '+91 97890 12345',
      studentId: 'SM-2024-089',
      hostelBlock: 'Girls Hostel 1',
      roomNumber: '108',
      bedNumber: 'Bed-A',
      dietPreference: 'Jain',
      messStatus: 'On Leave',
      balanceDue: 0,
      monthlyMessPlan: 3800,
    });

    const student5 = await User.create({
      name: 'Vikram Aditya',
      email: 'vikram@student.in',
      password: 'password123',
      role: 'student',
      phone: '+91 96543 21098',
      studentId: 'SM-2024-150',
      hostelBlock: 'Block C',
      roomNumber: '401',
      bedNumber: 'Bed-C',
      dietPreference: 'Non-Veg',
      messStatus: 'Active',
      balanceDue: 3800,
      monthlyMessPlan: 3800,
    });

    console.log('[Seed]: Creating 7-Day Menus...');

    const weeklyMenus = [
      {
        dayOfWeek: 'Monday',
        breakfast: {
          items: ['Poha with Sev & Fried Peanuts', 'Green Chutney', 'Boiled Eggs / Sprouts', 'Adrak Masala Chai', 'Banana'],
          timing: '07:30 AM - 09:30 AM',
          isSpecial: false,
          calories: '450 kcal',
        },
        lunch: {
          items: ['Dal Tadka', 'Jeera Rice', 'Aloo Gobi Matar', 'Phulka Roti (Butter)', 'Boondi Raita', 'Green Salad'],
          timing: '12:30 PM - 02:30 PM',
          isSpecial: false,
          calories: '650 kcal',
        },
        snacks: {
          items: ['Crispy Veg Pakoda', 'Mint Chutney', 'Cutting Chai / Coffee', 'Marie Biscuits'],
          timing: '05:00 PM - 06:15 PM',
          isSpecial: false,
          calories: '260 kcal',
        },
        dinner: {
          items: ['Shahi Paneer (Veg) / Egg Bhurji', 'Panchmel Dal', 'Steamed Basmati Rice', 'Soft Rotis', 'Kheer (Payasam)'],
          timing: '08:00 PM - 10:00 PM',
          isSpecial: true,
          specialNote: 'Chef Special Kheer for Dinner',
          calories: '710 kcal',
        },
        averageRating: 4.4,
      },
      {
        dayOfWeek: 'Tuesday',
        breakfast: {
          items: ['Crispy Masala Dosa', 'Steamed Idli', 'Coconut Chutney & Tomato Chutney', 'Hot Sambar', 'Filter Coffee / Tea'],
          timing: '07:30 AM - 09:30 AM',
          isSpecial: true,
          specialNote: 'South Indian Breakfast Day',
          calories: '510 kcal',
        },
        lunch: {
          items: ['Rajma Masala (Punjabi Style)', 'Steamed Rice', 'Bhindi Do Pyaza', 'Tawa Roti', 'Cucumber Salad', 'Papad'],
          timing: '12:30 PM - 02:30 PM',
          isSpecial: false,
          calories: '680 kcal',
        },
        snacks: {
          items: ['Hot Veg Samosa (2 pcs)', 'Sweet Tamarind & Mint Chutney', 'Special Cardamom Tea'],
          timing: '05:00 PM - 06:15 PM',
          isSpecial: false,
          calories: '310 kcal',
        },
        dinner: {
          items: ['Lauki Chana Dal', 'Aloo Baingan Bharta', 'Tawa Roti', 'Lemon Rice', 'Custard with Fruits'],
          timing: '08:00 PM - 10:00 PM',
          isSpecial: false,
          calories: '590 kcal',
        },
        averageRating: 4.1,
      },
      {
        dayOfWeek: 'Wednesday',
        breakfast: {
          items: ['Aloo Paratha with White Butter', 'Fresh Curd (Dahi)', 'Mango Pickle', 'Bournvita / Milk / Tea'],
          timing: '07:30 AM - 09:30 AM',
          isSpecial: false,
          calories: '520 kcal',
        },
        lunch: {
          items: ['Kadhi Pakora', 'Khichdi / Jeera Rice', 'Sukhi Aloo Methi', 'Roti', 'Roasted Papad'],
          timing: '12:30 PM - 02:30 PM',
          isSpecial: false,
          calories: '620 kcal',
        },
        snacks: {
          items: ['Sweet Corn Chaat & Bhel Puri', 'Nimbu Paani / Masala Tea'],
          timing: '05:00 PM - 06:15 PM',
          isSpecial: false,
          calories: '220 kcal',
        },
        dinner: {
          items: ['Kadai Paneer (Veg) / Butter Chicken (Non-Veg)', 'Dal Makhani', 'Jeera Pulao', 'Butter Naan / Roti', 'Gulab Jamun (2 pcs)'],
          timing: '08:00 PM - 10:00 PM',
          isSpecial: true,
          specialNote: 'Mid-week Special Dinner Feast',
          calories: '780 kcal',
        },
        averageRating: 4.7,
      },
      {
        dayOfWeek: 'Thursday',
        breakfast: {
          items: ['Upma with Peanuts', 'Medu Vada (1 pc)', 'Coconut Chutney', 'Sambar', 'Tea / Milk'],
          timing: '07:30 AM - 09:30 AM',
          isSpecial: false,
          calories: '440 kcal',
        },
        lunch: {
          items: ['Chole Masala', 'Bhature (2 pcs) / Roti', 'Jeera Rice', 'Pickled Onions & Green Chilli', 'Mint Buttermilk (Chaas)'],
          timing: '12:30 PM - 02:30 PM',
          isSpecial: true,
          specialNote: 'Chole Bhature Day',
          calories: '750 kcal',
        },
        snacks: {
          items: ['Grilled Vegetable Sandwich (Green chutney & cheese)', 'Hot Coffee / Tea'],
          timing: '05:00 PM - 06:15 PM',
          isSpecial: false,
          calories: '290 kcal',
        },
        dinner: {
          items: ['Mix Veg Handi', 'Moong Dal Tadka', 'Plain Phulka', 'Matar Pulao', 'Fresh Fruit Salad'],
          timing: '08:00 PM - 10:00 PM',
          isSpecial: false,
          calories: '580 kcal',
        },
        averageRating: 4.3,
      },
      {
        dayOfWeek: 'Friday',
        breakfast: {
          items: ['Methi Thepla', 'Chhundo & Mixed Pickle', 'Boiled Eggs / Sprouts Chat', 'Ginger Tea'],
          timing: '07:30 AM - 09:30 AM',
          isSpecial: false,
          calories: '430 kcal',
        },
        lunch: {
          items: ['Dum Aloo Kashmiri', 'Arhar Dal Fry', 'Steamed Rice', 'Garlic Butter Roti', 'Onion Cucumber Raita'],
          timing: '12:30 PM - 02:30 PM',
          isSpecial: false,
          calories: '640 kcal',
        },
        snacks: {
          items: ['Aloo Tikki Chaat with Curd & Chutneys', 'Chai'],
          timing: '05:00 PM - 06:15 PM',
          isSpecial: false,
          calories: '270 kcal',
        },
        dinner: {
          items: ['Veg Biryani / Chicken Biryani', 'Mirchi Ka Salan', 'Burani Raita', 'Veg Manchurian Gravy', 'Ice Cream Scoop'],
          timing: '08:00 PM - 10:00 PM',
          isSpecial: true,
          specialNote: 'Friday Night Biryani Fest',
          calories: '760 kcal',
        },
        averageRating: 4.8,
      },
      {
        dayOfWeek: 'Saturday',
        breakfast: {
          items: ['Puri Bhaji (Halwai Style Aloo)', 'Pickle', 'Sweet Lassi / Milk / Tea'],
          timing: '08:00 AM - 10:00 AM',
          isSpecial: true,
          specialNote: 'Weekend Special Brunch Timings',
          calories: '580 kcal',
        },
        lunch: {
          items: ['Pav Bhaji with Extra Butter', 'Masala Pav (3 pcs)', 'Chopped Onions & Lemon', 'Pulao', 'Curd'],
          timing: '12:30 PM - 02:30 PM',
          isSpecial: true,
          calories: '690 kcal',
        },
        snacks: {
          items: ['Bread Pakoda with Green Chutney', 'Masala Chai'],
          timing: '05:00 PM - 06:15 PM',
          isSpecial: false,
          calories: '280 kcal',
        },
        dinner: {
          items: ['Paneer Tikka Masala', 'Yellow Dal Fry', 'Kashmiri Pulao', 'Butter Tawa Roti', 'Rasgulla (2 pcs)'],
          timing: '08:00 PM - 10:00 PM',
          isSpecial: false,
          calories: '670 kcal',
        },
        averageRating: 4.6,
      },
      {
        dayOfWeek: 'Sunday',
        breakfast: {
          items: ['Club Sandwich & French Fries / Bread Butter Jam', 'Boiled Eggs / Omelette', 'Banana & Apple', 'Filter Coffee / Tea'],
          timing: '08:00 AM - 10:30 AM',
          isSpecial: true,
          calories: '530 kcal',
        },
        lunch: {
          items: ['Grand Sunday Feast', 'Paneer Lababdar', 'Mutton Curry / Egg Curry (Special)', 'Dal Bukhara', 'Jeera Rice', 'Tandoori Roti', 'Rasmalai'],
          timing: '12:30 PM - 03:00 PM',
          isSpecial: true,
          specialNote: 'Weekly Grand Sunday Special Feast',
          calories: '850 kcal',
        },
        snacks: {
          items: ['Veg Cutlets / Samosa', 'Tomato Ketchup', 'Special Chai'],
          timing: '05:00 PM - 06:15 PM',
          isSpecial: false,
          calories: '240 kcal',
        },
        dinner: {
          items: ['Light Khichdi / Curd Rice', 'Aloo Jeera', 'Kadhi', 'Roti', 'Moong Dal Halwa'],
          timing: '08:00 PM - 10:00 PM',
          isSpecial: false,
          calories: '560 kcal',
        },
        averageRating: 4.9,
      },
    ];

    for (const menu of weeklyMenus) {
      await Menu.create(menu);
    }

    console.log('[Seed]: Creating Invoices & Payments...');

    // Invoices for Rahul
    await FeeInvoice.create({
      student: student1._id,
      month: 'November 2026',
      year: 2026,
      baseAmount: 3800,
      rebateDiscount: 0,
      totalAmount: 3800,
      paidAmount: 0,
      status: 'Pending',
      dueDate: new Date(2026, 10, 25),
      notes: 'Hostel mess dues for November 2026',
    });

    await FeeInvoice.create({
      student: student1._id,
      month: 'October 2026',
      year: 2026,
      baseAmount: 3800,
      rebateDiscount: 0,
      totalAmount: 3800,
      paidAmount: 3800,
      status: 'Paid',
      dueDate: new Date(2026, 9, 25),
      paidAt: new Date(2026, 9, 20),
      paymentMethod: 'Razorpay',
      transactionId: 'pay_NzkX92Klsdf01',
      receiptNumber: 'SM-REC-2026-10492',
      notes: 'Hostel mess dues for October 2026',
    });

    // Invoices for Priya (Fully paid)
    const priyaInv = await FeeInvoice.create({
      student: student2._id,
      month: 'November 2026',
      year: 2026,
      baseAmount: 3800,
      rebateDiscount: 0,
      totalAmount: 3800,
      paidAmount: 3800,
      status: 'Paid',
      dueDate: new Date(2026, 10, 25),
      paidAt: new Date(2026, 10, 5),
      paymentMethod: 'Razorpay',
      transactionId: 'pay_Olk93Mdsf301',
      receiptNumber: 'SM-REC-2026-11002',
    });

    await Payment.create({
      student: student2._id,
      invoice: priyaInv._id,
      amount: 3800,
      currency: 'INR',
      paymentMethod: 'Razorpay',
      razorpayPaymentId: 'pay_Olk93Mdsf301',
      status: 'successful',
      receiptNumber: 'SM-REC-2026-11002',
      paidAt: new Date(2026, 10, 5),
    });

    // Invoices for Aman Preet (Rebate deducted)
    await FeeInvoice.create({
      student: student3._id,
      month: 'November 2026',
      year: 2026,
      baseAmount: 4200,
      rebateDiscount: 500, // 4 days rebate @ 125
      totalAmount: 3700,
      paidAmount: 1900,
      status: 'Partial',
      dueDate: new Date(2026, 10, 25),
      paidAt: new Date(2026, 10, 10),
      paymentMethod: 'Cash',
      transactionId: 'CASH-REC-0091',
      receiptNumber: 'SM-MAN-2026-11041',
      notes: 'Paid ₹1900 cash to Mess Bhaiya. ₹1800 pending.',
    });

    // Invoices for Vikram
    await FeeInvoice.create({
      student: student5._id,
      month: 'November 2026',
      year: 2026,
      baseAmount: 3800,
      rebateDiscount: 0,
      totalAmount: 3800,
      paidAmount: 0,
      status: 'Pending',
      dueDate: new Date(2026, 10, 25),
    });

    console.log('[Seed]: Creating Complaints & Feedback...');

    await Complaint.create({
      ticketNumber: 'TKT-827101',
      student: student1._id,
      studentName: student1.name,
      studentRoom: 'Block A - 204',
      title: 'Water filter cooling not working in Mess Hall A',
      category: 'Utensils & Water',
      priority: 'High',
      status: 'In Progress',
      description: 'The cold water dispenser in Mess Hall A has not been chilling water since yesterday. Please inspect the compressor.',
      adminResponse: 'Electrician has been informed. Repair will be done by today 4 PM.',
    });

    await Complaint.create({
      ticketNumber: 'TKT-827102',
      student: student2._id,
      studentName: student2.name,
      studentRoom: 'Girls Hostel 1 - 312',
      title: 'Chapati hardness during dinner service',
      category: 'Food Quality',
      priority: 'Medium',
      status: 'Resolved',
      description: 'The chapatis served at 9:15 PM last night were brittle and cold. Can we ensure hot rotis are served in smaller batches?',
      adminResponse: 'Addressed with head cook. Fresh warm rotis will now be kept in insulated casseroles.',
      resolvedBy: admin._id,
      resolvedByName: admin.name,
      resolvedAt: new Date(),
    });

    await Complaint.create({
      ticketNumber: 'TKT-827103',
      student: student3._id,
      studentName: student3.name,
      studentRoom: 'Block B - 105',
      title: 'Request for Jain/Non-Spicy Counter during lunch',
      category: 'Food Quality',
      priority: 'Medium',
      status: 'Pending',
      description: 'Please keep mild/less spicy dal and boiled veggies option for students recovering from illness.',
    });

    console.log('[Seed]: Creating Mess Rebates...');

    await Rebate.create({
      rebateId: 'REB-719201',
      student: student3._id,
      studentName: student3.name,
      roomNumber: 'Block B 105',
      startDate: new Date(2026, 10, 1),
      endDate: new Date(2026, 10, 4),
      numberOfDays: 4,
      dailyRate: 125,
      totalRebateAmount: 500,
      reason: 'Home visit for festival (Diwali holidays)',
      status: 'Approved',
      reviewedBy: admin._id,
      adminNotes: 'Approved and ₹500 credited to November bill.',
      reviewedAt: new Date(2026, 10, 2),
    });

    await Rebate.create({
      rebateId: 'REB-719202',
      student: student1._id,
      studentName: student1.name,
      roomNumber: 'Block A 204',
      startDate: new Date(2026, 10, 20),
      endDate: new Date(2026, 10, 23),
      numberOfDays: 4,
      dailyRate: 125,
      totalRebateAmount: 500,
      reason: 'Attending National Hackathon at IIT Delhi',
      status: 'Pending',
    });

    console.log('[Seed]: Creating Attendance & Meal Tokens for today...');

    const todayStr = new Date().toISOString().split('T')[0];
    await MealAttendance.create({
      student: student1._id,
      studentName: student1.name,
      studentId: student1.studentId,
      roomNumber: student1.roomNumber,
      hostelBlock: student1.hostelBlock,
      date: todayStr,
      mealType: 'breakfast',
      passToken: `PASS-${student1._id.toString().slice(-4)}-BRE-${todayStr}`,
      scanned: true,
      scannedAt: new Date(),
    });

    await MealAttendance.create({
      student: student2._id,
      studentName: student2.name,
      studentId: student2.studentId,
      roomNumber: student2.roomNumber,
      hostelBlock: student2.hostelBlock,
      date: todayStr,
      mealType: 'breakfast',
      passToken: `PASS-${student2._id.toString().slice(-4)}-BRE-${todayStr}`,
      scanned: true,
      scannedAt: new Date(),
    });

    await MealAttendance.create({
      student: student3._id,
      studentName: student3.name,
      studentId: student3.studentId,
      roomNumber: student3.roomNumber,
      hostelBlock: student3.hostelBlock,
      date: todayStr,
      mealType: 'breakfast',
      passToken: `PASS-${student3._id.toString().slice(-4)}-BRE-${todayStr}`,
      scanned: true,
      scannedAt: new Date(),
    });

    console.log('[Seed]: Creating Notifications...');

    await Notification.create({
      targetRole: 'all',
      title: 'Special Sunday Feast Tomorrow!',
      message: 'Grand Sunday Feast includes Paneer Lababdar, Dum Biryani, and Gulab Jamun. Mess timings: 12:30 PM - 03:00 PM.',
      type: 'menu',
      priority: 'high',
      link: '/menu',
    });

    await Notification.create({
      targetRole: 'student',
      title: 'Mess Bill Dues for November 2026',
      message: 'Kindly clear your mess fee bill before the 25th of November to avoid late fine (₹50/week).',
      type: 'fee',
      priority: 'urgent',
      link: '/fees',
    });

    await Notification.create({
      recipient: student1._id,
      targetRole: 'student',
      title: 'Complaint Update on Water Filter',
      message: 'Your complaint regarding Mess Hall A water filter is marked In Progress. Technician has arrived.',
      type: 'complaint',
      priority: 'normal',
      link: '/complaints',
    });

    console.log('[Seed]: Database successfully seeded with rich mock data!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
