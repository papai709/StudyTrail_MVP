import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  GraduationCap,
  Bell,
  MessageSquare,
  Camera,
  Edit2,
  Image as ImageIcon,
  Mail,
  BookOpen,
  Zap,
  Flame,
  Share2,
  UserPlus,
  Trophy,
  Star,
  Clock,
  FileText,
  Activity,
  Target,
  CheckCircle2,
  Users,
  LogOut,
  Loader2,
  MoreVertical,
  X,
  Eye,
  Upload,
  MapPin,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import {
  getMyProfile,
  updateMyProfile,
  uploadProfileImage,
  getMyConnections,
  getMyStats,
  getMyPosts,
} from "../api/profile";
import { logout } from "../api/auth";
import { getApiErrorMessage } from "../api/client";

// helper function for time
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const now = new Date();
  const postDate = new Date(dateStr);
  const diffInSeconds = Math.floor((now - postDate) / 1000);

  if (diffInSeconds < 60) return "Just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;

  // Fallback to standard LinkedIn date format for older items (e.g., "Jul 12, 2026")
  return postDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Mock Databases (static reference data — not fake profile data)
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
  "West Bengal Board (WBBSE/WBCHSE)",
];

const indiaLocations = {
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Nellore",
    "Tirupati",
  ],
  Assam: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"],
  Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
  Delhi: ["New Delhi", "North Delhi", "South Delhi", "Dwarka"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  Haryana: ["Gurugram", "Faridabad", "Panipat", "Ambala"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
  ],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  Tripura: ["Agartala", "Udaipur", "Dharmanagar"],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Varanasi",
    "Agra",
    "Noida",
    "Prayagraj",
  ],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol"],
};

const Profile = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();

  // --- UI & Loading States ---
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [saveError, setSaveError] = useState("");

  // --- Photo Interaction States ---
  const [photoMenu, setPhotoMenu] = useState({ isOpen: false, type: "" });
  const [viewImage, setViewImage] = useState({ isOpen: false, src: "" });
  const [showConnections, setShowConnections] = useState(false);
  const [connectionsList, setConnectionsList] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // --- Profile Editing States ---
  const [isEditing, setIsEditing] = useState(false);
  const [backupData, setBackupData] = useState(null);
  const [emailError, setEmailError] = useState("");

  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  // States for Searchable Inputs
  const [courseSearch, setCourseSearch] = useState("");
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [boardSearch, setBoardSearch] = useState("");
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);

  const [stateSearch, setStateSearch] = useState("");
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    bio: "",
    type: "college",
    instituteName: "",
    course: "",
    year: "",
    schoolName: "",
    grade: "",
    board: "",
    state: "",
    city: "",
    avatar: "",
    cover: "",
    stats: { xp: 0, streak: 0, level: 0, connections: 0 },
    goalProgress: 0,
  });

  // --- Effects ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getMyProfile();
        // Parse location: "City, State" format
        let loadedState = "";
        let loadedCity = "";

        if (user.location) {
          loadedCity = user.location.city || "";
          loadedState = user.location.state || "";
        }

        // Determine student type from backend field
        const studentType =
          user.studentType ||
          user.type ||
          (user.className?.toLowerCase().includes("grade")
            ? "school"
            : "college");

        // Map backend fields to frontend state
        setProfileData({
          name: user.fullName || "",
          email: user.email || "",
          bio: user.bio || "",
          type: studentType,
          instituteName:
            studentType === "college"
              ? user.instituteName || user.schoolName || ""
              : "",
          schoolName: studentType === "school" ? user.schoolName || "" : "",
          course: user.course || "",
          year: user.year || "",
          grade: !user.className?.includes("-")
            ? user.className.replace(/^grade\s*/i, "").trim()
            : "",
          board: user.board || "",
          state: loadedState,
          city: loadedCity,
          avatar: user.profileImage || user.avatar || "",
          cover: user.coverImage || user.cover || "",
          stats: {
            xp: 0,
            streak: 0,
            level: 1,
            connections: 0,
          },
          goalProgress: user.goalProgress || 0,
        });

        setCourseSearch(user.course || "");
        setBoardSearch(user.board || "");
        setStateSearch(loadedState);
        setCitySearch(loadedCity);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        // If unauthorized, redirect to login
        if (err?.response?.status === 401) {
          navigate("/");
        }
      } finally {
        setIsLoading(false);
      }
    };

    // fetch user gamification state
    const fetchStats = async () => {
      try {
        const stats = await getMyStats();
        setProfileData((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            xp: stats.xp ?? 0,
            streak: stats.currentStreak ?? 0,
            level: stats.level ?? 1,
          },
        }));
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    };

    // fetch user connections
    const fetchConnections = async () => {
      try {
        const connections = await getMyConnections();

        // Save the complete list
        setConnectionsList(connections);

        // Update the count
        setProfileData((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            connections: connections.length,
          },
        }));
      } catch (err) {
        console.error("Failed to load connections:", err);
      }
    };

    // fetch logged-in user posts
    const fetchPosts = async () => {
      try {
        const myPosts = await getMyPosts();

        setPosts(myPosts);
      } catch (err) {
        console.error("Failed to load posts:", err);
      }
    };

    fetchUserData();
    fetchStats();
    fetchConnections();
    fetchPosts();
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Searchable Inputs Logic ---
  const filteredCourses = collegeCourses.filter((c) =>
    c.name.toLowerCase().includes(courseSearch.toLowerCase()),
  );
  const handleCourseSelect = (courseName) => {
    setProfileData((prev) => ({ ...prev, course: courseName, year: "" }));
    setCourseSearch(courseName);
    setShowCourseDropdown(false);
  };
  const handleCourseSearchChange = (e) => {
    setCourseSearch(e.target.value);
    setShowCourseDropdown(true);
    setProfileData((prev) => ({ ...prev, course: e.target.value, year: "" }));
  };

  const filteredBoards = indianBoards.filter((b) =>
    b.toLowerCase().includes(boardSearch.toLowerCase()),
  );
  const handleBoardSelect = (boardName) => {
    setProfileData((prev) => ({ ...prev, board: boardName }));
    setBoardSearch(boardName);
    setShowBoardDropdown(false);
  };
  const handleBoardSearchChange = (e) => {
    setBoardSearch(e.target.value);
    setShowBoardDropdown(true);
    setProfileData((prev) => ({ ...prev, board: e.target.value }));
  };

  const filteredStates = Object.keys(indiaLocations).filter((s) =>
    s.toLowerCase().includes(stateSearch.toLowerCase()),
  );
  const handleStateSelect = (stateName) => {
    setProfileData((prev) => ({ ...prev, state: stateName, city: "" }));
    setStateSearch(stateName);
    setCitySearch("");
    setShowStateDropdown(false);
  };
  const handleStateSearchChange = (e) => {
    setStateSearch(e.target.value);
    setShowStateDropdown(true);
  };
  const handleStateBlur = () => {
    setTimeout(() => {
      setShowStateDropdown(false);
      const exactMatch = Object.keys(indiaLocations).find(
        (s) => s.toLowerCase() === stateSearch.toLowerCase(),
      );
      if (exactMatch) {
        if (exactMatch !== profileData.state) {
          setProfileData((prev) => ({ ...prev, state: exactMatch, city: "" }));
          setCitySearch("");
        }
        setStateSearch(exactMatch);
      } else {
        setStateSearch(profileData.state);
      }
    }, 200);
  };

  const availableCities = profileData.state
    ? indiaLocations[profileData.state] || []
    : [];
  const filteredCities = availableCities.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase()),
  );
  const handleCitySelect = (cityName) => {
    setProfileData((prev) => ({ ...prev, city: cityName }));
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
      const exactMatch = availableCities.find(
        (c) => c.toLowerCase() === citySearch.toLowerCase(),
      );
      if (exactMatch) {
        setProfileData((prev) => ({ ...prev, city: exactMatch }));
        setCitySearch(exactMatch);
      } else {
        setCitySearch(profileData.city);
      }
    }, 200);
  };

  const selectedCourseObj = collegeCourses.find(
    (c) => c.name === profileData.course,
  );
  const maxYears = selectedCourseObj
    ? selectedCourseObj.duration
    : profileData.course
      ? 5
      : 0;
  const yearOptions = Array.from({ length: maxYears }, (_, i) => i + 1);

  // --- HANDLERS ---

  // Upload profile/cover image to backend
  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      // type is 'avatar' or 'cover'; API expects 'profile' or 'cover'
      const apiType = type === "avatar" ? "profile" : "cover";
      const updatedUser = await uploadProfileImage(apiType, file);

      // Update local state with new image URL from backend
      const newImageUrl =
        type === "avatar"
          ? updatedUser.profileImage || updatedUser.avatar || ""
          : updatedUser.coverImage || updatedUser.cover || "";

      setProfileData((prev) => ({ ...prev, [type]: newImageUrl }));
    } catch (err) {
      console.error(`Failed to upload ${type} image:`, err);
      alert(getApiErrorMessage(err, `Failed to upload ${type} image`));
    } finally {
      setIsUploadingImage(false);
      setPhotoMenu({ isOpen: false, type: "" });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === "email" ? value.toLowerCase() : value;
    setProfileData((prev) => ({ ...prev, [name]: processedValue }));
    if (name === "email") setEmailError("");
  };

  const startEditing = () => {
    setBackupData({ ...profileData });
    setCourseSearch(profileData.course);
    setBoardSearch(profileData.board);
    setStateSearch(profileData.state);
    setCitySearch(profileData.city);
    setEmailError("");
    setSaveError("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setProfileData(backupData);
    setCourseSearch(backupData.course);
    setBoardSearch(backupData.board);
    setStateSearch(backupData.state);
    setCitySearch(backupData.city);
    setEmailError("");
    setSaveError("");
    setIsEditing(false);
  };

  const saveProfile = async () => {
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!profileData.email.trim()) {
      setEmailError("Email cannot be empty");
      return;
    }
    if (!emailRegex.test(profileData.email)) {
      setEmailError("Enter a valid email address (e.g., yourname@gmail.com)");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    try {
      // Build payload to match backend's /user/update-account schema
      const payload = {
        fullName: profileData.name,
        email: profileData.email,
        bio: profileData.bio,
        studentType: profileData.type,

        className:
          profileData.type === "school"
            ? `Grade ${profileData.grade}`
            : `${profileData.course} - ${profileData.year}`,
        schoolName: profileData.schoolName,
        instituteName: profileData.instituteName,
        course: profileData.course,
        year: profileData.year,
        grade: profileData.grade,
        board: profileData.board,
        location: {
          city: profileData.city,
          state: profileData.state,
        },
      };

      // Remove undefined keys
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key],
      );

      await updateMyProfile(payload);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setSaveError(
        getApiErrorMessage(err, "Failed to save profile. Please try again."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      navigate("/");
    }
  };

  // --- REUSABLE WIDGETS ---
  const GoalWidget = () => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const progress = profileData.goalProgress;
    return (
      <div className="bg-white dark:bg-[#0A0A0A] p-6 rounded-3xl border border-black/5 dark:border-white/5 w-full">
        <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Target className="text-indigo-500" size={20} /> Weekly Goal
        </h3>
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={isDarkMode ? "#1f2937" : "#e5e7eb"}
                strokeWidth="12"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#6366F1"
                strokeWidth="12"
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
                strokeDasharray={circumference}
                strokeDashoffset={
                  circumference - (circumference * progress) / 100
                }
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {progress}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Completed
              </span>
            </div>
          </div>
          <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-6 px-4">
            You are almost there! Keep studying to complete your weekly target.
          </p>
        </div>
      </div>
    );
  };

  const BadgesWidget = () => (
    <div className="bg-white dark:bg-[#0A0A0A] p-6 rounded-3xl border border-black/5 dark:border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Star className="text-amber-500" size={20} /> Top Badges
        </h3>
        <button className="text-xs font-bold text-indigo-500 hover:text-indigo-600 uppercase tracking-wider">
          View All
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-[#111] p-4 rounded-2xl flex flex-col items-center text-center border border-black/5 dark:border-white/5 hover:border-indigo-500/30 transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-500/10 text-violet-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Trophy size={20} />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Top Contributor
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-[#111] p-4 rounded-2xl flex flex-col items-center text-center border border-black/5 dark:border-white/5 hover:border-indigo-500/30 transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Moon size={20} />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Night Owl
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-[#111] p-4 rounded-2xl flex flex-col items-center text-center border border-black/5 dark:border-white/5 hover:border-emerald-500/30 transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users size={20} />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Helpful Peer
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-[#111] p-4 rounded-2xl flex flex-col items-center text-center border border-black/5 dark:border-white/5 hover:border-orange-500/30 transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Flame size={20} />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Hot Streak
          </span>
        </div>
      </div>
    </div>
  );

  const MobileStatsWidget = () => {
    return (
      <div className="w-full grid grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-[#111] p-4 min-h-27.5">
          <Zap size={24} className="mb-2 text-amber-500 shrink-0" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {profileData.stats.xp}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Total XP
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-[#111] p-4 min-h-27.5">
          <Flame size={24} className="mb-2 text-orange-500 shrink-0" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {profileData.stats.streak}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Day Streak
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-[#111] p-4 md:p-10 rounded-2xl border border-black/5 dark:border-white/5 flex items-center gap-1 md:gap-5 hover:-translate-y-1 transition-transform shadow-sm col-span-2">
          <div className="w-8 h-8 md:w-14 md:h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Star className="text-emerald-500 fill-emerald-500/20" size={24} />
          </div>
          <div>
            <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
              Level
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {profileData.stats.level} Docs
            </h3>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#050505]">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );

  return (
    <div className={isDarkMode ? "dark" : ""}>
      {/* Full Screen Image Viewer Modal */}
      {viewImage.isOpen && (
        <div
          className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setViewImage({ isOpen: false, src: "" })}
        >
          <button className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
          <img
            src={viewImage.src}
            alt="Full Screen"
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Connections Modal */}
      {showConnections && (
        <div
          className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowConnections(false)}
        >
          <div
            className="bg-white dark:bg-[#111] p-6 rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 w-full max-w-sm animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5 border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Your Connections
              </h3>

              <button
                onClick={() => setShowConnections(false)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-1.5 rounded-full"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {connectionsList.map((connection) => (
                <div key={connection._id} className="flex items-center gap-3">
                  <img
                    src={connection.profileImage || "/default-avatar.png"}
                    alt={connection.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />

                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {connection.fullName}
                    </h4>

                    <p className="text-xs text-slate-500">
                      @{connection.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {connectionsList.length === 0 && (
              <div className="text-center py-8">
                <Users
                  className="mx-auto mb-3 text-slate-300 dark:text-slate-700"
                  size={32}
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You don't have any connections yet.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Connect with others to see them here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Facebook-Style Action Menu */}
      {photoMenu.isOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setPhotoMenu({ isOpen: false, type: "" })}
        >
          <div
            className="bg-white dark:bg-[#111] p-4 rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 w-72 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
              {photoMenu.type === "avatar" ? "Profile Picture" : "Cover Photo"}
            </h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setViewImage({
                    isOpen: true,
                    src:
                      photoMenu.type === "avatar"
                        ? profileData.avatar
                        : profileData.cover,
                  });
                  setPhotoMenu({ isOpen: false, type: "" });
                }}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-white transition-colors font-semibold"
              >
                <Eye size={18} className="text-indigo-500" /> View Photo
              </button>
              <button
                onClick={() => {
                  if (photoMenu.type === "avatar")
                    avatarInputRef.current?.click();
                  else coverInputRef.current?.click();
                  setPhotoMenu({ isOpen: false, type: "" });
                }}
                disabled={isUploadingImage}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-white transition-colors font-semibold disabled:opacity-60"
              >
                {isUploadingImage ? (
                  <Loader2
                    size={18}
                    className="animate-spin text-emerald-500"
                  />
                ) : (
                  <Upload size={18} className="text-emerald-500" />
                )}
                {isUploadingImage ? "Uploading..." : "Upload New Photo"}
              </button>
            </div>
            <button
              onClick={() => setPhotoMenu({ isOpen: false, type: "" })}
              className="w-full mt-3 p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hidden file inputs for uploading */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={coverInputRef}
        onChange={(e) => handleImageUpload(e, "cover")}
      />
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={avatarInputRef}
        onChange={(e) => handleImageUpload(e, "avatar")}
      />

      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#050505] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500 flex flex-col relative overflow-x-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,rgba(0,0,0,0)_70%)] blur-[100px] pointer-events-none z-0"></div>
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.1)_0%,rgba(0,0,0,0)_70%)] blur-[100px] pointer-events-none z-0"></div>

        {/* Navbar */}
        <nav
          className={`fixed top-0 w-full z-40 transition-all duration-500 ${scrolled ? "bg-white/90 dark:bg-[#050505]/90 backdrop-blur-2xl border-b border-black/5 dark:border-white/5 py-3" : "bg-transparent border-transparent py-3 md:py-5"}`}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-wrap items-center justify-between gap-y-3">
            <div className="flex items-center gap-2 md:gap-3 order-1 shrink-0">
              <div className="bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/10 p-2 rounded-xl shadow-sm transition-colors">
                <GraduationCap className="text-black dark:text-white w-5 h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-xl md:text-2xl font-bold tracking-tight text-black dark:text-white">
                StudyTrail
              </span>
            </div>

            <div className="flex items-center gap-2 md:gap-4 order-2 md:order-3 shrink-0">
              <div
                onClick={(e) => {
                  e.preventDefault();
                  toggleDarkMode();
                }}
                className="cursor-pointer p-2 md:p-2.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-amber-300 hover:scale-110 active:scale-95 transition-all"
              >
                {isDarkMode ? (
                  <Sun
                    size={16}
                    className="md:w-5 md:h-5 pointer-events-none"
                  />
                ) : (
                  <Moon
                    size={16}
                    className="md:w-5 md:h-5 pointer-events-none"
                  />
                )}
              </div>

              <button className="hidden md:block p-2 md:p-2.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-110 active:scale-95 transition-all relative">
                <Bell size={16} className="md:w-5 md:h-5" />
                <span className="absolute top-1.5 right-1.5 md:top-1.5 md:right-2 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full border border-white dark:border-[#0A0A0A]"></span>
              </button>

              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition-all"
              >
                <MoreVertical size={20} />
              </button>

              <div className="hidden md:block w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-indigo-500 shadow-sm shrink-0">
                <img
                  src={profileData.avatar}
                  alt="Current User"
                  className="w-full h-full object-cover bg-white"
                />
              </div>

              <button
                onClick={handleLogout}
                className="hidden md:flex bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold hover:scale-105 active:scale-95 transition-all shadow-sm items-center gap-1.5 md:gap-2 shrink-0"
              >
                <LogOut size={14} className="md:w-4 md:h-4" />{" "}
                <span>Logout</span>
              </button>
            </div>

            <div className="flex w-full md:w-auto items-center justify-center gap-6 md:gap-8 order-3 md:order-2 text-sm font-medium text-slate-500 pt-2 md:pt-0">
              <a
                href="#"
                className="text-indigo-600 dark:text-indigo-400 font-bold transition-colors"
              >
                Home
              </a>
              <Link
                to="/Working"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Leaderboard
              </Link>
              <Link
                to="/feed"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Explore
              </Link>
            </div>
          </div>
        </nav>

        {/* Mobile Sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <div
          className={`fixed top-0 right-0 h-full w-[85%] sm:w-80 bg-white dark:bg-[#0A0A0A] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden overflow-y-auto ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <img
                  src={profileData.avatar}
                  alt="Current User"
                  className="w-10 h-10 rounded-full border-2 border-indigo-500 object-cover"
                />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white leading-tight">
                    {profileData.name}
                  </p>
                  <p className="text-xs text-slate-500">Student Dashboard</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 bg-slate-100 dark:bg-[#111] rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Your Stats
            </h4>
            <MobileStatsWidget />
            <div className="space-y-6 mt-8">
              <GoalWidget />
              <BadgesWidget />
            </div>
            <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 space-y-3">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#111] text-slate-700 dark:text-slate-300 transition-colors">
                <Bell size={18} /> Notifications{" "}
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  3
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors font-semibold"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 relative z-10 pt-32 md:pt-36 pb-20 w-full max-w-[100vw]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* HERO / PROFILE HEADER */}
            {/* FIX: Removed 'overflow-hidden' from here to prevent cropping dropdowns, added 'relative z-20' */}
            <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl md:rounded-[40px] shadow-2xl border border-black/5 dark:border-white/5 mb-8 relative z-20">
              {/* FIX: Added 'rounded-t-3xl md:rounded-t-[40px] overflow-hidden' specifically to the cover container */}
              <div
                className="h-48 sm:h-56 md:h-72 w-full relative group cursor-pointer rounded-t-3xl md:rounded-t-[40px] overflow-hidden"
                onClick={() => setPhotoMenu({ isOpen: true, type: "cover" })}
              >
                {profileData.cover ? (
                  <img
                    src={profileData.cover}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-cyan-500/20" />
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-full font-medium text-sm border border-white/40 flex items-center gap-2 hover:scale-105 transition-all shadow-lg pointer-events-none">
                    <Camera size={18} /> Edit Cover
                  </div>
                </div>
              </div>

              <div className="px-5 sm:px-8 md:px-12 pb-8 md:pb-10 flex flex-col md:flex-row gap-4 md:gap-10">
                <div className="relative -mt-16 sm:-mt-20 md:-mt-24 inline-block group w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 shrink-0 self-start">
                  <div
                    className="w-full h-full rounded-full border-4 border-white dark:border-[#0A0A0A] bg-slate-100 dark:bg-slate-800 overflow-hidden relative shadow-xl cursor-pointer"
                    onClick={() =>
                      setPhotoMenu({ isOpen: true, type: "avatar" })
                    }
                  >
                    {profileData.avatar ? (
                      <img
                        src={profileData.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-cyan-400">
                        <span className="text-4xl font-black text-white">
                          {profileData.name
                            ? profileData.name.charAt(0).toUpperCase()
                            : "?"}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera
                        className="text-white hover:scale-110 transition-transform pointer-events-none"
                        size={28}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 pt-2 md:pt-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-start gap-4">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight wrap-break-word">
                          {profileData.name || "Student"}
                        </h1>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {isEditing ? (
                            <>
                              <button
                                onClick={saveProfile}
                                disabled={isSaving}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                              >
                                {isSaving ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={16} />
                                )}
                                {isSaving ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-[#1A1A1A] text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                              >
                                <X size={16} /> Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={startEditing}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                            >
                              <Edit2 size={16} /> Edit Profile
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-4 animate-in fade-in duration-300 max-w-2xl">
                          {saveError && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
                              {saveError}
                            </div>
                          )}
                          <input
                            type="text"
                            name="name"
                            value={profileData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/50 text-sm font-bold"
                            placeholder="Full Name"
                          />
                          <textarea
                            name="bio"
                            value={profileData.bio}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/50 text-sm"
                            rows="2"
                            placeholder="Write your bio..."
                          />

                          <div>
                            <input
                              type="email"
                              name="email"
                              value={profileData.email}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#111] border ${emailError ? "border-red-500 focus:ring-red-500/50" : "border-black/10 dark:border-white/10 focus:ring-indigo-500/50"} focus:ring-2 text-sm`}
                              placeholder="Email address (e.g., name@gmail.com)"
                            />
                            {emailError && (
                              <p className="text-xs text-red-500 font-medium mt-1.5 ml-1">
                                {emailError}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="radio"
                                name="type"
                                value="college"
                                checked={profileData.type === "college"}
                                onChange={handleInputChange}
                                className="text-indigo-500"
                              />{" "}
                              College
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="radio"
                                name="type"
                                value="school"
                                checked={profileData.type === "school"}
                                onChange={handleInputChange}
                                className="text-indigo-500"
                              />{" "}
                              School
                            </label>
                          </div>

                          {profileData.type === "college" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                name="instituteName"
                                value={profileData.instituteName}
                                onChange={handleInputChange}
                                className="col-span-1 md:col-span-2 w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/50 text-sm"
                                placeholder="College/University Name"
                              />

                              {/* FIX: added conditional dynamic z-index wrapping logic to prevent overlap between adjacent fields */}
                              <div
                                className={`relative ${showCourseDropdown ? "z-50" : "z-10"}`}
                              >
                                <input
                                  type="text"
                                  name="courseSearch"
                                  required
                                  value={courseSearch}
                                  onChange={handleCourseSearchChange}
                                  onFocus={() => setShowCourseDropdown(true)}
                                  onBlur={() =>
                                    setTimeout(
                                      () => setShowCourseDropdown(false),
                                      200,
                                    )
                                  }
                                  placeholder="Search or type course..."
                                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/50 text-sm"
                                />
                                {showCourseDropdown && (
                                  <div className="absolute w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-xl shadow-xl custom-scrollbar text-left">
                                    {filteredCourses.map((c) => (
                                      <div
                                        key={c.name}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          handleCourseSelect(c.name);
                                        }}
                                        className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 transition-colors"
                                      >
                                        {c.name}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="relative z-10">
                                <select
                                  name="year"
                                  value={profileData.year}
                                  onChange={handleInputChange}
                                  disabled={!profileData.course}
                                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/50 text-sm disabled:opacity-50"
                                >
                                  <option value="" disabled>
                                    {profileData.course
                                      ? "Select Year"
                                      : "Select a course first"}
                                  </option>
                                  {yearOptions.map((y) => (
                                    <option key={y} value={`Year ${y}`}>
                                      {y}
                                      {y === 1
                                        ? "st"
                                        : y === 2
                                          ? "nd"
                                          : y === 3
                                            ? "rd"
                                            : "th"}{" "}
                                      Year
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                name="schoolName"
                                value={profileData.schoolName}
                                onChange={handleInputChange}
                                className="col-span-1 md:col-span-2 w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/50 text-sm"
                                placeholder="School Name"
                              />

                              <div className="relative z-10">
                                <select
                                  name="grade"
                                  value={profileData.grade}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/50 text-sm"
                                >
                                  <option value="" disabled>
                                    Select Grade
                                  </option>
                                  {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                                    <option key={g} value={String(g)}>
                                      Grade {g}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* FIX: added conditional dynamic z-index wrapping logic to prevent overlap between adjacent fields */}
                              <div
                                className={`relative ${showBoardDropdown ? "z-50" : "z-10"}`}
                              >
                                <input
                                  type="text"
                                  name="boardSearch"
                                  required
                                  value={boardSearch}
                                  onChange={handleBoardSearchChange}
                                  onFocus={() => setShowBoardDropdown(true)}
                                  onBlur={() =>
                                    setTimeout(
                                      () => setShowBoardDropdown(false),
                                      200,
                                    )
                                  }
                                  placeholder="Search or type board..."
                                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/50 text-sm"
                                />
                                {showBoardDropdown && (
                                  <div className="absolute w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-xl shadow-xl custom-scrollbar text-left">
                                    {filteredBoards.map((b) => (
                                      <div
                                        key={b}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          handleBoardSelect(b);
                                        }}
                                        className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 transition-colors"
                                      >
                                        {b}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Common Location Searchable Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-black/5 dark:border-white/5 mt-4">
                            {/* FIX: conditional dynamic z-index wrapping */}
                            <div
                              className={`relative ${showStateDropdown ? "z-50" : "z-10"}`}
                            >
                              <input
                                type="text"
                                required
                                value={stateSearch}
                                onChange={handleStateSearchChange}
                                onFocus={() => setShowStateDropdown(true)}
                                onBlur={handleStateBlur}
                                placeholder="Search for your state..."
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/50 text-sm"
                              />
                              {showStateDropdown && (
                                <div className="absolute w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-xl shadow-xl custom-scrollbar text-left">
                                  {filteredStates.map((s) => (
                                    <div
                                      key={s}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleStateSelect(s);
                                      }}
                                      className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 transition-colors"
                                    >
                                      {s}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* FIX: conditional dynamic z-index wrapping */}
                            <div
                              className={`relative ${showCityDropdown ? "z-50" : "z-10"}`}
                            >
                              <input
                                type="text"
                                required
                                disabled={!profileData.state}
                                value={citySearch}
                                onChange={handleCitySearchChange}
                                onFocus={() => setShowCityDropdown(true)}
                                onBlur={handleCityBlur}
                                placeholder={
                                  profileData.state
                                    ? "Search for your city..."
                                    : "Select a state first"
                                }
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#111] border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/50 text-sm disabled:opacity-50"
                              />
                              {showCityDropdown && profileData.state && (
                                <div className="absolute w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-xl shadow-xl custom-scrollbar text-left">
                                  {filteredCities.map((c) => (
                                    <div
                                      key={c}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleCitySelect(c);
                                      }}
                                      className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 transition-colors"
                                    >
                                      {c}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 animate-in fade-in max-w-2xl">
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">
                            {profileData.bio || "No bio added yet."}
                          </p>

                          <div className="pt-1">
                            <button
                              onClick={() => setShowConnections(true)}
                              className="inline-flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                            >
                              {profileData.stats.connections} connections
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-y-3 gap-x-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-2 w-full sm:w-auto break-all">
                              <Mail
                                size={16}
                                className="text-indigo-500 shrink-0"
                              />{" "}
                              {profileData.email || "No email provided"}
                            </div>
                            {profileData.type === "college" ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <BookOpen
                                    size={16}
                                    className="text-indigo-500 shrink-0"
                                  />{" "}
                                  <span className="line-clamp-1">
                                    {profileData.instituteName ||
                                      "College Not Set"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <GraduationCap
                                    size={16}
                                    className="text-indigo-500 shrink-0"
                                  />{" "}
                                  {profileData.course || "Course Not Set"}{" "}
                                  {profileData.year
                                    ? `• ${profileData.year}`
                                    : ""}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <BookOpen
                                    size={16}
                                    className="text-indigo-500 shrink-0"
                                  />{" "}
                                  <span className="line-clamp-1">
                                    {profileData.schoolName ||
                                      "School Name Not Set"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <GraduationCap
                                    size={16}
                                    className="text-indigo-500 shrink-0"
                                  />{" "}
                                  {profileData.grade || "Grade Not Set"}{" "}
                                  {profileData.board
                                    ? `• ${profileData.board}`
                                    : ""}
                                </div>
                              </>
                            )}
                            <div className="flex items-center gap-2 w-full">
                              <MapPin
                                size={16}
                                className="text-indigo-500 shrink-0"
                              />{" "}
                              {profileData.city && profileData.state
                                ? `${profileData.city}, ${profileData.state}`
                                : "Location Not Set"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row lg:flex-col w-full lg:w-auto gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-black/5 dark:border-white/5">
                      <Link
                        to="/Working"
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 active:scale-95 transition-all border border-black/5 dark:border-white/10 min-w-35 md:min-w-40"
                      >
                        <MessageSquare size={18} /> Message
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
              <div className="bg-white dark:bg-[#0A0A0A] p-5 md:p-6 rounded-3xl border border-black/5 dark:border-white/5 flex items-center gap-4 md:gap-5 hover:-translate-y-1 transition-transform shadow-sm">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Zap className="text-amber-500" size={24} />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
                    Total XP
                  </p>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                    {profileData.stats.xp.toLocaleString()}
                  </h3>
                </div>
              </div>
              <div className="bg-white dark:bg-[#0A0A0A] p-5 md:p-6 rounded-3xl border border-black/5 dark:border-white/5 flex items-center gap-4 md:gap-5 hover:-translate-y-1 transition-transform shadow-sm">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Flame className="text-orange-500" size={24} />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
                    Study Streak
                  </p>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                    {profileData.stats.streak} Days
                  </h3>
                </div>
              </div>
              <div className="bg-white dark:bg-[#0A0A0A] p-5 md:p-6 rounded-3xl border border-black/5 dark:border-white/5 flex items-center gap-4 md:gap-5 hover:-translate-y-1 transition-transform shadow-sm">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Star
                    className="text-emerald-500 fill-emerald-500/20"
                    size={24}
                  />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
                    Level
                  </p>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                    {profileData.stats.level}
                  </h3>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white dark:bg-[#0A0A0A] p-2 rounded-2xl border border-black/5 dark:border-white/5 flex overflow-x-auto hide-scrollbar">
                  {["posts", "achievements", "activity"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 min-w-30 py-3 px-4 rounded-xl font-semibold text-sm capitalize transition-all flex items-center justify-center gap-2 ${activeTab === tab ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"}`}
                    >
                      {tab === "posts" && <FileText size={16} />}
                      {tab === "achievements" && <Trophy size={16} />}
                      {tab === "activity" && <Activity size={16} />}
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl p-5 md:p-8 border border-black/5 dark:border-white/5 min-h-100">
                  {activeTab === "posts" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      {posts.length === 0 ? (
                        <div className="text-center py-10">
                          <FileText
                            className="mx-auto mb-3 text-slate-400"
                            size={36}
                          />
                          <p className="text-slate-500">
                            You haven't created any posts yet.
                          </p>
                        </div>
                      ) : (
                        posts.map((post) => (
                          <div
                            key={post._id}
                            className="bg-white dark:bg-[#111] rounded-2xl border border-black/5 dark:border-white/10 p-5 shadow-sm"
                          >
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-4">
                              <img
                                src={
                                  post.owner.profileImage ||
                                  "/default-avatar.png"
                                }
                                alt={post.owner.fullName}
                                className="w-11 h-11 rounded-full object-cover"
                              />

                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900 dark:text-white">
                                  {post.owner.fullName}
                                </h4>

                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <span>@{post.owner.username}</span>
                                  <span>•</span>
                                  <span
                                    title={new Date(
                                      post.createdAt,
                                    ).toLocaleString()}
                                  >
                                    {formatRelativeTime(post.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Post Content */}
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                              {post.content}
                            </p>

                            {/* Attachments */}
                            {post.attachments.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {post.attachments.map((file) => (
                                  <a
                                    key={file.url}
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3"
                                  >
                                    📎 {file.originalName}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}

                      <div className="text-center text-slate-400 py-10">
                        <Activity
                          className="mx-auto mb-3 opacity-50"
                          size={32}
                        />
                        <p className="text-sm">End of posts</p>
                      </div>
                    </div>
                  )}

                  {activeTab === "achievements" && (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-20 animate-in fade-in">
                      <Trophy
                        className="mx-auto mb-4 opacity-50 text-amber-500"
                        size={48}
                      />
                      <p>View all unlocked badges and milestones here.</p>
                    </div>
                  )}

                  {activeTab === "activity" && (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-20 animate-in fade-in">
                      <Clock
                        className="mx-auto mb-4 opacity-50 text-indigo-500"
                        size={48}
                      />
                      <p>Recent interactions, comments, and study sessions.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right column: Goals and Badges (Stacks on mobile) */}
              <div className="lg:col-span-4 space-y-6 flex flex-col">
                <GoalWidget />
                <BadgesWidget />
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-transparent border-t border-black/5 dark:border-white/5 py-12 md:py-16 relative z-10 mt-10">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-linear-to-tr from-indigo-600 to-cyan-500 p-2 rounded-lg">
                  <GraduationCap
                    className="text-black dark:text-white"
                    size={20}
                  />
                </div>
                <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  StudyTrail
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm leading-relaxed font-light">
                Empowering students worldwide by combining community-driven
                learning with modern productivity tools.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 md:mb-6">
                Platform
              </h4>
              <ul className="space-y-3 md:space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <Link
                    to="/Working"
                    className="hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Resources
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 md:mb-6">
                Company
              </h4>
              <ul className="space-y-3 md:space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left">
              &copy; 2026 StudyTrail. All rights reserved.
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all">
                X
              </div>
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all">
                in
              </div>
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all">
                IG
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Profile;
