import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  Trash2, 
  RefreshCcw, 
  VideoOff,
  AlertCircle,
  Sparkles,
  Smile,
  Heart,
  UserPlus,
  Users,
  Home,
  Send,
  X,
  UserCheck,
  Globe,
  MessageCircle,
  MessageSquare,
  User,
  Search,
  PlusCircle,
  Image as ImageIcon,
  Type,
  TrendingUp,
  Hash,
  Check
} from 'lucide-react';

// --- Firebase Initialization ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';

// 1. Create a mock Firebase config fallback so the app runs offline/locally without crashes
const defaultFirebaseConfig = {
  apiKey: "AIzaSyFakeKeyForLocalTestingOnly",
  authDomain: "photo-hub.firebaseapp.com",
  projectId: "photo-hub",
  storageBucket: "photo-hub.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const isLocalMode = typeof __firebase_config === 'undefined';
const firebaseConfig = JSON.parse(!isLocalMode ? __firebase_config : JSON.stringify(defaultFirebaseConfig));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Constants ---
const FILTERS = [
  { name: 'Normal', value: 'none' },
  { name: 'B & W', value: 'grayscale(100%)' },
  { name: 'Sepia', value: 'sepia(100%)' },
  { name: 'Vintage', value: 'sepia(50%) contrast(150%) saturate(150%)' },
  { name: 'Cool', value: 'saturate(150%) hue-rotate(90deg)' },
  { name: 'Warm', value: 'sepia(50%) hue-rotate(-30deg) saturate(150%)' },
  { name: 'Vibrant', value: 'saturate(200%) hue-rotate(45deg) contrast(120%)' },
];

const EMOJIS = ['😎', '👻', '👾', '🦊', '🚀', '🌟', '🦄', '🦖', '🍕', '🎸', '🐱', '🍩', '🔮', '👽', '🔥', '💖'];

const GRADIENTS = [
  'from-pink-500 to-rose-500',
  'from-purple-600 to-indigo-600',
  'from-cyan-500 to-blue-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-600',
  'from-violet-600 to-fuchsia-600'
];

const CURATED_GIFS = [
  { name: 'Happy Dance', url: 'https://media.giphy.com/media/l3V0lsGtTMSB5YNgA/giphy.gif' },
  { name: 'Retro Sunset', url: 'https://media.giphy.com/media/3d9rkLNvMXahgQVpM4/giphy.gif' },
  { name: 'Cat Vibe', url: 'https://media.giphy.com/media/GeimqsH0TLDt4tScGw/giphy.gif' },
  { name: 'Laser Eyes', url: 'https://media.giphy.com/media/26n6WywJyum5o9fWM/giphy.gif' },
  { name: 'Nyan Cat', url: 'https://media.giphy.com/media/sIIhZUk24moGQ/giphy.gif' },
  { name: 'SpongeBob Smile', url: 'https://media.giphy.com/media/3o7aubqB57bB89vDoc/giphy.gif' },
  { name: 'Mind Blown', url: 'https://media.giphy.com/media/2RqsuAkVK86hy38gWA/giphy.gif' },
  { name: 'Floating Hearts', url: 'https://media.giphy.com/media/Lp71Uqyzn28JJ34P3q/giphy.gif' }
];

// Helper to format timestamps
const timeAgo = (timestamp) => {
  if (!timestamp) return 'Just now';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function App() {
  // --- Auth / Base State (with offline fallback engine) ---
  const [user, setUser] = useState(() => isLocalMode ? { uid: 'local-demo-user' } : null);
  
  const [profile, setProfile] = useState(() => {
    if (isLocalMode) {
      const saved = localStorage.getItem('ph_profile');
      return saved ? JSON.parse(saved) : {
        username: `User_${Math.floor(Math.random() * 9000) + 1000}`,
        emoji: '😎',
        bio: 'Welcome to my Photo Hub!',
        createdAt: Date.now()
      };
    }
    return null;
  });
  
  // --- Navigation / View State ---
  const [currentTab, setCurrentTab] = useState('feed');
  const [feedFilter, setFeedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- Live Feeds (Loaded from LocalStorage if offline) ---
  const [stories, setStories] = useState(() => {
    if (isLocalMode) {
      const saved = localStorage.getItem('ph_stories');
      if (saved) return JSON.parse(saved);
      return [{
        id: 'system-post-1',
        authorId: 'system-bot',
        authorName: 'Photo Hub Bot',
        authorEmoji: '🤖',
        textContent: 'Welcome to your deployed Photo Hub! Create a post using the Post Studio tab!',
        bgGradient: 'from-blue-600 to-indigo-600',
        createdAt: Date.now(),
        likes: []
      }];
    }
    return [];
  });
  const [friends, setFriends] = useState(() => isLocalMode ? JSON.parse(localStorage.getItem('ph_friends') || '[]') : []);
  const [comments, setComments] = useState(() => isLocalMode ? JSON.parse(localStorage.getItem('ph_comments') || '[]') : []);
  const [messages, setMessages] = useState(() => isLocalMode ? JSON.parse(localStorage.getItem('ph_messages') || '[]') : []);
  const [allProfiles, setAllProfiles] = useState(() => isLocalMode ? JSON.parse(localStorage.getItem('ph_profiles') || '[]') : []);

  // --- Creator & Upload States ---
  const [creationType, setCreationType] = useState('camera'); 
  const [textPostContent, setTextPostContent] = useState('');
  const [textPostGradient, setTextPostGradient] = useState(GRADIENTS[0]);
  const [uploadFile, setUploadFile] = useState(null);
  const [selectedGif, setSelectedGif] = useState(null);
  const [customCaption, setCustomCaption] = useState('');
  
  // --- Photo Booth Hardware States ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const demoCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [countdown, setCountdown] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoEmoji, setDemoEmoji] = useState('😎');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isPosting, setIsPosting] = useState(false);

  // --- Profile Edit State ---
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editEmoji, setEditEmoji] = useState('😎');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // --- Comment System State ---
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');

  // --- DM System State ---
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');

  // --- Offline Persistence Synchronization ---
  useEffect(() => {
    if (isLocalMode && profile) {
      localStorage.setItem('ph_profile', JSON.stringify(profile));
      setEditName(profile.username || '');
      setEditBio(profile.bio || '');
      setEditEmoji(profile.emoji || '😎');
      
      // Inject bot and self into the local profile database
      setAllProfiles([
        { id: user.uid, ...profile },
        { id: 'system-bot', username: 'Photo Hub Bot', emoji: '🤖', bio: 'I exist to be your first friend on GitHub Pages!', createdAt: Date.now() }
      ]);
    }
  }, [profile, user]);

  useEffect(() => { if (isLocalMode) localStorage.setItem('ph_stories', JSON.stringify(stories)); }, [stories]);
  useEffect(() => { if (isLocalMode) localStorage.setItem('ph_friends', JSON.stringify(friends)); }, [friends]);
  useEffect(() => { if (isLocalMode) localStorage.setItem('ph_comments', JSON.stringify(comments)); }, [comments]);
  useEffect(() => { if (isLocalMode) localStorage.setItem('ph_messages', JSON.stringify(messages)); }, [messages]);

  // --- 1. Firebase Authentication & Listeners (Bypassed if LocalMode) ---
  useEffect(() => {
    if (isLocalMode) return; 
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Sync / Generate Profile (Online only)
  useEffect(() => {
    if (isLocalMode || !user) return;
    
    const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid);
    const unsub = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setEditName(data.username || '');
        setEditBio(data.bio || '');
        setEditEmoji(data.emoji || '😎');
      } else {
        const defaultProfile = {
          username: `User_${Math.floor(Math.random() * 9000) + 1000}`,
          emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
          bio: 'Taking sweet poses in the photo booth!',
          createdAt: Date.now()
        };
        setDoc(profileRef, defaultProfile);
      }
    }, err => console.error("Profile listen error:", err));

    return unsub;
  }, [user]);

  // Sync Live Feed, Profiles, Friends, Messages, & Comments (Online only)
  useEffect(() => {
    if (isLocalMode || !user) return;

    const storiesRef = collection(db, 'artifacts', appId, 'public', 'data', 'stories');
    const unsubStories = onSnapshot(storiesRef, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => b.createdAt - a.createdAt);
      setStories(fetched);
    }, err => console.error("Stories load failed:", err));

    const profilesRef = collection(db, 'artifacts', appId, 'public', 'data', 'profiles');
    const unsubProfiles = onSnapshot(profilesRef, (snap) => {
      setAllProfiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error("Profiles load failed:", err));

    const friendsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'friends');
    const unsubFriends = onSnapshot(friendsRef, (snap) => {
      setFriends(snap.docs.map(d => d.id));
    }, err => console.error("Friends load failed:", err));

    const commentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'comments');
    const unsubComments = onSnapshot(commentsRef, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => a.createdAt - b.createdAt); // oldest first
      setComments(fetched);
    }, err => console.error("Comments load failed:", err));

    const messagesRef = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    const unsubMessages = onSnapshot(messagesRef, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => a.createdAt - b.createdAt);
      setMessages(fetched);
    }, err => console.error("Messages load failed:", err));

    return () => {
      unsubStories();
      unsubProfiles();
      unsubFriends();
      unsubComments();
      unsubMessages();
    };
  }, [user]);

  // --- 2. Camera & Photo Booth Hardware Engine ---
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsDemoMode(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.warn("Retrying basic webcam...", err);
      try {
        const basicStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(basicStream);
        if (videoRef.current) videoRef.current.srcObject = basicStream;
      } catch (fallbackErr) {
        setCameraError('No webcam detected. Click the Star icon to run in Live Demo mode!');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraReady(false);
    }
  }, [stream]);

  const activateDemoMode = () => {
    stopCamera();
    setCameraError(null);
    setIsDemoMode(true);
    setIsCameraReady(true);
  };

  useEffect(() => {
    if (currentTab === 'create' && creationType === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [currentTab, creationType, startCamera]);

  // Demo Mode Animation Engine
  useEffect(() => {
    if (!isDemoMode || !demoCanvasRef.current) return;
    const canvas = demoCanvasRef.current;
    const ctx = canvas.getContext('2d');
    let angle = 0, emojiX = 320, emojiY = 240, dx = 4, dy = 3;

    const renderDemo = () => {
      if (!ctx || !canvas) return;
      angle += 0.02;
      
      ctx.fillStyle = `rgb(15, 23, 42)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1.5;
      const offset = (angle * 45) % 60;
      for (let x = offset; x < canvas.width; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let y = offset; y < canvas.height; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 110, 0, Math.PI * 2);
      ctx.stroke();

      emojiX += dx; emojiY += dy;
      if (emojiX < 60 || emojiX > canvas.width - 60) dx = -dx;
      if (emojiY < 60 || emojiY > canvas.height - 60) dy = -dy;

      ctx.save();
      ctx.translate(emojiX, emojiY);
      ctx.rotate(Math.sin(angle) * 0.4);
      ctx.font = "110px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(demoEmoji, 0, 0);
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(renderDemo);
    };
    renderDemo();
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isDemoMode, demoEmoji]);

  const handleVideoCanPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.error(e));
      setIsCameraReady(true);
    }
  };

  const takePhoto = () => {
    if (!isCameraReady || countdown !== null) return;
    let counter = 3;
    setCountdown(counter);
    const timer = setInterval(() => {
      counter -= 1;
      if (counter > 0) setCountdown(counter);
      else {
        clearInterval(timer);
        setCountdown(null);
        snap();
      }
    }, 1000);
  };

  const snap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (isDemoMode && demoCanvasRef.current) {
      canvas.width = demoCanvasRef.current.width;
      canvas.height = demoCanvasRef.current.height;
      ctx.filter = activeFilter.value;
      ctx.drawImage(demoCanvasRef.current, 0, 0);
    } else if (videoRef.current) {
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      ctx.filter = activeFilter.value;
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    } else return;

    const max_dim = 600;
    let w = canvas.width;
    let h = canvas.height;
    if (w > max_dim || h > max_dim) {
      const scale = Math.min(max_dim / w, max_dim / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    
    const compCanvas = document.createElement('canvas');
    compCanvas.width = w;
    compCanvas.height = h;
    const compCtx = compCanvas.getContext('2d');
    compCtx.drawImage(canvas, 0, 0, w, h);
    
    const compressedData = compCanvas.toDataURL('image/jpeg', 0.55);

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);
    setCapturedPhoto(compressedData);
  };

  // --- 3. Dynamic Local File Uploader Handling ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max_dim = 600;
        let w = img.width;
        let h = img.height;
        if (w > max_dim || h > max_dim) {
          const scale = Math.min(max_dim / w, max_dim / h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        setUploadFile(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // --- 4. Main Multi-Format Posting System ---
  const handleCreatePost = async () => {
    if (!user || !profile) return;
    setIsPosting(true);

    let finalImageUrl = null;
    let textContent = null;
    let bgGradient = null;
    let isGif = false;

    if (creationType === 'camera' && capturedPhoto) {
      finalImageUrl = capturedPhoto;
    } else if (creationType === 'upload' && uploadFile) {
      finalImageUrl = uploadFile;
    } else if (creationType === 'gif' && selectedGif) {
      finalImageUrl = selectedGif;
      isGif = true;
    } else if (creationType === 'text' && textPostContent.trim() !== '') {
      textContent = textPostContent;
      bgGradient = textPostGradient;
    } else {
      setIsPosting(false);
      return;
    }

    const payload = {
      authorId: user.uid,
      authorName: profile.username,
      authorEmoji: profile.emoji,
      imageUrl: finalImageUrl,
      textContent: textContent,
      bgGradient: bgGradient,
      caption: customCaption,
      isGif: isGif,
      createdAt: Date.now(),
      likes: []
    };

    try {
      if (isLocalMode) {
        setStories(prev => [{ id: Date.now().toString(), ...payload }, ...prev]);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'stories'), payload);
      }

      setCapturedPhoto(null);
      setUploadFile(null);
      setSelectedGif(null);
      setTextPostContent('');
      setCustomCaption('');
      setCurrentTab('feed');
    } catch (err) {
      console.error("Posting error:", err);
    } finally {
      setIsPosting(false);
    }
  };

  // --- 5. Custom Comment System Engine ---
  const handlePostComment = async () => {
    if (!user || !profile || !newCommentText.trim() || !activeCommentPost) return;
    
    const payload = {
      storyId: activeCommentPost.id,
      authorId: user.uid,
      authorName: profile.username,
      authorEmoji: profile.emoji,
      text: newCommentText.trim(),
      createdAt: Date.now()
    };

    try {
      if (isLocalMode) {
        setComments(prev => [...prev, { id: Date.now().toString(), ...payload }]);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'comments'), payload);
      }
      setNewCommentText('');
    } catch (err) {
      console.error("Commenting error:", err);
    }
  };

  // --- 6. Dynamic Direct Messaging Engine ---
  const handleSendDM = async () => {
    if (!user || !profile || !newMessageText.trim() || !activeChatUser) return;
    
    const payload = {
      senderId: user.uid,
      senderName: profile.username,
      senderEmoji: profile.emoji,
      receiverId: activeChatUser.id,
      text: newMessageText.trim(),
      createdAt: Date.now()
    };

    try {
      if (isLocalMode) {
        setMessages(prev => [...prev, { id: Date.now().toString(), ...payload }]);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), payload);
      }
      setNewMessageText('');
    } catch (err) {
      console.error("DM sending error:", err);
    }
  };

  // --- 7. Social Network Utility Methods ---
  const toggleLike = async (story) => {
    if (!user) return;
    const hasLiked = story.likes?.includes(user.uid);
    const newLikes = hasLiked 
      ? (story.likes || []).filter(id => id !== user.uid)
      : [...(story.likes || []), user.uid];
    
    try {
      if (isLocalMode) {
        setStories(prev => prev.map(s => s.id === story.id ? { ...s, likes: newLikes } : s));
      } else {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stories', story.id), { likes: newLikes });
      }
    } catch (err) { console.error("Error toggling like:", err); }
  };

  const toggleFriend = async (targetId) => {
    if (!user || targetId === user.uid) return;
    try {
      if (isLocalMode) {
        setFriends(prev => prev.includes(targetId) ? prev.filter(id => id !== targetId) : [...prev, targetId]);
      } else {
        const friendRef = doc(db, 'artifacts', appId, 'users', user.uid, 'friends', targetId);
        if (friends.includes(targetId)) await deleteDoc(friendRef);
        else await setDoc(friendRef, { addedAt: Date.now() });
      }
    } catch (err) { console.error("Error toggling friend:", err); }
  };

  const handleUpdateProfile = async () => {
    if (!user || !editName.trim()) return;
    setIsUpdatingProfile(true);
    try {
      if (isLocalMode) {
        setProfile(prev => ({ ...prev, username: editName.trim(), emoji: editEmoji, bio: editBio.trim() }));
        alert("Profile updated successfully!");
      } else {
        const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid);
        await updateDoc(profileRef, { username: editName.trim(), emoji: editEmoji, bio: editBio.trim() });
        alert("Profile updated!");
      }
    } catch (err) {
      console.error("Profile save error:", err);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const deleteStory = async (storyId) => {
    if (!user) return;
    try {
      if (isLocalMode) {
        setStories(prev => prev.filter(s => s.id !== storyId));
      } else {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stories', storyId));
      }
    } catch (err) { console.error("Error deleting story:", err); }
  };

  // --- Filtered Feeds ---
  const filteredStories = stories.filter(story => {
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const nameMatch = story.authorName?.toLowerCase().includes(query);
      const capMatch = story.caption?.toLowerCase().includes(query);
      const textMatch = story.textContent?.toLowerCase().includes(query);
      if (!nameMatch && !capMatch && !textMatch) return false;
    }
    if (feedFilter === 'friends') {
      return friends.includes(story.authorId) || story.authorId === user?.uid;
    }
    return true;
  });

  const chatHistory = messages.filter(m => 
    (m.senderId === user?.uid && m.receiverId === activeChatUser?.id) || 
    (m.senderId === activeChatUser?.id && m.receiverId === user?.uid)
  );

  return (
    <div className="h-screen bg-neutral-950 text-white font-sans flex flex-col md:flex-row overflow-hidden relative">
      
      {/* ===== SIDEBAR NAVIGATION ===== */}
      <nav className="hidden md:flex flex-col w-64 bg-neutral-900 border-r border-neutral-800 p-4 shrink-0">
        <div className="flex items-center gap-2 mb-8 px-2">
          <Camera className="w-7 h-7 text-blue-500" />
          <span className="font-black text-lg tracking-wider text-blue-400">PHOTO HUB</span>
        </div>

        {/* My Mini Account Card */}
        {profile && (
          <div className="bg-neutral-950 border border-neutral-800/60 p-3 rounded-xl flex items-center gap-3 mb-6">
            <span className="text-3xl">{profile.emoji}</span>
            <div className="overflow-hidden">
              <h4 className="font-bold text-xs text-neutral-200 truncate">{profile.username}</h4>
              <p className="text-[10px] text-neutral-500 truncate">{profile.bio || 'No bio yet.'}</p>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <button 
            onClick={() => { setCurrentTab('feed'); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${currentTab === 'feed' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}
          >
            <Globe className="w-5 h-5" /> Home Feed
          </button>
          
          <button 
            onClick={() => { setCurrentTab('create'); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${currentTab === 'create' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}
          >
            <PlusCircle className="w-5 h-5" /> Post Studio
          </button>

          <button 
            onClick={() => { setCurrentTab('dms'); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${currentTab === 'dms' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}
          >
            <MessageSquare className="w-5 h-5" /> Messenger
          </button>

          <button 
            onClick={() => { setCurrentTab('profile'); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${currentTab === 'profile' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}
          >
            <User className="w-5 h-5" /> Profile Settings
          </button>
        </div>
      </nav>

      {/* ===== CENTRAL MAIN CONTENT DISPLAY ===== */}
      <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
        
        {/* Mobile Mini Header */}
        <div className="md:hidden flex justify-between items-center px-4 py-3 bg-neutral-900 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <Camera className="w-5 h-5 text-blue-500" />
            <span className="font-black text-sm tracking-widest text-blue-400">PHOTO HUB</span>
          </div>
          {profile && <span className="text-xl">{profile.emoji}</span>}
        </div>

        {/* Dynamic Tab Switchboard */}
        <div className="flex-1 overflow-y-auto">
          
          {/* TAB 1: HOME FEED */}
          {currentTab === 'feed' && (
            <div className="max-w-xl mx-auto p-4 space-y-6 pb-24 md:pb-6">
              
              {/* Filter Tabs and Search Bar */}
              <div className="space-y-3 bg-neutral-900/50 p-3.5 rounded-2xl border border-neutral-800/80">
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Search posts, tags, or usernames..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-pink-500 text-neutral-200"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-neutral-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-neutral-400 tracking-wide uppercase">Feed Filter</span>
                  <div className="flex bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
                    <button onClick={() => setFeedFilter('all')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${feedFilter === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>
                      Global
                    </button>
                    <button onClick={() => setFeedFilter('friends')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${feedFilter === 'friends' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>
                      Friends
                    </button>
                  </div>
                </div>
              </div>

              {/* Story/Post Deck */}
              {filteredStories.length === 0 ? (
                <div className="py-20 text-center opacity-40">
                  <Smile className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-sm">No stories or matching posts found!</p>
                </div>
              ) : (
                filteredStories.map((story) => {
                  const isMine = story.authorId === user?.uid;
                  const isFriend = friends.includes(story.authorId);
                  const hasLiked = story.likes?.includes(user?.uid);
                  const postComments = comments.filter(c => c.storyId === story.id);
                  
                  return (
                    <article key={story.id} className="bg-neutral-900 border border-neutral-800/80 rounded-2xl overflow-hidden shadow-2xl">
                      {/* Header */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{story.authorEmoji}</span>
                          <div>
                            <div className="font-black text-sm flex items-center gap-1.5">
                              {story.authorName}
                              {isMine && <span className="text-[8px] bg-neutral-800 px-1 py-0.5 rounded text-neutral-400">YOU</span>}
                            </div>
                            <div className="text-[10px] text-neutral-500">{timeAgo(story.createdAt)}</div>
                          </div>
                        </div>

                        {!isMine ? (
                          <button 
                            onClick={() => toggleFriend(story.authorId)}
                            className={`p-1.5 rounded-full ${isFriend ? 'text-indigo-400' : 'text-neutral-500 hover:text-neutral-300'}`}
                          >
                            {isFriend ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                          </button>
                        ) : (
                          <button onClick={() => deleteStory(story.id)} className="text-neutral-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Content Card Body */}
                      <div className="w-full relative">
                        {story.imageUrl ? (
                          <div className="aspect-[4/3] bg-black relative group">
                            <img src={story.imageUrl} alt="Uploaded Post" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`aspect-[4/3] bg-gradient-to-br ${story.bgGradient || 'from-neutral-800 to-neutral-900'} p-8 flex items-center justify-center text-center`}>
                            <p className="text-xl md:text-2xl font-extrabold tracking-wide text-white drop-shadow-md">
                              {story.textContent}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="p-3 bg-neutral-900 border-t border-neutral-800/50 flex justify-between items-center">
                        <div className="flex gap-4">
                          <button 
                            onClick={() => toggleLike(story)}
                            className={`flex items-center gap-1.5 text-xs font-bold ${hasLiked ? 'text-pink-500' : 'text-neutral-400'}`}
                          >
                            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
                            {story.likes?.length || 0}
                          </button>

                          <button 
                            onClick={() => setActiveCommentPost(story)}
                            className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-200"
                          >
                            <MessageCircle className="w-5 h-5" />
                            {postComments.length}
                          </button>
                        </div>
                      </div>

                      {/* Attached Caption text */}
                      {story.caption && (
                        <div className="px-4 pb-4 text-xs text-neutral-300">
                          <span className="font-bold text-neutral-100 mr-2">{story.authorName}</span>
                          {story.caption}
                        </div>
                      )}
                    </article>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 2: POST CREATION STUDIO */}
          {currentTab === 'create' && (
            <div className="max-w-xl mx-auto p-4 space-y-6 pb-24 md:pb-6">
              <h2 className="text-xl font-extrabold tracking-wide text-blue-400">CREATIVE STUDIO</h2>
              
              {/* Type Switcher */}
              <div className="grid grid-cols-4 gap-1.5 bg-neutral-900 p-1.5 rounded-xl border border-neutral-800">
                <button onClick={() => setCreationType('camera')} className={`py-2 text-[11px] font-bold rounded-lg transition-all ${creationType === 'camera' ? 'bg-blue-500 text-white' : 'text-neutral-400'}`}>Camera</button>
                <button onClick={() => setCreationType('text')} className={`py-2 text-[11px] font-bold rounded-lg transition-all ${creationType === 'text' ? 'bg-blue-500 text-white' : 'text-neutral-400'}`}>Text Card</button>
                <button onClick={() => setCreationType('upload')} className={`py-2 text-[11px] font-bold rounded-lg transition-all ${creationType === 'upload' ? 'bg-blue-500 text-white' : 'text-neutral-400'}`}>Image File</button>
                <button onClick={() => setCreationType('gif')} className={`py-2 text-[11px] font-bold rounded-lg transition-all ${creationType === 'gif' ? 'bg-blue-500 text-white' : 'text-neutral-400'}`}>GIF Library</button>
              </div>

              {/* 1. Camera Viewbox */}
              {creationType === 'camera' && (
                <div className="relative rounded-2xl overflow-hidden bg-neutral-950 aspect-[4/3] border border-neutral-800 flex items-center justify-center">
                  {cameraError && !isDemoMode ? (
                    <div className="text-center p-6 max-w-sm">
                      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                      <p className="text-xs text-neutral-400 mb-4">{cameraError}</p>
                      <button onClick={activateDemoMode} className="px-4 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-xs font-bold rounded-xl flex items-center gap-1.5 mx-auto">
                        <Sparkles className="w-3.5 h-3.5" /> Virtual Camera Demo
                      </button>
                    </div>
                  ) : (
                    <>
                      {!isDemoMode && (
                        <video ref={videoRef} onCanPlay={handleVideoCanPlay} autoPlay playsInline muted
                          className={`w-full h-full object-cover ${isCameraReady ? 'opacity-100' : 'opacity-0'}`}
                          style={{ transform: 'scaleX(-1)', filter: activeFilter.value }}
                        />
                      )}
                      {isDemoMode && (
                        <canvas ref={demoCanvasRef} width="640" height="480" className="w-full h-full object-cover" style={{ filter: activeFilter.value }} />
                      )}
                      {countdown !== null && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30">
                          <span className="text-8xl font-black text-pink-500 animate-ping">{countdown}</span>
                        </div>
                      )}
                      <div className={`absolute inset-0 bg-white transition-opacity duration-150 pointer-events-none ${isFlashing ? 'opacity-100' : 'opacity-0'}`} />
                      
                      {/* Interactive Demo selector Overlay */}
                      {isDemoMode && (
                        <div className="absolute top-3 left-3 bg-neutral-900/80 px-2.5 py-1.5 rounded-xl border border-neutral-800 text-[10px] flex gap-2">
                          {EMOJIS.slice(0, 6).map(e => (
                            <button key={e} onClick={() => setDemoEmoji(e)} className={`hover:scale-125 transition-transform ${demoEmoji === e ? 'scale-110' : 'opacity-50'}`}>{e}</button>
                          ))}
                        </div>
                      )}

                      {/* Camera Filters Strip */}
                      <div className="absolute bottom-2 left-0 right-0 p-2 flex gap-1.5 overflow-x-auto scrollbar-hide bg-black/60 backdrop-blur-sm">
                        {FILTERS.map(f => (
                          <button key={f.name} onClick={() => setActiveFilter(f)} className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${activeFilter.name === f.name ? 'bg-pink-500' : 'bg-neutral-800'}`}>{f.name}</button>
                        ))}
                      </div>
                    </>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}

              {/* Shutter Button under camera section */}
              {creationType === 'camera' && !capturedPhoto && (
                <button onClick={takePhoto} className="w-16 h-16 rounded-full border-4 border-neutral-300 flex items-center justify-center mx-auto hover:scale-105 active:scale-95 transition-all">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <Camera className="w-6 h-6 text-black" />
                  </div>
                </button>
              )}

              {/* Display Captured Image thumbnail block */}
              {creationType === 'camera' && capturedPhoto && (
                <div className="border border-neutral-800 rounded-2xl p-4 bg-neutral-900 flex items-center gap-4">
                  <img src={capturedPhoto} alt="Preview" className="w-20 rounded-lg aspect-square object-cover" />
                  <div>
                    <h5 className="font-bold text-xs text-neutral-300">Smile Captured!</h5>
                    <button onClick={() => setCapturedPhoto(null)} className="text-[10px] text-red-400 mt-1 hover:underline">Retake Picture</button>
                  </div>
                </div>
              )}

              {/* 2. Text Grad Creator view */}
              {creationType === 'text' && (
                <div className="space-y-4">
                  <div className={`aspect-[4/3] rounded-2xl bg-gradient-to-br ${textPostGradient} p-8 flex items-center justify-center relative border border-neutral-800`}>
                    <textarea
                      placeholder="Write your creative message here..."
                      value={textPostContent}
                      onChange={(e) => setTextPostContent(e.target.value)}
                      maxLength={140}
                      className="w-full bg-transparent border-none text-center font-black text-xl md:text-2xl text-white placeholder-white/60 focus:outline-none resize-none overflow-hidden drop-shadow-md"
                    />
                  </div>
                  <div className="flex gap-2 justify-center">
                    {GRADIENTS.map(grad => (
                      <button 
                        key={grad} 
                        onClick={() => setTextPostGradient(grad)}
                        className={`w-7 h-7 rounded-full bg-gradient-to-br ${grad} border-2 ${textPostGradient === grad ? 'border-white scale-115 shadow-md' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Local Hardware File Upload Section */}
              {creationType === 'upload' && (
                <div className="border-2 border-dashed border-neutral-800 rounded-2xl p-8 text-center bg-neutral-900/30">
                  {uploadFile ? (
                    <div className="space-y-4">
                      <img src={uploadFile} alt="Pre-upload preview" className="max-h-52 rounded-xl mx-auto object-cover" />
                      <button onClick={() => setUploadFile(null)} className="text-xs text-red-400 hover:underline">Remove Picture</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block space-y-3">
                      <ImageIcon className="w-10 h-10 text-neutral-500 mx-auto" />
                      <div>
                        <span className="text-xs font-bold text-pink-500">Choose Image File</span>
                        <p className="text-[10px] text-neutral-500 mt-1">Accepts PNG, JPG, JPEG</p>
                      </div>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  )}
                </div>
              )}

              {/* 4. GIF Search Selector */}
              {creationType === 'gif' && (
                <div className="space-y-4">
                  <p className="text-xs text-neutral-400">Pick a trending motion GIF to express yourself:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CURATED_GIFS.map(g => (
                      <button 
                        key={g.name}
                        onClick={() => setSelectedGif(g.url)}
                        className={`relative rounded-xl overflow-hidden aspect-video border-2 ${selectedGif === g.url ? 'border-pink-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
                      >
                        <img src={g.url} alt={g.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1.5 bg-black/70 text-[9px] px-1.5 py-0.5 rounded text-neutral-300">{g.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Universal Caption Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400">Post Caption</label>
                <input 
                  type="text" 
                  placeholder="Write a cute story description... #hashtag"
                  value={customCaption}
                  onChange={(e) => setCustomCaption(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Universal Submit Post Trigger */}
              <button 
                onClick={handleCreatePost}
                disabled={isPosting}
                className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-indigo-500 hover:brightness-110 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
              >
                {isPosting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                Publish Post
              </button>
            </div>
          )}

          {/* TAB 3: MESSENGER (DMs) */}
          {currentTab === 'dms' && (
            <div className="max-w-4xl mx-auto p-4 flex flex-col md:flex-row h-[80vh] md:h-full gap-4">
              
              {/* Friends List for messaging */}
              <div className="w-full md:w-60 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold uppercase text-neutral-400 tracking-wider mb-3">Your Friends</h3>
                <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
                  {friends.length === 0 ? (
                    <p className="text-[11px] text-neutral-500">Add friends on the Home Feed to unlock chat!</p>
                  ) : (
                    allProfiles.filter(p => friends.includes(p.id)).map(friend => (
                      <button 
                        key={friend.id}
                        onClick={() => setActiveChatUser(friend)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${activeChatUser?.id === friend.id ? 'bg-pink-500/10 border border-pink-500/35' : 'bg-neutral-950/40 border border-transparent hover:bg-neutral-800/40'}`}
                      >
                        <span className="text-2xl">{friend.emoji}</span>
                        <span className="text-xs font-bold truncate text-left text-neutral-200">{friend.username}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Window */}
              <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden">
                {activeChatUser ? (
                  <>
                    {/* Active User Header */}
                    <div className="p-4 border-b border-neutral-800 bg-neutral-950/20 flex items-center gap-3">
                      <span className="text-3xl">{activeChatUser.emoji}</span>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-100">{activeChatUser.username}</h4>
                        <p className="text-[9px] text-neutral-500">Connected Chat</p>
                      </div>
                    </div>

                    {/* Messages Body Scroll */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-hide">
                      {chatHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                          <MessageCircle className="w-10 h-10 mb-2" />
                          <p className="text-xs">No message history yet. Say hi!</p>
                        </div>
                      ) : (
                        chatHistory.map(m => {
                          const isSentByMe = m.senderId === user?.uid;
                          return (
                            <div key={m.id} className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs ${isSentByMe ? 'bg-pink-500 text-white rounded-tr-none' : 'bg-neutral-800 text-neutral-200 rounded-tl-none'}`}>
                                <p className="leading-relaxed">{m.text}</p>
                                <span className={`text-[8px] block mt-1.5 text-right ${isSentByMe ? 'text-white/70' : 'text-neutral-500'}`}>
                                  {timeAgo(m.createdAt)}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Chat Text Input field */}
                    <div className="p-3.5 border-t border-neutral-800 bg-neutral-950/40 flex gap-2">
                      <input 
                        type="text" 
                        placeholder={`Chat to ${activeChatUser.username}...`}
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter') handleSendDM(); }}
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-500"
                      />
                      <button onClick={handleSendDM} className="p-2.5 bg-pink-500 hover:bg-pink-600 rounded-xl text-white transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-500 p-8">
                    <MessageSquare className="w-12 h-12 mb-3 opacity-40 text-pink-500 animate-pulse" />
                    <p className="text-sm font-semibold">Instant Messenger</p>
                    <p className="text-xs text-neutral-600 mt-1">Select a friend on the left panel to initiate a live chat room!</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: PROFILE SETTINGS */}
          {currentTab === 'profile' && profile && (
            <div className="max-w-xl mx-auto p-4 space-y-6 pb-24 md:pb-6">
              <h2 className="text-xl font-extrabold tracking-wide text-blue-400">CUSTOMIZE YOUR ACCOUNT</h2>
              
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
                
                {/* Avatar emoji picker strip */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400">Choose Profile Emoji</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {EMOJIS.map(e => (
                      <button 
                        key={e} 
                        type="button"
                        onClick={() => setEditEmoji(e)}
                        className={`text-3xl p-1.5 rounded-xl transition-all ${editEmoji === e ? 'bg-pink-500/20 border border-pink-500 scale-110' : 'bg-neutral-950 hover:bg-neutral-800'}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Username Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400">Username</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-pink-500 text-neutral-200 font-bold"
                  />
                </div>

                {/* Account Bio */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400">Custom Bio</label>
                  <textarea 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    maxLength={100}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-pink-500 text-neutral-200 resize-none h-20"
                  />
                </div>

                <button 
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-xs font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save Profile Details
                </button>
              </div>

              {/* Own posted stories history */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Your Published Posts</h3>
                <div className="grid grid-cols-2 gap-3">
                  {stories.filter(s => s.authorId === user?.uid).map(story => (
                    <div key={story.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden aspect-[4/3] relative group">
                      {story.imageUrl ? (
                        <img src={story.imageUrl} alt="My post" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${story.bgGradient} p-4 flex items-center justify-center text-center text-[10px] font-bold`}>
                          {story.textContent}
                        </div>
                      )}
                      <button 
                        onClick={() => deleteStory(story.id)}
                        className="absolute bottom-2 right-2 p-1.5 bg-neutral-950/80 hover:bg-red-600 rounded-lg text-neutral-400 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* ===== COMMENTS PANEL DRAWER ===== */}
      {activeCommentPost && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 h-full flex flex-col">
            
            {/* Header */}
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/40">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-pink-500" />
                <h3 className="font-bold text-sm text-neutral-100">Post Comments</h3>
              </div>
              <button onClick={() => setActiveCommentPost(null)} className="p-1 hover:bg-neutral-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List scroll */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-hide">
              {comments.filter(c => c.storyId === activeCommentPost.id).length === 0 ? (
                <div className="text-center text-neutral-500 text-xs py-10">No comments on this post yet. Type below to start the conversation!</div>
              ) : (
                comments.filter(c => c.storyId === activeCommentPost.id).map(comment => (
                  <div key={comment.id} className="flex gap-3 bg-neutral-950/30 p-3 rounded-xl border border-neutral-800/40">
                    <span className="text-2xl">{comment.authorEmoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-neutral-100">{comment.authorName}</span>
                        <span className="text-[9px] text-neutral-600">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input field */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex gap-2">
              <input 
                type="text" 
                placeholder="Write an engaging comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter') handlePostComment(); }}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-500"
              />
              <button onClick={handlePostComment} className="p-2.5 bg-pink-500 hover:bg-pink-600 rounded-xl text-white">
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===== MOBILE BOTTOM NAVBAR BAR ===== */}
      <nav className="md:hidden absolute bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 flex justify-around p-3 pb-safe z-40 backdrop-blur-lg bg-opacity-90">
        <button onClick={() => setCurrentTab('feed')} className={`flex flex-col items-center gap-1 ${currentTab === 'feed' ? 'text-pink-500' : 'text-neutral-500'}`}>
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold">Home</span>
        </button>
        <button onClick={() => setCurrentTab('create')} className={`flex flex-col items-center gap-1 ${currentTab === 'create' ? 'text-pink-500' : 'text-neutral-500'}`}>
          <PlusCircle className="w-5 h-5" />
          <span className="text-[9px] font-bold">Post</span>
        </button>
        <button onClick={() => setCurrentTab('dms')} className={`flex flex-col items-center gap-1 ${currentTab === 'dms' ? 'text-pink-500' : 'text-neutral-500'}`}>
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px] font-bold">Inbox</span>
        </button>
        <button onClick={() => setCurrentTab('profile')} className={`flex flex-col items-center gap-1 ${currentTab === 'profile' ? 'text-pink-500' : 'text-neutral-500'}`}>
          <User className="w-5 h-5" />
          <span className="text-[9px] font-bold">Profile</span>
        </button>
      </nav>

      {/* Standard Scrollbar Overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0.8rem); }
      `}} />
    </div>
  );
}