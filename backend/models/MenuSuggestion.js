const mongoose = require('mongoose');

const menuSuggestionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentId: {
      type: String,
      default: '',
    },
    dishName: {
      type: String,
      required: [true, 'Please provide dish name'],
      trim: true,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'snacks', 'dinner', 'general'],
      default: 'lunch',
    },
    dayPreference: {
      type: String,
      default: 'Any Day',
    },
    category: {
      type: String,
      enum: ['New Dish Request', 'Improve Taste / Quality', 'Healthy Diet Option', 'Weekend Special', 'General Feedback'],
      default: 'New Dish Request',
    },
    suggestion: {
      type: String,
      required: [true, 'Please provide detailed suggestion notes'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'Accepted', 'Implemented', 'Rejected'],
      default: 'Pending',
    },
    adminResponse: {
      type: String,
      default: '',
    },
    upvotes: {
      type: Number,
      default: 1,
    },
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MenuSuggestion', menuSuggestionSchema);
