// "use client";

// import type { ChangeEvent } from "react";
// import { useState, useEffect } from "react";

// // Types
// type Student = {
//   _id: string;
//   student_id: string;
//   student_name: string;
//   attendance_percentage: number;
//   internal_marks: number;
//   assignment_submission_rate: number;
//   semester: number;
//   risk_score?: number;
//   risk_level?: string;
// };

// type StudentDetails = {
//   student: Student;
//   prediction?: {
//     risk_level: string;
//     risk_score: number;
//     predicted_at: string;
//   };
//   risk_factors: Array<{
//     factor_name: string;
//     current_value: number;
//     threshold: number;
//     impact: string;
//   }>;
//   suggestions: string[];
// };

// type DashboardStats = {
//   total_students: number;
//   high_risk: number;
//   medium_risk: number;
//   low_risk: number;
//   risk_percentages: {
//     high: number;
//     medium: number;
//     low: number;
//   };
// };

// type UploadStatus = {
//   message: string;
//   fileId: string;
// };

// type Visualization = {
//   name: string;
//   filename: string;
//   url: string;
//   size: number;
//   modified: number;
// };

// type ReportsStatus = {
//   generated: number;
//   latest_report_at: number | null;
// };

// type OverviewResponse = {
//   stats: DashboardStats;
//   students: Student[];
//   visualizations: Visualization[];
//   reports: ReportsStatus;
// };

// // API Functions
// const API_BASE = "http://localhost:8000/api";

// const uploadCsv = async (file: File) => {
//   const formData = new FormData();
//   formData.append("file", file);
  
//   const response = await fetch(`${API_BASE}/upload`, {
//     method: "POST",
//     body: formData,
//   });
  
//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.detail || "Upload failed");
//   }
  
//   return response.json();
// };

// const runPredictions = async (fileId: string) => {
//   const response = await fetch(`${API_BASE}/predict-all/${fileId}`, {
//     method: "POST",
//   });
  
//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.detail || "Prediction failed");
//   }
  
//   return response.json();
// };

// const fetchStudentDetails = async (studentId: string): Promise<StudentDetails> => {
//   const response = await fetch(`${API_BASE}/student/${studentId}`);
//   if (!response.ok) throw new Error("Failed to fetch student details");
//   return response.json();
// };

// const fetchOverview = async (): Promise<OverviewResponse> => {
//   const response = await fetch(`${API_BASE}/dashboard/overview`);
//   if (!response.ok) throw new Error("Failed to fetch overview");
//   return response.json();
// };

// const generateReportsBatch = async (batchSize: number) => {
//   const response = await fetch(`${API_BASE}/dashboard/reports/batch?batch_size=${batchSize}`, {
//     method: "POST",
//   });
//   if (!response.ok) throw new Error("Failed to generate reports batch");
//   return response.json();
// };

// const sendReportEmail = async (studentId: string, recipientEmail: string) => {
//   const response = await fetch(`${API_BASE}/notifications/email-report/${studentId}`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ recipient_email: recipientEmail }),
//   });
//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.detail || "Failed to send email");
//   }
//   return response.json();
// };

// const downloadReport = (studentId: string) => {
//   window.open(`${API_BASE}/download-report/${studentId}`, "_blank");
// };

// const generatePlan = async (studentId: string, question: string) => {
//   const response = await fetch(`${API_BASE}/ai/plan/${studentId}`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ question }),
//   });

//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.detail || "Plan generation failed");
//   }

//   return response.json();
// };

// export default function Home() {
//   // State
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
//   const [students, setStudents] = useState<Student[]>([]);
//   const [stats, setStats] = useState<DashboardStats | null>(null);
//   const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
//   const [showModal, setShowModal] = useState(false);
//   const [activeTab, setActiveTab] = useState<"upload" | "dashboard" | "insights">("upload");
//   const [planText, setPlanText] = useState<string | null>(null);
//   const [planQuestion, setPlanQuestion] = useState("");
//   const [isPlanLoading, setIsPlanLoading] = useState(false);
//   const [visualizations, setVisualizations] = useState<Visualization[]>([]);
//   const [loadingViz, setLoadingViz] = useState(false);
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);
//   const [reportStatus, setReportStatus] = useState<ReportsStatus | null>(null);
//   const [isGeneratingReports, setIsGeneratingReports] = useState(false);
//   const [emailTo, setEmailTo] = useState("");
//   const [isSendingEmail, setIsSendingEmail] = useState(false);
//   const [emailStatus, setEmailStatus] = useState<string | null>(null);
//   const quickQuestions = [
//     "How can I improve my attendance quickly?",
//     "What should I do this week to improve marks?",
//     "Give me a 7-day study plan based on my risk factors.",
//     "How can I increase assignment submission rate?",
//     "What are the top 3 actions I should take now?",
//   ];

//   // Fetch data
//   const loadData = async () => {
//     try {
//       const overview = await fetchOverview();
//       setStudents(overview.students);
//       setStats(overview.stats);
//       setVisualizations(overview.visualizations);
//       setReportStatus(overview.reports);
//     } catch (error) {
//       console.error("Error loading data:", error);
//     }
//   };

//   const loadVisualizations = async () => {
//     setLoadingViz(true);
//     try {
//       const overview = await fetchOverview();
//       setVisualizations(overview.visualizations);
//       setReportStatus(overview.reports);
//     } catch (error) {
//       console.error("Error loading visualizations:", error);
//     } finally {
//       setLoadingViz(false);
//     }
//   };

//   useEffect(() => {
//     if (activeTab === "insights") {
//       loadVisualizations();
//       const interval = setInterval(loadVisualizations, 10000);
//       return () => clearInterval(interval);
//     }
//   }, [activeTab]);

//   const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0] ?? null;
//     setSelectedFile(file);
//     setErrorMessage(null);
//     setUploadStatus(null);
//   };

//   const handleUpload = async () => {
//     if (!selectedFile) {
//       setErrorMessage("Please select a CSV file to upload.");
//       return;
//     }

//     setIsLoading(true);
//     setErrorMessage(null);
//     setUploadStatus(null);

//     try {
//       const uploadResult = await uploadCsv(selectedFile);
//       setUploadStatus({ 
//         message: uploadResult.message, 
//         fileId: uploadResult.fileId 
//       });

//       const predictResult = await runPredictions(uploadResult.fileId);
//       setUploadStatus(prev => ({
//         ...prev!,
//         message: `${prev!.message} Predictions completed for ${predictResult.total} students!`
//       }));

//       await loadData();
//       setActiveTab("dashboard");
      
//     } catch (error) {
//       const message = error instanceof Error ? error.message : "Upload failed.";
//       setErrorMessage(message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleViewStudent = async (studentId: string) => {
//     try {
//       const details = await fetchStudentDetails(studentId);
//       setSelectedStudent(details);
//       setShowModal(true);
//       setPlanText(null);
//       setPlanQuestion("");
//       setEmailTo("");
//       setEmailStatus(null);
//     } catch (error) {
//       console.error("Error fetching student details:", error);
//       setErrorMessage("Failed to load student details");
//     }
//   };

//   const handleGeneratePlan = async () => {
//     if (!selectedStudent) return;

//     setIsPlanLoading(true);
//     setErrorMessage(null);

//     try {
//       const result = await generatePlan(
//         selectedStudent.student.student_id,
//         planQuestion || "Generate a personalized improvement plan based on my risk assessment."
//       );
//       setPlanText(result.plan);
//     } catch (error) {
//       const message = error instanceof Error ? error.message : "Failed to generate plan.";
//       setErrorMessage(message);
//     } finally {
//       setIsPlanLoading(false);
//     }
//   };

//   const handleQuickQuestion = async (question: string) => {
//     setPlanQuestion(question);
//     if (!selectedStudent) return;
//     setIsPlanLoading(true);
//     setErrorMessage(null);
//     try {
//       const result = await generatePlan(selectedStudent.student.student_id, question);
//       setPlanText(result.plan);
//     } catch (error) {
//       const message = error instanceof Error ? error.message : "Failed to generate plan.";
//       setErrorMessage(message);
//     } finally {
//       setIsPlanLoading(false);
//     }
//   };

//   const handleGenerateReportsBatch = async () => {
//     if (isGeneratingReports) return;
//     setIsGeneratingReports(true);
//     setErrorMessage(null);
//     try {
//       await generateReportsBatch(10);
//       await loadData();
//     } catch (error) {
//       const message = error instanceof Error ? error.message : "Failed to generate reports.";
//       setErrorMessage(message);
//     } finally {
//       setIsGeneratingReports(false);
//     }
//   };

//   const handleSendEmail = async () => {
//     if (!selectedStudent || !emailTo.trim()) {
//       setEmailStatus("Please enter a recipient email.");
//       return;
//     }
//     setIsSendingEmail(true);
//     setEmailStatus(null);
//     try {
//       await sendReportEmail(selectedStudent.student.student_id, emailTo.trim());
//       setEmailStatus("Email sent successfully.");
//     } catch (error) {
//       const message = error instanceof Error ? error.message : "Email send failed.";
//       setEmailStatus(message);
//     } finally {
//       setIsSendingEmail(false);
//     }
//   };

//   const getRiskColor = (riskLevel?: string) => {
//     switch (riskLevel) {
//       case "HIGH":
//         return "bg-red-100 text-red-800 border-red-200";
//       case "MEDIUM":
//         return "bg-yellow-100 text-yellow-800 border-yellow-200";
//       case "LOW":
//         return "bg-green-100 text-green-800 border-green-200";
//       default:
//         return "bg-gray-100 text-gray-800 border-gray-200";
//     }
//   };

//   const getRiskBadge = (riskLevel?: string) => {
//     if (!riskLevel) return <span className="text-gray-400">Pending</span>;
    
//     const colors = {
//       HIGH: "bg-gradient-to-r from-red-500 to-red-600",
//       MEDIUM: "bg-gradient-to-r from-yellow-500 to-yellow-600",
//       LOW: "bg-gradient-to-r from-green-500 to-green-600"
//     };
    
//     return (
//       <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm ${colors[riskLevel as keyof typeof colors]}`}>
//         {riskLevel}
//       </span>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
//       {/* Navigation */}
//       <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between h-16">
//             <div className="flex items-center space-x-2">
//               <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
//                 <span className="text-white text-lg font-bold">A</span>
//               </div>
//               <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
//                 AcadAlert
//               </h1>
//             </div>
//             <div className="flex items-center space-x-2">
//               {[
//                 { id: "upload", label: "Upload CSV", icon: "📤" },
//                 { id: "dashboard", label: "Dashboard", icon: "📊" },
//                 { id: "insights", label: "ML Insights", icon: "📈" }
//               ].map((tab) => (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id as any)}
//                   className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
//                     activeTab === tab.id
//                       ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
//                       : "text-gray-600 hover:bg-gray-100"
//                   }`}
//                 >
//                   <span className="mr-1">{tab.icon}</span>
//                   {tab.label}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       </nav>

//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Upload Section */}
//         {activeTab === "upload" && (
//           <div className="max-w-2xl mx-auto">
//             <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
//               <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
//                 <h2 className="text-2xl font-bold text-white">Upload Student Data</h2>
//                 <p className="text-blue-100 text-sm mt-1">
//                   Upload a CSV file to generate AI-powered risk predictions
//                 </p>
//               </div>

//               <div className="p-8">
//                 <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 transition-all hover:bg-blue-50/30 cursor-pointer group">
//                   <input
//                     type="file"
//                     accept=".csv"
//                     onChange={handleFileChange}
//                     className="hidden"
//                     id="file-upload"
//                   />
//                   <label
//                     htmlFor="file-upload"
//                     className="cursor-pointer flex flex-col items-center"
//                   >
//                     <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
//                       <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//                       </svg>
//                     </div>
//                     <span className="text-lg font-medium text-gray-700">
//                       {selectedFile ? selectedFile.name : "Choose a CSV file"}
//                     </span>
//                     <span className="text-sm text-gray-500 mt-2">
//                       or drag and drop
//                     </span>
//                     <span className="text-xs text-gray-400 mt-4">
//                       Required: student_id, student_name, attendance_percentage, internal_marks, assignment_submission_rate, semester
//                     </span>
//                   </label>
//                 </div>

//                 <button
//                   onClick={handleUpload}
//                   disabled={isLoading}
//                   className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {isLoading ? (
//                     <span className="flex items-center justify-center">
//                       <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                       Processing...
//                     </span>
//                   ) : (
//                     "Upload & Analyze"
//                   )}
//                 </button>

//                 {errorMessage && (
//                   <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
//                     {errorMessage}
//                   </div>
//                 )}
                
//                 {uploadStatus && (
//                   <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
//                     <p className="font-medium">{uploadStatus.message}</p>
//                     <p className="text-green-700 text-xs mt-1">File ID: {uploadStatus.fileId}</p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Dashboard Section */}
//         {activeTab === "dashboard" && stats && (
//           <>
//             {/* Stats Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//               {[
//                 { label: "Total Students", value: stats.total_students, color: "from-blue-500 to-blue-600", icon: "👥" },
//                 { label: "High Risk", value: stats.high_risk, color: "from-red-500 to-red-600", icon: "🔴" },
//                 { label: "Medium Risk", value: stats.medium_risk, color: "from-yellow-500 to-yellow-600", icon: "🟡" },
//                 { label: "Low Risk", value: stats.low_risk, color: "from-green-500 to-green-600", icon: "🟢" }
//               ].map((card, idx) => (
//                 <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
//                   <div className={`bg-gradient-to-r ${card.color} px-6 py-4`}>
//                     <div className="flex justify-between items-center">
//                       <span className="text-3xl">{card.icon}</span>
//                       <span className="text-white/80 text-sm">Risk Level</span>
//                     </div>
//                   </div>
//                   <div className="px-6 py-4">
//                     <p className="text-3xl font-bold text-gray-800">{card.value}</p>
//                     <p className="text-sm text-gray-500 mt-1">{card.label}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Students Table */}
//             <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
//               <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
//                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//                   <div>
//                     <h2 className="text-lg font-semibold text-gray-800">Student Risk Analysis</h2>
//                     {reportStatus && (
//                       <p className="text-xs text-gray-500 mt-1">
//                         📄 Reports generated: {reportStatus.generated} / {stats.total_students}
//                       </p>
//                     )}
//                   </div>
//                   <button
//                     onClick={handleGenerateReportsBatch}
//                     disabled={isGeneratingReports}
//                     className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition disabled:opacity-50"
//                   >
//                     {isGeneratingReports ? "Generating..." : "Generate Next 10 Reports"}
//                   </button>
//                 </div>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       {["Student ID", "Name", "Attendance", "Internal Marks", "Risk Level", "Risk Score", "Actions"].map((header) => (
//                         <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
//                           {header}
//                         </th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-100">
//                     {students.map((student) => (
//                       <tr key={student._id} className="hover:bg-blue-50/30 transition group">
//                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_id}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.student_name}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="flex items-center gap-2">
//                             <span className="text-sm text-gray-600">{student.attendance_percentage}%</span>
//                             <div className="w-16 bg-gray-200 rounded-full h-1.5">
//                               <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${student.attendance_percentage}%` }} />
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="flex items-center gap-2">
//                             <span className="text-sm text-gray-600">{student.internal_marks}/100</span>
//                             <div className="w-16 bg-gray-200 rounded-full h-1.5">
//                               <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${student.internal_marks}%` }} />
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">{getRiskBadge(student.risk_level)}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
//                           {student.risk_score ? `${(student.risk_score * 100).toFixed(1)}%` : '-'}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
//                           <button
//                             onClick={() => handleViewStudent(student.student_id)}
//                             className="text-blue-600 hover:text-blue-800 font-medium transition"
//                           >
//                             Details
//                           </button>
//                           <button
//                             onClick={() => downloadReport(student.student_id)}
//                             className="text-gray-600 hover:text-gray-800 font-medium transition"
//                           >
//                             Report
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//                 {students.length === 0 && (
//                   <div className="text-center py-12">
//                     <p className="text-gray-500">No students loaded. Please upload a CSV file first.</p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </>
//         )}

//         {/* ML Insights Section */}
//         {activeTab === "insights" && (
//           <div className="bg-white rounded-2xl shadow-lg p-6">
//             <div className="text-center mb-8">
//               <h2 className="text-2xl font-bold text-gray-800">Machine Learning Insights</h2>
//               <p className="text-gray-500 text-sm mt-2">
//                 Real-time visualizations from our ML pipeline showing risk patterns and feature relationships
//               </p>
//             </div>
            
//             {loadingViz && visualizations.length === 0 ? (
//               <div className="flex justify-center items-center py-20">
//                 <div className="text-center">
//                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//                   <p className="text-gray-500 mt-4">Loading visualizations...</p>
//                 </div>
//               </div>
//             ) : visualizations.length === 0 ? (
//               <div className="text-center py-20">
//                 <p className="text-gray-500">No visualizations available yet. Run the ML pipeline to generate insights.</p>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 {visualizations.map((viz, idx) => (
//                   <div 
//                     key={idx}
//                     className="group relative bg-gray-50 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200"
//                     onClick={() => setSelectedImage(`http://localhost:8000/visualizations/${viz.filename}`)}
//                   >
//                     <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
//                       <img 
//                         src={`http://localhost:8000/visualizations/${viz.filename}`}
//                         alt={viz.name}
//                         className="max-w-full max-h-full object-contain group-hover:scale-105 transition duration-500"
//                         onError={(e) => {
//                           (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Loading...';
//                         }}
//                       />
//                     </div>
//                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end">
//                       <div className="p-4 text-white">
//                         <p className="text-sm font-medium">Click to enlarge</p>
//                       </div>
//                     </div>
//                     <div className="p-4 bg-white border-t border-gray-200">
//                       <h3 className="font-semibold text-gray-800">{viz.name}</h3>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}
//       </main>

//       {/* Student Details Modal */}
//       {showModal && selectedStudent && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
//           <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
//             <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
//               <h2 className="text-xl font-bold text-white">
//                 {selectedStudent.student.student_name}
//               </h2>
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="text-white/80 hover:text-white transition"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>
            
//             <div className="px-6 py-6 space-y-6">
//               {/* Basic Info */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="bg-gray-50 rounded-xl p-3">
//                   <p className="text-xs text-gray-500">Student ID</p>
//                   <p className="font-semibold text-gray-800">{selectedStudent.student.student_id}</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-xl p-3">
//                   <p className="text-xs text-gray-500">Semester</p>
//                   <p className="font-semibold text-gray-800">{selectedStudent.student.semester}</p>
//                 </div>
//               </div>

//               {/* Academic Performance */}
//               <div>
//                 <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">📚 Academic Performance</h3>
//                 <div className="space-y-3">
//                   {[
//                     { label: "Attendance", value: selectedStudent.student.attendance_percentage, color: "blue" },
//                     { label: "Internal Marks", value: selectedStudent.student.internal_marks, color: "green" },
//                     { label: "Assignment Submission", value: selectedStudent.student.assignment_submission_rate, color: "purple" }
//                   ].map((metric) => (
//                     <div key={metric.label}>
//                       <div className="flex justify-between text-sm mb-1">
//                         <span className="text-gray-600">{metric.label}</span>
//                         <span className="font-semibold">{metric.value}%</span>
//                       </div>
//                       <div className="w-full bg-gray-200 rounded-full h-2">
//                         <div className={`bg-${metric.color}-600 h-2 rounded-full`} style={{ width: `${metric.value}%` }} />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Risk Assessment */}
//               {selectedStudent.prediction && (
//                 <div>
//                   <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">⚠️ Risk Assessment</h3>
//                   <div className={`rounded-xl p-4 ${getRiskColor(selectedStudent.prediction.risk_level)}`}>
//                     <div className="flex justify-between items-center">
//                       <span className="font-semibold">Risk Level: {selectedStudent.prediction.risk_level}</span>
//                       <span className="text-sm">Score: {(selectedStudent.prediction.risk_score * 100).toFixed(1)}%</span>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Risk Factors */}
//               {selectedStudent.risk_factors.length > 0 && (
//                 <div>
//                   <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">🔍 Key Risk Factors</h3>
//                   <div className="space-y-2">
//                     {selectedStudent.risk_factors.map((factor, idx) => (
//                       <div key={idx} className="border-l-4 border-red-400 pl-3 py-2 bg-red-50 rounded-r-lg">
//                         <p className="font-medium text-sm">{factor.factor_name}</p>
//                         <p className="text-xs text-gray-600">
//                           Current: {factor.current_value}% | Threshold: {factor.threshold}%
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Recommendations */}
//               {selectedStudent.suggestions.length > 0 && (
//                 <div>
//                   <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">💡 Recommendations</h3>
//                   <ul className="space-y-2">
//                     {selectedStudent.suggestions.map((suggestion, idx) => (
//                       <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
//                         <span className="text-green-600 mt-0.5">✓</span>
//                         <span>{suggestion}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}

//               {/* Buttons */}
//               <div className="pt-4 border-t border-gray-200 space-y-3">
//                 <button
//                   onClick={() => downloadReport(selectedStudent.student.student_id)}
//                   className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition"
//                 >
//                   📄 Download Full Report (PDF)
//                 </button>
//                 <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
//                   <p className="text-sm font-semibold text-gray-900">Send Report Email</p>
//                   <input
//                     type="email"
//                     value={emailTo}
//                     onChange={(e) => setEmailTo(e.target.value)}
//                     placeholder="Recipient email"
//                     className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                   <button
//                     onClick={handleSendEmail}
//                     disabled={isSendingEmail}
//                     className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
//                   >
//                     {isSendingEmail ? "Sending..." : "Send Email to Student"}
//                   </button>
//                   {emailStatus && (
//                     <div className="text-xs text-gray-600">{emailStatus}</div>
//                   )}
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
//                   {quickQuestions.map((q) => (
//                     <button
//                       key={q}
//                       type="button"
//                       onClick={() => handleQuickQuestion(q)}
//                       className="text-left rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition"
//                     >
//                       {q}
//                     </button>
//                   ))}
//                 </div>                <textarea
//                   value={planQuestion}
//                   onChange={(e) => setPlanQuestion(e.target.value)}
//                   placeholder="Ask a follow-up question - e.g., 'How can I improve my attendance?'"
//                   className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   rows={2}
//                 />
//                 <button
//                   onClick={handleGeneratePlan}
//                   disabled={isPlanLoading}
//                   className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
//                 >
//                   {isPlanLoading ? "Generating Plan..." : "✨ Generate AI Improvement Plan"}
//                 </button>
//                 {planText && (
//                   <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm whitespace-pre-line">
//                     {planText}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Image Zoom Modal */}
//       {selectedImage && (
//         <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
//           <div className="relative max-w-5xl max-h-[90vh]">
//             <img src={selectedImage} alt="Visualization" className="max-w-full max-h-full object-contain rounded-xl" />
//             <button
//               onClick={() => setSelectedImage(null)}
//               className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/75 transition"
//             >
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  LayoutDashboard,
  TrendingUp,
  FileText,
  MessageSquare,
  HomeIcon,
  Download,
  Mail,
  Sparkles,
  ChevronRight,
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Eye,
  X,
  Send,
  Menu,
  Moon,
  Sun,
  Brain,
  GraduationCap,
  Activity,
  BarChart3
} from "lucide-react";

// Types
type StudentData = {
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

type StudentDetailsType = {
  student: StudentData;
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

type DashboardStatsType = {
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

type UploadStatusType = {
  message: string;
  fileId: string;
};

type VisualizationType = {
  name: string;
  filename: string;
  url: string;
  size: number;
  modified: number;
};

type ReportsStatusType = {
  generated: number;
  latest_report_at: number | null;
};

type OverviewResponseType = {
  stats: DashboardStatsType;
  students: StudentData[];
  visualizations: VisualizationType[];
  reports: ReportsStatusType;
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

const fetchStudentDetails = async (studentId: string): Promise<StudentDetailsType> => {
  const response = await fetch(`${API_BASE}/student/${studentId}`);
  if (!response.ok) throw new Error("Failed to fetch student details");
  return response.json();
};

const fetchOverview = async (): Promise<OverviewResponseType> => {
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

export default function AcadAlertApp() {
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatusType | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailsType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "dashboard" | "insights" | "reports" | "assistant">("home");
  const [planText, setPlanText] = useState<string | null>(null);
  const [planQuestion, setPlanQuestion] = useState("");
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [visualizations, setVisualizations] = useState<VisualizationType[]>([]);
  const [loadingViz, setLoadingViz] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<ReportsStatusType | null>(null);
  const [isGeneratingReports, setIsGeneratingReports] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const quickQuestions = [
    "How can I improve my attendance quickly?",
    "What should I do this week to improve marks?",
    "Give me a 7-day study plan based on my risk factors.",
    "How can I increase assignment submission rate?",
    "What are the top 3 actions I should take now?",
  ];

  // Load Data
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      setUploadStatus({ message: uploadResult.message, fileId: uploadResult.fileId });
      const predictResult = await runPredictions(uploadResult.fileId);
      setUploadStatus(prev => ({
        ...prev!,
        message: `${prev!.message} Predictions completed for ${predictResult.total} students!`
      }));
      await loadData();
      setActiveTab("insights");
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
      case "HIGH": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "LOW": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getRiskBadge = (riskLevel?: string) => {
    if (!riskLevel) return <span className="text-gray-400">Pending</span>;
    const colors: Record<string, string> = {
      HIGH: "bg-gradient-to-r from-red-500 to-red-600",
      MEDIUM: "bg-gradient-to-r from-yellow-500 to-yellow-600",
      LOW: "bg-gradient-to-r from-green-500 to-green-600"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm ${colors[riskLevel]}`}>
        {riskLevel}
      </span>
    );
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.student_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === "all" || student.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const navItems = [
    { id: "home" as const, label: "Home", icon: HomeIcon },
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "insights" as const, label: "Insights", icon: TrendingUp },
    { id: "reports" as const, label: "Reports", icon: FileText },
    { id: "assistant" as const, label: "AI Assistant", icon: MessageSquare },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
        
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  AcadAlert
                </h1>
              </div>
              
              <div className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      activeTab === item.id
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <div className="px-4 py-2 space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-3 ${
                        activeTab === item.id
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
              <div className="flex items-center gap-3 text-sm font-semibold">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                System Online
              </div>
              <div className="text-xs text-emerald-700/80 dark:text-emerald-200/80">
                {stats
                  ? `Students analyzed: ${stats.total_students} • Last sync: just now`
                  : "Loading live data in background..."}
              </div>
            </div>
          </div>
          
          {/* HOME PAGE */}
          {activeTab === "home" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-12"
            >
              <div className="grid lg:grid-cols-2 gap-10 items-center py-12">
                <div className="space-y-6">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-sm font-medium">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI-Powered Student Success Platform
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Predict. Prevent. <br />
                    Empower.
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
                    Identify at-risk students before it's too late. Get AI-powered insights and personalized improvement plans.
                  </p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Used by 12,000+ students • 98% risk detection accuracy
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setActiveTab("dashboard")}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:shadow-lg transition-all"
                    >
                      Get Started
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveTab("assistant")}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      Try AI Assistant
                      <MessageSquare className="ml-2 w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-4 border border-gray-100 dark:border-gray-700">
                  <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src="/img1.jpg" alt="Product overview" className="w-full h-64 md:h-80 object-cover" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { label: "At-risk", value: "14%" },
                      { label: "Insights", value: "28" },
                      { label: "Reports", value: "120+" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl bg-gray-50 dark:bg-gray-900 px-4 py-3 text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</p>
                        <p className="text-xs text-gray-500">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="max-w-3xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload CSV & Get Insights</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Drop a dataset to generate AI risk analysis instantly.</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                        {selectedFile ? selectedFile.name : "Choose CSV file"}
                      </div>
                      <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                    </label>
                    <button
                      onClick={handleUpload}
                      disabled={isLoading || !selectedFile}
                      className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:shadow-lg transition disabled:opacity-50"
                    >
                      {isLoading ? "Uploading..." : "Upload & Get Insights"}
                    </button>
                  </div>
                  {errorMessage && (
                    <div className="mt-3 text-sm text-red-600">{errorMessage}</div>
                  )}
                  {uploadStatus && (
                    <div className="mt-3 text-sm text-emerald-600">{uploadStatus.message}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How It Works</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Three steps to move from data to action.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: "1. Upload Student Data",
                    desc: "Import a CSV of attendance, marks, and assignments to start analysis.",
                    icon: Upload,
                  },
                  {
                    title: "2. AI Risk Scoring",
                    desc: "Models classify risk level and explain the top drivers instantly.",
                    icon: Brain,
                  },
                  {
                    title: "3. Act & Notify",
                    desc: "Generate reports, send emails, and track improvement over time.",
                    icon: Mail,
                  },
                ].map((step, idx) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
                  </motion.div>
                ))}
              </div>

              {stats && (
                <>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Snapshot</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Live performance signals at a glance.</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: "Students Analyzed", value: stats.total_students, icon: Users, color: "bg-blue-100 dark:bg-blue-900/30" },
                      { label: "High Risk", value: stats.high_risk, icon: AlertTriangle, color: "bg-red-100 dark:bg-red-900/30" },
                      { label: "Medium Risk", value: stats.medium_risk, icon: Activity, color: "bg-yellow-100 dark:bg-yellow-900/30" },
                      { label: "Reports Generated", value: reportStatus?.generated || 0, icon: FileText, color: "bg-green-100 dark:bg-green-900/30" },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center border border-gray-100 dark:border-gray-700"
                      >
                        <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                          <item.icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                        <p className="text-sm text-gray-500">{item.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              <div className="grid md:grid-cols-3 gap-8 py-8">
                {[
                  { icon: Brain, title: "AI Risk Prediction", desc: "ML models identify at-risk students with high accuracy" },
                  { icon: TrendingUp, title: "ML Insights", desc: "Visual analytics showing risk patterns and correlations" },
                  { icon: FileText, title: "Smart Reports", desc: "Auto-generated PDF reports with improvement plans" },
                  { icon: MessageSquare, title: "AI Assistant", desc: "Chat with AI for personalized guidance" },
                  { icon: Mail, title: "Email Notifications", desc: "Send reports directly to students" },
                  { icon: BarChart3, title: "Performance Analytics", desc: "Track progress over time" },
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    whileHover={{ y: -5 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Platform Showcase</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  A quick visual tour of the tools that power AcadAlert.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { src: "/img1.jpg", label: "Overview" },
                    { src: "/img2.jpg", label: "Insights" },
                    { src: "/img3.jpg", label: "Reports" },
                    { src: "/img4.jpg", label: "Engagement" },
                  ].map((item) => (
                    <div
                      key={item.src}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <img src={item.src} alt={item.label} className="h-40 w-full object-cover" />
                      </div>
                      <span className="text-base font-semibold text-gray-700 dark:text-gray-200">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* DASHBOARD PAGE */}
          {activeTab === "dashboard" && stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total Students", value: stats.total_students, icon: Users, color: "from-blue-500 to-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
                  { label: "High Risk", value: stats.high_risk, icon: AlertTriangle, color: "from-red-500 to-red-600", bg: "bg-red-50 dark:bg-red-900/20", percent: stats.risk_percentages.high },
                  { label: "Medium Risk", value: stats.medium_risk, icon: Activity, color: "from-yellow-500 to-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20", percent: stats.risk_percentages.medium },
                  { label: "Low Risk", value: stats.low_risk, icon: CheckCircle, color: "from-green-500 to-green-600", bg: "bg-green-50 dark:bg-green-900/20", percent: stats.risk_percentages.low },
                ].map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
                  >
                    <div className={`bg-gradient-to-r ${card.color} px-5 py-4`}>
                      <div className="flex justify-between items-center">
                        <card.icon className="w-8 h-8 text-white" />
                        <span className="text-white/80 text-xs font-medium">Risk Level</span>
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
                      {card.percent !== undefined && (
                        <p className="text-xs text-gray-400 mt-2">{card.percent}% of total</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    {["all", "HIGH", "MEDIUM", "LOW"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setRiskFilter(filter)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                          riskFilter === filter
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {filter === "all" ? "All" : filter}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Student Risk Analysis</h2>
                    {reportStatus && (
                      <p className="text-xs text-gray-500 mt-1">📄 Reports generated: {reportStatus.generated} / {stats.total_students}</p>
                    )}
                  </div>
                  <button
                    onClick={handleGenerateReportsBatch}
                    disabled={isGeneratingReports}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 text-white text-sm font-medium hover:shadow-lg transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingReports ? "animate-spin" : ""}`} />
                    {isGeneratingReports ? "Generating..." : "Generate Next 10 Reports"}
                  </button>
                </div>
                <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
                      <tr>
                        {["Student ID", "Name", "Attendance", "Internal Marks", "Risk Level", "Risk Score", "Actions"].map((header) => (
                          <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredStudents.map((student) => (
                        <tr key={student._id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{student.student_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{student.student_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 dark:text-gray-300">{student.attendance_percentage}%</span>
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${student.attendance_percentage}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 dark:text-gray-300">{student.internal_marks}/100</span>
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${student.internal_marks}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{getRiskBadge(student.risk_level)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {student.risk_score ? `${(student.risk_score * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                            <button
                              onClick={() => handleViewStudent(student.student_id)}
                              className="text-blue-600 hover:text-blue-800 font-medium transition inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Details
                            </button>
                            <button
                              onClick={() => downloadReport(student.student_id)}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition inline-flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> Report
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredStudents.length === 0 && (
                    <div className="text-center py-12 px-6">
                      <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <img src="/img2.jpg" alt="Empty state" className="h-full w-full object-cover" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 font-semibold">No student records yet</p>
                      <p className="text-sm text-gray-500 mt-1">Upload a CSV to generate predictions and reports.</p>
                      <button
                        onClick={() => setActiveTab("home")}
                        className="mt-4 inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg transition"
                      >
                        Go to Home
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* INSIGHTS PAGE */}
          {activeTab === "insights" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Machine Learning Insights</h2>
                  <p className="text-gray-500 text-sm mt-2">Real-time visualizations from our ML pipeline showing risk patterns and feature relationships</p>
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
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="group relative bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700"
                        onClick={() => setSelectedImage(`http://localhost:8000/visualizations/${viz.filename}`)}
                      >
                        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center p-6">
                          <img 
                            src={`http://localhost:8000/visualizations/${viz.filename}`}
                            alt={viz.name}
                            className="max-w-full max-h-full object-contain group-hover:scale-105 transition duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Loading...';
                            }}
                          />
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{viz.name}</h3>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* REPORTS PAGE */}
          {activeTab === "reports" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Batch Report Generation</h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Generate reports for multiple students at once.</p>
                  <button
                    onClick={handleGenerateReportsBatch}
                    disabled={isGeneratingReports}
                    className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:shadow-lg transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingReports ? "animate-spin" : ""}`} />
                    {isGeneratingReports ? "Generating Reports..." : "Generate Next 10 Reports"}
                  </button>
                  {reportStatus && stats && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-semibold">{reportStatus.generated}/{stats.total_students}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${(reportStatus.generated / stats.total_students) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Send Reports via Email</h2>
                  </div>
                  <div className="space-y-3">
                    <select className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                      <option>Select a student</option>
                      {students.map(s => (
                        <option key={s.student_id}>{s.student_name} ({s.student_id})</option>
                      ))}
                    </select>
                    <input type="email" placeholder="Recipient email address" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white" />
                    <button className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold hover:shadow-lg transition">
                      <Send className="w-4 h-4 mr-2" />
                      Send Email Report
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Reports</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {students.slice(0, 5).map((student) => (
                    <div key={student._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{student.student_name}</p>
                        <p className="text-xs text-gray-500">{student.student_id}</p>
                      </div>
                      <button onClick={() => downloadReport(student.student_id)} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-200 transition">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* AI ASSISTANT PAGE */}
          {activeTab === "assistant" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
                      <p className="text-blue-100 text-xs">Get personalized improvement plans and academic advice</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Student</label>
                    <select
                      onChange={(e) => handleViewStudent(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="">Choose a student...</option>
                      {students.map(s => (
                        <option key={s.student_id} value={s.student_id}>{s.student_name} ({s.student_id})</option>
                      ))}
                    </select>
                  </div>

                  {selectedStudent ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Questions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {quickQuestions.map((q) => (
                            <button
                              key={q}
                              onClick={() => handleQuickQuestion(q)}
                              className="text-left px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 transition"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Ask Your Own Question</h3>
                        <textarea
                          value={planQuestion}
                          onChange={(e) => setPlanQuestion(e.target.value)}
                          placeholder="e.g., How can I improve my attendance?"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          rows={2}
                        />
                        <button
                          onClick={handleGeneratePlan}
                          disabled={isPlanLoading}
                          className="mt-3 inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:shadow-lg transition disabled:opacity-50"
                        >
                          {isPlanLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate AI Plan
                            </>
                          )}
                        </button>
                      </div>

                      {planText && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 border border-blue-200 dark:border-blue-800"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Brain className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white mb-2">AI Recommendation</p>
                              <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">{planText}</div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Select a student to get AI-powered improvement plans</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </main>

        {/* Student Details Modal */}
        <AnimatePresence>
          {showModal && selectedStudent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">{selectedStudent.student.student_name}</h2>
                  <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="px-6 py-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Student ID</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedStudent.student.student_id}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Semester</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedStudent.student.semester}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">📚 Academic Performance</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Attendance", value: selectedStudent.student.attendance_percentage },
                        { label: "Internal Marks", value: selectedStudent.student.internal_marks },
                        { label: "Assignment Submission", value: selectedStudent.student.assignment_submission_rate }
                      ].map((metric) => (
                        <div key={metric.label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">{metric.label}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{metric.value}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${metric.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedStudent.prediction && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">⚠️ Risk Assessment</h3>
                      <div className={`rounded-xl p-4 ${getRiskColor(selectedStudent.prediction.risk_level)}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Risk Level: {selectedStudent.prediction.risk_level}</span>
                          <span className="text-sm">Score: {(selectedStudent.prediction.risk_score * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedStudent.risk_factors.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">🔍 Key Risk Factors</h3>
                      {selectedStudent.risk_factors.map((factor, idx) => (
                        <div key={idx} className="border-l-4 border-red-400 pl-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-r-lg mb-2">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{factor.factor_name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Current: {factor.current_value}% | Threshold: {factor.threshold}%</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedStudent.suggestions.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">💡 Recommendations</h3>
                      <ul className="space-y-2">
                        {selectedStudent.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    <button
                      onClick={() => downloadReport(selectedStudent.student.student_id)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition"
                    >
                      <Download className="w-4 h-4" />
                      Download Full Report (PDF)
                    </button>
                    
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-4 py-3 space-y-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Send Report Email
                      </p>
                      <input
                        type="email"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="Recipient email"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSendEmail}
                        disabled={isSendingEmail}
                        className="w-full bg-gray-900 dark:bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                      >
                        {isSendingEmail ? "Sending..." : "Send Email to Student"}
                      </button>
                      {emailStatus && <div className={`text-xs ${emailStatus.includes("success") ? "text-green-600" : "text-red-600"}`}>{emailStatus}</div>}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Zoom Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative max-w-5xl max-h-[90vh]"
              >
                <img src={selectedImage} alt="Visualization" className="max-w-full max-h-full object-contain rounded-xl" />
                <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/75 transition">
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
