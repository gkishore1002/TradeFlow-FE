// app/pages/profile/page.jsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../dashboard/Navbar";
import Sidebar from "../../dashboard/Sidebar";
import {
  Person as PersonIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';


export default function Profile() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);


  // Get JWT Token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };


  // API Call with JWT - MATCHES YOUR BACKEND ENDPOINTS
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const token = getAuthToken();

      if (!token) {
        console.warn('⚠️ No auth token found');
        router.push('/login');
        return null;
      }


      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      };


      console.log(`📡 API Call: ${API_BASE_URL}${endpoint}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('⏱️ Request timeout');
        controller.abort();
      }, 8000);


      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });


      clearTimeout(timeoutId);


      if (response.status === 401) {
        console.warn('🔴 Unauthorized');
        localStorage.removeItem('access_token');
        router.push('/login');
        setBackendConnected(false);
        return null;
      }


      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        console.error('🔴 API Error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }


      const data = await response.json();
      console.log('✅ API Success');
      setBackendConnected(true);
      return data;
    } catch (error) {
      console.error('🔴 API Error:', error.message);
      if (error.name !== 'AbortError') {
        setBackendConnected(false);
      }
      return null;
    }
  }, [router]);


  // Load user profile - CALLS /api/auth/profile (YOUR BACKEND)
  const loadUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);

      // MATCHES YOUR BACKEND ENDPOINT: /api/auth/profile
      const response = await apiCall('/api/auth/profile');

      if (response && response.user) {
        console.log('✅ Loaded from backend');
        const user = response.user;

        setFirstName(user.first_name || "");
        setLastName(user.last_name || "");
        setEmail(user.email || "");
        // CHANGED: Phone is now stored in 'bio' field in backend
        setPhone(user.bio || "");
        // CHANGED: Address is now stored in 'location' field in backend
        setAddress(user.location || "");


        localStorage.setItem("first_name", user.first_name || "");
        localStorage.setItem("last_name", user.last_name || "");
        localStorage.setItem("email", user.email || "");
        // CHANGED: Store phone from bio
        localStorage.setItem("phone", user.bio || "");
        // CHANGED: Store address from location
        localStorage.setItem("address", user.location || "");
        setBackendConnected(true);
      } else {
        console.log('📦 Loading from localStorage');
        const storedFirstName = localStorage.getItem("first_name") || "Demo";
        const storedLastName = localStorage.getItem("last_name") || "User";

        setFirstName(storedFirstName);
        setLastName(storedLastName);
        setEmail(localStorage.getItem("email") || "user@example.com");
        setPhone(localStorage.getItem("phone") || "(555) 123-4567");
        setAddress(localStorage.getItem("address") || "123 Main St, City, State 12345");
        setBackendConnected(false);
      }
    } catch (error) {
      console.error('❌ Error loading:', error);
      const storedFirstName = localStorage.getItem("first_name") || "Demo";
      const storedLastName = localStorage.getItem("last_name") || "User";

      setFirstName(storedFirstName);
      setLastName(storedLastName);
      setEmail(localStorage.getItem("email") || "user@example.com");
      setPhone(localStorage.getItem("phone") || "(555) 123-4567");
      setAddress(localStorage.getItem("address") || "123 Main St, City, State 12345");
      setBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);


  // Validate form
  const validateForm = () => {
    if (!firstName.trim()) {
      setErrorMessage("First name is required");
      return false;
    }
    if (!lastName.trim()) {
      setErrorMessage("Last name is required");
      return false;
    }
    if (!email.trim()) {
      setErrorMessage("Email is required");
      return false;
    }
    if (!email.includes("@")) {
      setErrorMessage("Email is invalid");
      return false;
    }
    if (!phone.trim()) {
      setErrorMessage("Contact number is required");
      return false;
    }
    return true;
  };


  // Save profile - CALLS /api/auth/profile with PUT (YOUR BACKEND)
  const handleSave = async () => {
    if (!validateForm()) return;


    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");


    try {
      const profileData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        // CHANGED: Phone is sent as 'bio' field
        bio: phone.trim(),
        // CHANGED: Address is sent as 'location' field
        location: address.trim()
      };


      console.log('💾 Saving:', profileData);


      // MATCHES YOUR BACKEND ENDPOINT: PUT /api/auth/profile
      const result = await apiCall('/api/auth/profile', {
        method: 'PUT',
        body: profileData
      });


      if (result && result.user) {
        console.log('✅ Profile saved');
        setSuccessMessage("✅ Profile updated successfully!");

        localStorage.setItem("first_name", firstName);
        localStorage.setItem("last_name", lastName);
        localStorage.setItem("email", email);
        // CHANGED: Store phone in localStorage
        localStorage.setItem("phone", phone);
        // CHANGED: Store address in localStorage
        localStorage.setItem("address", address);


        setIsEditing(false);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("❌ Error:", error.message);
      setErrorMessage(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };


  const handleCancel = () => {
    setIsEditing(false);
    setErrorMessage("");
    loadUserProfile();
  };


  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileScreen = window.innerWidth < 768;
      setIsMobile(isMobileScreen);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };


    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Initial load
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }
    loadUserProfile();
  }, [loadUserProfile, router]);


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };


  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("first_name");
    localStorage.removeItem("last_name");
    localStorage.removeItem("email");
    localStorage.removeItem("phone");
    localStorage.removeItem("address");
    setSidebarOpen(false);
    router.push("/login");
  };


  const navigateToDashboard = () => {
    setSidebarOpen(false);
    router.push("/dashboard");
  };


  const tabs = [
    { id: "profile", label: "Profile", icon: PersonIcon },
    { id: "password", label: "Manage Password", icon: SecurityIcon },
  ];


  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-blue-50">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        handleLogout={handleLogout}
      />


      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          activeTab="profile"
          toggleSidebar={toggleSidebar}
          handleLogout={handleLogout}
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          backendConnected={backendConnected}
        />


        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumbs */}
            <div className="mb-6 sm:mb-8 flex items-center gap-2 text-xs sm:text-sm">
              <button
                onClick={navigateToDashboard}
                className="text-[#f15f26] hover:text-[#d94e1f] font-medium transition-colors hover:underline"
              >
                Dashboard
              </button>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-slate-600 font-medium">Profile</span>
            </div>


            {/* Connection Status */}
            {!backendConnected && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-800 text-sm">ℹ️ Using local storage - backend offline</p>
              </div>
            )}


            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fade-in">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span className="text-green-800 font-medium text-xs sm:text-sm">{successMessage}</span>
              </div>
            )}


            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span className="text-red-800 font-medium text-xs sm:text-sm">{errorMessage}</span>
              </div>
            )}


            {/* Loading State */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm border border-slate-100 animate-pulse h-32"></div>
                </div>
                <div className="md:col-span-3">
                  <div className="bg-white rounded-lg shadow-sm border border-slate-100 animate-pulse h-96"></div>
                </div>
              </div>
            ) : (
              /* Main Container */
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Left Sidebar */}
                <div className="md:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden sticky top-6">
                    <div className="p-3 sm:p-4 space-y-1">
                      {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setActiveTab(tab.id);
                              if (isMobile) setSidebarOpen(false);
                            }}
                            className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all text-left text-sm ${activeTab === tab.id
                                ? 'bg-[#f15f26]/10 border-l-4 border-[#f15f26] text-[#f15f26] font-semibold'
                                : 'text-slate-700 hover:bg-slate-50'
                              }`}
                          >
                            <Icon sx={{ fontSize: '1.25rem' }} />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>


                {/* Right Content */}
                <div className="md:col-span-3">
                  {/* Profile Tab */}
                  {activeTab === "profile" && (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                      {/* Header */}
                      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900">Profile</h2>
                        {!isEditing && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-[#f15f26] hover:bg-[#d94e1f] text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                        )}
                      </div>


                      {/* Content */}
                      <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-6">
                        <div className="space-y-4 sm:space-y-6">
                          {/* Row 1 */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                                First Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                disabled={!isEditing}
                                className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all ${isEditing
                                    ? 'border-slate-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#f15f26]'
                                    : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                                  }`}
                              />
                            </div>


                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                                Last Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                disabled={!isEditing}
                                className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all ${isEditing
                                    ? 'border-slate-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                                  }`}
                              />
                            </div>


                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                                Contact Number <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={!isEditing}
                                className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all ${isEditing
                                    ? 'border-slate-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                                  }`}
                              />
                            </div>
                          </div>


                          {/* Row 2 */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                                Email <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={!isEditing}
                                className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all ${isEditing
                                    ? 'border-slate-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                                  }`}
                              />
                            </div>


                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                                Address
                              </label>
                              <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={!isEditing}
                                className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all ${isEditing
                                    ? 'border-slate-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                                  }`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>


                      {/* Footer */}
                      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleCancel}
                              disabled={isSaving}
                              className="px-6 py-2.5 rounded-lg border-2 border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSave}
                              disabled={isSaving}
                              className="px-6 py-2.5 rounded-lg bg-[#f15f26] hover:bg-[#d94e1f] text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              {isSaving ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                  Save
                                </>
                              )}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}


                  {/* Password Tab */}
                  {activeTab === "password" && (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                      <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8">
                        <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                          <svg className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300 mb-4 sm:mb-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                          </svg>
                          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Coming Soon</h3>
                          <p className="text-slate-600 text-center text-sm sm:text-base max-w-sm">
                            Password management is under development. Check back soon!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>


      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }


        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px white inset !important;
          -webkit-text-fill-color: #000 !important;
        }
      `}</style>
    </div>
  );
}
