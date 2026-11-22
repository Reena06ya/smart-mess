import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Clock,
  Sparkles,
  Star,
  Coffee,
  Sun,
  Cookie,
  Moon,
  Send,
  MessageSquare,
  ThumbsUp,
  Calendar,
  Layers,
  Flame,
  CheckCircle2,
  Plus,
  X,
  ChevronRight,
  Filter,
  Info,
} from 'lucide-react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export const StudentMenu = () => {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [todayData, setTodayData] = useState(null);
  const [tomorrowData, setTomorrowData] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'calendar' | 'suggestions'

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [suggestionForm, setSuggestionForm] = useState({
    dishName: '',
    mealType: 'lunch',
    dayPreference: 'Sunday',
    category: 'New Dish Request',
    suggestion: '',
  });

  // Rating state
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateMealType, setRateMealType] = useState('lunch');
  const [ratingVal, setRatingVal] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const [weeklyRes, todayRes, tomorrowRes, suggRes] = await Promise.all([
        api.get('/menu/weekly'),
        api.get('/menu/today'),
        api.get('/menu/tomorrow'),
        api.get('/menu/suggestions'),
      ]);

      if (weeklyRes.data?.success) {
        setWeeklyMenu(weeklyRes.data.data || []);
      }

      if (todayRes.data?.success) {
        setTodayData(todayRes.data);
        if (todayRes.data.currentDay) {
          setSelectedDay(todayRes.data.currentDay);
        }
      }

      if (tomorrowRes.data?.success) {
        setTomorrowData(tomorrowRes.data);
      }

      if (suggRes.data?.success) {
        setSuggestions(suggRes.data.data || []);
      }
    } catch (err) {
      showToast('Error loading mess menu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRating(true);
    try {
      const res = await api.post('/menu/rate', {
        dayOfWeek: selectedDay,
        mealType: rateMealType,
        rating: ratingVal,
        feedback: feedbackText,
      });

      if (res.data?.success) {
        showToast(`Thank you! Your ${ratingVal}-star rating was recorded.`, 'success');
        setFeedbackText('');
        setShowRateModal(false);
        fetchMenuData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit rating', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    if (!suggestionForm.dishName.trim() || !suggestionForm.suggestion.trim()) {
      showToast('Please enter dish name and details', 'error');
      return;
    }

    setSubmittingSuggestion(true);
    try {
      const res = await api.post('/menu/suggestions', suggestionForm);
      if (res.data?.success) {
        showToast('Your dish suggestion has been submitted to the Mess Committee!', 'success');
        setShowSuggestModal(false);
        setSuggestionForm({
          dishName: '',
          mealType: 'lunch',
          dayPreference: 'Sunday',
          category: 'New Dish Request',
          suggestion: '',
        });
        fetchMenuData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit suggestion', 'error');
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  const handleUpvote = async (suggestionId) => {
    try {
      const res = await api.post(`/menu/suggestions/${suggestionId}/upvote`);
      if (res.data?.success) {
        setSuggestions((prev) =>
          prev.map((s) => (s._id === suggestionId ? { ...s, upvotes: res.data.upvotes } : s))
        );
      }
    } catch (err) {
      showToast('Error upvoting suggestion', 'error');
    }
  };

  if (loading) {
    return <LoadingSkeleton count={4} type="card" />;
  }

  const selectedMenuObj = weeklyMenu.find((m) => m.dayOfWeek === selectedDay);

  const mealSections = [
    {
      key: 'breakfast',
      title: 'Breakfast',
      icon: Coffee,
      iconColor: 'text-amber-500',
      timingDefault: '07:30 AM - 09:30 AM',
      data: selectedMenuObj?.breakfast,
    },
    {
      key: 'lunch',
      title: 'Lunch',
      icon: Sun,
      iconColor: 'text-blue-500',
      timingDefault: '12:30 PM - 02:30 PM',
      data: selectedMenuObj?.lunch,
    },
    {
      key: 'snacks',
      title: 'Evening Snacks & Tea',
      icon: Cookie,
      iconColor: 'text-emerald-600',
      timingDefault: '05:00 PM - 06:15 PM',
      data: selectedMenuObj?.snacks,
    },
    {
      key: 'dinner',
      title: 'Dinner',
      icon: Moon,
      iconColor: 'text-indigo-500',
      timingDefault: '08:00 PM - 10:00 PM',
      data: selectedMenuObj?.dinner,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <UtensilsCrossed className="w-4 h-4" />
            <span>Hostel Nutrition & Food Service</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Hostel Mess Food Menu
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View today's meals, browse the complete 7-day weekly calendar, rate meal quality, and submit new dish requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Serving Badge */}
          {todayData?.currentSlot && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 flex items-center space-x-3 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <p className="font-bold text-emerald-900">
                  Now Serving: {todayData.currentSlot.label}
                </p>
                <p className="text-[11px] text-emerald-700">{todayData.currentSlot.timing}</p>
              </div>
            </div>
          )}

          {/* Suggest a Dish Button */}
          <button
            onClick={() => setShowSuggestModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold shadow-md shadow-navy-900/15 transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Suggest a Dish</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'daily'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Daily Menu Focus</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'calendar'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Weekly Menu Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('suggestions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'suggestions'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
          <span>Dish Suggestions ({suggestions.length})</span>
        </button>
      </div>

      {/* TAB 1: DAILY MENU FOCUS */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Quick Buttons: Today, Tomorrow, & Day Pills */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (todayData?.currentDay) setSelectedDay(todayData.currentDay);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  selectedDay === todayData?.currentDay
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Today's Menu ({todayData?.currentDay})</span>
              </button>

              <button
                onClick={() => {
                  if (tomorrowData?.data?.dayOfWeek) setSelectedDay(tomorrowData.data.dayOfWeek);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  selectedDay === tomorrowData?.data?.dayOfWeek
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Tomorrow ({tomorrowData?.data?.dayOfWeek})</span>
              </button>
            </div>

            {/* Weekday Selector */}
            <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
              {daysList.map((day) => {
                const isSelected = selectedDay === day;
                const isToday = todayData?.currentDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1 ${
                      isSelected
                        ? 'bg-navy-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{day.substring(0, 3)}</span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Meal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mealSections.map((sec) => {
              const Icon = sec.icon;
              const meal = sec.data;
              const isCurrentlyServing =
                todayData?.currentDay === selectedDay &&
                todayData?.currentSlot?.slot === sec.key;

              return (
                <div
                  key={sec.key}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden flex flex-col justify-between ${
                    isCurrentlyServing
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Photo Banner */}
                  <div className="relative h-40 bg-slate-900 overflow-hidden">
                    <img
                      src={
                        meal?.image ||
                        'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600'
                      }
                      alt={sec.title}
                      className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

                    {/* Meal Label */}
                    <div className="absolute top-3 left-3 flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl shadow-xs">
                      <Icon className={`w-4 h-4 ${sec.iconColor}`} />
                      <span className="text-xs font-bold text-slate-900">{sec.title}</span>
                    </div>

                    {/* Currently Serving Tag */}
                    {isCurrentlyServing && (
                      <span className="absolute top-3 right-3 text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-sm flex items-center space-x-1 animate-pulse">
                        <span>● Serving Now</span>
                      </span>
                    )}

                    {/* Timings & Calories */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <div className="flex items-center space-x-1 text-slate-200 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{meal?.timing || sec.timingDefault}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-[11px] font-bold">
                        {meal?.calories || '~550'} kcal
                      </span>
                    </div>
                  </div>

                  {/* Body: Items List */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-semibold mb-2">
                        <span>Dishes on Menu</span>
                        <span>{meal?.items?.length || 0} items</span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        {meal?.items && meal.items.length > 0 ? (
                          meal.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-medium text-slate-800 flex items-center space-x-2 hover:bg-slate-100 transition-colors"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400 italic">
                            Menu being prepared by chef.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chef Special Tag */}
                    {meal?.isSpecial && (
                      <div className="pt-2">
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2 font-medium">
                          <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>
                            <strong>Chef Special:</strong> {meal?.specialNote || 'Special Dish'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer with Rate CTA */}
                  <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Hygienic • Freshly Cooked
                    </span>
                    <button
                      onClick={() => {
                        setRateMealType(sec.key);
                        setShowRateModal(true);
                      }}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>Rate this meal</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ATTRACTIVE WEEKLY MENU CALENDAR (Requested Layout) */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-slate-700">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>
                <strong>Official 7-Day Hostel Mess Schedule:</strong> Displaying Monday to Sunday breakfast, lunch, snacks, and dinner.
              </span>
            </div>
            <span className="text-emerald-600 font-bold hidden sm:inline">
              ● All 7 Days Published
            </span>
          </div>

          {/* 7-Day Grid Calendar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {weeklyMenu.map((dayMenu) => {
              const isToday = todayData?.currentDay === dayMenu.dayOfWeek;
              return (
                <div
                  key={dayMenu.dayOfWeek}
                  className={`bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between transition-all ${
                    isToday
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-slate-200/80 hover:shadow-md'
                  }`}
                >
                  {/* Day Header Banner */}
                  <div
                    className={`p-3.5 flex items-center justify-between ${
                      isToday ? 'bg-emerald-700 text-white' : 'bg-navy-950 text-white'
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-sm tracking-wide flex items-center space-x-1.5">
                        <span>{dayMenu.dayOfWeek.toUpperCase()}</span>
                        {isToday && (
                          <span className="px-2 py-0.2 rounded-full bg-white text-emerald-800 text-[10px] font-black uppercase">
                            Today
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-slate-300">Mess Schedule</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedDay(dayMenu.dayOfWeek);
                        setActiveTab('daily');
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
                    >
                      View Daily
                    </button>
                  </div>

                  {/* Day Sections matching Example in Prompt */}
                  <div className="p-4 space-y-3 text-xs divide-y divide-slate-100">
                    {/* Breakfast */}
                    <div className="pt-1">
                      <div className="flex items-center space-x-1 text-amber-700 font-bold text-[11px] mb-1">
                        <Coffee className="w-3.5 h-3.5 text-amber-500" />
                        <span>Breakfast:</span>
                      </div>
                      <p className="text-slate-800 font-medium pl-4">
                        {dayMenu.breakfast?.items?.join(', ') || 'Poha, Tea'}
                      </p>
                    </div>

                    {/* Lunch */}
                    <div className="pt-2">
                      <div className="flex items-center space-x-1 text-blue-700 font-bold text-[11px] mb-1">
                        <Sun className="w-3.5 h-3.5 text-blue-500" />
                        <span>Lunch:</span>
                      </div>
                      <p className="text-slate-800 font-medium pl-4">
                        {dayMenu.lunch?.items?.join(', ') || 'Dal, Rice, Roti, Sabzi'}
                      </p>
                    </div>

                    {/* Snacks */}
                    <div className="pt-2">
                      <div className="flex items-center space-x-1 text-emerald-700 font-bold text-[11px] mb-1">
                        <Cookie className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Snacks:</span>
                      </div>
                      <p className="text-slate-800 font-medium pl-4">
                        {dayMenu.snacks?.items?.join(', ') || 'Samosa, Tea'}
                      </p>
                    </div>

                    {/* Dinner */}
                    <div className="pt-2">
                      <div className="flex items-center space-x-1 text-indigo-700 font-bold text-[11px] mb-1">
                        <Moon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Dinner:</span>
                      </div>
                      <p className="text-slate-800 font-medium pl-4">
                        {dayMenu.dinner?.items?.join(', ') || 'Paneer, Roti, Rice'}
                      </p>
                    </div>
                  </div>

                  {/* Special Tag or Rating */}
                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Student Rating</span>
                    <span className="font-bold text-amber-600 flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{dayMenu.averageRating || '4.5'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT DISH SUGGESTIONS & COMMUNITY UPVOTING */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Student Dish Suggestions & Upvoting
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upvote your favorite meal ideas. The mess committee reviews top-voted dishes each weekend for the upcoming menu!
              </p>
            </div>
            <button
              onClick={() => setShowSuggestModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 self-start sm:self-auto shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Suggestion</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((sugg) => (
              <div
                key={sugg._id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-slate-900">{sugg.dishName}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {sugg.mealType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Preference: <strong>{sugg.dayPreference}</strong> • Category: {sugg.category}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        sugg.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sugg.status === 'Implemented'
                          ? 'bg-blue-100 text-blue-800'
                          : sugg.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sugg.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60 my-2.5">
                    "{sugg.suggestion}"
                  </p>

                  {sugg.adminResponse && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 mb-2">
                      <strong className="block text-[10px] uppercase tracking-wider text-emerald-700">
                        Mess Committee Response:
                      </strong>
                      <span>{sugg.adminResponse}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    By: <strong>{sugg.studentName}</strong>
                  </span>
                  <button
                    onClick={() => handleUpvote(sugg._id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Upvote ({sugg.upvotes || 0})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUGGESTION MODAL */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Suggest a Meal / Dish to Mess Committee
                </h3>
              </div>
              <button
                onClick={() => setShowSuggestModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSuggestionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Dish / Recipe Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chole Bhature, Masala Dosa, Dal Makhani..."
                  value={suggestionForm.dishName}
                  onChange={(e) =>
                    setSuggestionForm({ ...suggestionForm, dishName: e.target.value })
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Meal Slot</label>
                  <select
                    value={suggestionForm.mealType}
                    onChange={(e) =>
                      setSuggestionForm({ ...suggestionForm, mealType: e.target.value })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="snacks">Evening Snacks</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Day</label>
                  <select
                    value={suggestionForm.dayPreference}
                    onChange={(e) =>
                      setSuggestionForm({ ...suggestionForm, dayPreference: e.target.value })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
                  >
                    <option value="Any Day">Any Day</option>
                    {daysList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={suggestionForm.category}
                  onChange={(e) =>
                    setSuggestionForm({ ...suggestionForm, category: e.target.value })
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
                >
                  <option value="New Dish Request">New Dish Request</option>
                  <option value="Healthy / Diet Option">Healthy / Diet Option (e.g. Sprouts, Oats)</option>
                  <option value="Regional Specialty">Regional Specialty (South/North/East)</option>
                  <option value="Taste & Quality Improvement">Taste & Quality Improvement</option>
                  <option value="Festival / Special Occasion">Festival / Special Occasion</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Why would hostellers love this? (Detailed note) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Chole Bhature on Sunday lunch would be amazing! Many students from Block A and B requested it..."
                  value={suggestionForm.suggestion}
                  onChange={(e) =>
                    setSuggestionForm({ ...suggestionForm, suggestion: e.target.value })
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSuggestModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSuggestion}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-600/20"
                >
                  {submittingSuggestion ? 'Submitting...' : 'Send to Mess Committee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RATING MODAL */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Rate Food Quality ({selectedDay})
                </h3>
              </div>
              <button
                onClick={() => setShowRateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRatingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Which meal are you rating?
                </label>
                <select
                  value={rateMealType}
                  onChange={(e) => setRateMealType(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="snacks">Evening Snacks & High-Tea</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rating: {ratingVal} / 5 Stars
                </label>
                <div className="flex items-center space-x-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatingVal(star)}
                      className="p-1 text-slate-300 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= ratingVal
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Feedback remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="e.g. The Paneer butter masala was very rich and tasty. Rotis were served hot."
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-600/20"
                >
                  {submittingRating ? 'Saving...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMenu;
