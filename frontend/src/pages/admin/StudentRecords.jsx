import React, { useState, useEffect } from 'react';
import {
  Building,
  Users,
  Search,
  Filter,
  PlusCircle,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Phone,
  Mail,
  RefreshCw,
  DoorClosed,
  CheckCircle2,
  AlertCircle,
  Coins,
  ShieldAlert,
  ArrowRight,
  Maximize2,
  X,
  Bed,
  Utensils,
  Eye,
  SlidersHorizontal,
  LayoutGrid,
  List,
} from 'lucide-react';
import api from '../../services/api';
import { formatINR } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import Badge from '../../components/common/Badge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

export const StudentRecords = () => {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalStudents: 0,
    totalPendingFees: 0,
    unpaidStudentsCount: 0,
    allBlocks: [],
    allFloors: [],
  });

  // Filter & Search States
  const [search, setSearch] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('All');
  const [selectedFloor, setSelectedFloor] = useState('All');
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Deactivated'
  const [viewMode, setViewMode] = useState('rooms'); // 'rooms' | 'table'

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [selectedRoomData, setSelectedRoomData] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    avatar: '',
    hostelName: 'CV Raman Central Hostel',
    hostelBlock: 'Block A',
    blockFloor: '1st Floor',
    roomNumber: '101',
    bedNumber: 'Bed-1',
    dietPreference: 'Veg',
    messStatus: 'Active',
    monthlyMessPlan: 3800,
    balanceDue: 3800,
  });

  const avatarPresets = [
    { label: 'Student 1', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200' },
    { label: 'Student 2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
    { label: 'Student 3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
    { label: 'Student 4', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
  ];

  // Fetch Room-Wise Student Hierarchy
  const fetchRoomWiseData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedBlock !== 'All') params.block = selectedBlock;
      if (selectedFloor !== 'All') params.floor = selectedFloor;
      if (onlyUnpaid) params.unpaidOnly = true;
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await api.get('/students/room-wise', { params });
      if (res.data?.success) {
        setRooms(res.data.data || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      showToast('Error loading room records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomWiseData();
  }, [selectedBlock, selectedFloor, onlyUnpaid, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRoomWiseData();
  };

  // Open Add Student Modal
  const handleOpenAddModal = (presetRoom = null, presetBlock = null, presetFloor = null) => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      studentId: `SM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      avatar: avatarPresets[0].url,
      hostelName: 'CV Raman Central Hostel',
      hostelBlock: presetBlock || 'Block A',
      blockFloor: presetFloor || '1st Floor',
      roomNumber: presetRoom || '101',
      bedNumber: 'Bed-1',
      dietPreference: 'Veg',
      messStatus: 'Active',
      monthlyMessPlan: 3800,
      balanceDue: 3800,
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      studentId: student.studentId || '',
      avatar: student.avatar || '',
      hostelName: student.hostelName || 'CV Raman Central Hostel',
      hostelBlock: student.hostelBlock || 'Block A',
      blockFloor: student.blockFloor || student.floor || '1st Floor',
      roomNumber: student.roomNumber || '101',
      bedNumber: student.bedNumber || 'Bed-1',
      dietPreference: student.dietPreference || 'Veg',
      messStatus: student.messStatus || 'Active',
      monthlyMessPlan: student.monthlyMessPlan || 3800,
      balanceDue: student.balanceDue || 0,
    });
    setIsEditModalOpen(true);
  };

  // Add / Edit Submission
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingStudent) {
        const res = await api.put(`/students/${editingStudent._id}`, formData);
        if (res.data?.success) {
          showToast(res.data.message || 'Student details updated successfully', 'success');
          setIsEditModalOpen(false);
          fetchRoomWiseData();
          if (selectedRoomData) {
            // refresh active room inspector
            const updatedStudents = selectedRoomData.students.map((s) =>
              s._id === editingStudent._id ? { ...s, ...formData } : s
            );
            setSelectedRoomData({ ...selectedRoomData, students: updatedStudents });
          }
        }
      } else {
        const res = await api.post('/students', formData);
        if (res.data?.success) {
          showToast(res.data.message || 'Student enrolled successfully!', 'success');
          setIsAddModalOpen(false);
          fetchRoomWiseData();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Deactivate Student (Mark Left Hostel)
  const handleToggleDeactivate = async (student) => {
    const isCurrentlyDeactivated =
      student.messStatus === 'Deactivated' || student.messStatus === 'Left Hostel';
    const confirmMessage = isCurrentlyDeactivated
      ? `Reactivate ${student.name} as an Active hostel resident?`
      : `Deactivate ${student.name}? This marks them as having left the hostel mess.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await api.put(`/students/${student._id}/deactivate`);
      if (res.data?.success) {
        showToast(res.data.message || 'Status updated', 'success');
        fetchRoomWiseData();
        if (selectedRoomData) {
          setIsRoomModalOpen(false);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update student status', 'error');
    }
  };

  // Open Room Inspector Drawer
  const handleOpenRoomInspector = (room) => {
    setSelectedRoomData(room);
    setIsRoomModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <Building className="w-4 h-4" />
            <span>Hostel Room Directory & Residents</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Room-Wise Student Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Group students by block, floor and room, audit monthly fee payment status, and manage hostel room allotments.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Hosteller Student</span>
          </button>
        </div>
      </div>

      {/* 4 Financial & Occupancy KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <DoorClosed className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Rooms</p>
            <h3 className="text-2xl font-black text-slate-900">{stats.totalRooms}</h3>
            <p className="text-[11px] text-slate-500">Across {stats.allBlocks.length} hostel blocks</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Students</p>
            <h3 className="text-2xl font-black text-emerald-600">{stats.totalStudents}</h3>
            <p className="text-[11px] text-slate-500">Hostel room residents</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pending Dues</p>
            <h3 className="text-2xl font-black text-rose-600">{formatINR(stats.totalPendingFees)}</h3>
            <p className="text-[11px] text-slate-500">Cumulative room balances</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unpaid Students</p>
            <h3 className="text-2xl font-black text-amber-600">{stats.unpaidStudentsCount}</h3>
            <p className="text-[11px] text-slate-500">Pending / Overdue payments</p>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Real-time Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by room number (101), student name (Rahul), or enrollment ID (SM-2024-001)..."
              className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </form>

          {/* Block Selector */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white font-medium text-slate-700"
            >
              <option value="All">All Hostel Blocks</option>
              {stats.allBlocks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {/* Floor Selector */}
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white font-medium text-slate-700"
            >
              <option value="All">All Floors</option>
              {stats.allFloors.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            {/* Unpaid Only Filter Toggle */}
            <button
              type="button"
              onClick={() => setOnlyUnpaid(!onlyUnpaid)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                onlyUnpaid
                  ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-500/20 shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${onlyUnpaid ? 'bg-rose-600 animate-pulse' : 'bg-slate-300'}`} />
              <span>Unpaid Only</span>
            </button>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white font-medium text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Residents</option>
              <option value="Deactivated">Deactivated / Left Hostel</option>
            </select>

            <button
              onClick={fetchRoomWiseData}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Refresh Room Directory"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ROOM-WISE STUDENT CARDS VIEW */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LoadingSkeleton count={6} type="card" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/80 shadow-sm">
          <EmptyState
            icon={DoorClosed}
            title="No Rooms or Students Found"
            description="No room allotments matched your search query or selected floor/block filters."
            actionLabel="Enroll Student"
            onAction={() => handleOpenAddModal()}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const hasUnpaid = room.hasUnpaid;
            return (
              <div
                key={room.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* ROOM HEADER BANNER */}
                <div className="p-4 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white flex items-center justify-between border-b border-navy-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-black">
                      <DoorClosed className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-tight text-white flex items-center space-x-2">
                        <span>ROOM {room.roomNumber}</span>
                      </h3>
                      <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">
                        {room.block} • {room.floor}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleOpenRoomInspector(room)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                      title="Open full room details"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ROOM FINANCIAL & OCCUPANCY STRIP */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1 text-slate-600 font-semibold">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {room.totalStudents} {room.totalStudents === 1 ? 'Resident' : 'Residents'}
                    </span>
                  </div>

                  <div>
                    {room.totalPendingFees > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                        {formatINR(room.totalPendingFees)} Due
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Dues Cleared (₹0)
                      </span>
                    )}
                  </div>
                </div>

                {/* STUDENTS IN THIS ROOM */}
                <div className="p-4 space-y-3 divide-y divide-slate-100 flex-1">
                  {room.students.map((student, idx) => {
                    const isDeactivated =
                      student.messStatus === 'Deactivated' || student.messStatus === 'Left Hostel';
                    const isUnpaid = student.balanceDue > 0 || student.latestFeeStatus !== 'PAID';

                    return (
                      <div
                        key={student._id}
                        className={`pt-3 first:pt-0 space-y-2.5 ${isDeactivated ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          {/* Student Photo with Diet Ring */}
                          <div className="relative flex-shrink-0">
                            <img
                              src={
                                student.avatar ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}&backgroundColor=0f172a&textColor=10b981`
                              }
                              alt={student.name}
                              className={`w-12 h-12 rounded-xl object-cover border-2 shadow-sm ${
                                student.dietPreference === 'Veg'
                                  ? 'border-emerald-500'
                                  : student.dietPreference === 'Non-Veg'
                                  ? 'border-amber-500'
                                  : 'border-slate-300'
                              }`}
                            />
                            <span
                              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                isDeactivated ? 'bg-slate-400' : 'bg-emerald-500'
                              }`}
                              title={student.messStatus}
                            />
                          </div>

                          {/* Student Details */}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center space-x-1.5">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {student.name}
                              </h4>
                              {isDeactivated && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-slate-200 text-slate-700">
                                  Left Hostel
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500 font-mono">
                              ID: <strong className="text-slate-800">{student.studentId}</strong> • {student.bedNumber}
                            </p>

                            <p className="text-[11px] text-slate-600 flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <a
                                href={`tel:${student.phone}`}
                                className="hover:text-emerald-600 truncate"
                              >
                                {student.phone}
                              </a>
                            </p>
                          </div>

                          {/* Edit / Deactivate Quick Icons */}
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <button
                              onClick={() => handleOpenEditModal(student)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Edit student particulars"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleDeactivate(student)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDeactivated
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-rose-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title={
                                isDeactivated
                                  ? 'Reactivate student'
                                  : 'Deactivate student (marked as Left Hostel)'
                              }
                            >
                              {isDeactivated ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Monthly Fee Status Pill */}
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Monthly Fee:</span>
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-black uppercase text-[9px] tracking-wider ${
                                student.latestFeeStatus === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : student.latestFeeStatus === 'PARTIALLY PAID'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : student.latestFeeStatus === 'OVERDUE'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {student.latestFeeStatus}
                            </span>
                            {student.balanceDue > 0 && (
                              <span className="font-bold text-rose-600">
                                {formatINR(student.balanceDue)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ROOM BOTTOM ACTION FOOTER */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleOpenAddModal(room.roomNumber, room.block, room.floor)}
                    className="text-emerald-600 hover:text-emerald-700 font-bold text-[11px] flex items-center space-x-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add to Room {room.roomNumber}</span>
                  </button>

                  <button
                    onClick={() => handleOpenRoomInspector(room)}
                    className="text-slate-600 hover:text-slate-900 font-bold text-[11px] flex items-center space-x-1"
                  >
                    <span>Inspect Room</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ROOM INSPECTOR MODAL */}
      <Modal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        title={`Room ${selectedRoomData?.roomNumber || ''} Overview`}
      >
        {selectedRoomData && (
          <div className="space-y-4">
            {/* Room Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-navy-950 to-navy-800 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Hostel Room Allotment
                </span>
                <h3 className="text-xl font-black text-white">ROOM {selectedRoomData.roomNumber}</h3>
                <p className="text-xs text-slate-300">
                  {selectedRoomData.block} • {selectedRoomData.floor}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Room Dues</span>
                <p className="text-lg font-black text-rose-400">
                  {formatINR(selectedRoomData.totalPendingFees)}
                </p>
              </div>
            </div>

            {/* Students List in this Room */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-900">
                Assigned Hostellers ({selectedRoomData.students.length}):
              </p>

              {selectedRoomData.students.map((student) => (
                <div
                  key={student._id}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 space-y-2"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900">{student.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        ID: {student.studentId} • Bed: {student.bedNumber}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {student.phone} • {student.email}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          student.latestFeeStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : student.latestFeeStatus === 'PARTIALLY PAID'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {student.latestFeeStatus}
                      </span>
                      <p className="text-xs font-black text-rose-600">
                        {student.balanceDue > 0 ? formatINR(student.balanceDue) : '₹0 Due'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Diet: {student.dietPreference}</span>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(student)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold"
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={() => handleToggleDeactivate(student)}
                        className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold"
                      >
                        {student.messStatus === 'Deactivated' ? 'Reactivate' : 'Deactivate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => {
                  setIsRoomModalOpen(false);
                  handleOpenAddModal(
                    selectedRoomData.roomNumber,
                    selectedRoomData.block,
                    selectedRoomData.floor
                  );
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                + Add Another Student to Room {selectedRoomData.roomNumber}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: ADD NEW STUDENT */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Student to Hostel Room"
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Student ID / Roll *</label>
              <input
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="e.g. SM-2024-001"
                className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@hostel.in"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
              />
            </div>
          </div>

          {/* Room Allocation Grid */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Room & Bed Allocation
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Hostel Block</label>
                <select
                  value={formData.hostelBlock}
                  onChange={(e) => setFormData({ ...formData, hostelBlock: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                >
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                  <option value="Girls Wing">Girls Wing</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Floor</label>
                <select
                  value={formData.blockFloor}
                  onChange={(e) => setFormData({ ...formData, blockFloor: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                >
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="1st Floor">1st Floor</option>
                  <option value="2nd Floor">2nd Floor</option>
                  <option value="3rd Floor">3rd Floor</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Room No. *</label>
                <input
                  type="text"
                  required
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="e.g. 101"
                  className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Bed No.</label>
                <input
                  type="text"
                  value={formData.bedNumber}
                  onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                  placeholder="Bed-1 / Bed-A"
                  className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Diet Preference</label>
                <select
                  value={formData.dietPreference}
                  onChange={(e) => setFormData({ ...formData, dietPreference: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                >
                  <option value="Veg">Veg</option>
                  <option value="Non-Veg">Non-Veg</option>
                  <option value="Jain">Jain</option>
                  <option value="Eggetarian">Eggetarian</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Mess Fee (₹) *</label>
              <input
                type="number"
                required
                value={formData.monthlyMessPlan}
                onChange={(e) => setFormData({ ...formData, monthlyMessPlan: e.target.value })}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mess Account Status</label>
              <select
                value={formData.messStatus}
                onChange={(e) => setFormData({ ...formData, messStatus: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-semibold"
              >
                <option value="Active">Active</option>
                <option value="Deactivated">Deactivated (Left Hostel)</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex space-x-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all"
            >
              {submitting ? 'Enrolling...' : 'Enroll in Room'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: EDIT STUDENT PARTICULARS */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Details for ${editingStudent?.name || 'Student'}`}
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
              />
            </div>
          </div>

          {/* Room Allotment Fields */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Hostel Room & Bed Allocation
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Hostel Block</label>
                <select
                  value={formData.hostelBlock}
                  onChange={(e) => setFormData({ ...formData, hostelBlock: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                >
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                  <option value="Girls Wing">Girls Wing</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Floor</label>
                <select
                  value={formData.blockFloor}
                  onChange={(e) => setFormData({ ...formData, blockFloor: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                >
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="1st Floor">1st Floor</option>
                  <option value="2nd Floor">2nd Floor</option>
                  <option value="3rd Floor">3rd Floor</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Room Number *</label>
                <input
                  type="text"
                  required
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Bed Allocation</label>
                <input
                  type="text"
                  value={formData.bedNumber}
                  onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Diet Preference</label>
                <select
                  value={formData.dietPreference}
                  onChange={(e) => setFormData({ ...formData, dietPreference: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                >
                  <option value="Veg">Veg</option>
                  <option value="Non-Veg">Non-Veg</option>
                  <option value="Jain">Jain</option>
                  <option value="Eggetarian">Eggetarian</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Plan (₹)</label>
              <input
                type="number"
                value={formData.monthlyMessPlan}
                onChange={(e) => setFormData({ ...formData, monthlyMessPlan: e.target.value })}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mess Resident Status</label>
              <select
                value={formData.messStatus}
                onChange={(e) => setFormData({ ...formData, messStatus: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-semibold"
              >
                <option value="Active">Active Resident</option>
                <option value="Deactivated">Deactivated (Left Hostel)</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex space-x-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentRecords;
