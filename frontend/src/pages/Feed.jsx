import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import "../Feed.css";
import {
  Home,
  BookOpen,
  Trophy,
  Compass,
  MessageSquare,
  Search,
  Image as ImageIcon,
  FileText,
  Send,
  Heart,
  Share2,
  X,
  Check,
  Download,
  Flame,
  Sparkles,
  GraduationCap,
  Edit3,
  Upload,
  MoreVertical,
  Menu,
  Sun,
  Moon,
  Bell,
  Users,
  UserPlus,
  Clock,
  Lock,
  Globe,
  ChevronDown,
  ChevronUp,
  GlobeLock,
  Target,
  Smile,
  PlaySquare,
} from "lucide-react";
import { getCurrentUser } from "../api/auth";

import {
  getPosts,
  createPost,
  togglePostReaction,
  createComment,
  getComments,
  getGoals,
  createGoal,
  updateGoal,
  getSuggestedScholars,
  sendConnectionRequest,
  getPendingRequests,
  acceptConnectionRequest,
  removeConnection,
  getMyNetworkStreaks,
} from "../api/feed";

import { getMyStats } from "../api/profile";

export const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "Home", targetRoute: "/home" },
  {
    id: "messages",
    label: "Messages",
    icon: "MessageSquare",
    targetRoute: "/working",
  },
  {
    id: "resources",
    label: "Resources",
    icon: "BookOpen",
    targetRoute: "/working",
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    icon: "Trophy",
    targetRoute: "/working",
  },
];

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
const TYPEWRITER_PLACEHOLDERS = [
  "What's on your mind?",
  "Want to share your studies?",
  "Share a study update...",
  "Got any notes to share?",
  "Ask a question to the community...",
];

const REACTIONS = [
  { id: "love", emoji: "❤️", label: "Love", color: "text-pink-500" },
];

const QUICK_EMOJIS = ["👍", "🔥", "📚", "🧠", "✨", "💻", "💡", "🚀"];

const DUMMY_GIFS = [
  "https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif",
  "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
];

const renderCommentText = (text) => {
  if (!text) return null;
  const parts = text.split(/(@[\w_]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span key={i} className="text-violet-500 font-semibold">
          {part}
        </span>
      );
    }
    return part;
  });
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export default function Feed() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  // --- REAL DATA STATES ---
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [suggestedScholars, setSuggestedScholars] = useState([]);
  const [requestedScholars, setRequestedScholars] = useState(new Set());

  // Infinite Scroll State
  // Infinite Scroll State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // NEW: Bulletproof Intersection Observer using useCallback
  const observer = useRef();
  const lastElementRef = useCallback(
    (node) => {
      // 1. Don't trigger if we are already loading something
      if (isLoadingMore) return;

      // 2. Disconnect the old observer so we don't end up with duplicates
      if (observer.current) observer.current.disconnect();

      // 3. Create a new observer pointing at the target node
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          console.log("Threshold crossed! Loading page...");
          setPage((prev) => prev + 1);
        }
      });

      // 4. Tell the observer to watch the node
      if (node) observer.current.observe(node);
    },
    [isLoadingMore, hasMore],
  );

  // Derived user variables
  const userAvatar =
    currentUser?.profileImage ||
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Student&backgroundColor=e2e8f0";
  const userHandle = currentUser?.username ? `@${currentUser.username}` : "";
  const [myStats, setMyStats] = useState(null);
  const [networkStreaks, setNetworkStreaks] = useState([]);

  // Remap global template references to prevent React structural rendering crashes
  const LOGGED_IN_USER = {
    id: currentUser?._id || "current-user",
    name: currentUser?.fullName || "Student",
    handle: userHandle,
    avatarUrl: userAvatar,
  };

  const storyData = [
    {
      id: "me",
      name: "Your StudyStreak",
      username: userHandle,
      avatar: userAvatar,
      streak: myStats?.currentStreak || 0,
      isSelf: true,
    },

    ...networkStreaks.map((item) => ({
      id: item.user._id,
      name: item.user.fullName,
      username: `@${item.user.username}`,
      avatar: item.user.profileImage,
      streak: item.streak,
    })),
  ];

  // --- ALL EXISTING UI STATES (Kept intact!) ---
  const [isFriendRequestsOpen, setIsFriendRequestsOpen] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newPostText, setNewPostText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageLightbox, setImageLightbox] = useState(null);
  const [currentRoute, setCurrentRoute] = useState("/home");
  const [isUploadExpanded, setIsUploadExpanded] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileScholarsOpen, setIsMobileScholarsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [isBottomSearchOpen, setIsBottomSearchOpen] = useState(false);
  const [activeReactionPostId, setActiveReactionPostId] = useState(null);

  const pressTimer = useRef(null);
  const scholarsSectionRef = useRef(null);
  const storyScrollRef = useRef(null);
  const mediaInputRef = useRef(null);
  const docInputRef = useRef(null);
  const postTextareaRef = useRef(null);

  const [goalForm, setGoalForm] = useState({
    title: "",
    subject: "",
    deadline: "",
    isPublic: true,
  });
  const [isGoalSubmitting, setIsGoalSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [goals, setGoals] = useState([]);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentMedia, setCommentMedia] = useState({});
  const [activeEmojiPicker, setActiveEmojiPicker] = useState({});
  const [activeGifPicker, setActiveGifPicker] = useState({});

  const [currentPlaceholder, setCurrentPlaceholder] = useState("");
  const [phIndex, setPhIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [isComposerActive, setIsComposerActive] = useState(false);

  const shouldShowComposerActions =
    isComposerActive ||
    Boolean(newPostText.trim()) ||
    Boolean(selectedFile) ||
    isUploadExpanded;

  // --- NORMALIZATION HELPER ---
  const normalizePost = (post) => {
    const media = post.attachments?.[0];
    return {
      ...post,
      id: post.id || post._id,
      contentText: post.content || post.contentText || "",
      mediaUrl: media?.url || post.mediaUrl || null,
      mediaType: media?.fileType?.includes("image")
        ? "image"
        : media
          ? "document"
          : post.mediaType || "none",
      fileName: post.fileName || (media ? "Attachment" : null),
      fileSize: post.fileSize || null,
      author: post.owner
        ? {
            name: post.owner.fullName || "Student",
            handle: post.owner.username ? `@${post.owner.username}` : "",
            avatarUrl:
              post.owner.profileImage ||
              "https://api.dicebear.com/7.x/avataaars/svg?seed=Student&backgroundColor=e2e8f0",
          }
        : post.author || {
            name: "Student",
            handle: "",
            avatarUrl:
              "https://api.dicebear.com/7.x/avataaars/svg?seed=Student&backgroundColor=e2e8f0",
          },
      userReaction: post.isLiked ? "love" : post.userReaction || null,
    };
  };

  //useEffect start
  // --- DATA LOADING EFFECTS ---

  //  Initial Load
  useEffect(() => {
    const loadInitialFeed = async () => {
      try {
        const userResponse = await getCurrentUser();
        setCurrentUser(userResponse?.user ?? userResponse);
      } catch (error) {
        // console.error("AUTH ERROR DETAILS:", error.response?.data || error.message);
        navigate("/log", { state: { mode: "login" } });
        return;
      }

      const [
        postsResult,
        goalsResult,
        suggestionsResult,
        requestsResult,
        myStatsResult,
        networkResult,
      ] = await Promise.allSettled([
        getPosts(page),
        getGoals(),
        getSuggestedScholars(),
        getPendingRequests(), // fetch pending friend requests!
        getMyStats(),
        getMyNetworkStreaks(),
      ]);

      if (postsResult.status === "fulfilled") {
        const payload = postsResult.value;
        const loadedPosts = payload?.posts ?? payload ?? [];
        const normalizedPosts = (
          Array.isArray(loadedPosts) ? loadedPosts : []
        ).map(normalizePost);

        setPosts(normalizedPosts);
        setCommentsByPost({});
        setHasMore(payload?.pagination?.hasNextPage ?? false);
      }

      if (goalsResult.status === "fulfilled") {
        const loadedGoals = goalsResult.value?.goals ?? goalsResult.value ?? [];
        setGoals(
          (Array.isArray(loadedGoals) ? loadedGoals : []).map((goal) => ({
            ...goal,
            id: goal.id || goal._id,
          })),
        );
      }

      if (suggestionsResult.status === "fulfilled") {
        const loadedSuggestions =
          suggestionsResult.value?.users ?? suggestionsResult.value ?? [];
        setSuggestedScholars(
          (Array.isArray(loadedSuggestions) ? loadedSuggestions : []).map(
            (user) => ({
              ...user,
              id: user.id || user._id,
              name: user.fullName || user.name || "Student",
              handle: user.username ? `@${user.username}` : user.handle,
              avatar:
                user.profileImage ||
                user.avatarUrl ||
                "https://api.dicebear.com/7.x/avataaars/svg?seed=Student&backgroundColor=e2e8f0",
            }),
          ),
        );
      }

      //PROCESS THE FRIEND REQUESTS
      if (requestsResult && requestsResult.status === "fulfilled") {
        const loadedRequests = requestsResult.value ?? [];

        setFriendRequests(
          (Array.isArray(loadedRequests) ? loadedRequests : []).map((req) => ({
            requestId: req._id,
            // Added '?' safe-navigation in case the sender's account was deleted
            senderId: req.sender?._id,
            name: req.sender?.fullName || "Student",
            handle: req.sender?.username ? `@${req.sender.username}` : "",
            avatar:
              req.sender?.profileImage ||
              "https://api.dicebear.com/7.x/avataaars/svg?seed=Student&backgroundColor=e2e8f0",
          })),
        );
      }

      if (myStatsResult.status === "fulfilled") {
        setMyStats(myStatsResult.value);
      }

      if (networkResult.status === "fulfilled") {
        setNetworkStreaks(networkResult.value);
      }
    };
    loadInitialFeed();
  }, [navigate]);

  //  Load More Posts Pagination
  useEffect(() => {
    if (page === 1) return;
    const loadMorePosts = async () => {
      setIsLoadingMore(true);
      try {
        const payload = await getPosts(page);
        const loadedPosts = payload?.posts ?? [];
        const normalizedPosts = loadedPosts.map(normalizePost);

        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNewPosts = normalizedPosts.filter(
            (p) => !existingIds.has(p.id),
          );
          return [...prev, ...uniqueNewPosts];
        });

        setCommentsByPost((prev) => ({
          ...prev,
          ...Object.fromEntries(
            normalizedPosts.map((post) => [post.id, post.comments || []]),
          ),
        }));

        setHasMore(payload?.pagination?.hasNextPage ?? false);
      } catch (error) {
        console.error("Failed to load more posts", error);
      } finally {
        setIsLoadingMore(false);
      }
    };
    loadMorePosts();
  }, [page]);

  // --- UI EFFECTS (Keep these below the infinite scroll observer) ---
  useEffect(() => {
    if (postTextareaRef.current) {
      postTextareaRef.current.style.height = "auto";
      postTextareaRef.current.style.height =
        Math.max(postTextareaRef.current.scrollHeight, 40) + "px";
    }
  }, [newPostText]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isTextareaFocused) return;
    const targetString = TYPEWRITER_PLACEHOLDERS[phIndex];
    let typingSpeed = isDeleting ? 30 : 80;

    if (!isDeleting && currentPlaceholder === targetString) {
      const timeout = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(timeout);
    }
    if (isDeleting && currentPlaceholder === "") {
      setIsDeleting(false);
      setPhIndex((prev) => (prev + 1) % TYPEWRITER_PLACEHOLDERS.length);
      const timeout = setTimeout(() => {}, 500);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => {
      setCurrentPlaceholder(
        targetString.substring(
          0,
          currentPlaceholder.length + (isDeleting ? -1 : 1),
        ),
      );
    }, typingSpeed);
    return () => clearTimeout(timeout);
  }, [currentPlaceholder, isDeleting, phIndex, isTextareaFocused]);

  //useEffect end

  // handlers start

  const handleConnect = async (userId) => {
    // Optimistic UI update: instantly change button to "Pending"
    setRequestedScholars((prev) => new Set(prev).add(userId));

    try {
      await sendConnectionRequest(userId);
    } catch (error) {
      // Rollback if the API call fails
      setRequestedScholars((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      console.error("Connection request failed:", error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    // 1. Optimistic UI Update: Instantly remove it from the dropdown
    setFriendRequests((prev) =>
      prev.filter((req) => req.requestId !== requestId),
    );

    try {
      // 2. Tell the backend to mark it 'Accepted'
      await acceptConnectionRequest(requestId);
    } catch (error) {
      console.error("Failed to accept connection", error);
    }
  };

  const handleIgnoreRequest = async (requestId) => {
    // 1. Optimistic UI Update: Instantly remove it from the dropdown
    setFriendRequests((prev) =>
      prev.filter((req) => req.requestId !== requestId),
    );

    try {
      // 2. Tell the backend to delete the connection document
      await removeConnection(requestId);
    } catch (error) {
      console.error("Failed to ignore connection", error);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !selectedFile) return;

    setIsUploading(true);
    try {
      const payload = await createPost({
        text: newPostText,
        file: selectedFile?.fileObj,
      });

      const createdPost = payload?.post ?? payload;
      const normalized = normalizePost(createdPost);

      // Update UI instantly
      setPosts((prev) => [normalized, ...prev]);
      setCommentsByPost((prev) => ({ ...prev, [normalized.id]: [] }));

      // Clear inputs
      setNewPostText("");
      removeAttachment();
      setIsUploadExpanded(false);
    } catch (error) {
      console.error("Failed to create post", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    const trimmedComment = (commentDrafts[postId] || "").trim();
    if (!trimmedComment) return;

    try {
      const newComment = await createComment(postId, trimmedComment);

      // Update UI instantly
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));

      // Increment comment count
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, commentsCount: (post.commentsCount || 0) + 1 }
            : post,
        ),
      );

      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("Failed to post comment", error);
    }
  };

  const loadComments = async (postId) => {
    try {
      const response = await getComments(postId);

      // Backend may return { comments: [...] } or directly [...]
      const rawComments = response?.comments ?? response ?? [];

      const formattedComments = rawComments.map((comment) => ({
        id: comment._id,
        text: comment.content,
        createdAt: comment.createdAt,
        likes: comment.likesCount || 0,
        isLiked: comment.isLiked || false,
        author: {
          name: comment.commentby?.fullName || "Student",
          handle: comment.commentby?.username
            ? `@${comment.commentby.username}`
            : "",
          avatarUrl:
            comment.commentby?.profileImage ||
            "https://api.dicebear.com/7.x/avataaars/svg?seed=Student&backgroundColor=e2e8f0",
        },
      }));

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: formattedComments,
      }));
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  };

  const handleLikeToggle = async (postId) => {
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    const isRemoving = targetPost.userReaction !== null;
    const newReaction = isRemoving ? null : "love";

    // Optimistic UI Update
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          userReaction: newReaction,
          likesCount: isRemoving
            ? Math.max(0, post.likesCount - 1)
            : post.likesCount + 1,
        };
      }),
    );

    // Send to backend
    try {
      await togglePostReaction(postId, newReaction);
    } catch (error) {
      console.error("Failed to toggle reaction", error);
    }
  };

  const handleSelectReaction = async (postId, reactionId) => {
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    const isRemoving = targetPost.userReaction === reactionId;
    const newReaction = isRemoving ? null : reactionId;

    let newCount = targetPost.likesCount;
    if (!targetPost.userReaction && newReaction) newCount += 1;
    else if (targetPost.userReaction && !newReaction)
      newCount = Math.max(0, targetPost.likesCount - 1);

    // Optimistic UI Update
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;
        return { ...post, userReaction: newReaction, likesCount: newCount };
      }),
    );
    setActiveReactionPostId(null);

    // Send to backend
    try {
      await togglePostReaction(postId, newReaction);
    } catch (error) {
      console.error("Failed to toggle reaction", error);
    }
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    if (
      !goalForm.title.trim() ||
      !goalForm.subject.trim() ||
      !goalForm.deadline
    )
      return;

    setIsGoalSubmitting(true);
    try {
      const response = await createGoal(goalForm);
      const newGoal = response?.goal ?? response;

      // Update UI
      setGoals((prev) => [
        { ...newGoal, id: newGoal._id || newGoal.id },
        ...prev,
      ]);
      setGoalForm({ title: "", subject: "", deadline: "", isPublic: true });
    } catch (error) {
      console.error("Failed to create goal", error);
    } finally {
      setIsGoalSubmitting(false);
    }
  };

  const handleCompleteGoal = async (goalId, createdAt) => {
    const threeHoursInMs = 3 * 60 * 60 * 1000;

    const isCompletable =
      currentTime >= new Date(createdAt).getTime() + threeHoursInMs;

    if (!isCompletable) {
      alert("You must spend at least 3 hours on this goal.");
      return;
    }

    try {
      const response = await updateGoal(goalId);

      const updatedGoal = response.goal ?? response;

      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                ...updatedGoal,
              }
            : goal,
        ),
      );

      const stats = await getMyStats();
      setMyStats(stats);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to complete goal.");
    }
  };

  const handleInteractionStart = (postId) => {
    pressTimer.current = setTimeout(() => {
      setActiveReactionPostId(postId);
    }, 500);
  };

  const handleInteractionEnd = (postId) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (activeReactionPostId === postId) return;
    handleLikeToggle(postId);
  };

  const handleInteractionCancel = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const toggleCommentLike = (postId, commentId) => {
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: prev[postId].map((c) =>
        c.id === commentId
          ? {
              ...c,
              isLiked: !c.isLiked,
              likes: c.isLiked ? (c.likes || 1) - 1 : (c.likes || 0) + 1,
            }
          : c,
      ),
    }));
  };

  const handleCommentFileChange = (e, postId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setCommentMedia((prev) => ({ ...prev, [postId]: { file, previewUrl } }));
    setActiveEmojiPicker((prev) => ({ ...prev, [postId]: false }));
    setActiveGifPicker((prev) => ({ ...prev, [postId]: false }));
  };

  const removeCommentMedia = (postId) => {
    setCommentMedia((prev) => {
      const newState = { ...prev };
      delete newState[postId];
      return newState;
    });
  };

  const insertEmoji = (postId, emoji) => {
    setCommentDrafts((prev) => ({
      ...prev,
      [postId]: (prev[postId] || "") + emoji,
    }));
    setActiveEmojiPicker((prev) => ({ ...prev, [postId]: false }));
  };

  const insertGif = (postId, gifUrl) => {
    setCommentMedia((prev) => ({
      ...prev,
      [postId]: { file: null, previewUrl: gifUrl, isGif: true },
    }));
    setActiveGifPicker((prev) => ({ ...prev, [postId]: false }));
  };

  const handleReplyClick = (postId, userHandle) => {
    setCommentDrafts((prev) => {
      const currentText = prev[postId] || "";
      const mention = `${userHandle} `;
      if (currentText.includes(mention)) return prev;
      return {
        ...prev,
        [postId]: currentText ? `${currentText} ${mention}` : mention,
      };
    });

    setTimeout(() => {
      const input = document.getElementById(`comment-input-${postId}`);
      if (input) {
        input.focus();
        input.selectionStart = input.selectionEnd = input.value.length;
      }
    }, 50);
  };

  const triggerMediaUpload = () => {
    setActiveEmojiPicker({});
    setActiveGifPicker({});
    mediaInputRef.current?.click();
  };

  const triggerDocUpload = () => {
    setActiveEmojiPicker({});
    setActiveGifPicker({});
    docInputRef.current?.click();
  };

  const handleFileChange = (e, category) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
    let fileType = "document";

    if (category === "media") {
      if (file.type.startsWith("image/")) fileType = "image";
      else if (file.type.startsWith("video/")) fileType = "video";
    }

    const previewUrl =
      fileType === "image" || fileType === "video"
        ? URL.createObjectURL(file)
        : undefined;
    setSelectedFile({
      fileObj: file,
      name: file.name,
      type: fileType,
      previewUrl,
      size: sizeStr,
    });
    setIsUploadExpanded(false);
  };

  const removeAttachment = () => {
    if (selectedFile?.previewUrl) URL.revokeObjectURL(selectedFile.previewUrl);
    setSelectedFile(null);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleNavigation = (route) => {
    if (route === "/home" || route === "/") {
      window.location.reload();
    } else {
      setCurrentRoute(route);
      setSearchQuery("");
      setIsMobileMenuOpen(false);
      navigate(route);
    }
  };

  const handleMouseDown = (e) => {
    const slider = storyScrollRef.current;
    if (!slider) return;
    let isDown = true;
    let startX = e.pageX - slider.offsetLeft;
    let scrollLeft = slider.scrollLeft;

    const onMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;
      slider.scrollLeft = scrollLeft - walk;
    };

    const onMouseUp = () => {
      isDown = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const renderNavIcon = (iconName, className = "w-5 h-5") => {
    switch (iconName) {
      case "Home":
        return <Home className={className} />;
      case "BookOpen":
        return <BookOpen className={className} />;
      case "Trophy":
        return <Trophy className={className} />;
      case "Compass":
        return <Compass className={className} />;
      case "MessageSquare":
        return <MessageSquare className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (post.contentText || "").toLowerCase().includes(query) ||
      (post.studyTopicTag || "").toLowerCase().includes(query) ||
      (post.author?.name || "").toLowerCase().includes(query)
    );
  });

  //handlers end

  // --- THE VARIABLE BRIDGE ---
  // This connects your new backend states to the old names your 1776-line UI expects!
  const STORY_DATA_STATIC = storyData;
  const SUGGESTED_SCHOLARS = suggestedScholars;
  const INITIAL_POSTS = posts;

  // (Note: Make sure this is pasted right above your 'return (' statement!)

  return (
    <div
      className={`h-screen w-screen flex overflow-hidden font-sans antialiased transition-colors duration-300 ${
        isDarkMode
          ? "bg-[#0B0914] text-white selection:bg-violet-600/30 selection:text-violet-200"
          : "bg-slate-50 text-slate-900 selection:bg-violet-600/10 selection:text-violet-900"
      }`}
    >
      {/* LEFT SIDEBAR (Desktop) */}
      <aside
        className={`hidden lg:flex flex-col w-[18rem] shrink-0 h-full border-r overflow-hidden transition-colors duration-300 ${
          isDarkMode
            ? "border-white/5 bg-[#0B0914]"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex-1 flex flex-col p-6 space-y-8 overflow-hidden">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 mb-2 px-2 group cursor-pointer text-left"
          >
            <div
              className={`p-2.5 rounded-2xl border shadow-sm transition-colors ${
                isDarkMode
                  ? "bg-white/10 border-white/10 text-white"
                  : "bg-slate-200 border-slate-300 text-black"
              }`}
            >
              <GraduationCap className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <h1
                className={`text-2xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}
              >
                StudyTrail
              </h1>
              <span
                className={`text-[6px] font-semibold uppercase tracking-[0.24em] transition-colors mt-0.5 ${
                  isDarkMode
                    ? "text-gray-400 group-hover:text-violet-300"
                    : "text-slate-500 group-hover:text-violet-600"
                }`}
              >
                Empowering Students Worldwide
              </span>
            </div>
          </button>

          <div className="space-y-2 shrink-0 mt-4">
            {NAV_ITEMS.map((item) => {
              const isActive = currentRoute === item.targetRoute;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.targetRoute)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-sm font-medium transition duration-200 text-left cursor-pointer ${
                    isActive
                      ? isDarkMode
                        ? "bg-violet-600/10 text-violet-400 font-semibold border-l-4 border-violet-500"
                        : "bg-violet-50 text-violet-600 font-semibold border-l-4 border-violet-500"
                      : isDarkMode
                        ? "text-gray-400 hover:text-white hover:bg-white/10 border-l-4 border-transparent hover:translate-x-1"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-l-4 border-transparent hover:translate-x-1"
                  }`}
                >
                  {renderNavIcon(item.icon, "w-5 h-5")}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div
            className={`rounded-3xl border p-5 space-y-4 shrink-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-md mt-auto ${
              isDarkMode
                ? "bg-white/5 border-white/5 shadow-white/5"
                : "bg-slate-100 border-slate-200 shadow-slate-200"
            }`}
          >
            <span className="text-xs font-bold text-gray-500 tracking-widest font-mono uppercase block">
              LONGEST STUDY STREAK
            </span>
            <div
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors duration-300 ${
                isDarkMode
                  ? "bg-[#0B0914] border-white/5"
                  : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  isDarkMode
                    ? "bg-violet-950 text-violet-400 border border-violet-800/30"
                    : "bg-violet-50 text-violet-600"
                }`}
              >
                <Flame className="w-6 h-6 fill-violet-400/20" />
              </div>
              <div className="min-w-0">
                <h5
                  className={`text-sm font-bold truncate ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {myStats?.longestStreak ?? 0}-Day Streak
                </h5>
              </div>
            </div>
          </div>
        </div>

        <footer
          className={`p-5 border-t flex flex-col shrink-0 transition-colors duration-300 ${isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`p-1.5 rounded-md ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`}
            >
              <GraduationCap
                className={`w-4 h-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}
              />
            </div>
            <span
              className={`text-sm font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              StudyTrail
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <h4
                className={`font-semibold text-sm mb-1.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                Platform
              </h4>
              <ul
                className={`space-y-1 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
              >
                <li>
                  <a
                    href="#"
                    className="hover:text-violet-500 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-violet-500 transition-colors"
                  >
                    Leaderboard
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-violet-500 transition-colors"
                  >
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className={`font-semibold text-sm mb-1.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                Company
              </h4>
              <ul
                className={`space-y-1 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
              >
                <li>
                  <a
                    href="#"
                    className="hover:text-violet-500 transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-violet-500 transition-colors"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-violet-500 transition-colors"
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div
            className={`pt-4 border-t flex items-center justify-between gap-1 ${isDarkMode ? "border-white/10" : "border-slate-200"}`}
          >
            <div
              className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              &copy; 2026 StudyTrail
            </div>
            <div className="flex gap-2 text-[10px]">
              <a
                href="#"
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? "bg-white/10 text-slate-400 hover:text-white" : "bg-black/5 text-slate-500 hover:text-slate-900"}`}
              >
                X
              </a>
              <a
                href="#"
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? "bg-white/10 text-slate-400 hover:text-white" : "bg-black/5 text-slate-500 hover:text-slate-900"}`}
              >
                in
              </a>
              <a
                href="#"
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? "bg-white/10 text-slate-400 hover:text-white" : "bg-black/5 text-slate-500 hover:text-slate-900"}`}
              >
                IG
              </a>
            </div>
          </div>
        </footer>
      </aside>

      {/* MOBILE MENU MODAL */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            className={`relative w-80 h-full p-6 shadow-2xl flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ${isDarkMode ? "bg-[#0B0914] text-white" : "bg-white text-slate-900"}`}
          >
            <div className="flex items-center justify-between mb-8 mt-2">
              <h2 className="font-bold text-xl">Menu</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-2 rounded-full transition ${isDarkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-900"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6 flex-1">
              <div
                className={`rounded-2xl border p-4 space-y-3 shrink-0 transition-colors duration-300 ${isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-100 border-slate-200"}`}
              >
                <span className="text-[10px] font-bold text-gray-500 tracking-widest font-mono uppercase block">
                  LONGEST STUDY STREAK
                </span>
                <div
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors duration-300 ${isDarkMode ? "bg-[#0B0914] border-white/5" : "bg-white border-slate-200"}`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${isDarkMode ? "bg-violet-950 text-violet-400 border border-violet-800/30" : "bg-violet-50 text-violet-600"}`}
                  >
                    <Flame className="w-5 h-5 fill-violet-400/20" />
                  </div>
                  <div className="min-w-0">
                    <h5
                      className={`text-sm font-bold truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}
                    >
                      {myStats?.longestStreak ?? 0}-Day Streak
                    </h5>
                  </div>
                </div>
              </div>

              <div
                className={`flex justify-between items-center p-4 rounded-2xl border transition-colors duration-300 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}
              >
                <div>
                  <span className="text-[10px] text-gray-400 font-mono block">
                    Monthly Rank
                  </span>
                  <span className="font-bold text-sm flex items-center gap-1 mt-0.5">
                    <Trophy className="w-4 h-4 text-yellow-500" /> Top 5%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-mono block">
                    Level
                  </span>
                  <span className="font-bold text-sm text-violet-500 font-mono">
                    {myStats?.level ?? 1}
                  </span>
                </div>
              </div>

              <div
                id="mobile-scholars-section"
                className={`border rounded-3xl p-5 shadow-sm transition-colors duration-300 ${isDarkMode ? "bg-[#151125] border-white/5" : "bg-white border-slate-200"}`}
              >
                <div
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => setIsMobileScholarsOpen(!isMobileScholarsOpen)}
                >
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-violet-500" />
                    <h4 className="font-bold text-sm">Suggested Scholars</h4>
                  </div>
                  {isMobileScholarsOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-violet-500 transition-colors" />
                  )}
                </div>

                {isMobileScholarsOpen && (
                  <div className="space-y-4 mt-5 max-h-[40vh] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden">
                    {SUGGESTED_SCHOLARS.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div>
                            <h5
                              className={`text-xs font-bold transition-colors ${isDarkMode ? "text-white" : "text-slate-900"}`}
                            >
                              {user.name}
                            </h5>
                            <p className="text-[10px] text-gray-500">
                              {user.handle}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleConnect(user.id)}
                          disabled={requestedScholars.has(user.id)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition-colors ${
                            requestedScholars.has(user.id)
                              ? "bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-gray-400 cursor-not-allowed"
                              : "text-violet-600 bg-violet-500/10 hover:bg-violet-600 hover:text-white"
                          }`}
                        >
                          {requestedScholars.has(user.id)
                            ? "Pending"
                            : "Connect"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsGoalModalOpen(true);
                }}
                className="w-full py-4 rounded-2xl font-bold text-white shadow-md bg-violet-600 hover:bg-violet-700 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Target className="w-5 h-5" />
                Set Goal
              </button>
            </div>

            <div className="mt-8">
              <footer
                className={`pt-6 border-t shrink-0 ${isDarkMode ? "border-white/5" : "border-slate-200"}`}
              >
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-md ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`}
                    >
                      <GraduationCap
                        className={`w-4 h-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                      />
                    </div>
                    <span
                      className={`text-sm font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}
                    >
                      StudyTrail
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4
                        className={`font-semibold text-[11px] mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                      >
                        Platform
                      </h4>
                      <ul
                        className={`space-y-1.5 text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                      >
                        <li>
                          <a
                            href="#"
                            className="hover:text-violet-500 transition-colors"
                          >
                            Features
                          </a>
                        </li>
                        <li>
                          <a
                            href="#"
                            className="hover:text-violet-500 transition-colors"
                          >
                            Leaderboard
                          </a>
                        </li>
                        <li>
                          <a
                            href="#"
                            className="hover:text-violet-500 transition-colors"
                          >
                            Pricing
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4
                        className={`font-semibold text-[11px] mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                      >
                        Company
                      </h4>
                      <ul
                        className={`space-y-1.5 text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                      >
                        <li>
                          <a
                            href="#"
                            className="hover:text-violet-500 transition-colors"
                          >
                            About Us
                          </a>
                        </li>
                        <li>
                          <a
                            href="#"
                            className="hover:text-violet-500 transition-colors"
                          >
                            Privacy
                          </a>
                        </li>
                        <li>
                          <a
                            href="#"
                            className="hover:text-violet-500 transition-colors"
                          >
                            Terms
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div
                    className={`pt-4 border-t flex items-center justify-between gap-1 ${isDarkMode ? "border-white/5" : "border-slate-200"}`}
                  >
                    <div
                      className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                    >
                      &copy; 2026 StudyTrail
                    </div>
                    <div className="flex gap-2 text-[10px]">
                      <a
                        href="#"
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? "bg-white/10 text-slate-400 hover:text-white" : "bg-black/5 text-slate-500 hover:text-slate-900"}`}
                      >
                        X
                      </a>
                      <a
                        href="#"
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? "bg-white/10 text-slate-400 hover:text-white" : "bg-black/5 text-slate-500 hover:text-slate-900"}`}
                      >
                        in
                      </a>
                      <a
                        href="#"
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? "bg-white/10 text-slate-400 hover:text-white" : "bg-black/5 text-slate-500 hover:text-slate-900"}`}
                      >
                        IG
                      </a>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pb-16 lg:pb-0">
        <header
          className={`sticky top-0 z-30 flex items-center px-4 py-3 border-b backdrop-blur-md transition-colors ${
            isDarkMode
              ? "bg-[#0B0914]/80 border-white/10"
              : "bg-white/80 border-slate-200"
          }`}
        >
          <button
            onClick={() => window.location.reload()}
            className="lg:hidden flex items-center gap-2 shrink-0"
          >
            <GraduationCap className="w-6 h-6 text-violet-500" />
            <h1 className="font-bold text-lg">StudyTrail</h1>
          </button>

          <div className="hidden sm:flex flex-1 justify-center pl-8">
            <div
              className={`w-full max-w-xl flex items-center px-4 py-2 rounded-full border transition-colors ${
                isDarkMode
                  ? "bg-[#151125] border-white/10 focus-within:border-violet-500"
                  : "bg-slate-100 border-transparent focus-within:bg-white focus-within:border-violet-500"
              }`}
            >
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts, topics, or people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm ml-3 text-inherit placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4 ml-auto sm:ml-0">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? "hover:bg-white/10 text-gray-300" : "hover:bg-slate-200 text-slate-600"}`}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2 rounded-full transition-colors relative ${isDarkMode ? "hover:bg-white/10 text-gray-300" : "hover:bg-slate-200 text-slate-600"}`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-white dark:border-[#0B0914] transition-colors"></span>
              </button>

              {isNotificationsOpen && (
                <div
                  className={`absolute top-full right-0 mt-2 w-72 rounded-2xl border shadow-xl p-4 z-50 animate-fade-in ${
                    isDarkMode
                      ? "bg-[#151125] border-white/10"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm">Recent Notifications</h3>
                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                        <Heart className="w-4 h-4" />
                      </div>
                      <div>
                        <p
                          className={
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          }
                        >
                          <span
                            className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                          >
                            Sarah Chen
                          </span>{" "}
                          liked your backprop notes.
                        </p>
                        <span className="text-[10px] text-gray-400">
                          10 mins ago
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <p
                          className={
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          }
                        >
                          <span
                            className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                          >
                            Michael Torres
                          </span>{" "}
                          commented on your post.
                        </p>
                        <span className="text-[10px] text-gray-400">
                          2 hours ago
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Friend Requests */}
            <div className="relative">
              <button
                onClick={() => setIsFriendRequestsOpen(!isFriendRequestsOpen)}
                className={`p-2 rounded-full transition-colors relative ${
                  isDarkMode
                    ? "hover:bg-white/10 text-gray-300"
                    : "hover:bg-slate-200 text-slate-600"
                }`}
              >
                <UserPlus className="w-5 h-5" />

                {friendRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                    {friendRequests.length}
                  </span>
                )}
              </button>

              {isFriendRequestsOpen && (
                <div
                  className={`absolute right-0 mt- w-75 rounded-2xl border shadow-xl overflow-hidden z-50 ${
                    isDarkMode
                      ? "bg-[#151125] border-white/10"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <h3 className="font-semibold text-sm">Friend Requests</h3>

                    <button
                      onClick={() => setIsFriendRequestsOpen(false)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {friendRequests.map((user) => (
                      <div
                        key={user.requestId} // <-- Use the unique connection ID
                        className={`flex items-center justify-between px-4 py-3 ${
                          isDarkMode ? "hover:bg-white/5" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-gray-500">
                              {user.handle}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(user.requestId)} // <-- Add onClick
                            className="px-3 py-1 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700"
                          >
                            Accept
                          </button>

                          <button
                            onClick={() => handleIgnoreRequest(user.requestId)} // <-- Add onClick
                            className={`px-3 py-1 rounded-lg text-xs font-medium ${
                              isDarkMode
                                ? "bg-white/10 hover:bg-white/20"
                                : "bg-slate-200 hover:bg-slate-300"
                            }`}
                          >
                            Ignore
                          </button>
                        </div>
                      </div>
                    ))}

                    {friendRequests.length === 0 && (
                      <div className="py-10 text-center text-sm text-gray-500">
                        No pending requests
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/profile" className="cursor-pointer hidden sm:block">
              <img
                src={LOGGED_IN_USER.avatarUrl}
                alt="Profile"
                className={`w-8 h-8 rounded-full object-cover border transition ${isDarkMode ? "border-white/10" : "border-slate-200"} hover:opacity-80`}
              />
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`lg:hidden p-2 rounded-full transition ${isDarkMode ? "hover:bg-white/10 text-gray-300" : "hover:bg-slate-200 text-slate-600"}`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="w-full max-w-4xl mx-auto p-4 lg:px-6 lg:py-6 space-y-6 flex-1">
          {/* Center Aligned Study Streak Section with full names and dynamic gradient borders */}
          <div className="w-full flex justify-center">
            <div
              ref={storyScrollRef}
              onMouseDown={handleMouseDown}
              className="story-container flex gap-4 py-3 items-start w-full max-w-4xl no-scrollbar pb-2 select-none cursor-grab active:cursor-grabbing"
            >
              {storyData.map((story) => (
                <div
                  key={story.id}
                  onClick={() => {}}
                  className="flex flex-col items-center justify-start gap-1.5 shrink-0 group snap-start"
                >
                  <div className="relative">
                    <div
                      className={`w-16 h-16 rounded-full p-1 flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
                        story.streak > 0
                          ? `bg-gradient-to-tr ${
                              story.isSelf
                                ? isDarkMode
                                  ? "from-gray-600 to-gray-700"
                                  : "from-gray-300 to-gray-400"
                                : "from-orange-500 via-pink-500 to-violet-500"
                            }`
                          : isDarkMode
                            ? "bg-transparent border-2 border-white/10"
                            : "bg-transparent border-2 border-slate-200"
                      }`}
                    >
                      <img
                        src={story.avatar}
                        alt={story.name}
                        className={`w-full h-full rounded-full object-cover pointer-events-none border-2 ${
                          isDarkMode ? "border-[#0B0914]" : "border-white"
                        }`}
                      />
                    </div>

                    {story.streak > 0 && (
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#0B0914] rounded-full p-0.5 transition-colors duration-300">
                        <div className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-500/30">
                          <Flame className="w-2.5 h-2.5 fill-orange-500" />
                          <span className="text-[10px] font-bold">
                            {story.streak}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium w-20 break-words text-center transition-colors duration-300 leading-tight ${
                      isDarkMode ? "text-gray-300" : "text-slate-700"
                    }`}
                  >
                    {story.isSelf ? "You" : story.username}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* POST CREATION BOX */}
          <div
            className={`w-full p-3 sm:px-4 sm:py-3 rounded-2xl border shadow-sm transition-colors duration-300 ${
              isDarkMode
                ? "bg-[#151125] border-white/5"
                : "bg-white border-slate-200"
            }`}
          >
            <div
              className="flex items-start gap-3"
              onClick={() => {
                postTextareaRef.current?.focus();
                setIsComposerActive(true);
              }}
            >
              <img
                src={LOGGED_IN_USER.avatarUrl}
                alt="Avatar"
                className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0 flex flex-col">
                <textarea
                  ref={postTextareaRef}
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  onFocus={() => {
                    setIsTextareaFocused(true);
                    setIsComposerActive(true);
                  }}
                  onBlur={() => {
                    setIsTextareaFocused(false);
                    setTimeout(() => {
                      if (
                        !newPostText.trim() &&
                        !selectedFile &&
                        !isUploadExpanded
                      ) {
                        setIsComposerActive(false);
                      }
                    }, 150);
                  }}
                  placeholder={
                    isTextareaFocused
                      ? "Write your post..."
                      : currentPlaceholder
                  }
                  className={`w-full bg-transparent resize-none outline-none text-sm leading-relaxed py-1.5 transition-all duration-300 whitespace-pre-wrap ${
                    isDarkMode
                      ? "text-white placeholder-gray-500"
                      : "text-slate-900 placeholder-slate-400"
                  }`}
                  rows="1"
                />

                {selectedFile && (
                  <div
                    className={`relative mt-2 p-3 rounded-xl border inline-flex items-center gap-3 w-fit ${isDarkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}
                  >
                    <span className="text-xs truncate max-w-50">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={removeAttachment}
                      className="p-1 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  ref={mediaInputRef}
                  onChange={(e) => handleFileChange(e, "media")}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={docInputRef}
                  onChange={(e) => handleFileChange(e, "doc")}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                />

                {shouldShowComposerActions && (
                  <div
                    className={`flex items-center justify-between pt-2 mt-2 border-t animate-fade-in ${isDarkMode ? "border-white/5" : "border-slate-100"}`}
                  >
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setActiveEmojiPicker({});
                        setActiveGifPicker({});
                        setIsTextareaFocused(true);
                        setIsComposerActive(true);
                        setIsUploadExpanded(!isUploadExpanded);
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition ${isDarkMode ? "bg-white/5 hover:bg-white/10 text-gray-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handlePostSubmit}
                      disabled={
                        (!newPostText.trim() && !selectedFile) || isUploading
                      }
                      className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-1.5 rounded-full text-xs font-semibold transition"
                    >
                      Post
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isUploadExpanded && (
              <div
                className={`mt-3 p-3 rounded-2xl border animate-fade-in ${isDarkMode ? "bg-[#0B0914] border-white/10" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold">Upload Content</h3>
                    <p className="text-[11px] text-slate-500">
                      Add to your post
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={triggerMediaUpload}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed transition hover:border-violet-500 hover:bg-violet-500/5 ${isDarkMode ? "border-white/20" : "border-slate-300"}`}
                  >
                    <ImageIcon className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-semibold">Photo/Video</span>
                  </button>
                  <button
                    onClick={triggerDocUpload}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed transition hover:border-violet-500 hover:bg-violet-500/5 ${isDarkMode ? "border-white/20" : "border-slate-300"}`}
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold">Document</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {searchQuery && (
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-medium text-gray-500">
                Showing results for "{searchQuery}"
              </span>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-violet-500 hover:underline"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Post Feed */}
          <div className="space-y-6">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => {
                const postComments = commentsByPost[post.id] || [];
                const isCommentsOpen = activeCommentPostId === post.id;

                const activeReaction = REACTIONS.find(
                  (r) => r.id === post.userReaction,
                );

                return (
                  <div
                    key={post.id}
                    className={`w-full p-4 sm:p-5 rounded-3xl border shadow-sm ${isDarkMode ? "bg-[#151125] border-white/5" : "bg-white border-slate-200"}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.author.avatarUrl}
                          alt={post.author.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="text-sm font-semibold">
                            {post.author.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{post.author.handle}</span>
                            <span>•</span>
                            <span
                              title={new Date(post.createdAt).toLocaleString()}
                            >
                              {formatRelativeTime(post.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {post.contentText}
                      </p>
                    </div>

                    {post.mediaType === "image" && post.mediaUrl && (
                      <div
                        className="mb-4 rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 cursor-zoom-in"
                        onClick={() => setImageLightbox(post.mediaUrl)}
                      >
                        <img
                          src={post.mediaUrl}
                          alt="Post material"
                          className="w-full h-auto max-h-96 object-cover hover:scale-[1.02] transition duration-500"
                        />
                      </div>
                    )}
                    {post.mediaType === 'video' && post.mediaUrl && (
                      <div className="mb-4 rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 bg-black">
                        <video src={post.mediaUrl} controls className="w-full h-auto max-h-96 object-contain" />
                      </div>
                    )}

                    {post.mediaType === "document" && (
                      <div
                        className={`mb-4 p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold truncate max-w-50">
                              {post.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {post.fileSize}
                            </p>
                          </div>
                        </div>
                        <button
                          className={`p-2 rounded-full transition ${isDarkMode ? "hover:bg-white/10" : "hover:bg-slate-200"}`}
                        >
                          <Download className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                    )}

                    <div
                      className={`flex flex-wrap items-center gap-4 pt-3 border-t ${isDarkMode ? "border-white/5" : "border-slate-100"}`}
                    >
                      {/* Reaction Button Wrapper */}
                      <div
                        className="relative flex items-center"
                        onMouseLeave={() => setActiveReactionPostId(null)}
                      >
                        {activeReactionPostId === post.id && (
                          <div
                            className={`absolute -top-12 left-0 flex items-center gap-2 px-3 py-2 rounded-full shadow-xl animate-fade-in reaction-picker z-50 ${
                              isDarkMode
                                ? "bg-[#151125] border border-white/10 shadow-black/50"
                                : "bg-white border border-slate-200 shadow-slate-200"
                            }`}
                            onTouchMove={(e) => {
                              const touch = e.touches[0];
                              const element = document.elementFromPoint(
                                touch.clientX,
                                touch.clientY,
                              );
                              document
                                .querySelectorAll(".reaction-emoji")
                                .forEach((el) =>
                                  el.classList.remove(
                                    "scale-125",
                                    "-translate-y-1",
                                  ),
                                );
                              if (
                                element &&
                                element.classList.contains("reaction-emoji")
                              ) {
                                element.classList.add(
                                  "scale-125",
                                  "-translate-y-1",
                                );
                              }
                            }}
                            onTouchEnd={(e) => {
                              const touch = e.changedTouches[0];
                              const element = document.elementFromPoint(
                                touch.clientX,
                                touch.clientY,
                              );
                              if (element && element.dataset.reactionId) {
                                handleSelectReaction(
                                  post.id,
                                  element.dataset.reactionId,
                                );
                              } else {
                                setActiveReactionPostId(null);
                              }
                            }}
                          >
                            {REACTIONS.map((reaction) => (
                              <button
                                key={reaction.id}
                                data-reaction-id={reaction.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectReaction(post.id, reaction.id);
                                }}
                                className="reaction-emoji text-2xl p-1 hover:scale-125 hover:-translate-y-1 transition-all duration-200 origin-bottom cursor-pointer"
                                title={reaction.label}
                              >
                                {reaction.emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        <button
                          onMouseDown={() => handleInteractionStart(post.id)}
                          onMouseUp={() => handleInteractionEnd(post.id)}
                          onMouseLeave={handleInteractionCancel}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            handleInteractionStart(post.id);
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            handleInteractionEnd(post.id);
                          }}
                          onTouchCancel={(e) => {
                            e.preventDefault();
                            handleInteractionCancel();
                          }}
                          onClick={(e) => e.preventDefault()}
                          className={`flex items-center gap-1.5 text-xs font-medium transition select-none touch-none ${
                            activeReaction
                              ? activeReaction.color
                              : "text-gray-500 hover:text-pink-500"
                          }`}
                        >
                          {activeReaction ? (
                            <span className="text-[16px] leading-none transform scale-110">
                              {activeReaction.emoji}
                            </span>
                          ) : (
                            <Heart className="w-4 h-4 transition-transform" />
                          )}
                          <span className={activeReaction ? "font-bold" : ""}>
                            {post.likesCount}
                          </span>
                        </button>
                      </div>

                      <button
                        onClick={async () => {
                          if (isCommentsOpen) {
                            setActiveCommentPostId(null);
                            return;
                          }

                          setActiveCommentPostId(post.id);

                          // Load comments only once
                          if (commentsByPost[post.id] === undefined) {
                            await loadComments(post.id);
                          }
                        }}
                        className={`flex items-center gap-1.5 text-xs font-medium transition ${isCommentsOpen ? "text-violet-500" : "text-gray-500 hover:text-violet-500"}`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.commentsCount}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-500 transition ml-auto">
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>

                    {/* COMMENTS SECTION */}
                    {isCommentsOpen && (
                      <div
                        className={`mt-4 rounded-2xl border p-3 space-y-3 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">Comments</p>
                          <span className="text-xs text-gray-500">
                            {postComments.length}{" "}
                            {postComments.length === 1 ? "comment" : "comments"}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {postComments.length > 0 ? (
                            postComments.map((comment) => (
                              <div
                                key={comment.id}
                                className="flex items-start gap-2"
                              >
                                <img
                                  src={comment.author.avatarUrl}
                                  alt={comment.author.name}
                                  className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
                                />
                                <div className="flex-1 min-w-0 flex flex-col items-start">
                                  {/* Dynamic Size Comment Bubble */}
                                  <div
                                    className={`inline-block max-w-[95%] rounded-2xl px-3 py-2 ${isDarkMode ? "bg-[#0B0914] text-gray-200" : "bg-white text-slate-700 shadow-sm border border-slate-100"} w-fit`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-semibold">
                                        {comment.author.name}
                                      </span>
                                      <span
                                        className="text-[10px] text-gray-500"
                                        title={new Date(
                                          comment.createdAt,
                                        ).toLocaleString()}
                                      >
                                        {formatRelativeTime(comment.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                      {renderCommentText(comment.text)}
                                    </p>
                                    {comment.mediaUrl && (
                                      <div
                                        className="mt-2 cursor-zoom-in"
                                        onClick={() =>
                                          setImageLightbox(comment.mediaUrl)
                                        }
                                      >
                                        <img
                                          src={comment.mediaUrl}
                                          alt="Comment Attachment"
                                          className="rounded-lg max-h-32 object-contain hover:scale-[1.02] transition"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 px-2 mt-1">
                                    <button
                                      onClick={() =>
                                        toggleCommentLike(post.id, comment.id)
                                      }
                                      className={`text-[10px] font-semibold transition-colors flex items-center gap-1 ${comment.isLiked ? "text-pink-500" : isDarkMode ? "text-gray-400 hover:text-pink-400" : "text-gray-500 hover:text-pink-500"}`}
                                    >
                                      <Heart
                                        className={`w-3 h-3 ${comment.isLiked ? "fill-pink-500" : ""}`}
                                      />
                                      {comment.likes > 0
                                        ? comment.likes
                                        : "Like"}
                                    </button>
                                    <span className="text-gray-300 dark:text-gray-600 text-[10px]">
                                      •
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleReplyClick(
                                          post.id,
                                          comment.author.handle,
                                        )
                                      }
                                      className={`text-[10px] font-semibold transition-colors ${isDarkMode ? "text-gray-400 hover:text-violet-400" : "text-gray-500 hover:text-violet-500"}`}
                                    >
                                      Reply
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">
                              No comments yet — start the conversation.
                            </p>
                          )}
                        </div>

                        {commentMedia[post.id] && (
                          <div className="relative mt-2 p-2 rounded-lg inline-block bg-slate-200 dark:bg-white/10 border dark:border-white/20">
                            <img
                              src={commentMedia[post.id].previewUrl}
                              alt="To attach"
                              className="h-16 rounded"
                            />
                            <button
                              onClick={() => removeCommentMedia(post.id)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <form
                          onSubmit={(e) => handleCommentSubmit(e, post.id)}
                          className={`comment-form-container mt-2 flex flex-col gap-2 rounded-2xl border px-2 py-1.5 transition ${isDarkMode ? "bg-[#0B0914] border-white/10" : "bg-white border-slate-200"}`}
                        >
                          <div className="flex w-full items-center">
                            <input
                              id={`comment-input-${post.id}`}
                              type="text"
                              value={commentDrafts[post.id] || ""}
                              onChange={(e) =>
                                setCommentDrafts((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              placeholder="Write a comment..."
                              className="flex-1 bg-transparent px-2 py-1 text-sm outline-none placeholder-gray-500 w-full"
                            />
                            <button
                              type="submit"
                              disabled={
                                !(commentDrafts[post.id] || "").trim() &&
                                !commentMedia[post.id]
                              }
                              className="ml-1 rounded-full bg-violet-600 p-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                            >
                              <Send className="w-4 h-4 ml-0.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 px-1 relative">
                            <input
                              type="file"
                              id={`comment-file-${post.id}`}
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleCommentFileChange(e, post.id)
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                document
                                  .getElementById(`comment-file-${post.id}`)
                                  .click()
                              }
                              className={`p-1.5 rounded-full transition-colors ${isDarkMode ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-slate-100"}`}
                              title="Attach Photo"
                            >
                              <ImageIcon className="w-4 h-4 text-blue-500" />
                            </button>

                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setActiveGifPicker(
                                    activeGifPicker[post.id]
                                      ? {}
                                      : { [post.id]: true },
                                  );
                                  setActiveEmojiPicker({});
                                }}
                                className={`p-1.5 rounded-full transition-colors ${isDarkMode ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-slate-100"}`}
                                title="GIF"
                              >
                                <PlaySquare className="w-4 h-4 text-emerald-500" />
                              </button>

                              {activeGifPicker[post.id] && (
                                <div
                                  className={`absolute bottom-[110%] left-0 z-[9999] w-48 p-2 rounded-xl border shadow-xl flex gap-2 ${isDarkMode ? "bg-[#151125] border-white/10" : "bg-white border-slate-200"}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {DUMMY_GIFS.map((gif, i) => (
                                    <img
                                      key={i}
                                      src={gif}
                                      alt="gif"
                                      className="w-14 h-14 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => insertGif(post.id, gif)}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setActiveEmojiPicker(
                                    activeEmojiPicker[post.id]
                                      ? {}
                                      : { [post.id]: true },
                                  );
                                  setActiveGifPicker({});
                                }}
                                className={`p-1.5 rounded-full transition-colors ${isDarkMode ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-slate-100"}`}
                                title="Emoji"
                              >
                                <Smile className="w-4 h-4 text-orange-500" />
                              </button>

                              {activeEmojiPicker[post.id] && (
                                <div
                                  className={`absolute bottom-[110%] left-0 z-[9999] w-[260px] p-2 rounded-2xl shadow-2xl border ${isDarkMode ? "bg-[#151125] border-white/10" : "bg-white border-slate-200"}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex flex-wrap gap-2 justify-center">
                                    {QUICK_EMOJIS.map((emoji) => (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={() =>
                                          insertEmoji(post.id, emoji)
                                        }
                                        className="text-lg hover:scale-150 transition-transform flex items-center justify-center p-1"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-gray-500">
                <p>No posts found for "{searchQuery}".</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-3 text-violet-500 hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}
            {/* --- NEW INFINITE SCROLL TRIGGER GOES HERE --- */}
            {posts.length > 0 && hasMore && (
              <div
                ref={lastElementRef}
                className="py-8 flex justify-center items-center w-full"
              >
                {isLoadingMore && (
                  <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400 font-medium w-full">
                You're all caught up! 🚀
              </div>
            )}
            {/* ---------------------------------*/}
          </div>
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden flex flex-col px-2 py-2 pb-3 border-t backdrop-blur-xl transition-colors ${
          isDarkMode
            ? "bg-[#0B0914]/90 border-white/10"
            : "bg-white/90 border-slate-200"
        }`}
      >
        {isBottomSearchOpen && (
          <div
            className={`mb-2 rounded-2xl border px-3 py-2 ${isDarkMode ? "bg-[#151125] border-white/10" : "bg-slate-50 border-slate-200"}`}
          >
            <div
              className={`flex items-center px-3 py-2 rounded-full border transition-colors ${
                isDarkMode
                  ? "bg-[#0B0914] border-white/10 focus-within:border-violet-500"
                  : "bg-white border-slate-200 focus-within:border-violet-500"
              }`}
            >
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm ml-3 text-inherit placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const isActive = currentRoute === item.targetRoute;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.targetRoute)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  isActive
                    ? isDarkMode
                      ? "text-violet-400"
                      : "text-violet-600"
                    : isDarkMode
                      ? "text-gray-400 hover:text-white"
                      : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {renderNavIcon(item.icon, "w-5 h-5")}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setIsBottomSearchOpen((prev) => !prev)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isDarkMode ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium">Search</span>
          </button>
          <button
            onClick={() => handleNavigation("/profile")}
            className="flex flex-col items-center justify-center p-2 rounded-lg"
          >
            <img
              src={LOGGED_IN_USER.avatarUrl}
              alt="Profile"
              className={`w-6 h-6 rounded-full object-cover border-2 ${currentRoute === "/profile" ? "border-violet-500" : "border-transparent"}`}
            />
            <span
              className={`text-[10px] font-medium mt-1 ${currentRoute === "/profile" ? (isDarkMode ? "text-violet-400" : "text-violet-600") : isDarkMode ? "text-gray-400" : "text-slate-500"}`}
            >
              Profile
            </span>
          </button>
        </div>
      </nav>

      {/* RIGHT SIDEBAR (Fixed Desktop UI) */}
      <aside
        className={`hidden lg:flex flex-col w-88 shrink-0 h-full border-l overflow-hidden transition-colors duration-300 ${
          isDarkMode
            ? "border-white/5 bg-[#0B0914]"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
          <div className="shrink-0 space-y-4">
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-3xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Target className="w-5 h-5" />
              <span>Set Weekly Goal</span>
            </button>

            <div
              className={`flex justify-between items-center p-5 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                isDarkMode
                  ? "bg-white/5 border-white/10 shadow-white/5"
                  : "bg-slate-50 border-slate-200 shadow-slate-200"
              }`}
            >
              <div>
                <span className="text-[11px] text-gray-400 font-mono block mb-1">
                  Monthly Rank
                </span>
                <span className="font-bold text-sm flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-500" /> Top 5%
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-gray-400 font-mono block mb-1">
                  Level
                </span>
                <span className="font-bold text-sm text-violet-500 font-mono">
                  {myStats?.level ?? 1}
                </span>
              </div>
            </div>
          </div>

          <div
            ref={scholarsSectionRef}
            className={`border rounded-3xl p-5 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md shrink min-h-0 overflow-hidden ${
              isDarkMode
                ? "bg-[#151125] border-white/5 shadow-white/5"
                : "bg-white border-slate-200 shadow-slate-200"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-4 shrink-0">
              <Users className="w-4 h-4 text-violet-500" />
              <h4 className="font-bold text-sm">Suggested Scholars</h4>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 flex-1 no-scrollbar h-full">
              {SUGGESTED_SCHOLARS.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <h5
                        className={`text-xs font-bold group-hover:text-violet-500 transition-colors ${isDarkMode ? "text-white" : "text-slate-900"}`}
                      >
                        {user.name}
                      </h5>
                      <p className="text-[10px] text-gray-500">{user.handle}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnect(user.id)}
                    disabled={requestedScholars.has(user.id)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors ${
                      requestedScholars.has(user.id)
                        ? "bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-gray-400 cursor-not-allowed"
                        : "text-violet-600 bg-violet-500/10 hover:bg-violet-600 hover:text-white"
                    }`}
                  >
                    {requestedScholars.has(user.id) ? "Pending" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* GOAL MODAL OVERLAY */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsGoalModalOpen(false)}
          />
          <div
            className={`relative w-full max-w-md p-6 rounded-3xl shadow-2xl z-10 ${isDarkMode ? "bg-[#151125] text-white border border-white/10" : "bg-white text-slate-900 border border-slate-200"}`}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-bold text-xl">Set Goal</h2>
                <p className="text-xs text-violet-500 uppercase font-mono tracking-widest mt-1">
                  Complete goals to earn EXP
                </p>
              </div>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className={`p-2 rounded-full transition ${isDarkMode ? "hover:bg-white/10" : "hover:bg-slate-200"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <form
                onSubmit={handleGoalSubmit}
                className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#0B0914] border-white/10" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Goal Title (e.g., Read Chapter 4)"
                    value={goalForm.title}
                    onChange={(e) =>
                      setGoalForm({ ...goalForm, title: e.target.value })
                    }
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition ${
                      isDarkMode
                        ? "bg-[#151125] border-white/10 text-white placeholder-gray-500"
                        : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                    }`}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Subject"
                    value={goalForm.subject}
                    onChange={(e) =>
                      setGoalForm({ ...goalForm, subject: e.target.value })
                    }
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition ${
                      isDarkMode
                        ? "bg-[#151125] border-white/10 text-white placeholder-gray-500"
                        : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                    }`}
                    required
                  />
                  <div className="flex items-center gap-3">
                    {/* UPDATED: Change time to date input */}
                    <input
                      type="date"
                      value={goalForm.deadline}
                      onChange={(e) =>
                        setGoalForm({ ...goalForm, deadline: e.target.value })
                      }
                      className={`flex-1 rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition ${
                        isDarkMode
                          ? "bg-[#151125] border-white/10 text-white placeholder-gray-500"
                          : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                      }`}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={goalForm.isPublic}
                          onChange={(e) =>
                            setGoalForm({
                              ...goalForm,
                              isPublic: e.target.checked,
                            })
                          }
                        />
                        <div
                          className={`block w-10 h-6 rounded-full transition-colors duration-300 ${goalForm.isPublic ? "bg-violet-600" : isDarkMode ? "bg-white/20" : "bg-gray-300"}`}
                        ></div>
                        <div
                          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${goalForm.isPublic ? "translate-x-2" : ""}`}
                        ></div>
                      </div>
                      <div className="ml-3 flex items-center gap-1.5 text-sm font-medium">
                        {goalForm.isPublic ? (
                          <Globe className="w-4 h-4 text-violet-500" />
                        ) : (
                          <GlobeLock className="w-4 h-4 text-gray-500" />
                        )}
                        {goalForm.isPublic ? "Public" : "Private"}
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={
                        isGoalSubmitting ||
                        !goalForm.title.trim() ||
                        !goalForm.subject.trim() ||
                        !goalForm.deadline
                      }
                      className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-violet-700 disabled:opacity-50 transition min-w-[100px]"
                    >
                      {isGoalSubmitting ? "Loading..." : "Add"}
                    </button>
                  </div>
                </div>
              </form>

              <div className="max-h-[35vh] overflow-y-auto space-y-3 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {goals.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-4">
                    No goals added yet.
                  </p>
                ) : (
                  goals.map((goal) => {
                    const threeHoursInMs = 3 * 60 * 60 * 1000;
                    const isCompletable =
                      currentTime >=
                      new Date(goal.createdAt).getTime() + threeHoursInMs;

                    return (
                      <div
                        key={goal.id}
                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0B0914] border-white/5" : "bg-slate-50 border-slate-100"}`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleCompleteGoal(goal.id, goal.createdAt)
                          }
                          disabled={
                            !isCompletable || goal.status === "completed"
                          }
                          className={`w-6 h-6 mt-1 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                            goal.status === "completed"
                              ? "bg-violet-600 border-violet-500 text-white"
                              : !isCompletable
                                ? "border-gray-500/30 text-transparent opacity-50 cursor-not-allowed"
                                : isDarkMode
                                  ? "border-white/20 text-transparent hover:border-violet-500 cursor-pointer"
                                  : "border-slate-300 text-transparent hover:border-violet-500 cursor-pointer"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`font-semibold text-sm truncate ${goal.status === "completed" ? "text-gray-500 line-through" : ""}`}
                            >
                              {goal.title}
                            </p>
                            {goal.visibility === "public" ? (
                              <Globe className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                            ) : (
                              <GlobeLock className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                            )}
                          </div>

                          <p className="text-xs text-gray-500 mt-0.5">
                            {/* UPDATED: Displays the selected deadline date nicely */}
                            {goal.subject} • Deadline:{" "}
                            {formatDate(goal.deadline)} • Set:{" "}
                            {new Date(goal.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>

                          {goal.status === "completed" && !isCompletable && (
                            <div className="mt-2 inline-flex items-center gap-1 bg-orange-500/10 text-orange-500 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                              <Clock className="w-3 h-3" />
                              Unlocks in 3 hrs
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {imageLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setImageLightbox(null)}
        >
          <button
            onClick={() => setImageLightbox(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={imageLightbox}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
