"use client";

import type { ChangeEvent } from "react";
import { useState, useEffect } from "react";

// Types
type Student = {
  _id: string;
  student_id: string;
  student_name: string;
  attendance_percentage: number;
  internal_marks: number;
  assignment_submission_rate: number;
  semester: number;
  risk_score?: number;
  risk_level?: string;
};

type StudentDetails = {
  student: Student;
  prediction?: {
    risk_level: string;
    risk_score: number;
    predicted_at: string;
  };
  risk_factors: Array<{
    factor_name: string;
    current_value: number;
    threshold: number;
    impact: string;
  }>;
  suggestions: string[];
};

type DashboardStats = {
  total_students: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  risk_percentages: {
    high: number;
    medium: number;
    low: number;
  };
};

type UploadStatus = {
  message: string;
  fileId: string;
};

type Visualization = {
  name: string;
  filename: string;
  url: string;
  size: number;
  modified: number;
};

type ReportsStatus = {
  generated: number;
  latest_report_at: number | null;
};

type OverviewResponse = {
  stats: DashboardStats;
  students: Student[];
  visualizations: Visualization[];
  reports: ReportsStatus;
};

// API Functions
const API_BASE = "http://localhost:8000/api";

const uploadCsv = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Upload failed");
  }
  
  return response.json();
};

const runPredictions = async (fileId: string) => {
  const response = await fetch(`${API_BASE}/predict-all/${fileId}`, {
    method: "POST",
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Prediction failed");
  }
  
  return response.json();
};

const fetchStudentDetails = async (studentId: string): Promise<StudentDetails> => {
  const response = await fetch(`${API_BASE}/student/${studentId}`);
  if (!response.ok) throw new Error("Failed to fetch student details");
  return response.json();
};

const fetchOverview = async (): Promise<OverviewResponse> => {
  const response = await fetch(`${API_BASE}/dashboard/overview`);
  if (!response.ok) throw new Error("Failed to fetch overview");
  return response.json();
};

const generateReportsBatch = async (batchSize: number) => {
  const response = await fetch(`${API_BASE}/dashboard/reports/batch?batch_size=${batchSize}`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to generate reports batch");
  return response.json();
};

const sendReportEmail = async (studentId: string, recipientEmail: string) => {
  const response = await fetch(`${API_BASE}/notifications/email-report/${studentId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_email: recipientEmail }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to send email");
  }
  return response.json();
};

const downloadReport = (studentId: string) => {
  window.open(`${API_BASE}/download-report/${studentId}`, "_blank");
};

const generatePlan = async (studentId: string, question: string) => {
  const response = await fetch(`${API_BASE}/ai/plan/${studentId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Plan generation failed");
  }

  return response.json();
};

export default function Home() {
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "dashboard" | "insights">("upload");
  const [planText, setPlanText] = useState<string | null>(null);
  const [planQuestion, setPlanQuestion] = useState("");
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [loadingViz, setLoadingViz] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<ReportsStatus | null>(null);
  const [isGeneratingReports, setIsGeneratingReports] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const quickQuestions = [
    "How can I improve my attendance quickly?",
    "What should I do this week to improve marks?",
    "Give me a 7-day study plan based on my risk factors.",
    "How can I increase assignment submission rate?",
    "What are the top 3 actions I should take now?",
  ];

  // Fetch data
  const loadData = async () => {
    try {
      const overview = await fetchOverview();
      setStudents(overview.students);
      setStats(overview.stats);
      setVisualizations(overview.visualizations);
      setReportStatus(overview.reports);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadVisualizations = async () => {
    setLoadingViz(true);
    try {
      const overview = await fetchOverview();
      setVisualizations(overview.visualizations);
      setReportStatus(overview.reports);
    } catch (error) {
      console.error("Error loading visualizations:", error);
    } finally {
      setLoadingViz(false);
    }
  };

  useEffect(() => {
    if (activeTab === "insights") {
      loadVisualizations();
      const interval = setInterval(loadVisualizations, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setErrorMessage(null);
    setUploadStatus(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select a CSV file to upload.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setUploadStatus(null);

    try {
      const uploadResult = await uploadCsv(selectedFile);
      setUploadStatus({ 
        message: uploadResult.message, 
        fileId: uploadResult.fileId 
      });

      const predictResult = await runPredictions(uploadResult.fileId);
      setUploadStatus(prev => ({
        ...prev!,
        message: `${prev!.message} Predictions completed for ${predictResult.total} students!`
      }));

      await loadData();
      setActiveTab("dashboard");
      
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewStudent = async (studentId: string) => {
    try {
      const details = await fetchStudentDetails(studentId);
      setSelectedStudent(details);
      setShowModal(true);
      setPlanText(null);
      setPlanQuestion("");
      setEmailTo("");
      setEmailStatus(null);
    } catch (error) {
      console.error("Error fetching student details:", error);
      setErrorMessage("Failed to load student details");
    }
  };

  const handleGeneratePlan = async () => {
    if (!selectedStudent) return;

    setIsPlanLoading(true);
    setErrorMessage(null);

    try {
      const result = await generatePlan(
        selectedStudent.student.student_id,
        planQuestion || "Generate a personalized improvement plan based on my risk assessment."
      );
      setPlanText(result.plan);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate plan.";
      setErrorMessage(message);
    } finally {
      setIsPlanLoading(false);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    setPlanQuestion(question);
    if (!selectedStudent) return;
    setIsPlanLoading(true);
    setErrorMessage(null);
    try {
      const result = await generatePlan(selectedStudent.student.student_id, question);
      setPlanText(result.plan);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate plan.";
      setErrorMessage(message);
    } finally {
      setIsPlanLoading(false);
    }
  };

  const handleGenerateReportsBatch = async () => {
    if (isGeneratingReports) return;
    setIsGeneratingReports(true);
    setErrorMessage(null);
    try {
      await generateReportsBatch(10);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate reports.";
      setErrorMessage(message);
    } finally {
      setIsGeneratingReports(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedStudent || !emailTo.trim()) {
      setEmailStatus("Please enter a recipient email.");
      return;
    }
    setIsSendingEmail(true);
    setEmailStatus(null);
    try {
      await sendReportEmail(selectedStudent.student.student_id, emailTo.trim());
      setEmailStatus("Email sent successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email send failed.";
      setEmailStatus(message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRiskBadge = (riskLevel?: string) => {
    if (!riskLevel) return <span className="text-gray-400">Pending</span>;
    
    const colors = {
      HIGH: "bg-gradient-to-r from-red-500 to-red-600",
      MEDIUM: "bg-gradient-to-r from-yellow-500 to-yellow-600",
      LOW: "bg-gradient-to-r from-green-500 to-green-600"
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm ${colors[riskLevel as keyof typeof colors]}`}>
        {riskLevel}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">A</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AcadAlert
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {[
                { id: "upload", label: "Upload CSV", icon: "📤" },
                { id: "dashboard", label: "Dashboard", icon: "📊" },
                { id: "insights", label: "ML Insights", icon: "📈" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        {activeTab === "upload" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Upload Student Data</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Upload a CSV file to generate AI-powered risk predictions
                </p>
              </div>

              <div className="p-8">
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 transition-all hover:bg-blue-50/30 cursor-pointer group">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <span className="text-lg font-medium text-gray-700">
                      {selectedFile ? selectedFile.name : "Choose a CSV file"}
                    </span>
                    <span className="text-sm text-gray-500 mt-2">
                      or drag and drop
                    </span>
                    <span className="text-xs text-gray-400 mt-4">
                      Required: student_id, student_name, attendance_percentage, internal_marks, assignment_submission_rate, semester
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={isLoading}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Upload & Analyze"
                  )}
                </button>

                {errorMessage && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {errorMessage}
                  </div>
                )}
                
                {uploadStatus && (
                  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    <p className="font-medium">{uploadStatus.message}</p>
                    <p className="text-green-700 text-xs mt-1">File ID: {uploadStatus.fileId}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Section */}
        {activeTab === "dashboard" && stats && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Total Students", value: stats.total_students, color: "from-blue-500 to-blue-600", icon: "👥" },
                { label: "High Risk", value: stats.high_risk, color: "from-red-500 to-red-600", icon: "🔴" },
                { label: "Medium Risk", value: stats.medium_risk, color: "from-yellow-500 to-yellow-600", icon: "🟡" },
                { label: "Low Risk", value: stats.low_risk, color: "from-green-500 to-green-600", icon: "🟢" }
              ].map((card, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
                  <div className={`bg-gradient-to-r ${card.color} px-6 py-4`}>
                    <div className="flex justify-between items-center">
                      <span className="text-3xl">{card.icon}</span>
                      <span className="text-white/80 text-sm">Risk Level</span>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Student Risk Analysis</h2>
                    {reportStatus && (
                      <p className="text-xs text-gray-500 mt-1">
                        📄 Reports generated: {reportStatus.generated} / {stats.total_students}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleGenerateReportsBatch}
                    disabled={isGeneratingReports}
                    className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition disabled:opacity-50"
                  >
                    {isGeneratingReports ? "Generating..." : "Generate Next 10 Reports"}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Student ID", "Name", "Attendance", "Internal Marks", "Risk Level", "Risk Score", "Actions"].map((header) => (
                        <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {students.map((student) => (
                      <tr key={student._id} className="hover:bg-blue-50/30 transition group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.student_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{student.attendance_percentage}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${student.attendance_percentage}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{student.internal_marks}/100</span>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${student.internal_marks}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getRiskBadge(student.risk_level)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                          {student.risk_score ? `${(student.risk_score * 100).toFixed(1)}%` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                          <button
                            onClick={() => handleViewStudent(student.student_id)}
                            className="text-blue-600 hover:text-blue-800 font-medium transition"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => downloadReport(student.student_id)}
                            className="text-gray-600 hover:text-gray-800 font-medium transition"
                          >
                            Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No students loaded. Please upload a CSV file first.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ML Insights Section */}
        {activeTab === "insights" && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Machine Learning Insights</h2>
              <p className="text-gray-500 text-sm mt-2">
                Real-time visualizations from our ML pipeline showing risk patterns and feature relationships
              </p>
            </div>
            
            {loadingViz && visualizations.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading visualizations...</p>
                </div>
              </div>
            ) : visualizations.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500">No visualizations available yet. Run the ML pipeline to generate insights.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {visualizations.map((viz, idx) => (
                  <div 
                    key={idx}
                    className="group relative bg-gray-50 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200"
                    onClick={() => setSelectedImage(`http://localhost:8000/visualizations/${viz.filename}`)}
                  >
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
                      <img 
                        src={`http://localhost:8000/visualizations/${viz.filename}`}
                        alt={viz.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Loading...';
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end">
                      <div className="p-4 text-white">
                        <p className="text-sm font-medium">Click to enlarge</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white border-t border-gray-200">
                      <h3 className="font-semibold text-gray-800">{viz.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Student Details Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {selectedStudent.student.student_name}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Student ID</p>
                  <p className="font-semibold text-gray-800">{selectedStudent.student.student_id}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Semester</p>
                  <p className="font-semibold text-gray-800">{selectedStudent.student.semester}</p>
                </div>
              </div>

              {/* Academic Performance */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">📚 Academic Performance</h3>
                <div className="space-y-3">
                  {[
                    { label: "Attendance", value: selectedStudent.student.attendance_percentage, color: "blue" },
                    { label: "Internal Marks", value: selectedStudent.student.internal_marks, color: "green" },
                    { label: "Assignment Submission", value: selectedStudent.student.assignment_submission_rate, color: "purple" }
                  ].map((metric) => (
                    <div key={metric.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{metric.label}</span>
                        <span className="font-semibold">{metric.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`bg-${metric.color}-600 h-2 rounded-full`} style={{ width: `${metric.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Assessment */}
              {selectedStudent.prediction && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">⚠️ Risk Assessment</h3>
                  <div className={`rounded-xl p-4 ${getRiskColor(selectedStudent.prediction.risk_level)}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Risk Level: {selectedStudent.prediction.risk_level}</span>
                      <span className="text-sm">Score: {(selectedStudent.prediction.risk_score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Factors */}
              {selectedStudent.risk_factors.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">🔍 Key Risk Factors</h3>
                  <div className="space-y-2">
                    {selectedStudent.risk_factors.map((factor, idx) => (
                      <div key={idx} className="border-l-4 border-red-400 pl-3 py-2 bg-red-50 rounded-r-lg">
                        <p className="font-medium text-sm">{factor.factor_name}</p>
                        <p className="text-xs text-gray-600">
                          Current: {factor.current_value}% | Threshold: {factor.threshold}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedStudent.suggestions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">💡 Recommendations</h3>
                  <ul className="space-y-2">
                    {selectedStudent.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <button
                  onClick={() => downloadReport(selectedStudent.student.student_id)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition"
                >
                  📄 Download Full Report (PDF)
                </button>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
                  <p className="text-sm font-semibold text-gray-900">Send Report Email</p>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="Recipient email"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail}
                    className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {isSendingEmail ? "Sending..." : "Send Email to Student"}
                  </button>
                  {emailStatus && (
                    <div className="text-xs text-gray-600">{emailStatus}</div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleQuickQuestion(q)}
                      className="text-left rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>                <textarea
                  value={planQuestion}
                  onChange={(e) => setPlanQuestion(e.target.value)}
                  placeholder="Ask a follow-up question - e.g., 'How can I improve my attendance?'"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
                <button
                  onClick={handleGeneratePlan}
                  disabled={isPlanLoading}
                  className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {isPlanLoading ? "Generating Plan..." : "✨ Generate AI Improvement Plan"}
                </button>
                {planText && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm whitespace-pre-line">
                    {planText}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl max-h-[90vh]">
            <img src={selectedImage} alt="Visualization" className="max-w-full max-h-full object-contain rounded-xl" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/75 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


