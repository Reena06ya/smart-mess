const mongoose = require('mongoose');

const mealDetailsSchema = new mongoose.Schema(
  {
    items: [{ type: String, trim: true }],
    timing: { type: String, default: '' },
    isSpecial: { type: Boolean, default: false },
    specialNote: { type: String, default: '' },
    calories: { type: String, default: '~450 kcal' },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const menuSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
      unique: true,
    },
    scheduledDate: {
      type: Date,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    breakfast: {
      type: mealDetailsSchema,
      default: () => ({
        items: ['Aloo Paratha', 'Dahi', 'Pickle', 'Tea / Coffee / Milk', 'Banana'],
        timing: '07:30 AM - 09:30 AM',
        isSpecial: false,
        specialNote: '',
        calories: '480 kcal',
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400',
      }),
    },
    lunch: {
      type: mealDetailsSchema,
      default: () => ({
        items: ['Dal Makhani', 'Jeera Rice', 'Paneer Sabzi / Egg Curry', 'Roti', 'Salad', 'Raita'],
        timing: '12:30 PM - 02:30 PM',
        isSpecial: false,
        specialNote: '',
        calories: '650 kcal',
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400',
      }),
    },
    snacks: {
      type: mealDetailsSchema,
      default: () => ({
        items: ['Samosa / Poha', 'Mint Chutney', 'Masala Chai', 'Biscuits'],
        timing: '05:00 PM - 06:15 PM',
        isSpecial: false,
        specialNote: '',
        calories: '280 kcal',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=400',
      }),
    },
    dinner: {
      type: mealDetailsSchema,
      default: () => ({
        items: ['Mixed Vegetable', 'Tadka Dal', 'Steamed Rice', 'Phulka Butter Roti', 'Gulab Jamun'],
        timing: '08:00 PM - 10:00 PM',
        isSpecial: false,
        specialNote: '',
        calories: '620 kcal',
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=400',
      }),
    },
    ratings: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        studentName: String,
        mealType: {
          type: String,
          enum: ['breakfast', 'lunch', 'snacks', 'dinner', 'overall'],
        },
        rating: { type: Number, min: 1, max: 5 },
        feedback: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    averageRating: {
      type: Number,
      default: 4.2,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Menu', menuSchema);
