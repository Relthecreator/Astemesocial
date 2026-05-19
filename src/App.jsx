import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, Trash2, RefreshCcw, VideoOff, AlertCircle, Sparkles, Smile, Heart, 
  UserPlus, Users, Home, Send, X, UserCheck, Globe, MessageCircle, MessageSquare, 
  User, Search, PlusCircle, Image as ImageIcon, Type, TrendingUp, Hash, Check,
  Bell, Compass, Disc, BadgeCheck, Palette, Music
} from 'lucide-react';

// --- Firebase Initialization ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';

// ==========================================
// 1. Live Production Firebase Config
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCT1EdgS9Yk6J8X3BvTMKgExag7dwXdWQ8",
  authDomain: "astemesocial.firebaseapp.com",
  projectId: "astemesocial",
  storageBucket: "astemesocial.firebasestorage.app",
  messagingSenderId: "602552648047",
  appId: "1:602552648047:web:b070b83b77da3a4c80289a"
};

// Auto-switch to Online mode because we have real keys successfully attached!
const isLocalMode = false;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "astemesocial-global-room"; // Ensures everyone connects to the exact same global room!

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
const SOUNDTRACKS = ['None', 'Lofi Chill ☕️', 'Synthwave 🌃', 'Pop Anthem 🎤', 'Acoustic Vibes 🎸', 'Trap Beat 🎧', 'Cyberpunk 🦾'];

const GRADIENTS = [
  'from-pink-500 to-rose-500', 'from-purple-600 to-indigo-600', 'from-cyan-500 to-blue-500',
  'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-600', 'from-violet-600 to-fuchsia-600'
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
  // --- Auth / Base State ---
  const [user, setUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  
  const [profile, setProfile] = useState(null);
  
  // --- Navigation / View State ---
  const [currentTab, setCurrentTab] = useState('feed'); // feed | explore | create | inbox | profile
  const [inboxSubTab, setInboxSubTab] = useState('activity'); // activity | messages
  const [feedFilter, setFeedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- Live Feeds & Data ---
  const [stories, setStories] = useState([]);
  const [friends, setFriends] = useState([]);
  const [comments, setComments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);

  // --- Creator States ---
  const [creationType, setCreationType] = useState('camera'); 
  const [textPostContent, setTextPostContent] = useState('');
  const [textPostGradient, setTextPostGradient] = useState(GRADIENTS[0]);
  const [uploadFile, setUploadFile] = useState(null);
  const [selectedGif, setSelectedGif] = useState(null);
  const [customCaption, setCustomCaption] = useState('');
  const [selectedSoundtrack, setSelectedSoundtrack] = useState(SOUNDTRACKS[0]);
  
  // --- Camera Hardware ---
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

  // --- UI States ---
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editEmoji, setEditEmoji] = useState('😎');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [focusedExplorePost, setFocusedExplorePost] = useState(null);

  // --- Helper Notify Engine ---
  const notify = (text) => {
    const newNotif = { id: Date.now().toString(), text, time: Date.now(), read: false };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotifsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Handle Video Element Ready State
  const handleVideoCanPlay = () => {
    setIsCameraReady(true);
  };

  // --- Firebase Authentication (RULE 3 - Auth First) ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { 
        console.error("Auth Error:", err); 
      } finally {
        setIsAuthenticating(false);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Sync / Load Profiles (RULE 1 - Strict Paths)
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setEditName(data.username || '');
        setEditBio(data.bio || '');
        setEditEmoji(data.emoji || '😎');
      } else {
        const defaultProfile = { 
          username: `User_${Math.floor(Math.random() * 9000) + 1000}`, 
          emoji: '😎', 
          bio: 'Ready to post!', 
          createdAt: Date.now(), 
          isVerified: true 
        };
        // Guarantee profile sets locally immediately so posting isn't blocked
        setProfile(defaultProfile);
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid), defaultProfile)
          .catch(e => console.error("Error creating profile:", e));
      }
    });
    return unsub;
  }, [user]);

  // Sync Global Feeds (RULE 2 - No complex queries, sort/filter locally)
  useEffect(() => {
    if (!user) return;
    const unsubStories = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'stories'), (snap) => setStories(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)));
    const unsubProfiles = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'profiles'), (snap) => setAllProfiles(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubFriends = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'friends'), (snap) => setFriends(snap.docs.map(d => d.id)));
    const unsubComments = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'comments'), (snap) => setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.createdAt - b.createdAt)));
    const unsubMessages = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), (snap) => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.createdAt - b.createdAt)));
    return () => { unsubStories(); unsubProfiles(); unsubFriends(); unsubComments(); unsubMessages(); };
  }, [user]);

  // --- Camera Engine ---
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsDemoMode(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, audio: false });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      try {
        const basicStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(basicStream);
        if (videoRef.current) videoRef.current.srcObject = basicStream;
      } catch (fallbackErr) { setCameraError('No webcam detected. Click the Star icon to run Demo mode!'); }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); setIsCameraReady(false); }
  }, [stream]);

  const activateDemoMode = () => { stopCamera(); setCameraError(null); setIsDemoMode(true); setIsCameraReady(true); };

  useEffect(() => {
    if (currentTab === 'create' && creationType === 'camera') startCamera();
    else stopCamera();
  }, [currentTab, creationType, startCamera]);

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
      ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, 110, 0, Math.PI * 2); ctx.stroke();
      emojiX += dx; emojiY += dy;
      if (emojiX < 60 || emojiX > canvas.width - 60) dx = -dx;
      if (emojiY < 60 || emojiY > canvas.height - 60) dy = -dy;
      ctx.save(); ctx.translate(emojiX, emojiY); ctx.rotate(Math.sin(angle) * 0.4); ctx.font = "110px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(demoEmoji, 0, 0); ctx.restore();
      animationFrameRef.current = requestAnimationFrame(renderDemo);
    };
    renderDemo();
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isDemoMode, demoEmoji]);

  const takePhoto = () => {
    if (!isCameraReady || countdown !== null) return;
    let counter = 3; setCountdown(counter);
    const timer = setInterval(() => {
      counter -= 1;
      if (counter > 0) setCountdown(counter);
      else { clearInterval(timer); setCountdown(null); snap(); }
    }, 1000);
  };

  const snap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (isDemoMode && demoCanvasRef.current) {
      canvas.width = demoCanvasRef.current.width; canvas.height = demoCanvasRef.current.height;
      ctx.filter = activeFilter.value; ctx.drawImage(demoCanvasRef.current, 0, 0);
    } else if (videoRef.current) {
      canvas.width = videoRef.current.videoWidth || 640; canvas.height = videoRef.current.videoHeight || 480;
      ctx.filter = activeFilter.value; ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    } else return;

    // Strict compression: keep image small so it fits in Firestore's 1MB limit easily
    const max_dim = 500; let w = canvas.width; let h = canvas.height;
    if (w > max_dim || h > max_dim) { const scale = Math.min(max_dim / w, max_dim / h); w = Math.round(w * scale); h = Math.round(h * scale); }
    const compCanvas = document.createElement('canvas'); compCanvas.width = w; compCanvas.height = h;
    compCanvas.getContext('2d').drawImage(canvas, 0, 0, w, h);
    setIsFlashing(true); setTimeout(() => setIsFlashing(false), 150);
    setCapturedPhoto(compCanvas.toDataURL('image/jpeg', 0.5));
  };

  // --- Sticker Engine (AR Stamps) ---
  const applyStickerToPhoto = (emoji) => {
    if (!capturedPhoto) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      ctx.font = `${Math.floor(canvas.width / 4)}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const rx = canvas.width/2 + (Math.random() * canvas.width * 0.5 - canvas.width * 0.25);
      const ry = canvas.height/2 + (Math.random() * canvas.height * 0.5 - canvas.height * 0.25);
      const rot = (Math.random() - 0.5) * 0.8;
      ctx.translate(rx, ry); ctx.rotate(rot); ctx.fillText(emoji, 0, 0);
      setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.src = capturedPhoto;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max_dim = 600; let w = img.width; let h = img.height;
        if (w > max_dim || h > max_dim) { const scale = Math.min(max_dim / w, max_dim / h); w = Math.round(w * scale); h = Math.round(h * scale); }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setUploadFile(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async () => {
    if (!user) {
      alert("Authentication error: Still connecting to server. Please try again in a few seconds.");
      return;
    }
    if (!profile) {
      alert("Profile error: Your temporary user profile hasn't loaded yet. Please wait a second.");
      return;
    }
    
    setIsPosting(true);
    let finalImageUrl = null; let textContent = null; let bgGradient = null; let isGif = false;

    if (creationType === 'camera' && capturedPhoto) finalImageUrl = capturedPhoto;
    else if (creationType === 'upload' && uploadFile) finalImageUrl = uploadFile;
    else if (creationType === 'gif' && selectedGif) { finalImageUrl = selectedGif; isGif = true; }
    else if (creationType === 'text' && textPostContent.trim() !== '') { textContent = textPostContent; bgGradient = textPostGradient; }
    else { 
      alert("Please add a photo, text, or GIF before publishing!");
      setIsPosting(false); 
      return; 
    }

    const payload = {
      authorId: user.uid, authorName: profile.username, authorEmoji: profile.emoji,
      imageUrl: finalImageUrl, textContent: textContent, bgGradient: bgGradient,
      caption: customCaption, soundtrack: selectedSoundtrack, isGif: isGif, createdAt: Date.now(), likes: []
    };

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'stories'), payload);

      setCapturedPhoto(null); setUploadFile(null); setSelectedGif(null); setTextPostContent(''); setCustomCaption(''); setSelectedSoundtrack(SOUNDTRACKS[0]);
      setCurrentTab('feed');
    } catch (err) { 
      console.error("Posting error:", err); 
      alert(`Firebase rejected the post: ${err.message}. Make sure your Firestore Rules are set to Test Mode!`);
    } finally { 
      setIsPosting(false); 
    }
  };

  const handlePostComment = async () => {
    if (!user || !profile || !newCommentText.trim() || !activeCommentPost) return;
    const payload = { storyId: activeCommentPost.id, authorId: user.uid, authorName: profile.username, authorEmoji: profile.emoji, text: newCommentText.trim(), createdAt: Date.now() };
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'comments'), payload);
      
      if (activeCommentPost.authorId !== user.uid) notify(`You commented on ${activeCommentPost.authorName}'s post!`);
      setNewCommentText('');
    } catch (err) { console.error(err); }
  };

  const handleSendDM = async () => {
    if (!user || !profile || !newMessageText.trim() || !activeChatUser) return;
    const payload = { senderId: user.uid, senderName: profile.username, senderEmoji: profile.emoji, receiverId: activeChatUser.id, text: newMessageText.trim(), createdAt: Date.now() };
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), payload);
      setNewMessageText('');
    } catch (err) { console.error(err); }
  };

  const toggleLike = async (story) => {
    if (!user) return;
    const hasLiked = story.likes?.includes(user.uid);
    const newLikes = hasLiked ? (story.likes || []).filter(id => id !== user.uid) : [...(story.likes || []), user.uid];
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stories', story.id), { likes: newLikes });
      
      if (!hasLiked && story.authorId !== user.uid) notify(`You liked ${story.authorName}'s post! 💖`);
    } catch (err) { console.error(err); }
  };

  const toggleFriend = async (targetId) => {
    if (!user || targetId === user.uid) return;
    try {
      const friendRef = doc(db, 'artifacts', appId, 'users', user.uid, 'friends', targetId);
      if (friends.includes(targetId)) {
        await deleteDoc(friendRef); 
      } else {
        await setDoc(friendRef, { addedAt: Date.now() });
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateProfile = async () => {
    if (!user || !editName.trim()) return;
    setIsUpdatingProfile(true);
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid), { username: editName.trim(), emoji: editEmoji, bio: editBio.trim() });
      alert("Profile updated! Looking good!");
    } catch (err) { console.error(err); } finally { setIsUpdatingProfile(false); }
  };

  const deleteStory = async (storyId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stories', storyId));
    } catch (err) { console.error(err); }
  };

  const filteredStories = stories.filter(story => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return story.authorName?.toLowerCase().includes(q) || story.caption?.toLowerCase().includes(q) || story.textContent?.toLowerCase().includes(q);
    }
    if (feedFilter === 'friends') return friends.includes(story.authorId) || story.authorId === user?.uid;
    return true;
  });

  const chatHistory = messages.filter(m => (m.senderId === user?.uid && m.receiverId === activeChatUser?.id) || (m.senderId === activeChatUser?.id && m.receiverId === user?.uid));
  const unreadCount = notifications.filter(n => !n.read).length;

  if (isAuthenticating) {
    return (
      <div className="h-screen bg-neutral-950 text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <Camera className="w-12 h-12 text-blue-500 mx-auto animate-pulse" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Connecting to Room...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-neutral-950 text-white font-sans flex flex-col md:flex-row overflow-hidden relative selection:bg-blue-500/30">
      
      {/* ===== SIDEBAR NAVIGATION ===== */}
      <nav className="hidden md:flex flex-col w-64 bg-neutral-900 border-r border-neutral-800 p-4 shrink-0 z-20">
        <div className="flex items-center gap-2 mb-8 px-2 mt-2">
          <Camera className="w-8 h-8 text-blue-500" />
          <span className="font-black text-xl tracking-wider text-blue-400">PHOTO HUB</span>
        </div>

        {profile && (
          <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-2xl flex items-center gap-3 mb-6 shadow-inner">
            <span className="text-3xl bg-neutral-900 p-1.5 rounded-xl border border-neutral-800">{profile.emoji}</span>
            <div className="overflow-hidden">
              <h4 className="font-bold text-xs text-neutral-200 truncate flex items-center gap-1">
                {profile.username} <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
              </h4>
              <p className="text-[10px] text-neutral-500 truncate">{profile.bio || 'No bio yet.'}</p>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <button onClick={() => setCurrentTab('feed')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentTab === 'feed' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}>
            <Home className="w-5 h-5" /> Home Feed
          </button>
          
          <button onClick={() => setCurrentTab('explore')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentTab === 'explore' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}>
            <Compass className="w-5 h-5" /> Explore Grid
          </button>

          <button onClick={() => setCurrentTab('create')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentTab === 'create' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}>
            <PlusCircle className="w-5 h-5" /> Post Studio
          </button>

          <button onClick={() => { setCurrentTab('inbox'); markNotifsRead(); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentTab === 'inbox' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}>
            <div className="flex items-center gap-3"><Bell className="w-5 h-5" /> Inbox Hub</div>
            {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{unreadCount}</span>}
          </button>

          <button onClick={() => setCurrentTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentTab === 'profile' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}>
            <User className="w-5 h-5" /> Profile Settings
          </button>
        </div>
      </nav>

      {/* ===== CENTRAL CONTENT DISPLAY ===== */}
      <div className="flex-1 flex flex-col overflow-hidden bg-black/95 relative">
        
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center px-4 py-3 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 shrink-0 z-30 sticky top-0">
          <div className="flex items-center gap-1.5">
            <Camera className="w-6 h-6 text-blue-500" />
            <span className="font-black text-sm tracking-widest text-blue-400">PHOTO HUB</span>
          </div>
          <button onClick={() => { setCurrentTab('inbox'); markNotifsRead(); }} className="relative text-neutral-300">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 w-3.5 h-3.5 rounded-full border-2 border-neutral-900"></span>}
          </button>
        </div>

        {/* Dynamic Tab Switchboard */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          
          {/* TAB 1: HOME FEED */}
          {currentTab === 'feed' && (
            <div className="max-w-xl mx-auto p-4 space-y-6 pb-24 md:pb-6">
              
              <div className="flex justify-between items-center bg-neutral-900/60 p-2 rounded-xl border border-neutral-800 backdrop-blur-sm">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent border-none pl-9 pr-4 py-2 text-sm focus:outline-none text-neutral-200" />
                </div>
                <div className="flex bg-neutral-950 rounded-lg p-1 ml-2 border border-neutral-800">
                  <button onClick={() => setFeedFilter('all')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-colors ${feedFilter === 'all' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500'}`}>Global</button>
                  <button onClick={() => setFeedFilter('friends')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-colors ${feedFilter === 'friends' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500'}`}>Friends</button>
                </div>
              </div>

              {filteredStories.length === 0 ? (
                <div className="py-32 text-center opacity-40">
                  <Smile className="w-16 h-16 mx-auto mb-4 text-neutral-600" />
                  <p className="text-sm font-medium">No stories found. Start creating!</p>
                </div>
              ) : (
                filteredStories.map((story) => {
                  const isMine = story.authorId === user?.uid;
                  const isFriend = friends.includes(story.authorId);
                  const hasLiked = story.likes?.includes(user?.uid);
                  const postComments = comments.filter(c => c.storyId === story.id);
                  const profileData = allProfiles.find(p => p.id === story.authorId) || {};
                  
                  return (
                    <article key={story.id} className="bg-neutral-900 border border-neutral-800/80 rounded-3xl overflow-hidden shadow-2xl">
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl bg-neutral-950 p-1.5 rounded-full border border-neutral-800">{story.authorEmoji}</span>
                          <div>
                            <div className="font-bold text-sm flex items-center gap-1.5 text-neutral-100">
                              {story.authorName} 
                              {profileData.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                              {isMine && <span className="text-[9px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-bold tracking-wide">YOU</span>}
                            </div>
                            <div className="text-[10px] text-neutral-500 flex items-center gap-2">
                              {timeAgo(story.createdAt)}
                              {story.soundtrack && story.soundtrack !== 'None' && (
                                <span className="flex items-center gap-1 text-blue-400">
                                  <Music className="w-3 h-3" /> {story.soundtrack}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!isMine ? (
                          <button onClick={() => toggleFriend(story.authorId)} className={`p-2 rounded-full transition-colors ${isFriend ? 'bg-blue-500/10 text-blue-400' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>
                            {isFriend ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                          </button>
                        ) : (
                          <button onClick={() => deleteStory(story.id)} className="p-2 text-neutral-500 hover:text-red-400 transition-colors bg-neutral-950 rounded-full">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="w-full relative bg-black aspect-[4/5] flex items-center justify-center overflow-hidden">
                        {story.imageUrl ? (
                          <img src={story.imageUrl} alt="Uploaded Post" className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${story.bgGradient} p-8 flex items-center justify-center text-center`}>
                            <p className="text-2xl md:text-3xl font-extrabold tracking-wide text-white drop-shadow-xl">{story.textContent}</p>
                          </div>
                        )}
                        {/* Spinning Record overlay for music */}
                        {story.soundtrack && story.soundtrack !== 'None' && (
                          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                            <Disc className="w-6 h-6 text-white animate-[spin_4s_linear_infinite]" />
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-neutral-900">
                        <div className="flex gap-5 mb-3">
                          <button onClick={() => toggleLike(story)} className={`flex items-center gap-1.5 text-sm font-bold transition-transform hover:scale-110 ${hasLiked ? 'text-pink-500' : 'text-neutral-300'}`}>
                            <Heart className={`w-6 h-6 ${hasLiked ? 'fill-pink-500' : ''}`} /> {story.likes?.length || 0}
                          </button>
                          <button onClick={() => setActiveCommentPost(story)} className="flex items-center gap-1.5 text-sm font-bold text-neutral-300 hover:text-white transition-transform hover:scale-110">
                            <MessageCircle className="w-6 h-6" /> {postComments.length}
                          </button>
                        </div>
                        {story.caption && (
                          <div className="text-xs text-neutral-200">
                            <span className="font-bold mr-2">{story.authorName}</span>{story.caption}
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 2: EXPLORE (GRID) */}
          {currentTab === 'explore' && (
            <div className="p-2 md:p-6 pb-24 md:pb-6">
              <h2 className="text-xl font-extrabold tracking-wide text-blue-400 mb-4 px-2">EXPLORE WORLD</h2>
              <div className="grid grid-cols-3 gap-1 md:gap-3">
                {stories.filter(s => s.imageUrl).length === 0 ? (
                  <div className="col-span-3 text-center py-20 text-neutral-500 text-sm">No visual posts to explore yet!</div>
                ) : (
                  stories.filter(s => s.imageUrl).map(story => (
                    <div key={`exp-${story.id}`} onClick={() => setFocusedExplorePost(story)} className="aspect-[3/4] relative group cursor-pointer overflow-hidden rounded-md md:rounded-xl bg-neutral-900 border border-neutral-800">
                      <img src={story.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <Heart className="w-6 h-6 text-white fill-white" />
                        <span className="text-white font-bold text-xs">{story.likes?.length || 0}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: POST CREATION STUDIO */}
          {currentTab === 'create' && (
            <div className="max-w-xl mx-auto p-4 space-y-6 pb-24 md:pb-6">
              <h2 className="text-xl font-extrabold tracking-wide text-blue-400">CREATIVE STUDIO</h2>
              
              <div className="grid grid-cols-4 gap-1.5 bg-neutral-900 p-1.5 rounded-xl border border-neutral-800">
                <button onClick={() => setCreationType('camera')} className={`py-2 text-[11px] font-bold rounded-lg transition-all ${creationType === 'camera' ? 'bg-blue-500 text-white' : 'text-neutral-400'}`}>Camera</button>
                <button onClick={() => setCreationType('text')} className={`py-2 text-[11px] font-bold rounded-lg transition-all ${creationType === 'text' ? 'bg-blue-500 text-white' : 'text-neutral-400'}`}>Text Card</button>
                <button onClick={() => setCreationType('upload')} className={`py-2 text-[11px] font-bold rounded-lg transition-all ${creationType === 'upload' ? 'bg-blue-500 text-white' : 'text-neutral-400'}`}>Upload</button>
                <button onClick={() => setCreationType('gif')} className={`py-2 text-[11px] font-bold rounded-lg transition-all ${creationType === 'gif' ? 'bg-blue-500 text-white' : 'text-neutral-400'}`}>GIFs</button>
              </div>

              {creationType === 'camera' && (
                <div className="relative rounded-3xl overflow-hidden bg-neutral-950 aspect-[4/5] border border-neutral-800 flex flex-col items-center justify-center shadow-2xl">
                  {cameraError && !isDemoMode ? (
                    <div className="text-center p-6 max-w-sm">
                      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                      <p className="text-xs text-neutral-400 mb-4">{cameraError}</p>
                      <button onClick={activateDemoMode} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-xs font-bold rounded-xl flex items-center gap-1.5 mx-auto text-white">
                        <Sparkles className="w-3.5 h-3.5" /> Start Virtual Camera Demo
                      </button>
                    </div>
                  ) : (
                    <>
                      {!capturedPhoto ? (
                        <>
                          {!isDemoMode && <video ref={videoRef} onCanPlay={handleVideoCanPlay} autoPlay playsInline muted className={`w-full h-full object-cover ${isCameraReady ? 'opacity-100' : 'opacity-0'}`} style={{ transform: 'scaleX(-1)', filter: activeFilter.value }} />}
                          {isDemoMode && <canvas ref={demoCanvasRef} width="640" height="800" className="w-full h-full object-cover" style={{ filter: activeFilter.value }} />}
                          
                          {/* Hardware Overlays */}
                          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                            {isDemoMode && EMOJIS.slice(0, 4).map(e => <button key={e} onClick={() => setDemoEmoji(e)} className="text-2xl bg-black/40 rounded-full p-1 border border-white/10 hover:scale-110">{e}</button>)}
                          </div>
                          
                          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4 z-20">
                            <div className="flex gap-2 overflow-x-auto w-full px-4 scrollbar-hide justify-center">
                              {FILTERS.map(f => <button key={f.name} onClick={() => setActiveFilter(f)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold backdrop-blur-md border border-white/10 ${activeFilter.name === f.name ? 'bg-blue-500 text-white' : 'bg-black/50 text-neutral-300'}`}>{f.name}</button>)}
                            </div>
                            <button onClick={takePhoto} className="w-20 h-20 rounded-full border-4 border-neutral-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner"><Camera className="w-7 h-7 text-black" /></div>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full relative">
                          <img src={capturedPhoto} className="w-full h-full object-cover" />
                          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
                            <h4 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-1.5"><Palette className="w-4 h-4"/> STICKER STUDIO</h4>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                              {EMOJIS.map(e => (
                                <button key={e} onClick={() => applyStickerToPhoto(e)} className="text-2xl bg-white/10 hover:bg-white/30 backdrop-blur-md p-1.5 rounded-xl transition-all hover:-translate-y-1">{e}</button>
                              ))}
                            </div>
                          </div>
                          <button onClick={() => setCapturedPhoto(null)} className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-600/80 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1.5 hover:bg-red-500">
                            <RefreshCcw className="w-4 h-4" /> Retake
                          </button>
                        </div>
                      )}
                      
                      {countdown !== null && <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30"><span className="text-9xl font-black text-white drop-shadow-2xl animate-ping">{countdown}</span></div>}
                      <div className={`absolute inset-0 bg-white transition-opacity duration-150 pointer-events-none z-40 ${isFlashing ? 'opacity-100' : 'opacity-0'}`} />
                    </>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}

              {creationType === 'text' && (
                <div className="space-y-4">
                  <div className={`aspect-[4/5] rounded-3xl bg-gradient-to-br ${textPostGradient} p-8 flex items-center justify-center relative border border-neutral-800 shadow-2xl`}>
                    <textarea placeholder="Type something bold..." value={textPostContent} onChange={(e) => setTextPostContent(e.target.value)} maxLength={180} className="w-full bg-transparent border-none text-center font-black text-2xl md:text-4xl text-white placeholder-white/50 focus:outline-none resize-none overflow-hidden drop-shadow-xl" />
                  </div>
                  <div className="flex gap-2 justify-center p-2 bg-neutral-900 rounded-2xl border border-neutral-800">
                    {GRADIENTS.map(grad => <button key={grad} onClick={() => setTextPostGradient(grad)} className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} border-2 ${textPostGradient === grad ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`} />)}
                  </div>
                </div>
              )}

              {creationType === 'upload' && (
                <div className="border-2 border-dashed border-neutral-700 hover:border-blue-500 rounded-3xl p-10 text-center bg-neutral-900/50 transition-colors">
                  {uploadFile ? (
                    <div className="space-y-4">
                      <img src={uploadFile} className="max-h-64 rounded-xl mx-auto object-cover shadow-2xl" />
                      <button onClick={() => setUploadFile(null)} className="text-xs text-red-400 hover:underline">Remove Picture</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block space-y-4">
                      <ImageIcon className="w-12 h-12 text-blue-500 mx-auto" />
                      <div>
                        <span className="text-sm font-bold text-white block">Select an Image</span>
                        <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider">High Quality PNG or JPG</p>
                      </div>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  )}
                </div>
              )}

              {creationType === 'gif' && (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Trending GIFs</p>
                  <div className="grid grid-cols-2 gap-3">
                    {CURATED_GIFS.map(g => (
                      <button key={g.name} onClick={() => setSelectedGif(g.url)} className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${selectedGif === g.url ? 'border-blue-500 scale-105 shadow-xl shadow-blue-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                        <img src={g.url} alt={g.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1.5 bg-black/80 text-[10px] px-2 py-0.5 rounded font-bold text-white">{g.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5"><Type className="w-3.5 h-3.5"/> Caption</label>
                  <input type="text" placeholder="Write a description..." value={customCaption} onChange={(e) => setCustomCaption(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500 text-white" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5"><Music className="w-3.5 h-3.5"/> Soundtrack Vibe</label>
                  <select value={selectedSoundtrack} onChange={(e) => setSelectedSoundtrack(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500 text-white appearance-none">
                    {SOUNDTRACKS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleCreatePost} disabled={isPosting || (creationType==='camera'&&!capturedPhoto) || (creationType==='upload'&&!uploadFile) || (creationType==='gif'&&!selectedGif) || (creationType==='text'&&!textPostContent)} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-sm font-bold text-white rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all">
                {isPosting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />} Publish to World
              </button>
            </div>
          )}

          {/* TAB 4: COMBINED INBOX & NOTIFICATIONS */}
          {currentTab === 'inbox' && (
            <div className="max-w-4xl mx-auto p-4 flex flex-col h-[80vh] md:h-[90vh]">
              <h2 className="text-xl font-extrabold tracking-wide text-blue-400 mb-4 hidden md:block">INBOX HUB</h2>
              
              {/* Inbox Nav Toggle */}
              <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1.5 mb-4">
                <button onClick={() => setInboxSubTab('activity')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${inboxSubTab === 'activity' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500'}`}>
                  <Bell className="w-4 h-4" /> Activity
                </button>
                <button onClick={() => setInboxSubTab('messages')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${inboxSubTab === 'messages' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500'}`}>
                  <MessageSquare className="w-4 h-4" /> Direct Messages
                </button>
              </div>

              {inboxSubTab === 'activity' && (
                <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-y-auto p-2 scrollbar-hide space-y-2">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-500 opacity-60">
                      <Bell className="w-12 h-12 mb-3" />
                      <p className="text-sm font-medium">No new activity.</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="flex items-center gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800/60">
                        <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-neutral-200">{notif.text}</p>
                          <span className="text-[9px] text-neutral-500">{timeAgo(notif.time)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {inboxSubTab === 'messages' && (
                <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
                  <div className="w-full md:w-64 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shrink-0 h-1/3 md:h-full">
                    <h3 className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider p-4 pb-2 border-b border-neutral-800">Your Network</h3>
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-hide space-y-1">
                      {friends.length === 0 ? <p className="text-[11px] text-neutral-500 text-center mt-4">No friends yet!</p> : (
                        allProfiles.filter(p => friends.includes(p.id)).map(friend => (
                          <button key={friend.id} onClick={() => setActiveChatUser(friend)} className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${activeChatUser?.id === friend.id ? 'bg-blue-500/15 border border-blue-500/30' : 'hover:bg-neutral-800/60 border border-transparent'}`}>
                            <span className="text-2xl bg-neutral-950 p-1 rounded-lg">{friend.emoji}</span>
                            <span className="text-xs font-bold truncate text-neutral-200">{friend.username}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden h-2/3 md:h-full">
                    {activeChatUser ? (
                      <>
                        <div className="p-3 border-b border-neutral-800 bg-neutral-950/40 flex items-center gap-3">
                          <span className="text-2xl">{activeChatUser.emoji}</span>
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1">{activeChatUser.username} {activeChatUser.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500"/>}</h4>
                            <p className="text-[9px] text-green-400 font-bold uppercase tracking-wide">Online</p>
                          </div>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-hide">
                          {chatHistory.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                              <MessageSquare className="w-10 h-10 mb-2 text-blue-400" />
                              <p className="text-xs">Say hi to {activeChatUser.username}!</p>
                            </div>
                          ) : (
                            chatHistory.map(m => {
                              const isMe = m.senderId === user?.uid;
                              return (
                                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${isMe ? 'bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-900/20' : 'bg-neutral-800 text-neutral-200 rounded-tl-sm'}`}>
                                    <p className="leading-relaxed">{m.text}</p>
                                    <span className={`text-[8px] block mt-1 text-right ${isMe ? 'text-blue-200' : 'text-neutral-500'}`}>{timeAgo(m.createdAt)}</span>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                        <div className="p-3 border-t border-neutral-800 bg-neutral-950/60 flex gap-2">
                          <input type="text" placeholder={`Message...`} value={newMessageText} onChange={(e) => setNewMessageText(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleSendDM(); }} className="flex-1 bg-neutral-900 border border-neutral-800 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-blue-500 text-white" />
                          <button onClick={handleSendDM} className="w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors shrink-0"><Send className="w-4 h-4 ml-0.5" /></button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 p-8">
                        <MessageCircle className="w-12 h-12 mb-3 opacity-30 text-blue-500" />
                        <p className="text-sm font-bold">Secure Messages</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROFILE SETTINGS */}
          {currentTab === 'profile' && profile && (
            <div className="max-w-xl mx-auto p-4 space-y-6 pb-24 md:pb-6">
              <h2 className="text-xl font-extrabold tracking-wide text-blue-400">YOUR ACCOUNT</h2>
              
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
                <div className="space-y-3 mb-6">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Avatar Sticker</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {EMOJIS.map(e => <button key={e} type="button" onClick={() => setEditEmoji(e)} className={`text-3xl p-2 rounded-2xl transition-all ${editEmoji === e ? 'bg-blue-500/20 border-2 border-blue-500 scale-105 shadow-md shadow-blue-500/20' : 'bg-neutral-950 border-2 border-transparent hover:bg-neutral-800'}`}>{e}</button>)}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Display Name</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Public Bio</label>
                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} maxLength={100} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white resize-none h-20" />
                  </div>
                </div>

                <button onClick={handleUpdateProfile} disabled={isUpdatingProfile} className="w-full mt-6 py-3.5 bg-white text-black text-xs font-black rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-lg">
                  <Check className="w-4 h-4" /> Save Profile Details
                </button>
              </div>

              <div className="space-y-3 pt-4">
                <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5"><ImageIcon className="w-4 h-4"/> Your Portfolio</h3>
                <div className="grid grid-cols-2 gap-3">
                  {stories.filter(s => s.authorId === user?.uid).length === 0 ? <p className="col-span-2 text-xs text-neutral-600 p-4 text-center bg-neutral-900 rounded-xl">No posts published yet.</p> : 
                    stories.filter(s => s.authorId === user?.uid).map(story => (
                    <div key={story.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden aspect-[4/5] relative group shadow-lg">
                      {story.imageUrl ? <img src={story.imageUrl} alt="My post" className="w-full h-full object-cover" /> : <div className={`w-full h-full bg-gradient-to-br ${story.bgGradient} p-4 flex items-center justify-center text-center text-[10px] font-bold leading-tight`}>{story.textContent}</div>}
                      <button onClick={() => deleteStory(story.id)} className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center bg-black/80 hover:bg-red-600 rounded-full text-white transition-colors backdrop-blur-sm">
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

      {/* ===== EXPLORE MODAL DRAWER ===== */}
      {focusedExplorePost && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setFocusedExplorePost(null)}>
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
             <button onClick={() => setFocusedExplorePost(null)} className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/80 rounded-full z-10 text-white backdrop-blur-sm"><X className="w-4 h-4" /></button>
             <div className="aspect-[4/5] bg-black">
               <img src={focusedExplorePost.imageUrl} className="w-full h-full object-cover" />
             </div>
             <div className="p-4 flex items-center justify-between bg-neutral-900">
               <div className="flex items-center gap-2">
                 <span className="text-xl bg-neutral-950 p-1 rounded-lg border border-neutral-800">{focusedExplorePost.authorEmoji}</span>
                 <span className="text-xs font-bold">{focusedExplorePost.authorName}</span>
               </div>
               <div className="flex items-center gap-1.5 text-pink-500 font-bold text-xs"><Heart className="w-4 h-4 fill-pink-500" /> {focusedExplorePost.likes?.length || 0}</div>
             </div>
          </div>
        </div>
      )}

      {/* ===== COMMENTS PANEL DRAWER ===== */}
      {activeCommentPost && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
              <div className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-blue-500" /><h3 className="font-bold text-sm text-white">Discussion</h3></div>
              <button onClick={() => setActiveCommentPost(null)} className="p-1.5 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-hide">
              {comments.filter(c => c.storyId === activeCommentPost.id).length === 0 ? <div className="text-center text-neutral-500 text-xs py-20 font-medium">Be the first to leave a comment!</div> : 
                comments.filter(c => c.storyId === activeCommentPost.id).map(c => (
                  <div key={c.id} className="flex gap-3 bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800/50">
                    <span className="text-2xl">{c.authorEmoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1.5"><span className="text-[11px] font-bold text-blue-300">{c.authorName}</span><span className="text-[9px] text-neutral-600">{timeAgo(c.createdAt)}</span></div>
                      <p className="text-xs text-neutral-200 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))
              }
            </div>
            <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex gap-2">
              <input type="text" placeholder="Add a comment..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handlePostComment(); }} className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500 text-white" />
              <button onClick={handlePostComment} className="px-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold text-xs transition-colors shadow-md shadow-blue-900/20">Post</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MOBILE BOTTOM NAVBAR BAR ===== */}
      <nav className="md:hidden absolute bottom-0 left-0 right-0 bg-neutral-950/90 border-t border-neutral-800 flex justify-around p-2 pb-safe z-40 backdrop-blur-xl">
        <button onClick={() => setCurrentTab('feed')} className={`flex flex-col items-center gap-1 p-2 ${currentTab === 'feed' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
          <Home className="w-5 h-5" /><span className="text-[9px] font-bold">Home</span>
        </button>
        <button onClick={() => setCurrentTab('explore')} className={`flex flex-col items-center gap-1 p-2 ${currentTab === 'explore' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
          <Compass className="w-5 h-5" /><span className="text-[9px] font-bold">Explore</span>
        </button>
        <button onClick={() => setCurrentTab('create')} className="flex flex-col items-center justify-center -mt-6">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 border-4 border-neutral-950 text-white"><PlusCircle className="w-6 h-6" /></div>
        </button>
        <button onClick={() => { setCurrentTab('inbox'); markNotifsRead(); }} className={`relative flex flex-col items-center gap-1 p-2 ${currentTab === 'inbox' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
          <Bell className="w-5 h-5" /><span className="text-[9px] font-bold">Inbox</span>
          {unreadCount > 0 && <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-neutral-950"></span>}
        </button>
        <button onClick={() => setCurrentTab('profile')} className={`flex flex-col items-center gap-1 p-2 ${currentTab === 'profile' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
          <User className="w-5 h-5" /><span className="text-[9px] font-bold">Profile</span>
        </button>
      </nav>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0.5rem); }
      `}} />
    </div>
  );
}