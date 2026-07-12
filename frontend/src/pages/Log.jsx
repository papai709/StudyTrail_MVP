import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sun, Moon, GraduationCap, Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff
} from "lucide-react";
import { useTheme } from './ThemeContext';
import { login, register } from '../api/auth';
import { getApiErrorMessage } from '../api/client';

export default function Log() {
  const location = useLocation();
  const navigate = useNavigate(); 
  const initialMode = location.state?.mode || "login";

  const { isDarkMode, toggleDarkMode } = useTheme();
  
  const [authMode, setAuthMode] = useState(initialMode);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);
  
  // showPassword is false on load, so password is hidden
  const [showPassword, setShowPassword] = useState(false); 

  // State to hold the API's response for password strength
  const [strengthData, setStrengthData] = useState({ score: 0, label: "", color: "bg-transparent", text: "" });
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const typingTimeoutRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (location.state?.mode) {
      setAuthMode(location.state.mode);
      setErrors({});
    }
  }, [location.state]);


  const checkPasswordStrength = (password) => {
    if (!password) {
      setStrengthData({ score: 0, label: "", color: "bg-transparent", text: "" });
      setIsCheckingPassword(false);
      return;
    }

    let score = 0;
    if (password.length > 7) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) setStrengthData({ score, label: "Weak", color: "bg-red-500", text: "text-red-500" });
    else if (score === 2) setStrengthData({ score, label: "Fair", color: "bg-amber-500", text: "text-amber-500" });
    else if (score === 3) setStrengthData({ score, label: "Good", color: "bg-indigo-500", text: "text-indigo-500" });
    else setStrengthData({ score, label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" });

    setIsCheckingPassword(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    // If the user is typing in the register password field, trigger the API check
    if (name === "password" && authMode === "register") {
      setIsCheckingPassword(true);
      
      // Clear the previous timeout so we don't spam the API
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      // Wait 500ms after they stop typing to call the API (Debounce)
      typingTimeoutRef.current = setTimeout(() => {
        checkPasswordStrength(value);
      }, 500);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Please enter a valid email";

    if (authMode === "register") {
      if (!formData.name.trim()) newErrors.name = "Full name is required";
      if (!formData.username?.trim()) newErrors.username = "Username is required";

      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (!strongPasswordRegex.test(formData.password)) {
        newErrors.password = "Password must be at least 8 characters, containing uppercase, lowercase, numbers, and special characters.";
      }
    } else {
      if (!formData.password) newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (authMode === "register") {
        await register({
          fullName: formData.name.trim(),
          name: formData.name.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setAuthMode("login");
          setFormData({ name: "", username: "", email: "", password: "" });
          setShowPassword(false);
          setStrengthData({ score: 0, label: "", color: "bg-transparent", text: "" });
          setIsSubmitting(false);
        }, 1200);
      } else {
        const authUser = await login({
          email: formData.email.trim(),
          password: formData.password,
        });
        const user = authUser?.user ?? authUser;
        const isProfileComplete = Boolean(user?.className || user?.schoolName);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setFormData({ name: "", username: "", email: "", password: "" });
          setShowPassword(false);

          if (isProfileComplete) {
            navigate("/feed");
          } else {
            navigate("/signed");
          }
          setIsSubmitting(false);
        }, 700);
      }
    } catch (error) {
      setErrors({ email: getApiErrorMessage(error, "Authentication failed") });
      setIsSubmitting(false);
      console.error("API Error:", error);
    }
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#050505] transition-colors duration-500 flex flex-col selection:bg-indigo-500/30 overflow-x-hidden relative">

        {/* Floating Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode} 
          className={`fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-2xl hover:scale-110 active:scale-95 transition-all duration-1000 group ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          aria-label="Toggle Dark Mode"
        >
          {isDarkMode ? (
            <Sun size={20} className="group-hover:rotate-45 transition-transform duration-500 text-amber-300" />
          ) : (
            <Moon size={20} className="group-hover:-rotate-12 transition-transform duration-500 text-indigo-500" />
          )}
        </button>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 pt-20 pb-20 relative z-10 w-full">
          <div className={`w-full max-w-5xl overflow-hidden rounded-4xl bg-white dark:bg-[#0A0A0A] shadow-2xl border border-slate-200 dark:border-white/5 flex flex-col md:flex-row relative transition-all duration-1000 ease-out transform-gpu ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.98]'}`}>

            {/* Left Panel (Now visible and responsive on mobile) */}
            <div className="flex w-full md:w-5/12 bg-linear-to-br from-indigo-600 via-violet-600 to-cyan-500 p-8 md:p-12 text-white flex-col justify-center md:justify-between relative overflow-hidden">
              <div className="absolute -bottom-5 -left-6 w-100 h-100 bg-violet-600 full blur-2xl"></div>
              <div className="absolute top-5 left-9 w-100 h-100 bg-violet-600 full blur-2xl"></div>
              <div className="absolute top-10 -right-10 w-48 h-48 bg-cyan-300/20 rounded-full blur-2xl"></div>

              <div className="flex items-center justify-center md:justify-start gap-3 relative z-10 mb-2 md:mb-0">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/20">
                  <GraduationCap size={28} className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">StudyTrail</h1>
              </div>

              <div className={`flex justify-center items-center flex-1 relative z-10 my-6 md:my-8 transition-all duration-1000 delay-300 ease-out transform-gpu ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                {/* SVG scaled slightly smaller for mobile to avoid taking up the whole screen */}
                <svg viewBox="0 0 400 400" className="w-full max-w-40 md:max-w-70 drop-shadow-2xl hover:scale-105 transition-transform duration-700">
                  <circle cx="200" cy="180" r="120" fill="url(#glow)" opacity="0.8" />
                  <defs>
                    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <g className="origin-[200px_180px] animate-[spin_20s_linear_infinite]">
                    <circle cx="200" cy="180" r="110" stroke="white" strokeWidth="1" strokeDasharray="5 5" opacity="0.4" />
                    <circle cx="200" cy="180" r="130" stroke="white" strokeWidth="1" strokeDasharray="2 8" opacity="0.2" />
                  </g>
                  <g transform="translate(112, 95) scale(7)">
                    <path d="M21.42 10.922a2 2 0 0 0-.019-3.838L12.83 4.1a2 2 0 0 0-1.66 0L2.6 7.08a2 2 0 0 0 0 3.832l8.57 3.698a2 2 0 0 0 1.66 0z" fill="white" />
                    <path d="M22 10v6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </g>
                  <text x="200" y="340" textAnchor="middle" fill="white" fontSize="35" fontWeight="800" letterSpacing="-0.5">Empowering Students</text>
                  <text x="200" y="370" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="14" fontWeight="500" letterSpacing="4" className="uppercase">Worldwide</text>
                </svg>
              </div>

              {/* Hide paragraph on mobile to save vertical scrolling space */}
              <p className="text-white/80 text-sm font-light relative z-10 hidden md:block">
                Join the academic network built for collaboration and excellence.
              </p>
            </div>

            {/* Right Panel */}
            <div className="w-full md:w-7/12 p-8 md:p-14 flex items-center justify-center">
              <div className="w-full max-w-md mx-auto">
                
                <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6 md:mb-8 uppercase tracking-widest">
                  <ArrowLeft size={14} /> Back to Home
                </Link>

                {/* Removed the old md:hidden static header since the animating SVG panel now shows on mobile */}

                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {authMode === "login" ? "Welcome back." : "Create account."}
                </h2>

                <p className="text-slate-500 dark:text-slate-400 mt-2 mb-8 font-light">
                  {authMode === "login" ? "Sign in to continue your journey." : "Join thousands of students globally."}
                </p>

                <div className="flex bg-slate-100 dark:bg-white/5 rounded-xl p-1.5 mb-8 border border-black/5 dark:border-white/5 relative">
                  <div className={`absolute inset-y-1.5 w-[calc(50%-6px)] bg-white dark:bg-[#1A1A1A] rounded-lg shadow-sm border border-black/5 dark:border-white/10 transition-transform duration-500 ease-out ${authMode === 'register' ? 'translate-x-[calc(50%+0.1px)]' : 'translate-x-0'}`}></div>
                  
                  <button 
                    onClick={() => { 
                      setAuthMode("login"); 
                      setErrors({}); 
                      setShowPassword(false); 
                      setFormData({ name: "", username: "", email: "", password: "" });
                      setStrengthData({ score: 0, label: "", color: "bg-transparent", text: "" });
                    }} 
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-300 relative z-10 ${authMode === "login" ? "text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => { 
                      setAuthMode("register"); 
                      setErrors({}); 
                      setShowPassword(false); 
                      setFormData({ name: "", username: "", email: "", password: "" });
                      setStrengthData({ score: 0, label: "", color: "bg-transparent", text: "" });
                    }} 
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-300 relative z-10 ${authMode === "register" ? "text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                  >
                    Register
                  </button>
                </div>

                <div className="relative min-h-75">
                  
                  {/* Register Form */}
                  <form onSubmit={handleSubmit} className={`space-y-5 transition-all duration-500 absolute w-full ${authMode === 'register' ? 'opacity-100 translate-x-0 relative pointer-events-auto' : 'opacity-0 translate-x-8 absolute pointer-events-none'}`}>
                    
                    <div>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/3 -translate-y-1/6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-[#111] border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-900 dark:text-white ${errors.name ? 'border-red-500' : 'border-black/10 dark:border-white/10'}`} />
                      </div>
                      {errors.name && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.name}</p>}
                    </div>

                    <div>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/3 -translate-y-1/6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-[#111] border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-900 dark:text-white ${errors.username ? 'border-red-500' : 'border-black/10 dark:border-white/10'}`} />
                      </div>
                      {errors.username && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.username}</p>}
                    </div>

                    <div>
                      <div className="relative group">
                       <Mail className="absolute left-4 top-1/3 -translate-y-1/6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-[#111] border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-900 dark:text-white ${errors.email ? 'border-red-500' : 'border-black/10 dark:border-white/10'}`} />
                      </div>
                      {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.email}</p>}
                    </div>

                    <div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/3 -translate-y-1/6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          name="password" 
                          value={formData.password} 
                          onChange={handleChange} 
                          placeholder="Password" 
                          className={`w-full pl-11 pr-12 py-3.5 rounded-xl bg-slate-50 dark:bg-[#111] border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-900 dark:text-white ${errors.password ? 'border-red-500' : 'border-black/10 dark:border-white/10'}`} 
                        />
                        
                        {/* Animated Eye Button - Register */}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/4 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none"
                        >
                          {/* Shows Eye when password IS visible (showPassword = true) */}
                          <div className={`absolute transition-all duration-300 transform ${showPassword ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`}>
                            <Eye size={18} />
                          </div>
                          {/* Shows EyeOff when password is NOT visible (showPassword = false) */}
                          <div className={`absolute transition-all duration-300 transform ${!showPassword ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}>
                            <EyeOff size={18} />
                          </div>
                        </button>
                      </div>

                      {/* Helper text for regex requirements */}
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 ml-1">
                        Must be 8+ chars with uppercase, lowercase, number & special char.
                      </p>

                      {/* API-Driven Password Strength Indicator */}
                      {formData.password.length > 0 && (
                        <div className="mt-2.5 mb-1 px-1">
                          <div className="flex justify-between items-center mb-1.5 h-4">
                            <span className="text-[11px] font-medium text-slate-400">Password strength</span>
                            {isCheckingPassword ? (
                              <span className="text-[11px] font-medium text-indigo-400 animate-pulse">Checking...</span>
                            ) : (
                              <span className={`text-[11px] font-bold ${strengthData.text} transition-colors duration-300`}>
                                {strengthData.label}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1.5 h-1 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700/50">
                            {[1, 2, 3, 4].map((level) => (
                              <div 
                                key={level} 
                                className={`flex-1 h-full rounded-full transition-all duration-500 ease-out ${!isCheckingPassword && strengthData.score >= level ? strengthData.color : 'bg-transparent'}`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {errors.password && <p className="text-red-500 text-xs mt-2 ml-1 font-medium leading-relaxed">{errors.password}</p>}
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full py-3.5 mt-2 rounded-xl font-bold text-black dark:text-white bg-linear-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/25 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                      {isSubmitting ? "Creating..." : "Create Account"} <ArrowRight size={18} />
                    </button>
                  </form>

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className={`space-y-5 transition-all duration-500 absolute w-full ${authMode === 'login' ? 'opacity-100 translate-x-0 relative pointer-events-auto' : 'opacity-0 -translate-x-8 absolute pointer-events-none'}`}>
                    <div>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/3 -translate-y-1/6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-[#111] border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-900 dark:text-white ${errors.email ? 'border-red-500' : 'border-black/10 dark:border-white/10'}`} />
                      </div>
                      {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.email}</p>}
                    </div>

                    <div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/3 -translate-y-1/6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          name="password" 
                          value={formData.password} 
                          onChange={handleChange} 
                          placeholder="Password" 
                          className={`w-full pl-11 pr-12 py-3.5 rounded-xl bg-slate-50 dark:bg-[#111] border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-900 dark:text-white ${errors.password ? 'border-red-500' : 'border-black/10 dark:border-white/10'}`} 
                        />
                        
                        {/* Animated Eye Button - Login */}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/4 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none"
                        >
                          {/* Shows Eye when password IS visible (showPassword = true) */}
                          <div className={`absolute transition-all duration-300 transform ${showPassword ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`}>
                            <Eye size={18} />
                          </div>
                          {/* Shows EyeOff when password is NOT visible (showPassword = false) */}
                          <div className={`absolute transition-all duration-300 transform ${!showPassword ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}>
                            <EyeOff size={18} />
                          </div>
                        </button>
                      </div>
                      {errors.password && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.password}</p>}
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full py-3.5 mt-2 rounded-xl font-bold text-black dark:text-white bg-linear-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/25 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                      {isSubmitting ? "Signing in..." : "Sign In"} <ArrowRight size={18} />
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-transparent border-t border-black/5 dark:border-white/5 py-16 relative z-10 w-full mt-auto">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-linear-to-tr from-indigo-600 to-cyan-500 p-2 rounded-lg">
                <GraduationCap className="text-black dark:text-white " size={20} />
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">StudyTrail</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm leading-relaxed font-light">
                Empowering students worldwide by combining community-driven learning with modern productivity tools.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-6">Platform</h4>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Leaderboard</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Resources</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              &copy; 2026 StudyTrail. All rights reserved.
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all">X</div>
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all">in</div>
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all">IG</div>
            </div>
          </div>
        </footer>

        {/* Success State */}
        <div className={`fixed inset-0 z-9999 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-500 ${showSuccess ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className={`w-72 h-72 rounded-full bg-linear-to-br from-indigo-600 via-violet-600 to-cyan-500 shadow-[0_0_80px_rgba(99,102,241,0.6)] flex flex-col items-center justify-center text-white border-4 border-white/10 text-center p-6 transition-all duration-700 transform-gpu ${showSuccess ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            <GraduationCap size={64} className="mb-2" />
            <h2 className="text-xl font-bold tracking-tight">
              {authMode === 'login' ? 'Welcome Back!' : 'Account Created!'}
            </h2>
            <p className="text-white/80 tracking-widest uppercase text-xs mt-2 font-medium">
              {authMode === 'login' ? 'Logging you in...' : 'Redirecting...'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}