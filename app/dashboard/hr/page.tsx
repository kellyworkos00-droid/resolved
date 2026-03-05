"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Target,
  BookOpen,
  Award,
  MapPin,
  Plus,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [appraisals, setAppraisals] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    activeGoals: 0,
    completedTrainings: 0,
    avgAttendance: 0,
  });

  useEffect(() => {
    fetchHRData();
  }, []);

  const fetchHRData = async () => {
    try {
      setLoading(true);
      const [appraisalsRes, trainingsRes, attendanceRes, goalsRes] = await Promise.all([
        fetch("/api/hr/performance-appraisals"),
        fetch("/api/hr/training"),
        fetch("/api/hr/attendance-location"),
        fetch("/api/hr/employee-goals"),
      ]);

      const [appraisalsData, trainingsData, attendanceData, goalsData] = await Promise.all([
        appraisalsRes.json(),
        trainingsRes.json(),
        attendanceRes.json(),
        goalsRes.json(),
      ]);

      setAppraisals(appraisalsData || []);
      setTrainings(trainingsData || []);
      setAttendance(attendanceData || []);
      setGoals(goalsData.goals || []);

      // Calculate metrics
      const activeGoals = goalsData.goals?.filter((g: any) => g.status === "ACTIVE").length || 0;
      const completedTrainings = trainingsData.filter((t: any) => t.status === "COMPLETED").length || 0;
      const avgAttendance = attendanceData.length > 0
        ? (attendanceData.filter((a: any) => a.status === "PRESENT").length / attendanceData.length * 100).toFixed(1)
        : 0;

      setMetrics({
        totalEmployees: attendanceData.length || 0,
        activeGoals,
        completedTrainings,
        avgAttendance: parseFloat(avgAttendance as any),
      });
    } catch (error) {
      console.error("Error fetching HR data:", error);
    } finally {
      setLoading(false);
    }
  };

  const appraisalStatusData = [
    { name: "Draft", value: appraisals.filter((a: any) => a.status === "DRAFT").length },
    { name: "In Progress", value: appraisals.filter((a: any) => a.status === "IN_PROGRESS").length },
    { name: "Completed", value: appraisals.filter((a: any) => a.status === "COMPLETED").length },
  ];

  const goalProgressData = [
    { name: "0-25%", value: goals.filter((g: any) => g.progressPercent <= 25).length },
    { name: "25-50%", value: goals.filter((g: any) => g.progressPercent > 25 && g.progressPercent <= 50).length },
    { name: "50-75%", value: goals.filter((g: any) => g.progressPercent > 50 && g.progressPercent <= 75).length },
    { name: "75-100%", value: goals.filter((g: any) => g.progressPercent > 75).length },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">HR Management</h1>
          <p className="text-gray-600">Advanced HR & Talent Management</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Total Employees</CardTitle>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEmployees}</div>
            <p className="text-xs text-gray-600 mt-1">Active in system</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Active Goals</CardTitle>
              <Target className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeGoals}</div>
            <p className="text-xs text-gray-600 mt-1">In progress</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Trainings Completed</CardTitle>
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completedTrainings}</div>
            <p className="text-xs text-gray-600 mt-1">Employees trained</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Attendance Rate</CardTitle>
              <Award className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgAttendance}%</div>
            <p className="text-xs text-gray-600 mt-1">Average</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        {[
          { id: "overview", label: "Overview", icon: Award },
          { id: "appraisals", label: "Performance", icon: TrendingUp },
          { id: "training", label: "Training", icon: BookOpen },
          { id: "attendance", label: "Attendance", icon: Clock },
          { id: "goals", label: "Goals", icon: Target },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Appraisal Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {appraisalStatusData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={appraisalStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }: any) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">No appraisals yet</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Goal Progress Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {goalProgressData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={goalProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">No goals yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Appraisals Tab */}
      {activeTab === "appraisals" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Performance Appraisals</h2>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Appraisal
            </Button>
          </div>
          <div className="space-y-3">
            {appraisals.length > 0 ? (
              appraisals.slice(0, 5).map((appraisal: any) => (
                <Card key={appraisal.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">
                          {appraisal.employee?.firstName} {appraisal.employee?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {appraisal.appraisalType} - {new Date(appraisal.appraisalDate).toLocaleDateString()}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span>Self Rating: {appraisal.selfRating}/5</span>
                          <span>Manager Rating: {appraisal.managerRating}/5</span>
                          <span className="font-semibold">Status: {appraisal.status}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No appraisals found</p>
            )}
          </div>
        </div>
      )}

      {/* Training Tab */}
      {activeTab === "training" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Training Programs</h2>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Program
            </Button>
          </div>
          <div className="space-y-3">
            {trainings.length > 0 ? (
              trainings.slice(0, 5).map((training: any) => (
                <Card key={training.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{training.title || training.program?.title}</p>
                        <p className="text-sm text-gray-600">{training.category}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span>Status: {training.status}</span>
                          {training.completionPercent !== undefined && (
                            <span>Progress: {training.completionPercent}%</span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">View Program</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No training programs found</p>
            )}
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Attendance Records</h2>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Filter by date"
                className="w-40"
              />
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Record Attendance
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {attendance.length > 0 ? (
              attendance.slice(0, 5).map((record: any) => (
                <Card key={record.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">
                          {record.employee?.firstName} {record.employee?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm flex-wrap">
                          <span>Status: {record.status}</span>
                          {record.checkIn && <span>Check-in: {new Date(record.checkIn).toLocaleTimeString()}</span>}
                          {record.hoursWorked && <span>Hours: {record.hoursWorked}h</span>}
                          {record.locationData?.checkInLocation && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {record.locationData.checkInLocation}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No attendance records found</p>
            )}
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === "goals" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Employee Goals</h2>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </div>
          <div className="space-y-3">
            {goals.length > 0 ? (
              goals.slice(0, 5).map((goal: any) => (
                <Card key={goal.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{goal.title}</p>
                        <p className="text-sm text-gray-600">
                          {goal.employee?.firstName} {goal.employee?.lastName}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                          <span>Priority: {goal.priority}</span>
                          <span>Progress: {goal.progressPercent}%</span>
                        </div>
                        <div className="mt-3 bg-gray-200 rounded-full h-2 w-full">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${goal.progressPercent}%` }}
                          />
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Update</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No goals found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
