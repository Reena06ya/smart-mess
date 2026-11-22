const Menu = require('../models/Menu');
const MenuSuggestion = require('../models/MenuSuggestion');
const Notification = require('../models/Notification');
const { recordAuditLog } = require('../utils/auditLogger');

// Helper to determine current active meal slot in IST
const getCurrentMealSlot = () => {
  // Current time in IST (UTC + 5:30)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 3600000 * 5.5);

  const hour = istDate.getHours();
  const minutes = istDate.getMinutes();
  const timeVal = hour * 60 + minutes;

  // 07:00 to 10:30 -> Breakfast
  if (timeVal >= 7 * 60 && timeVal < 10 * 60 + 30) {
    return { slot: 'breakfast', label: 'Breakfast', timing: '07:30 AM - 09:30 AM', nextMeal: 'lunch' };
  }
  // 11:30 to 15:00 -> Lunch
  if (timeVal >= 11 * 60 + 30 && timeVal < 15 * 60) {
    return { slot: 'lunch', label: 'Lunch', timing: '12:30 PM - 02:30 PM', nextMeal: 'snacks' };
  }
  // 16:30 to 18:30 -> Evening Snacks
  if (timeVal >= 16 * 60 + 30 && timeVal < 18 * 60 + 30) {
    return { slot: 'snacks', label: 'Evening Snacks', timing: '05:00 PM - 06:15 PM', nextMeal: 'dinner' };
  }
  // 19:30 to 22:30 -> Dinner
  if (timeVal >= 19 * 60 + 30 && timeVal < 22 * 60 + 30) {
    return { slot: 'dinner', label: 'Dinner', timing: '08:00 PM - 10:00 PM', nextMeal: 'breakfast' };
  }

  // Off hours
  if (timeVal >= 22 * 60 + 30 || timeVal < 7 * 60) {
    return { slot: 'night', label: 'Mess Closed', timing: 'Reopens at 07:30 AM', nextMeal: 'breakfast' };
  }

  return { slot: 'afternoon', label: 'Prep Time', timing: 'Next meal soon', nextMeal: 'snacks' };
};

// Helper to get day name in IST
const getDayNameInIST = (offsetDays = 0) => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 3600000 * 5.5 + offsetDays * 86400000);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[istDate.getDay()];
};

// @desc    Get complete 7-day weekly menu
// @route   GET /api/menu/weekly
// @access  Public / Private
const getWeeklyMenu = async (req, res) => {
  try {
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const menus = await Menu.find({});

    const sortedMenus = daysOrder
      .map((day) => menus.find((m) => m.dayOfWeek === day))
      .filter(Boolean);

    res.json({
      success: true,
      data: sortedMenus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get today's live menu + tomorrow's menu
// @route   GET /api/menu/today
// @access  Public / Private
const getTodayMenu = async (req, res) => {
  try {
    const currentDay = getDayNameInIST(0);
    const tomorrowDay = getDayNameInIST(1);

    const [todayMenu, tomorrowMenu] = await Promise.all([
      Menu.findOne({ dayOfWeek: currentDay }),
      Menu.findOne({ dayOfWeek: tomorrowDay }),
    ]);

    const currentSlot = getCurrentMealSlot();

    res.json({
      success: true,
      currentDay,
      tomorrowDay,
      currentSlot,
      data: todayMenu,
      tomorrow: tomorrowMenu,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tomorrow's menu explicitly
// @route   GET /api/menu/tomorrow
// @access  Public / Private
const getTomorrowMenu = async (req, res) => {
  try {
    const tomorrowDay = getDayNameInIST(1);
    const tomorrowMenu = await Menu.findOne({ dayOfWeek: tomorrowDay });

    res.json({
      success: true,
      dayOfWeek: tomorrowDay,
      data: tomorrowMenu,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update menu for a day (Admin)
// @route   PUT /api/menu/:dayOfWeek
// @access  Private (Admin / Staff)
const updateMenu = async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const { breakfast, lunch, snacks, dinner, sendNotification = true } = req.body;

    let menu = await Menu.findOne({ dayOfWeek });

    if (!menu) {
      menu = new Menu({ dayOfWeek });
    }

    if (breakfast) menu.breakfast = { ...menu.breakfast, ...breakfast };
    if (lunch) menu.lunch = { ...menu.lunch, ...lunch };
    if (snacks) menu.snacks = { ...menu.snacks, ...snacks };
    if (dinner) menu.dinner = { ...menu.dinner, ...dinner };

    menu.isPublished = true;
    menu.publishedAt = new Date();
    menu.lastUpdatedBy = req.user._id;

    await menu.save();

    // Broadcast menu change notification if requested
    if (sendNotification) {
      await Notification.create({
        targetRole: 'student',
        title: `Mess Menu Updated: ${dayOfWeek}`,
        message: `Mess staff updated the food menu for ${dayOfWeek}. Check the new specials and timings!`,
        type: 'menu',
        link: '/menu',
      });
    }

    // Audit Log Entry
    await recordAuditLog({
      action: 'UPDATE_MENU',
      req,
      targetType: 'Menu',
      targetId: menu._id,
      summary: `Updated menu offerings for ${dayOfWeek}`,
      details: { dayOfWeek, isPublished: menu.isPublished },
    });

    res.json({
      success: true,
      message: `Menu for ${dayOfWeek} updated successfully`,
      data: menu,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Publish complete 7-day weekly menu (Admin)
// @route   POST /api/menu/publish-weekly
// @access  Private (Admin / Staff)
const publishWeeklyMenu = async (req, res) => {
  try {
    const now = new Date();
    await Menu.updateMany({}, { isPublished: true, publishedAt: now, lastUpdatedBy: req.user._id });

    // Send broadcast notification to all students
    await Notification.create({
      targetRole: 'student',
      title: 'Weekly Hostel Mess Menu Published!',
      message: `The complete 7-day mess menu for this week has been finalized and published by the Mess Committee.`,
      type: 'menu',
      priority: 'high',
      link: '/menu',
    });

    // Audit Log Entry
    await recordAuditLog({
      action: 'PUBLISH_WEEKLY_MENU',
      req,
      targetType: 'Menu',
      summary: 'Published and broadcasted 7-day weekly hostel mess menu to all hostellers',
      details: { publishedAt: now },
    });

    res.json({
      success: true,
      message: 'Complete weekly menu published and broadcast notification sent to all students!',
      publishedAt: now,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Rate a meal and submit feedback
// @route   POST /api/menu/rate
// @access  Private (Student)
const rateMeal = async (req, res) => {
  try {
    const { dayOfWeek, mealType, rating, feedback } = req.body;

    if (!dayOfWeek || !mealType || !rating) {
      return res.status(400).json({ success: false, message: 'Please provide dayOfWeek, mealType, and rating' });
    }

    const menu = await Menu.findOne({ dayOfWeek });
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu not found for this day' });
    }

    // Add new review
    menu.ratings.push({
      student: req.user._id,
      studentName: req.user.name,
      mealType,
      rating: Number(rating),
      feedback: feedback || '',
      createdAt: new Date(),
    });

    // Recompute average
    const totalRating = menu.ratings.reduce((acc, r) => acc + r.rating, 0);
    menu.averageRating = Number((totalRating / menu.ratings.length).toFixed(1));

    await menu.save();

    // Admin Notification for New Meal Feedback
    await Notification.create({
      recipient: null,
      targetRole: 'admin',
      title: 'New Student Meal Rating & Feedback',
      message: `${req.user.name} rated ${dayOfWeek} ${mealType} ${rating}/5 stars: "${feedback || 'No written remarks'}".`,
      type: 'feedback',
      priority: rating <= 2 ? 'high' : 'normal',
      link: '/menu-manager',
    });

    res.json({
      success: true,
      message: 'Thank you for your rating and meal feedback!',
      averageRating: menu.averageRating,
      ratingsCount: menu.ratings.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit menu-related suggestion (Student)
// @route   POST /api/menu/suggestions
// @access  Private (Student)
const submitSuggestion = async (req, res) => {
  try {
    const { dishName, mealType = 'lunch', dayPreference = 'Any Day', category = 'New Dish Request', suggestion } = req.body;

    if (!dishName || !suggestion) {
      return res.status(400).json({
        success: false,
        message: 'Please provide dish name and detailed suggestion notes',
      });
    }

    const newSuggestion = await MenuSuggestion.create({
      student: req.user._id,
      studentName: req.user.name,
      studentId: req.user.studentId || '',
      dishName: dishName.trim(),
      mealType,
      dayPreference,
      category,
      suggestion: suggestion.trim(),
      upvotedBy: [req.user._id],
    });

    // Admin Notification for New Dish Suggestion
    await Notification.create({
      recipient: null,
      targetRole: 'admin',
      title: 'New Student Dish Suggestion',
      message: `${req.user.name} proposed "${dishName.trim()}" for ${mealType} (${dayPreference}). Category: ${category}.`,
      type: 'feedback',
      priority: 'normal',
      link: '/menu-manager',
    });

    res.status(201).json({
      success: true,
      message: 'Your menu suggestion has been submitted to the Mess Committee!',
      data: newSuggestion,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all menu suggestions (Student & Admin)
// @route   GET /api/menu/suggestions
// @access  Private
const getSuggestions = async (req, res) => {
  try {
    const { status, category } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }
    if (category && category !== 'All') {
      query.category = category;
    }

    const suggestions = await MenuSuggestion.find(query)
      .populate('student', 'name studentId hostelBlock roomNumber')
      .sort({ upvotes: -1, createdAt: -1 });

    res.json({
      success: true,
      count: suggestions.length,
      data: suggestions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update suggestion status / Admin response (Admin)
// @route   PUT /api/menu/suggestions/:id
// @access  Private (Admin / Staff)
const updateSuggestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    const suggestion = await MenuSuggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({ success: false, message: 'Suggestion not found' });
    }

    if (status) suggestion.status = status;
    if (adminResponse !== undefined) suggestion.adminResponse = adminResponse;

    await suggestion.save();

    // Notify student if responded
    if (suggestion.student) {
      await Notification.create({
        recipient: suggestion.student,
        targetRole: 'student',
        title: `Mess Committee update on: ${suggestion.dishName}`,
        message: `Your menu suggestion was marked as '${suggestion.status}'${adminResponse ? `: "${adminResponse}"` : '.'}`,
        type: 'menu',
        link: '/menu',
      });
    }

    res.json({
      success: true,
      message: `Suggestion status updated to ${suggestion.status}`,
      data: suggestion,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upvote a menu suggestion (Student)
// @route   POST /api/menu/suggestions/:id/upvote
// @access  Private (Student)
const upvoteSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const suggestion = await MenuSuggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({ success: false, message: 'Suggestion not found' });
    }

    const hasUpvoted = suggestion.upvotedBy.some((uid) => uid.toString() === req.user._id.toString());
    if (hasUpvoted) {
      // Remove upvote
      suggestion.upvotedBy = suggestion.upvotedBy.filter((uid) => uid.toString() !== req.user._id.toString());
      suggestion.upvotes = Math.max(0, suggestion.upvotes - 1);
    } else {
      // Add upvote
      suggestion.upvotedBy.push(req.user._id);
      suggestion.upvotes += 1;
    }

    await suggestion.save();

    res.json({
      success: true,
      upvotes: suggestion.upvotes,
      hasUpvoted: !hasUpvoted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWeeklyMenu,
  getTodayMenu,
  getTomorrowMenu,
  updateMenu,
  publishWeeklyMenu,
  rateMeal,
  submitSuggestion,
  getSuggestions,
  updateSuggestionStatus,
  upvoteSuggestion,
};
