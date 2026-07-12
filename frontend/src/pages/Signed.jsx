import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { 
  Sun, Moon, ArrowRight, BookOpen, Users, Target, 
  Award, Sparkles, GraduationCap, Globe, LogOut, Loader2, AlertCircle,
  Camera, Edit2, Image as ImageIcon, X, Check, UploadCloud, CheckCircle2
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import { getCurrentUser, logout } from '../api/auth';
import { completeMyProfile } from '../api/profile';
import { getApiErrorMessage } from '../api/client';

const Signed = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  
  // Auth & UI States
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile Setup States
  const [educationLevel, setEducationLevel] = useState('school'); 
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [files, setFiles] = useState({ profileImage: null, coverImage: null });
  
  // States for Searchable Inputs
  const [courseSearch, setCourseSearch] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  
  const [boardSearch, setBoardSearch] = useState('');
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);

  // States for Searchable & Strict Inputs
  const [stateSearch, setStateSearch] = useState('');
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  
  const [profileData, setProfileData] = useState({
    schoolName: '',
    grade: '',
    board: '',
    instituteName: '',
    course: '',
    year: '',
    state: '',
    city: '',
    bio: '',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=e2e8f0',
    cover: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop'
  });

  // Static option lists for profile setup
  const avatarOptions = [1, 2, 3, 4, 5, 6, 7, 8].map(i => `https://api.dicebear.com/7.x/avataaars/svg?seed=User${i}&backgroundColor=e2e8f0`);
  const coverOptions = [
    'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop', 
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop', 
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2000&auto=format&fit=crop', 
    'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop', 
  ];

  const collegeCourses = [
    { name: "B.Tech (Bachelor of Technology)", duration: 4 },
    { name: "B.E. (Bachelor of Engineering)", duration: 4 },
    { name: "B.A. Hons (Bachelor of Arts)", duration: 3 },
    { name: "B.Sc (Bachelor of Science)", duration: 3 },
    { name: "B.Com (Bachelor of Commerce)", duration: 3 },
    { name: "BBA (Bachelor of Business Admin)", duration: 3 },
    { name: "BCA (Bachelor of Computer Apps)", duration: 3 },
    { name: "MBBS (Medicine & Surgery)", duration: 5 },
    { name: "B.Arch (Bachelor of Architecture)", duration: 5 },
    { name: "LLB (Bachelor of Laws)", duration: 3 },
    { name: "M.Tech (Master of Technology)", duration: 2 },
    { name: "MBA (Master of Business Admin)", duration: 2 },
    { name: "M.Sc (Master of Science)", duration: 2 },
    { name: "MCA (Master of Computer Application)", duration: 2 },
    { name: "M.A. (Master of Arts)", duration: 2 },
    { name: "M.Com (Master of Commerce)", duration: 2 },
    { name: "Ph.D (Doctor of Philosophy)", duration: 3 },
  ];

  const indianBoards = [
    "CBSE (Central Board of Secondary Education)",
    "CISCE (ICSE/ISC)",
    "NIOS (National Institute of Open Schooling)",
    "IB (International Baccalaureate)",
    "Cambridge (IGCSE/A-Level)",
    "Andhra Pradesh Board (BSEAP/BIEAP)",
    "Assam Board (SEBA/AHSEC)",
    "Bihar Board (BSEB)",
    "Gujarat Board (GSEB)",
    "Haryana Board (BSEH)",
    "Karnataka Board (KSEEB/DPUE)",
    "Kerala Board (KBPE)",
    "Madhya Pradesh Board (MPBSE)",
    "Maharashtra Board (MSBSHSE)",
    "Punjab Board (PSEB)",
    "Rajasthan Board (RBSE)",
    "Tamil Nadu Board (TNBSE)",
    "Telangana Board (BSE Telangana)",
    "Tripura Board (TBSE)",
    "Uttar Pradesh Board (UPMSP)",
    "West Bengal Board (WBBSE/WBCHSE)"
  ];

  const indiaLocations = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
    "Delhi": ["New Delhi", "North Delhi", "South Delhi", "Dwarka"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
    "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala"],
    "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Noida", "Prayagraj"],
    "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol"]
  };

  // ---------------- Course Search Logic ----------------
  const filteredCourses = collegeCourses.filter(c => c.name.toLowerCase().includes(courseSearch.toLowerCase()));

  const handleCourseSelect = (courseName) => {
    setProfileData(prev => ({ ...prev, course: courseName, year: '' }));
    setCourseSearch(courseName);
    setShowCourseDropdown(false);
  };

  const handleCourseSearchChange = (e) => {
    setCourseSearch(e.target.value);
    setShowCourseDropdown(true);
    setProfileData(prev => ({ ...prev, course: e.target.value, year: '' }));
  };

  // ---------------- Board Search Logic ----------------
  const filteredBoards = indianBoards.filter(b => b.toLowerCase().includes(boardSearch.toLowerCase()));

  const handleBoardSelect = (boardName) => {
    setProfileData(prev => ({ ...prev, board: boardName }));
    setBoardSearch(boardName);
    setShowBoardDropdown(false);
  };

  const handleBoardSearchChange = (e) => {
    setBoardSearch(e.target.value);
    setShowBoardDropdown(true);
    setProfileData(prev => ({ ...prev, board: e.target.value }));
  };

  // ---------------- State Search Logic ----------------
  const filteredStates = Object.keys(indiaLocations).filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));

  const handleStateSelect = (stateName) => {
    setProfileData(prev => ({ ...prev, state: stateName, city: '' }));
    setStateSearch(stateName);
    setCitySearch('');
    setShowStateDropdown(false);
  };

  const handleStateSearchChange = (e) => {
    setStateSearch(e.target.value);
    setShowStateDropdown(true);
  };

  const handleStateBlur = () => {
    setTimeout(() => {
      setShowStateDropdown(false);
      const exactMatch = Object.keys(indiaLocations).find(s => s.toLowerCase() === stateSearch.toLowerCase());
      if (exactMatch) {
        if (exactMatch !== profileData.state) {
          setProfileData(prev => ({ ...prev, state: exactMatch, city: '' }));
          setCitySearch('');
        }
        setStateSearch(exactMatch);
      } else {
        setStateSearch(profileData.state);
      }
    }, 200);
  };

  // ---------------- City Search Logic ----------------
  const availableCities = profileData.state ? (indiaLocations[profileData.state] || []) : [];
  const filteredCities = availableCities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));

  const handleCitySelect = (cityName) => {
    setProfileData(prev => ({ ...prev, city: cityName }));
    setCitySearch(cityName);
    setShowCityDropdown(false);
  };

  const handleCitySearchChange = (e) => {
    setCitySearch(e.target.value);
    setShowCityDropdown(true);
  };

  const handleCityBlur = () => {
    setTimeout(() => {
      setShowCityDropdown(false);
      const exactMatch = availableCities.find(c => c.toLowerCase() === citySearch.toLowerCase());
      if (exactMatch) {
        setProfileData(prev => ({ ...prev, city: exactMatch }));
        setCitySearch(exactMatch);
      } else {
        setCitySearch(profileData.city);
      }
    }, 200);
  };

  const selectedCourseObj = collegeCourses.find(c => c.name === profileData.course);
  const maxYears = selectedCourseObj ? selectedCourseObj.duration : (profileData.course ? 5 : 0);
  const yearOptions = Array.from({ length: maxYears }, (_, i) => i + 1);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const authUser = await getCurrentUser();
        const currentUser = authUser?.user ?? authUser;
        setUser(currentUser);
        if (currentUser?.className || currentUser?.schoolName) {
          navigate("/profile");
        }
      } catch (error) {
        navigate("/log", { state: { mode: "login" } });
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [navigate]);
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      navigate("/");
    }
  };
  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, profileImage: file })); 
      const imageUrl = URL.createObjectURL(file);
      setProfileData({ ...profileData, avatar: imageUrl }); 
      setShowAvatarModal(false); 
    }
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, coverImage: file })); 
      const imageUrl = URL.createObjectURL(file);
      setProfileData({ ...profileData, cover: imageUrl }); 
      setShowCoverModal(false); 
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.state || !profileData.city) {
      setError("Please select a valid state and city from the dropdown lists.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage("");

    // FIX: Format the course/grade into the single 'className' field the backend expects
    const combinedClassName = educationLevel === 'college' 
      ? `${profileData.course} - ${profileData.year}` 
      : profileData.grade;

    try {
      await completeMyProfile({
        schoolName: educationLevel === 'college' ? profileData.instituteName : profileData.schoolName,
        className: combinedClassName, 
        board: profileData.board,
        state: profileData.state,
        city: profileData.city,
        bio: profileData.bio,
        profileImage: files.profileImage, // Passes the actual file object to FormData
        coverImage: files.coverImage      // Passes the actual file object to FormData
      });
      setSuccessMessage("Profile completed successfully! Redirecting...");
      setTimeout(() => navigate("/profile"), 900);
    } catch (error) {
      setError(getApiErrorMessage(error, "Could not complete your profile"));
    } finally {
      setIsSubmitting(false);
    }
  };
  const features = [
    { icon: <Users className="text-violet-500" size={24} />, title: "Collaborative Social Feed", description: "Connect with peers, ask questions, and share your 'aha!' moments in a dedicated academic timeline." },
    { icon: <BookOpen className="text-cyan-500" size={24} />, title: "Resource Sharing", description: "Upload notes, flashcards, and study guides. Build your repository while helping others succeed." },
    { icon: <Target className="text-emerald-500" size={24} />, title: "Weekly Goal Tracking", description: "Set personalized study targets and watch your progress ring close as you complete tasks." },
    { icon: <Award className="text-amber-500" size={24} />, title: "Gamified Achievements", description: "Earn XP, maintain study streaks, and unlock exclusive badges like 'Top Contributor' and 'Night Owl'." }
  ];

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isDarkMode ? 'dark bg-[#050505]' : 'bg-[#FAFAFA]'}`}>
        <div className="bg-red-50 dark:bg-red-500/10 p-6 rounded-2xl flex flex-col items-center border border-red-200 dark:border-red-500/20 text-center shadow-xl mx-4">
          <AlertCircle className="text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Something went wrong</h2>
          <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
          <button onClick={() => setError(null)} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto">Try Again</button>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDarkMode ? 'dark bg-[#050505]' : 'bg-[#FAFAFA]'}`}>
        <div className="w-24 h-24 mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500 animate-bounce">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Success!</h2>
        <p className="text-slate-600 dark:text-slate-300 text-center">{successMessage}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'dark bg-[#050505]' : 'bg-[#FAFAFA]'}`}>
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#050505] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500 flex flex-col overflow-x-hidden selection:bg-indigo-500/30 relative">
        
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,rgba(0,0,0,0)_70%)] blur-[100px] pointer-events-none z-0"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.1)_0%,rgba(0,0,0,0)_70%)] blur-[100px] pointer-events-none z-0"></div>

        {/* FULLY VISIBLE WRAPPING NAVBAR */}
        <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 dark:bg-[#050505]/90 backdrop-blur-2xl border-b border-black/5 dark:border-white/5 py-3' : 'bg-transparent border-transparent py-3 md:py-5'}`}>
          <div className="max-w-7xl mx-auto px-3 md:px-6 flex flex-wrap items-center justify-between gap-y-3">
            
            {/* Logo (Top Left on Mobile) */}
            <div className="flex items-center gap-2 md:gap-3 order-1">
              <div className="bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/10 p-1.5 md:p-2 rounded-xl shadow-sm transition-colors">
                <GraduationCap className="text-black dark:text-white w-4 h-4 md:w-6 md:h-6" />
              </div>
              <span className="text-lg md:text-2xl font-bold tracking-tight text-black dark:text-white">StudyTrail</span>
            </div>

            {/* User Controls (Top Right on Mobile) */}
            <div className="flex items-center gap-2 md:gap-4 order-2 md:order-3">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-1.5 md:p-2.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-amber-300 hover:scale-110 active:scale-95 transition-all"
              >
                {isDarkMode ? <Sun size={14} className="md:w-4.5 md:h-4.5" /> : <Moon size={14} className="md:w-4.5 md:h-4.5" />}
              </button>

              <div className="flex items-center gap-1.5 md:gap-2">
                <img src={profileData.avatar} alt="Profile" className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover border border-slate-300 dark:border-white/10 bg-white" />
                <span className="text-slate-700 dark:text-slate-300 text-xs md:text-sm font-medium">
                  Hi, {user?.username || "Student"}
                </span>
              </div>

              <button 
                type="button"
                onClick={handleLogout}
                className="bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 px-2.5 md:px-4 py-1.5 md:py-2 rounded-full text-[11px] md:text-sm font-semibold hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center gap-1 md:gap-2"
              >
                <LogOut size={12} className="md:w-4 md:h-4" /> <span>Logout</span>
              </button>
            </div>

            {/* Links (Drops to Bottom Row on Mobile, Centers on Desktop) */}
            <div className="flex w-full md:w-auto items-center justify-center gap-4 md:gap-8 order-3 md:order-2 text-xs md:text-sm font-medium text-slate-500 md:border-transparent pt-2 md:pt-0">
              <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
              <Link to="/Workflow" 
              className="hover:text-slate-900 dark:hover:text-white transition-colors">How It Works</Link>
              <a href="#testimonials" className="hover:text-slate-900 dark:hover:text-white transition-colors">Stories</a>
            </div>
            
          </div>
        </nav>

        {/* Increased padding-top to account for the taller responsive navbar */}
        <main className="flex-1 relative z-10 pt-32 md:pt-36">
          
          <section className="px-4 md:px-6 pb-20 max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-8 md:mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-md">
                <Sparkles size={14} /> Step 1 of 2
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-4">
                Welcome {user?.fullName || "Student"} <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 via-purple-500 to-cyan-500">
                  Let's set up your profile.
                </span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-xl mx-auto px-4">
                Define your academic identity to get tailored resources, connect with classmates, and track your specific goals.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl md:rounded-[40px] shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden">
              
              {/* Cover Image */}
              <div className="h-40 md:h-64 w-full relative group">
                <img src={profileData.cover} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    type="button"
                    onClick={() => setShowCoverModal(true)} 
                    className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full font-medium text-sm border border-white/40 flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
                  >
                    <ImageIcon size={16} /> Edit Cover
                  </button>
                </div>
              </div>

              <div className="px-5 md:px-12 pb-10 relative">
                {/* Avatar */}
                <div className="relative -mt-16 md:-mt-20 mb-8 inline-block group">
                  <div className="w-28 h-28 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-[#0A0A0A] bg-slate-100 dark:bg-slate-800 overflow-hidden relative shadow-lg">
                    <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => setShowAvatarModal(true)}>
                      <Camera className="text-white" size={32} />
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowAvatarModal(true)} className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-8 h-8 md:w-10 md:h-10 bg-indigo-500 rounded-full text-white flex items-center justify-center border-4 border-white dark:border-[#0A0A0A] hover:bg-indigo-600 transition-colors shadow-md">
                    <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </div>

                {/* Toggle Buttons */}
                <div className="bg-slate-100 dark:bg-[#111] p-1.5 rounded-2xl flex relative mb-8 md:mb-10 border border-black/5 dark:border-white/5">
                  <div className={`absolute inset-y-1.5 w-[calc(50%-6px)] bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-black/5 dark:border-white/10 transition-transform duration-500 ease-out ${educationLevel === 'college' ? 'translate-x-[calc(50%+0.1px)]' : 'translate-x-0'}`}></div>
                  
                  <button 
                    onClick={() => setEducationLevel('school')} 
                    type="button"
                    className={`flex-1 relative z-10 py-3 md:py-4 flex flex-col items-center justify-center transition-colors duration-300 ${educationLevel === 'school' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    <span className="font-bold text-sm md:text-lg">School Student</span>
                    <span className="hidden sm:block text-xs font-medium opacity-70 mt-1">Primary/Secondary Education</span>
                  </button>
                  
                  <button 
                    onClick={() => setEducationLevel('college')} 
                    type="button"
                    className={`flex-1 relative z-10 py-3 md:py-4 flex flex-col items-center justify-center transition-colors duration-300 ${educationLevel === 'college' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    <span className="font-bold text-sm md:text-lg">College / Uni</span>
                    <span className="hidden sm:block text-xs font-medium opacity-70 mt-1">Higher Education Institutions</span>
                  </button>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  
                  {/* School Form Elements */}
                  {educationLevel === 'school' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-semibold text-slate-900 dark:text-white">School Name <span className="text-red-500">*</span></label>
                        <input type="text" name="schoolName" required value={profileData.schoolName} onChange={handleProfileChange} placeholder="e.g. Lincoln High School" className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-900 dark:text-white" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-900 dark:text-white">Class / Grade <span className="text-red-500">*</span></label>
                        <select name="grade" required value={profileData.grade} onChange={handleProfileChange} className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-900 dark:text-white appearance-none">
                          <option value="" disabled>Select your grade</option>
                          {[6, 7, 8, 9, 10, 11, 12].map(g => (
                            <option key={g} value={`Grade ${g}`}>Grade {g}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 relative">
                        <label className="text-sm font-semibold text-slate-900 dark:text-white">
                          Education Board <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          name="boardSearch" 
                          required 
                          value={boardSearch} 
                          onChange={handleBoardSearchChange}
                          onFocus={() => setShowBoardDropdown(true)}
                          onBlur={() => setTimeout(() => setShowBoardDropdown(false), 200)}
                          placeholder="Search or type board..." 
                          className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-900 dark:text-white" 
                        />
                        
                        {showBoardDropdown && (
                          <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-xl shadow-xl custom-scrollbar">
                            {filteredBoards.length > 0 ? (
                              filteredBoards.map(b => (
                                <div 
                                  key={b} 
                                  onMouseDown={(e) => { e.preventDefault(); handleBoardSelect(b); }}
                                  className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 transition-colors"
                                >
                                  {b}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 italic">
                                Using custom board name.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* College Form Elements */}
                  {educationLevel === 'college' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-semibold text-slate-900 dark:text-white">Institute / University <span className="text-red-500">*</span></label>
                        <input type="text" name="instituteName" required value={profileData.instituteName} onChange={handleProfileChange} placeholder="e.g. Stanford University" className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-900 dark:text-white" />
                      </div>
                      
                      <div className="space-y-1.5 relative">
                        <label className="text-sm font-semibold text-slate-900 dark:text-white">
                          Course Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          name="courseSearch" 
                          required 
                          value={courseSearch} 
                          onChange={handleCourseSearchChange}
                          onFocus={() => setShowCourseDropdown(true)}
                          onBlur={() => setTimeout(() => setShowCourseDropdown(false), 200)}
                          placeholder="Search or type course..." 
                          className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-900 dark:text-white" 
                        />
                        
                        {showCourseDropdown && (
                          <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-xl shadow-xl custom-scrollbar">
                            {filteredCourses.length > 0 ? (
                              filteredCourses.map(c => (
                                <div 
                                  key={c.name} 
                                  onMouseDown={(e) => { e.preventDefault(); handleCourseSelect(c.name); }}
                                  className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 transition-colors"
                                >
                                  {c.name}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 italic">
                                Using custom course name.
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-900 dark:text-white">Current Year <span className="text-red-500">*</span></label>
                        <select name="year" required value={profileData.year} onChange={handleProfileChange} disabled={!profileData.course} className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-900 dark:text-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed">
                          <option value="" disabled>{profileData.course ? 'Select current year' : 'Select a course first'}</option>
                          {yearOptions.map(y => (
                            <option key={y} value={`Year ${y}`}>{y}{y===1?'st':y===2?'nd':y===3?'rd':'th'} Year</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Strict Searchable Location Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 pt-2">
                    
                    <div className="space-y-1.5 relative">
                      <label className="text-sm font-semibold text-slate-900 dark:text-white">State <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        required 
                        value={stateSearch} 
                        onChange={handleStateSearchChange}
                        onFocus={() => setShowStateDropdown(true)}
                        onBlur={handleStateBlur}
                        placeholder="Search for your state..." 
                        className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-900 dark:text-white" 
                      />
                      {showStateDropdown && (
                        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-xl shadow-xl custom-scrollbar">
                          {filteredStates.length > 0 ? (
                            filteredStates.map(s => (
                              <div 
                                key={s} 
                                onMouseDown={(e) => { e.preventDefault(); handleStateSelect(s); }}
                                className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 transition-colors"
                              >
                                {s}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 italic">
                              State not found. Select from list.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 relative">
                      <label className="text-sm font-semibold text-slate-900 dark:text-white">City <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        required 
                        disabled={!profileData.state}
                        value={citySearch} 
                        onChange={handleCitySearchChange}
                        onFocus={() => setShowCityDropdown(true)}
                        onBlur={handleCityBlur}
                        placeholder={profileData.state ? "Search for your city..." : "Select a state first"} 
                        className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed" 
                      />
                      {showCityDropdown && profileData.state && (
                        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-xl shadow-xl custom-scrollbar">
                          {filteredCities.length > 0 ? (
                            filteredCities.map(c => (
                              <div 
                                key={c} 
                                onMouseDown={(e) => { e.preventDefault(); handleCitySelect(c); }}
                                className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 transition-colors"
                              >
                                {c}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 italic">
                              City not found. Select from list.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 pt-2">
                    <label className="text-sm font-semibold text-slate-900 dark:text-white">Bio (Optional)</label>
                    <textarea name="bio" value={profileData.bio} onChange={handleProfileChange} placeholder="Tell your peers a bit about yourself, your goals, or your study habits..." rows="3" className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-900 dark:text-white resize-none"></textarea>
                  </div>

                  <div className="pt-6">
                   <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 md:px-10 py-3.5 md:py-4 rounded-xl font-bold text-black dark:text-white bg-linear-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/25 flex justify-center items-center gap-2 ml-auto">
                    {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : "Complete Profile"}
                    {!isSubmitting && <ArrowRight size={18} />}
                  </button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          <section id="features" className="py-20 md:py-32 border-t border-black/5 dark:border-white/5 backdrop-blur-3xl relative">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <div className="text-center mb-12 md:mb-20 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tighter mb-4 md:mb-6">Your Active Tools</h2>
                <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg font-light px-4">Everything you need to track progress and study effectively.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {features.map((feature, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#0A0A0A] p-6 md:p-8 rounded-3xl border border-black/5 dark:border-white/5 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group relative overflow-hidden cursor-pointer">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6 md:mb-8 border border-black/5 dark:border-white/5 group-hover:scale-110 transition-transform duration-500">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2 md:mb-3 tracking-tight">{feature.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs md:text-sm font-light">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </main>

        <footer className="bg-transparent border-t border-black/5 dark:border-white/5 py-12 md:py-16 relative z-10 w-full mt-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-12">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-linear-to-tr from-indigo-600 to-cyan-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                  <GraduationCap className="text-black dark:text-white w-5 h-5" />
                </div>
                <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">StudyTrail</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm leading-relaxed font-light">
                Empowering students worldwide by combining community-driven learning with modern productivity tools.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 md:mb-6">Platform</h4>
              <ul className="space-y-3 md:space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Leaderboard</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Resources</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 md:mb-6">Company</h4>
              <ul className="space-y-3 md:space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-8 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 order-2 md:order-1">
              &copy; 2026 StudyTrail. All rights reserved.
            </div>
            <div className="flex gap-4 order-1 md:order-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all text-xs md:text-base">X</div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all text-xs md:text-base">in</div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all text-xs md:text-base">IG</div>
            </div>
          </div>
        </footer>
        
        {/* Avatar Modal */}
        {showAvatarModal && (
          <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#111] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 relative shadow-2xl border border-black/5 dark:border-white/10 animate-in zoom-in-95 duration-200 custom-scrollbar">
              <button type="button" onClick={() => setShowAvatarModal(false)} className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white z-10 bg-black/5 dark:bg-white/5 rounded-full p-2 transition-colors">
                <X size={20} />
              </button>
              
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2 pr-8">Update Profile Picture</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mb-6">Upload your own image or choose an avatar.</p>

              {/* Upload Button */}
              <div className="mb-6 md:mb-8">
                 <input 
                   type="file" 
                   accept="image/*" 
                   className="hidden" 
                   ref={avatarInputRef} 
                   onChange={handleAvatarUpload} 
                 />
                 <button 
                   type="button"
                   onClick={() => avatarInputRef.current?.click()} 
                   className="w-full py-6 md:py-8 border-2 border-dashed border-indigo-500/50 hover:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400 transition-colors group"
                 >
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-black/20 rounded-full flex items-center justify-center mb-2 md:mb-3 shadow-sm group-hover:scale-110 transition-transform">
                      <UploadCloud size={20} className="md:w-6 md:h-6" />
                    </div>
                    <span className="font-bold text-base md:text-lg">Upload from Device</span>
                    <span className="text-[10px] md:text-xs font-medium opacity-70 mt-1">Supports JPG, PNG (Max 5MB)</span>
                 </button>
              </div>

              {/* Inbuilt Presets */}
              <div className="space-y-3 md:space-y-4">
                  <h4 className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Or choose a preset</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 md:gap-4">
                    {avatarOptions.map((opt, i) => (
                      <div key={i} onClick={() => { setProfileData({...profileData, avatar: opt}); setFiles({...files, profileImage: null}); setShowAvatarModal(false); }} className={`cursor-pointer rounded-2xl overflow-hidden border-2 md:border-4 relative transition-all hover:scale-105 ${profileData.avatar === opt ? 'border-indigo-500' : 'border-transparent'}`}>
                        <img src={opt} alt="Avatar option" className="w-full h-auto bg-slate-100 dark:bg-slate-800" />
                        {profileData.avatar === opt && (
                          <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-indigo-500 rounded-full p-1 text-white shadow-md">
                            <Check size={10} className="md:w-3 md:h-3" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
              </div>

            </div>
          </div>
        )}

        {/* CoverImage Modal */}
        {showCoverModal && (
          <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#111] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 relative shadow-2xl border border-black/5 dark:border-white/10 animate-in zoom-in-95 duration-200 custom-scrollbar">
              <button type="button" onClick={() => setShowCoverModal(false)} className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white z-10 bg-black/5 dark:bg-white/5 rounded-full p-2 transition-colors">
                <X size={20} />
              </button>
              
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2 pr-8">Update Cover Photo</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mb-6">Upload your own image or choose a theme.</p>

              {/* Upload Button */}
              <div className="mb-6 md:mb-8">
                 <input 
                   type="file" 
                   accept="image/*" 
                   className="hidden" 
                   ref={coverInputRef} 
                   onChange={handleCoverUpload} 
                 />
                 <button 
                   type="button"
                   onClick={() => coverInputRef.current?.click()} 
                   className="w-full py-6 md:py-8 border-2 border-dashed border-indigo-500/50 hover:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400 transition-colors group"
                 >
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-black/20 rounded-full flex items-center justify-center mb-2 md:mb-3 shadow-sm group-hover:scale-110 transition-transform">
                      <UploadCloud size={20} className="md:w-6 md:h-6" />
                    </div>
                    <span className="font-bold text-base md:text-lg">Upload from Device</span>
                    <span className="text-[10px] md:text-xs font-medium opacity-70 mt-1">Supports JPG, PNG (Max 5MB)</span>
                 </button>
              </div>

              {/* Inbuilt Presets */}
              <div className="space-y-3 md:space-y-4">
                  <h4 className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Or choose a preset</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {coverOptions.map((opt, i) => (
                      <div key={i} onClick={() => { setProfileData({...profileData, cover: opt}); setFiles({...files, coverImage: null}); setShowCoverModal(false); }} className={`cursor-pointer h-24 md:h-32 rounded-xl overflow-hidden border-2 md:border-4 relative transition-all hover:scale-105 ${profileData.cover === opt ? 'border-indigo-500' : 'border-transparent'}`}>
                        <img src={opt} alt="Cover option" className="w-full h-full object-cover" />
                        {profileData.cover === opt && (
                          <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-indigo-500 rounded-full p-1.5 text-white shadow-md">
                            <Check size={12} className="md:w-4 md:h-4" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signed;