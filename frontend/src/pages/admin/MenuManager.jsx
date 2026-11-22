import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Save,
  Clock,
  Sparkles,
  Coffee,
  Sun,
  Cookie,
  Moon,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Image as ImageIcon,
  Send,
  Bell,
  MessageSquare,
  ThumbsUp,
  Calendar,
  Layers,
  Flame,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Upload,
} from 'lucide-react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { validateAndReadImageFile } from '../../utils/imageUploadValidator';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const PRESET_IMAGES = [
  { label: 'Paratha & Curd', url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600' },
  { label: 'Masala Dosa / Idli', url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600' },
  { label: 'Rajma & Basmati Rice', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600' },
  { label: 'Chole Bhature', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600' },
  { label: 'Crispy Samosa & Chai', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600' },
  { label: 'Pav Bhaji', url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600' },
  { label: 'Shahi Paneer & Roti', url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600' },
  { label: 'Dum Biryani Feast', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600' },
  { label: 'Deluxe Indian Thali', url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600' },
];

export const MenuManager = () => {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'weekly-grid' | 'suggestions'
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [broadcastAlert, setBroadcastAlert] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionFilter, setSuggestionFilter] = useState('All');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [updatingSuggestion, setUpdatingSuggestion] = useState(false);

  // New item input per meal
  const [newItemInputs, setNewItemInputs] = useState({
    breakfast: '',
    lunch: '',
    snacks: '',
    dinner: '',
  });

  // Photo modal state
  const [photoPickerMeal, setPhotoPickerMeal] = useState(null); // 'breakfast' | 'lunch' | 'snacks' | 'dinner' | null

  // Form State with structured items array
  const [formData, setFormData] = useState({
    breakfast: {
      items: ['Aloo Paratha', 'Curd', 'Pickle', 'Hot Milk / Tea'],
      timing: '07:30 AM - 09:30 AM',
      isSpecial: false,
      specialNote: '',
      calories: 450,
      image: '',
    },
    lunch: {
      items: ['Rajma Masala', 'Steamed Rice', 'Phulka Roti (3 pcs)', 'Boondi Raita', 'Salad'],
      timing: '12:30 PM - 02:30 PM',
      isSpecial: false,
      specialNote: '',
      calories: 680,
      image: '',
    },
    snacks: {
      items: ['Crispy Samosa', 'Mint Chutney', 'Adrak Chai'],
      timing: '05:00 PM - 06:15 PM',
      isSpecial: false,
      specialNote: '',
      calories: 320,
      image: '',
    },
    dinner: {
      items: ['Shahi Paneer', 'Tawa Roti (Ghee)', 'Jeera Rice', 'Dal Tadka', 'Gulab Jamun'],
      timing: '08:00 PM - 10:00 PM',
      isSpecial: false,
      specialNote: '',
      calories: 720,
      image: '',
    },
  });

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const [res, suggRes] = await Promise.all([
        api.get('/menu/weekly'),
        api.get('/menu/suggestions'),
      ]);

      if (res.data?.success) {
        setWeeklyMenu(res.data.data || []);
      }
      if (suggRes.data?.success) {
        setSuggestions(suggRes.data.data || []);
      }
    } catch (err) {
      showToast('Error loading menu and suggestions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Update form data when selected day or weeklyMenu changes
  useEffect(() => {
    const dayObj = weeklyMenu.find((m) => m.dayOfWeek === selectedDay);
    if (dayObj) {
      setFormData({
        breakfast: {
          items: dayObj.breakfast?.items || [],
          timing: dayObj.breakfast?.timing || '07:30 AM - 09:30 AM',
          isSpecial: !!dayObj.breakfast?.isSpecial,
          specialNote: dayObj.breakfast?.specialNote || '',
          calories: dayObj.breakfast?.calories || 450,
          image: dayObj.breakfast?.image || PRESET_IMAGES[0].url,
        },
        lunch: {
          items: dayObj.lunch?.items || [],
          timing: dayObj.lunch?.timing || '12:30 PM - 02:30 PM',
          isSpecial: !!dayObj.lunch?.isSpecial,
          specialNote: dayObj.lunch?.specialNote || '',
          calories: dayObj.lunch?.calories || 680,
          image: dayObj.lunch?.image || PRESET_IMAGES[2].url,
        },
        snacks: {
          items: dayObj.snacks?.items || [],
          timing: dayObj.snacks?.timing || '05:00 PM - 06:15 PM',
          isSpecial: !!dayObj.snacks?.isSpecial,
          specialNote: dayObj.snacks?.specialNote || '',
          calories: dayObj.snacks?.calories || 320,
          image: dayObj.snacks?.image || PRESET_IMAGES[4].url,
        },
        dinner: {
          items: dayObj.dinner?.items || [],
          timing: dayObj.dinner?.timing || '08:00 PM - 10:00 PM',
          isSpecial: !!dayObj.dinner?.isSpecial,
          specialNote: dayObj.dinner?.specialNote || '',
          calories: dayObj.dinner?.calories || 720,
          image: dayObj.dinner?.image || PRESET_IMAGES[6].url,
        },
      });
    }
  }, [selectedDay, weeklyMenu]);

  // Item additions and deletions
  const handleAddItem = (mealKey) => {
    const itemVal = newItemInputs[mealKey]?.trim();
    if (!itemVal) return;

    setFormData((prev) => ({
      ...prev,
      [mealKey]: {
        ...prev[mealKey],
        items: [...prev[mealKey].items, itemVal],
      },
    }));

    setNewItemInputs((prev) => ({ ...prev, [mealKey]: '' }));
  };

  const handleRemoveItem = (mealKey, indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      [mealKey]: {
        ...prev[mealKey],
        items: prev[mealKey].items.filter((_, idx) => idx !== indexToRemove),
      },
    }));
  };

  const handleSaveDay = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        breakfast: {
          items: formData.breakfast.items,
          timing: formData.breakfast.timing,
          isSpecial: formData.breakfast.isSpecial,
          specialNote: formData.breakfast.specialNote,
          calories: Number(formData.breakfast.calories) || 450,
          image: formData.breakfast.image,
        },
        lunch: {
          items: formData.lunch.items,
          timing: formData.lunch.timing,
          isSpecial: formData.lunch.isSpecial,
          specialNote: formData.lunch.specialNote,
          calories: Number(formData.lunch.calories) || 680,
          image: formData.lunch.image,
        },
        snacks: {
          items: formData.snacks.items,
          timing: formData.snacks.timing,
          isSpecial: formData.snacks.isSpecial,
          specialNote: formData.snacks.specialNote,
          calories: Number(formData.snacks.calories) || 320,
          image: formData.snacks.image,
        },
        dinner: {
          items: formData.dinner.items,
          timing: formData.dinner.timing,
          isSpecial: formData.dinner.isSpecial,
          specialNote: formData.dinner.specialNote,
          calories: Number(formData.dinner.calories) || 720,
          image: formData.dinner.image,
        },
        broadcastNotification: broadcastAlert,
      };

      const res = await api.put(`/menu/${selectedDay}`, payload);
      if (res.data?.success) {
        showToast(
          broadcastAlert
            ? `Menu for ${selectedDay} saved and broadcasted to students!`
            : `Menu for ${selectedDay} saved successfully!`,
          'success'
        );
        fetchMenu();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update menu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishWeekly = async () => {
    setPublishing(true);
    try {
      const res = await api.post('/menu/publish-weekly', {
        note: 'Complete 7-day mess menu updated by Mess Bhaiya.',
      });
      if (res.data?.success) {
        showToast('Complete weekly menu published! Push notification sent to all hostellers.', 'success');
        fetchMenu();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to publish weekly menu', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleUpdateSuggestion = async (status) => {
    if (!selectedSuggestion) return;
    setUpdatingSuggestion(true);
    try {
      const res = await api.put(`/menu/suggestions/${selectedSuggestion._id}`, {
        status,
        adminResponse: adminReplyText.trim(),
      });
      if (res.data?.success) {
        showToast(`Suggestion marked as '${status}' and student notified!`, 'success');
        setSelectedSuggestion(null);
        setAdminReplyText('');
        fetchMenu();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update suggestion', 'error');
    } finally {
      setUpdatingSuggestion(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={4} type="card" />;
  }

  const filteredSuggestions = suggestions.filter((s) => {
    if (suggestionFilter === 'All') return true;
    return s.status === suggestionFilter;
  });

  const mealCardsConfig = [
    {
      key: 'breakfast',
      title: 'Breakfast',
      icon: Coffee,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50',
      timingDefault: '07:30 AM - 09:30 AM',
    },
    {
      key: 'lunch',
      title: 'Lunch',
      icon: Sun,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      timingDefault: '12:30 PM - 02:30 PM',
    },
    {
      key: 'snacks',
      title: 'Evening Snacks & High-Tea',
      icon: Cookie,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      timingDefault: '05:00 PM - 06:15 PM',
    },
    {
      key: 'dinner',
      title: 'Dinner',
      icon: Moon,
      iconColor: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      timingDefault: '08:00 PM - 10:00 PM',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <UtensilsCrossed className="w-4 h-4" />
            <span>Kitchen Operations & Catering Manager</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Mess Menu Management & Schedule
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Set breakfast, lunch, snacks, and dinner dishes, attach vibrant food photos, publish weekly menus, and review student meal suggestions.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePublishWeekly}
            disabled={publishing}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold shadow-md shadow-navy-900/15 transition-all"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>{publishing ? 'Broadcasting...' : 'Publish Full Weekly Menu'}</span>
          </button>

          <button
            onClick={handleSaveDay}
            disabled={saving}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : `Save ${selectedDay} Menu`}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === 'daily'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Menu Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('weekly-grid')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === 'weekly-grid'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Weekly Menu Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all relative ${
              activeTab === 'suggestions'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            <span>Student Dish Requests</span>
            {suggestions.filter((s) => s.status === 'Pending').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {suggestions.filter((s) => s.status === 'Pending').length}
              </span>
            )}
          </button>
        </div>

        {/* Broadcast Notification Checkbox */}
        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-600 font-medium">
          <input
            type="checkbox"
            id="broadcastCheck"
            checked={broadcastAlert}
            onChange={(e) => setBroadcastAlert(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="broadcastCheck" className="flex items-center space-x-1 cursor-pointer">
            <Bell className="w-3.5 h-3.5 text-emerald-600" />
            <span>Notify students on save</span>
          </label>
        </div>
      </div>

      {/* TAB 1: DAILY MENU EDITOR */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Day Selector Pills */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm flex items-center space-x-2 overflow-x-auto scrollbar-none">
            {daysList.map((day) => {
              const isSelected = selectedDay === day;
              const dayData = weeklyMenu.find((m) => m.dayOfWeek === day);
              const hasItems =
                (dayData?.breakfast?.items?.length || 0) +
                (dayData?.lunch?.items?.length || 0) +
                (dayData?.dinner?.items?.length || 0);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 ${
                    isSelected
                      ? 'bg-navy-900 text-white shadow-md shadow-navy-900/20 ring-2 ring-emerald-500/50'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{day}</span>
                  {hasItems > 0 && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-emerald-400' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* 4 Meals Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mealCardsConfig.map((mealCfg) => {
              const Icon = mealCfg.icon;
              const mealKey = mealCfg.key;
              const currentMeal = formData[mealKey];

              return (
                <div
                  key={mealKey}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  {/* Card Header & Photo Banner */}
                  <div className="relative h-36 bg-slate-900 overflow-hidden group">
                    <img
                      src={currentMeal.image || PRESET_IMAGES[0].url}
                      alt={mealCfg.title}
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center space-x-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl">
                      <Icon className={`w-4 h-4 ${mealCfg.iconColor}`} />
                      <span className="text-xs font-bold text-slate-900">{mealCfg.title}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPhotoPickerMeal(mealKey)}
                      className="absolute top-3 right-3 flex items-center space-x-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Change Photo</span>
                    </button>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <div className="flex items-center space-x-1 text-slate-200">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{currentMeal.timing}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/80 text-[11px] font-bold">
                        {currentMeal.calories || '~500'} kcal
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    {/* Timing & Calories Inline */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Serving Timing
                        </label>
                        <input
                          type="text"
                          value={currentMeal.timing}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [mealKey]: { ...currentMeal, timing: e.target.value },
                            })
                          }
                          className="w-full text-xs rounded-xl border border-slate-300 p-2 font-medium"
                          placeholder="e.g. 07:30 AM - 09:30 AM"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Estimated Calories
                        </label>
                        <input
                          type="number"
                          value={currentMeal.calories}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [mealKey]: { ...currentMeal, calories: e.target.value },
                            })
                          }
                          className="w-full text-xs rounded-xl border border-slate-300 p-2 font-medium"
                          placeholder="e.g. 450"
                        />
                      </div>
                    </div>

                    {/* Food Items Pills Manager */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-slate-700">
                          Dishes & Food Items ({currentMeal.items.length})
                        </label>
                        <span className="text-[10px] text-slate-400">Click &times; to remove</span>
                      </div>

                      {/* Chips Container */}
                      <div className="flex flex-wrap gap-1.5 min-h-[50px] p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        {currentMeal.items.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">No food items added yet. Add one below.</span>
                        ) : (
                          currentMeal.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-xs"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(mealKey, idx)}
                                className="text-slate-400 hover:text-red-600 ml-1 rounded-full p-0.5 hover:bg-slate-100 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      {/* Add Item Input Group */}
                      <div className="flex items-center space-x-2 mt-2">
                        <input
                          type="text"
                          value={newItemInputs[mealKey]}
                          onChange={(e) =>
                            setNewItemInputs({ ...newItemInputs, [mealKey]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddItem(mealKey);
                            }
                          }}
                          placeholder={`Add dish (e.g. ${
                            mealKey === 'breakfast'
                              ? 'Poha with Sev'
                              : mealKey === 'lunch'
                              ? 'Dal Makhani'
                              : mealKey === 'snacks'
                              ? 'Papad & Tea'
                              : 'Shahi Paneer'
                          })`}
                          className="flex-1 text-xs rounded-xl border border-slate-300 p-2"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddItem(mealKey)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center space-x-1 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>

                    {/* Special Dish Highlight Checkbox */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={currentMeal.isSpecial}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [mealKey]: { ...currentMeal, isSpecial: e.target.checked },
                              })
                            }
                            className="rounded text-amber-500 focus:ring-amber-400"
                          />
                          <span className="flex items-center space-x-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Mark as Chef Special Dish</span>
                          </span>
                        </label>
                      </div>

                      {currentMeal.isSpecial && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="e.g. Special Sunday Biryani with Raita & Gulab Jamun"
                            value={currentMeal.specialNote}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [mealKey]: { ...currentMeal, specialNote: e.target.value },
                              })
                            }
                            className="w-full text-xs rounded-xl border border-amber-300 bg-amber-50/60 p-2 text-amber-950 font-medium"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY MENU MATRIX */}
      {activeTab === 'weekly-grid' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Weekly Calendar Matrix:</strong> Quick view of all 7 days. Click any day header to edit its dishes directly.
              </span>
            </div>
            <button
              onClick={handlePublishWeekly}
              disabled={publishing}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all flex items-center space-x-1"
            >
              <Send className="w-3 h-3" />
              <span>{publishing ? 'Publishing...' : 'Publish Weekly Menu'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {weeklyMenu.map((dayMenu) => (
              <div
                key={dayMenu.dayOfWeek}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="p-3.5 bg-navy-950 text-white flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm tracking-wide">{dayMenu.dayOfWeek}</h3>
                    <p className="text-[10px] text-slate-400">
                      {dayMenu.isPublished ? '● Published' : 'Draft'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDay(dayMenu.dayOfWeek);
                      setActiveTab('daily');
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 font-bold transition-colors"
                  >
                    Edit Day
                  </button>
                </div>

                {/* Day Meals Summary */}
                <div className="p-4 space-y-3.5 text-xs">
                  {/* Breakfast */}
                  <div>
                    <div className="flex items-center space-x-1.5 text-amber-700 font-bold text-[11px] mb-1">
                      <Coffee className="w-3.5 h-3.5 text-amber-500" />
                      <span>Breakfast</span>
                    </div>
                    <p className="text-slate-700 line-clamp-2">
                      {dayMenu.breakfast?.items?.join(', ') || 'No dishes specified'}
                    </p>
                  </div>

                  {/* Lunch */}
                  <div>
                    <div className="flex items-center space-x-1.5 text-blue-700 font-bold text-[11px] mb-1">
                      <Sun className="w-3.5 h-3.5 text-blue-500" />
                      <span>Lunch</span>
                    </div>
                    <p className="text-slate-700 line-clamp-2">
                      {dayMenu.lunch?.items?.join(', ') || 'No dishes specified'}
                    </p>
                  </div>

                  {/* Snacks */}
                  <div>
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-bold text-[11px] mb-1">
                      <Cookie className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Evening Snacks</span>
                    </div>
                    <p className="text-slate-700 line-clamp-2">
                      {dayMenu.snacks?.items?.join(', ') || 'Tea & Biscuits'}
                    </p>
                  </div>

                  {/* Dinner */}
                  <div>
                    <div className="flex items-center space-x-1.5 text-indigo-700 font-bold text-[11px] mb-1">
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Dinner</span>
                    </div>
                    <p className="text-slate-700 line-clamp-2">
                      {dayMenu.dinner?.items?.join(', ') || 'No dishes specified'}
                    </p>
                  </div>
                </div>

                {/* Day Footer with rating */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Student Rating</span>
                  <span className="font-bold text-slate-800">
                    ★ {dayMenu.averageRating || '4.5'} / 5.0
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT DISH SUGGESTIONS */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700">Filter Status:</span>
              {['All', 'Pending', 'Accepted', 'Implemented', 'Rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSuggestionFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    suggestionFilter === status
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-500">
              Showing <strong>{filteredSuggestions.length}</strong> dish request(s)
            </p>
          </div>

          {/* Suggestions List */}
          {filteredSuggestions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No suggestions in this category</h4>
              <p className="text-xs text-slate-500 mt-1">
                When students submit new dish requests from their portal, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSuggestions.map((sugg) => (
                <div
                  key={sugg._id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-slate-900">{sugg.dishName}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {sugg.mealType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Requested for: <strong>{sugg.dayPreference}</strong> • Category: {sugg.category}
                        </p>
                      </div>

                      {/* Status Badge */}
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

                    {/* Note */}
                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60 my-2.5">
                      "{sugg.suggestion}"
                    </p>

                    {/* Student Info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        By: <strong>{sugg.studentName}</strong> ({sugg.student?.hostelBlock || 'Hostel'} - Room {sugg.student?.roomNumber || 'N/A'})
                      </span>
                      <span className="flex items-center space-x-1 font-bold text-slate-700">
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{sugg.upvotes || 0} Upvotes</span>
                      </span>
                    </div>

                    {/* Admin Response if present */}
                    {sugg.adminResponse && (
                      <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                        <strong className="block text-[10px] uppercase tracking-wider text-emerald-700">
                          Mess Bhaiya Response:
                        </strong>
                        <span>{sugg.adminResponse}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => {
                        setSelectedSuggestion(sugg);
                        setAdminReplyText(sugg.adminResponse || '');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all"
                    >
                      Respond / Change Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PHOTO PICKER MODAL */}
      {photoPickerMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Select Photo for {photoPickerMeal.toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setPhotoPickerMeal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Pick a high-resolution Indian dish photo from our curated library or enter a custom image URL.
            </p>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
              {PRESET_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      [photoPickerMeal]: {
                        ...formData[photoPickerMeal],
                        image: preset.url,
                      },
                    });
                    setPhotoPickerMeal(null);
                    showToast(`Photo updated for ${photoPickerMeal}!`, 'success');
                  }}
                  className="group relative rounded-xl overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-all text-left"
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute bottom-1 left-1.5 right-1.5 text-[10px] font-bold text-white truncate">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom URL Input & Direct File Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Or Upload Image / Enter Image URL
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... or click Upload"
                  value={formData[photoPickerMeal]?.image || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [photoPickerMeal]: {
                        ...formData[photoPickerMeal],
                        image: e.target.value,
                      },
                    })
                  }
                  className="flex-1 text-xs rounded-xl border border-slate-300 p-2"
                />
                <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center space-x-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>Browse</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const res = await validateAndReadImageFile(file);
                        setFormData({
                          ...formData,
                          [photoPickerMeal]: {
                            ...formData[photoPickerMeal],
                            image: res.dataUrl,
                          },
                        });
                        setPhotoPickerMeal(null);
                        showToast(`Dish photo uploaded for ${photoPickerMeal}!`, 'success');
                      } catch (err) {
                        showToast(err.message, 'error');
                      }
                    }}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => {
                    setPhotoPickerMeal(null);
                    showToast('Custom image applied!', 'success');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUGGESTION RESPONSE MODAL */}
      {selectedSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Respond to Dish Request
              </h3>
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <p className="font-bold text-slate-900">{selectedSuggestion.dishName}</p>
              <p className="text-slate-500 mt-0.5">
                Requested by {selectedSuggestion.studentName} for {selectedSuggestion.dayPreference} ({selectedSuggestion.mealType})
              </p>
              <p className="text-slate-700 italic mt-2">"{selectedSuggestion.suggestion}"</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mess Bhaiya Remarks / Feedback to Student
              </label>
              <textarea
                rows={3}
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                placeholder="e.g. Approved! We will introduce this dish in next week's Sunday dinner."
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Select Action:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={updatingSuggestion}
                  onClick={() => handleUpdateSuggestion('Accepted')}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all text-center"
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={updatingSuggestion}
                  onClick={() => handleUpdateSuggestion('Implemented')}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all text-center"
                >
                  Implement
                </button>
                <button
                  type="button"
                  disabled={updatingSuggestion}
                  onClick={() => handleUpdateSuggestion('Rejected')}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all text-center"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
