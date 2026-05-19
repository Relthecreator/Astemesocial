import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, Trash2, RefreshCcw, VideoOff, AlertCircle, Sparkles, Smile, Heart, 
  UserPlus, Users, Home, Send, X, UserCheck, Globe, MessageCircle, MessageSquare, 
  User, Search, PlusCircle, ImageIcon, Type, TrendingUp, Hash, Check,
  Bell, Compass, Disc, BadgeCheck, Palette, Music, Play, Pause, Wand2, Flame,
  Bookmark, Share, Video, BarChart2, PieChart, Award, Lock, Mail, AtSign, Key, LogOut, Crown,
  MapPin, Gem, Mic, Square, SplitSquareHorizontal, Bot
} from 'lucide-react';

// --- Firebase Initialization ---
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "astemesocial-global-room"; 

// --- Constants & Media ---
const FILTERS = [
  { name: 'Normal', value: 'none' },
  { name: 'B & W', value: 'grayscale(100%)' },
  { name: 'Sepia', value: 'sepia(100%)' },
  { name: 'Vintage', value: 'sepia(50%) contrast(150%) saturate(150%)' },
  { name: 'Cool', value: 'saturate(150%) hue-rotate(90deg)' },
  { name: 'Warm', value: 'sepia(50%) hue-rotate(-30deg) saturate(150%)' },
  { name: 'Vibrant', value: 'saturate(200%) hue-rotate(45deg) contrast(120%)' },
];

const EMOJIS = ['😎', '👻', '👾', '🦊', '🚀', '🌟', '🦄', '🦖', '🍕', '🎸', '🐱', '🍩', '🔮', '👽', '🔥', '💖', '👑', '💎'];

const SOUNDTRACKS = ['None', 'Lofi Chill ☕️', 'Synthwave 🌃', 'Pop Anthem 🎤', 'Acoustic Vibes 🎸', 'Trap Beat 🎧', 'Cyberpunk 🦾'];
const LOCATIONS = ['None', '📍 Los Angeles, CA', '📍 New York, NY', '📍 Tokyo, Japan', '📍 London, UK', '📍 Paris, France', '📍 Dubai, UAE', '📍 Sydney, AUS', '📍 The Moon 🌕'];

const AUDIO_MAP = {
  'Lofi Chill ☕️': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'Synthwave 🌃': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'Pop Anthem 🎤': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'Acoustic Vibes 🎸': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'Trap Beat 🎧': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  'Cyberpunk 🦾': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
};

const GRADIENTS = [
  'from-pink-500 to-rose-500', 'from-purple-600 to-indigo-600', 'from-cyan-500 to-blue-500',
  'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-600', 'from-violet-600 to-fuchsia-600',
  'from-yellow-400 to-amber-600'
];

const CURATED_GIFS = [
  { name: 'Happy Dance', url: 'https://media.giphy.com/media/l3V0lsGtTMSB5YNgA/giphy.gif' },
  { name: 'Retro Sunset', url: 'https://media.giphy.com/media/3d9rkLNvMXahgQVpM4/giphy.gif' },
  { name: 'Cat Vibe', url: 'https://media.giphy.com/media/GeimqsH0TLDt4tScGw/giphy.gif' },
  { name: 'Laser Eyes', url: 'https://media.giphy.com/media/26n6WywJyum5o9fWM/giphy.gif' }
];

const MAGIC_CAPTIONS = [
  "Just vibing ✨ #vibes", "Main character energy 👑 #maincharacter @relthecreator", "No cap, this is a masterpiece 🎨",
  "Living my best life 🚀 #blessed", "Catch flights, not feelings ✈️", "Built different 🦾 #gym",
  "Vibe check passed ✅", "Entering my villain era 😈", "Stay hydrated 💧 #health"
];

// --- AI Bot Configuration ---
const ASTEME_AI = { id: 'asteme_ai', username: 'Asteme AI', emoji: '🤖', isVerified: true };
const AI_RESPONSES = [
  "That is so cool! 🚀 What else is on your mind?",
  "I'm just a bot, but I totally agree with you.",
  "Have you checked out the Explore page lately? Lots of 🔥 content there.",
  "Your vibes are immaculate today ✨",
  "Hmm, interesting! Tell me more.",
  "I beep, therefore I boop. 🤖",
  "You should definitely post that to your 24h Story!",
  "Big W right there. 🏆"
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

const isVIP = (username) => username?.toLowerCase() === 'relthecreator';

const ParticleBurst = ({ particles }) => (
  <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
    {particles.map(p => (
      <div 
        key={p.id} className="absolute text-xl animate-float-up opacity-0"
        style={{ left: `${p.x}px`, top: `${p.y}px`, '--tx': `${p.vx}px`, '--ty': `${p.vy}px` }}
      >
        {p.emoji || '💖'}
      </div>
    ))}
  </div>
);

export default function App() {
  // --- Auth & Profile State ---
  const [user, setUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [profile, setProfile] = useState(null);
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // --- Navigation & View State ---
  const [currentTab, setCurrentTab] = useState('feed'); 
  const [inboxSubTab, setInboxSubTab] = useState('activity'); 
  const [profileSubTab, setProfileSubTab] = useState('posts'); 
  const [feedFilter, setFeedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStoryView, setActiveStoryView] = useState(null); 
  
  // --- Data Feeds ---
  const [stories, setStories] = useState([]);      
  const [fleets, setFleets] = useState([]);        
  const [friends, setFriends] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);  
  const [comments, setComments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);

  // --- Creator States ---
  const [creationType, setCreationType] = useState('camera'); 
  const [isPostingToStories, setIsPostingToStories] = useState(false); 
  const [textPostContent, setTextPostContent] = useState('');
  const [textPostGradient, setTextPostGradient] = useState(GRADIENTS[0]);
  const [pollOptions, setPollOptions] = useState(['', '']); 
  const [uploadFile, setUploadFile] = useState(null);
  const [selectedGif, setSelectedGif] = useState(null);
  const [customCaption, setCustomCaption] = useState('');
  const [selectedSoundtrack, setSelectedSoundtrack] = useState(SOUNDTRACKS[0]);
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0]);
  
  // --- Remix / Duet State ---
  const [remixPost, setRemixPost] = useState(null);

  // --- Audio Recording State ---
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

  // --- Interactive States ---
  const [particles, setParticles] = useState([]);
  const [currentAudio, setCurrentAudio] = useState({ url: null, postId: null });
  const audioRef = useRef(null);

  // --- Settings & Chat ---
  const [editBio, setEditBio] = useState('');
  const [editEmoji, setEditEmoji] = useState('😎');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [focusedExplorePost, setFocusedExplorePost] = useState(null);
  
  const chatEndRef = useRef(null);
  const prevMessagesLength = useRef(0);

  // Helper Notify Engine
  const notify = useCallback((text) => {
    const newNotif = { id: Date.now().toString(), text, time: Date.now(), read: false };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markNotifsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const handleVideoCanPlay = () => setIsCameraReady(true);

  // Vibe Particle Trigger
  const triggerParticles = (e, emoji = '💖', count = 8) => {
    if (!e || !e.clientX) return;
    const rect = e.target.getBoundingClientRect();
    const newParticles = Array.from({length: count}).map((_, i) => ({
       id: Date.now() + i + Math.random(), 
       x: rect.left + rect.width/2, y: rect.top + rect.height/2,
       vx: (Math.random() - 0.5) * 80, vy: -(Math.random() * 80 + 40), emoji
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.find(n => n.id === p.id))), 1000);
  };

  // --- Firebase Auth & Strict Registration ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthenticating(false);
    });
    return unsubscribe;
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        if (!authUsername.trim() || authUsername.trim().length < 3) throw new Error("Username must be at least 3 characters.");
        if (authUsername.includes(" ")) throw new Error("Username cannot contain spaces.");
        
        const lowerUser = authUsername.toLowerCase().trim();
        const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'usernames', lowerUser);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          throw new Error(`The handle @${authUsername} is already taken!`);
        }

        const cred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        await setDoc(userRef, { uid: cred.user.uid });
        
        const defaultProfile = { 
          username: authUsername.trim(), 
          emoji: '😎', bio: 'Ready to vibe!', 
          createdAt: Date.now(), isVerified: true, diamondsEarned: 0 
        };
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', cred.user.uid), defaultProfile);
      }
    } catch (err) { setAuthError(err.message.replace('Firebase: ', '')); } 
    finally { setIsAuthLoading(false); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); setProfile(null); setCurrentTab('feed'); } 
    catch (err) { console.error(err); }
  };

  // --- Global Data Syncer ---
  useEffect(() => {
    if (!user) return;
    
    const unsubProf = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setEditBio(data.bio || ''); setEditEmoji(data.emoji || '😎');
      }
    });

    const unsubStories = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'stories'), (snap) => setStories(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)));
    const unsubFleets = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'fleets'), (snap) => {
      const allFleets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const validFleets = allFleets.filter(f => Date.now() - f.createdAt < 24 * 60 * 60 * 1000).sort((a,b) => b.createdAt - a.createdAt);
      setFleets(validFleets);
    });
    
    const unsubAllProfiles = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'profiles'), (snap) => setAllProfiles(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubFriends = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'friends'), (snap) => setFriends(snap.docs.map(d => d.id)));
    const unsubBookmarks = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'bookmarks'), (snap) => setBookmarks(snap.docs.map(d => d.id)));
    const unsubComments = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'comments'), (snap) => setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.createdAt - b.createdAt)));
    const unsubMessages = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), (snap) => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.createdAt - b.createdAt)));

    return () => { unsubProf(); unsubStories(); unsubFleets(); unsubAllProfiles(); unsubFriends(); unsubBookmarks(); unsubComments(); unsubMessages(); };
  }, [user]);

  useEffect(() => {
    if (messages.length > prevMessagesLength.current && prevMessagesLength.current !== 0) {
      const newMsg = messages[messages.length - 1];
      if (newMsg.receiverId === user?.uid && activeChatUser?.id !== newMsg.senderId && newMsg.senderId !== 'asteme_ai') {
        notify(`💬 New message from ${newMsg.senderName}!`);
      }
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages, activeChatUser, user, notify]);

  // --- Audio Recording Engine ---
  const startAudioRecording = async () => {
    try {
      audioChunksRef.current = [];
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(mediaStream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => setRecordedAudio(reader.result);
        mediaStream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecordingAudio(true);
    } catch (err) {
      console.error(err);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  // --- Camera Engine ---
  const startCamera = useCallback(async () => {
    setCameraError(null); setIsDemoMode(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, audio: false });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) { setCameraError('No webcam detected. Click the Star icon to run Demo mode!'); }
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
      angle += 0.02; ctx.fillStyle = `rgb(15, 23, 42)`; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, 110, 0, Math.PI * 2); ctx.stroke();
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

    const max_dim = 1080; let w = canvas.width; let h = canvas.height;
    if (w > max_dim || h > max_dim) { const scale = Math.min(max_dim / w, max_dim / h); w = Math.round(w * scale); h = Math.round(h * scale); }
    const compCanvas = document.createElement('canvas'); compCanvas.width = w; compCanvas.height = h;
    compCanvas.getContext('2d').drawImage(canvas, 0, 0, w, h);
    setIsFlashing(true); setTimeout(() => setIsFlashing(false), 150);
    setCapturedPhoto(compCanvas.toDataURL('image/jpeg', 0.85));
  };

  const applyStickerToPhoto = (emoji) => {
    if (!capturedPhoto) return;
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const img = new Image();
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0);
      ctx.font = `${Math.floor(canvas.width / 4)}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const rx = canvas.width/2 + (Math.random() * canvas.width * 0.5 - canvas.width * 0.25);
      const ry = canvas.height/2 + (Math.random() * canvas.height * 0.5 - canvas.height * 0.25);
      const rot = (Math.random() - 0.5) * 0.8;
      ctx.translate(rx, ry); ctx.rotate(rot); ctx.fillText(emoji, 0, 0);
      setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.85));
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
        const max_dim = 1080; let w = img.width; let h = img.height;
        if (w > max_dim || h > max_dim) { const scale = Math.min(max_dim / w, max_dim / h); w = Math.round(w * scale); h = Math.round(h * scale); }
        canvas.width = w; canvas.height = h; canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setUploadFile(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const generateMagicCaption = (e) => {
    e.preventDefault();
    setCustomCaption(MAGIC_CAPTIONS[Math.floor(Math.random() * MAGIC_CAPTIONS.length)]);
    triggerParticles(e, '✨', 5);
  };

  const handlePollChange = (idx, value) => {
    const newOptions = [...pollOptions];
    newOptions[idx] = value;
    setPollOptions(newOptions);
  };

  // Setup Remix Workflow
  const initiateRemix = (story) => {
    setRemixPost(story);
    setCurrentTab('create');
    setCreationType('camera');
  };

  // --- Create & Interactivity Logic ---
  const handleCreatePost = async () => {
    if (!user || !profile) return;
    setIsPosting(true);
    let finalImageUrl = null; let textContent = null; let bgGradient = null; let isGif = false;
    let voiceNote = null;

    if (creationType === 'camera' && capturedPhoto) finalImageUrl = capturedPhoto;
    else if (creationType === 'upload' && uploadFile) finalImageUrl = uploadFile;
    else if (creationType === 'gif' && selectedGif) { finalImageUrl = selectedGif; isGif = true; }
    else if (creationType === 'text' && textPostContent.trim() !== '') { textContent = textPostContent; bgGradient = textPostGradient; }
    else if (creationType === 'audio' && recordedAudio) { voiceNote = recordedAudio; bgGradient = textPostGradient; }
    else { setIsPosting(false); return; }

    const finalPollOptions = creationType === 'text' ? pollOptions.filter(o => o.trim() !== '') : [];
    const finalLocation = selectedLocation === 'None' ? null : selectedLocation;

    const payload = {
      authorId: user.uid, authorName: profile.username, authorEmoji: profile.emoji,
      imageUrl: finalImageUrl, textContent: textContent, bgGradient: bgGradient, voiceNote: voiceNote,
      caption: customCaption, soundtrack: selectedSoundtrack, location: finalLocation,
      isGif: isGif, createdAt: Date.now(), 
      reactions: {}, diamonds: 0, pollOptions: finalPollOptions.length > 1 ? finalPollOptions : null, votes: {}, votedBy: [],
      remixData: remixPost ? { id: remixPost.id, imageUrl: remixPost.imageUrl, authorName: remixPost.authorName } : null
    };

    try {
      if (isPostingToStories) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'fleets'), payload);
        notify("✨ Added to your 24h Story!");
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'stories'), payload);
        notify("🚀 Published to Global Feed!");
      }
      setCapturedPhoto(null); setUploadFile(null); setSelectedGif(null); setTextPostContent(''); 
      setCustomCaption(''); setSelectedSoundtrack(SOUNDTRACKS[0]); setSelectedLocation(LOCATIONS[0]);
      setIsPostingToStories(false); setPollOptions(['', '']); setRecordedAudio(null); setRemixPost(null);
      setCurrentTab('feed');
    } catch (err) { console.error("Posting error:", err); alert("Error publishing to database."); } 
    finally { setIsPosting(false); }
  };

  const handleVote = async (storyId, optionIdx) => {
    if (!user) return;
    const story = stories.find(s => s.id === storyId);
    if (!story || story.votedBy?.includes(user.uid)) return; 
    
    const newVotes = { ...(story.votes || {}) };
    newVotes[optionIdx] = (newVotes[optionIdx] || 0) + 1;
    const newVotedBy = [...(story.votedBy || []), user.uid];

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stories', storyId), { votes: newVotes, votedBy: newVotedBy });
      notify("🗳️ Vote counted!");
    } catch (err) { console.error(err); }
  };

  const sendGift = async (story, e) => {
    if (!user) return;
    triggerParticles(e, '💎', 12);
    
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stories', story.id), { diamonds: (story.diamonds || 0) + 1 });
      const profRef = doc(db, 'artifacts', appId, 'public', 'data', 'profiles', story.authorId);
      const profSnap = await getDoc(profRef);
      if (profSnap.exists()) {
        await updateDoc(profRef, { diamondsEarned: (profSnap.data().diamondsEarned || 0) + 1 });
      }
      notify(`💎 Sent a Diamond to ${story.authorName}!`);
    } catch (err) { console.error("Gifting error:", err); }
  };

  const handlePostComment = async () => {
    if (!user || !profile || !newCommentText.trim() || !activeCommentPost) return;
    const payload = { storyId: activeCommentPost.id, authorId: user.uid, authorName: profile.username, authorEmoji: profile.emoji, text: newCommentText.trim(), createdAt: Date.now() };
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'comments'), payload);
      if (activeCommentPost.authorId !== user.uid) notify(`💬 You commented on ${activeCommentPost.authorName}'s post!`);
      setNewCommentText('');
    } catch (err) { console.error(err); }
  };

  const handleSendDM = async () => {
    if (!user || !profile || !newMessageText.trim() || !activeChatUser) return;
    const textToSend = newMessageText.trim();
    const isBot = activeChatUser.id === 'asteme_ai';
    
    const payload = { senderId: user.uid, senderName: profile.username, senderEmoji: profile.emoji, receiverId: activeChatUser.id, text: textToSend, createdAt: Date.now() };
    setNewMessageText('');
    
    try { 
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), payload); 
      
      // Asteme AI Auto-Responder Logic
      if (isBot) {
        setTimeout(async () => {
          const randomReply = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
          const botPayload = { senderId: 'asteme_ai', senderName: 'Asteme AI', senderEmoji: '🤖', receiverId: user.uid, text: randomReply, createdAt: Date.now() };
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), botPayload); 
        }, 1500);
      }
    } catch (err) { console.error(err); }
  };

  const toggleReaction = async (story, emoji, e) => {
    if (!user) return;
    triggerParticles(e, emoji, 5);
    const newReactions = { ...(story.reactions || {}) };
    
    if (newReactions[user.uid] === emoji) {
      delete newReactions[user.uid]; // Toggle off
    } else {
      newReactions[user.uid] = emoji; // Set reaction
    }
    
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stories', story.id), { reactions: newReactions });
    } catch (err) { console.error(err); }
  };

  const toggleBookmark = async (storyId) => {
    if (!user) return;
    const bookmarkRef = doc(db, 'artifacts', appId, 'users', user.uid, 'bookmarks', storyId);
    try {
      if (bookmarks.includes(storyId)) { await deleteDoc(bookmarkRef); notify("Removed from saved."); }
      else { await setDoc(bookmarkRef, { savedAt: Date.now() }); notify("🔖 Post saved to your profile!"); }
    } catch (err) { console.error(err); }
  };

  const toggleAudio = (post) => {
    if (!AUDIO_MAP[post.soundtrack]) return;
    if (currentAudio.postId === post.id) { 
      audioRef.current?.pause(); setCurrentAudio({ url: null, postId: null }); 
    } else { 
      setCurrentAudio({ url: AUDIO_MAP[post.soundtrack], postId: post.id }); 
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(err => {
            console.error("Audio playback error:", err); notify("⚠️ Soundtrack failed to load or was blocked."); setCurrentAudio({ url: null, postId: null });
          });
        }
      }, 50); 
    }
  };

  const toggleFriend = async (targetId) => {
    if (!user || targetId === user.uid) return;
    try {
      const friendRef = doc(db, 'artifacts', appId, 'users', user.uid, 'friends', targetId);
      if (friends.includes(targetId)) await deleteDoc(friendRef); else await setDoc(friendRef, { addedAt: Date.now() });
    } catch (err) { console.error(err); }
  };

  const shareToClipboard = (textToShare) => {
    navigator.clipboard.writeText(`${window.location.href}#${textToShare}`).then(() => notify("🔗 Link copied to clipboard!"));
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid), { emoji: editEmoji, bio: editBio.trim() }); } 
    catch (err) { console.error(err); } finally { setIsUpdatingProfile(false); notify("Profile Updated!"); }
  };

  const deleteStory = async (storyId, isFleet = false) => {
    if (!user) return;
    const colName = isFleet ? 'fleets' : 'stories';
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', colName, storyId)); notify("Deleted."); } catch (err) { console.error(err); }
  };

  const renderCaptionWithTags = (text) => {
    if (!text) return null;
    const parts = text.split(/(#\w+|@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) return <span key={i} onClick={(e) => { e.stopPropagation(); setSearchQuery(part); setCurrentTab('feed'); }} className="text-blue-400 font-semibold cursor-pointer hover:underline">{part}</span>;
      if (part.startsWith('@')) return <span key={i} onClick={(e) => { e.stopPropagation(); setSearchQuery(part.substring(1)); setCurrentTab('feed'); }} className="text-pink-400 font-semibold cursor-pointer hover:underline">{part}</span>;
      return part;
    });
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

  // Insert AI Bot into friend list dynamically
  const displayFriends = [ASTEME_AI, ...allProfiles.filter(p => friends.includes(p.id))];

  // --- Auth Screen Render ---
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

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white font-sans flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-900/20 via-transparent to-transparent pointer-events-none z-0" />
        <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] mb-4">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-wider text-blue-400">ASTEME SOCIAL</h1>
            <p className="text-xs font-bold text-neutral-500 mt-2 uppercase tracking-widest">Connect with the world</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {!isLoginMode && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Unique Handle</label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input type="text" placeholder="username" value={authUsername} onChange={(e) => setAuthUsername(e.target.value.toLowerCase())} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input type="email" placeholder="you@email.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input type="password" placeholder="••••••••" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs font-bold p-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{authError}</p>
              </div>
            )}

            <button type="submit" disabled={isAuthLoading} className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-sm font-bold text-white rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {isAuthLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isLoginMode ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); }} className="text-xs font-bold text-neutral-400 hover:text-white transition-colors">
              {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const iAmVIP = isVIP(profile?.username);

  // --- Main App Render ---
  return (
    <div className="h-screen bg-neutral-950 text-white font-sans flex flex-col md:flex-row overflow-hidden relative selection:bg-blue-500/30">
      <audio ref={audioRef} src={currentAudio.url || ''} onEnded={() => setCurrentAudio({ url: null, postId: null })} loop />
      <ParticleBurst particles={particles} />

      {/* ===== SIDEBAR NAVIGATION ===== */}
      <nav className="hidden md:flex flex-col w-64 bg-neutral-900 border-r border-neutral-800 p-4 shrink-0 z-20">
        <div className="flex items-center gap-2 mb-8 px-2 mt-2">
          <Camera className={`w-8 h-8 ${iAmVIP ? 'text-yellow-400' : 'text-blue-500'}`} />
          <span className={`font-black text-xl tracking-wider ${iAmVIP ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 bg-clip-text text-transparent' : 'text-blue-400'}`}>ASTEME SOCIAL</span>
        </div>

        {profile && (
          <div className={`bg-neutral-950 border p-3 rounded-2xl flex items-center gap-3 mb-6 shadow-inner ${iAmVIP ? 'border-yellow-500/30 shadow-[0_0_15px_rgba(250,204,21,0.1)]' : 'border-neutral-800'}`}>
            <span className={`text-3xl bg-neutral-900 p-1.5 rounded-xl border ${iAmVIP ? 'border-yellow-500/50' : 'border-neutral-800'}`}>{profile.emoji}</span>
            <div className="overflow-hidden">
              <h4 className="font-bold text-xs text-neutral-200 truncate flex items-center gap-1">
                {profile.username} 
                {iAmVIP ? <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> : (profile.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />)}
              </h4>
              <p className="text-[10px] text-neutral-500 truncate">{profile.bio || 'No bio yet.'}</p>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <button onClick={() => setCurrentTab('feed')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentTab === 'feed' ? (iAmVIP ? 'bg-yellow-600 text-black shadow-lg shadow-yellow-600/25' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25') : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}>
            <Home className="w-5 h-5" /> Home Feed
          </button>
          <button onClick={() => setCurrentTab('shorts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentTab === 'shorts' ? (iAmVIP ? 'bg-yellow-600 text-black shadow-lg shadow-yellow-600/25' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25') : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}>
            <Video className="w-5 h-5" /> Asteme Shorts
          </button>
          <button onClick={() => setCurrentTab('explore')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentTab === 'explore' ? (iAmVIP ? 'bg-yellow-600 text-black shadow-lg shadow-yellow-600/25' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25') : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}>
            <Compass className="w-5 h-5" /> Explore Grid
          </button>
          <button onClick={() => { setCurrentTab('create'); setRemixPost(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentTab === 'create' ? (iAmVIP ? 'bg-yellow-600 text-black shadow-lg shadow-yellow-600/25' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25') : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}>
            <PlusCircle className="w-5 h-5" /> Post Studio
          </button>
          <button onClick={() => { setCurrentTab('inbox'); markNotifsRead(); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentTab === 'inbox' ? (iAmVIP ? 'bg-yellow-600 text-black shadow-lg shadow-yellow-600/25' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25') : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}>
            <div className="flex items-center gap-3"><Bell className="w-5 h-5" /> Inbox Hub</div>
            {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{unreadCount}</span>}
          </button>
          <button onClick={() => { setCurrentTab('profile'); setProfileSubTab('posts'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentTab === 'profile' ? (iAmVIP ? 'bg-yellow-600 text-black shadow-lg shadow-yellow-600/25' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25') : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}>
            <User className="w-5 h-5" /> Profile Center
          </button>
        </div>
      </nav>

      {/* ===== CENTRAL CONTENT DISPLAY ===== */}
      <div className="flex-1 flex flex-col overflow-hidden bg-black/95 relative">
        
        {/* Mobile Header */}
        {currentTab !== 'shorts' && (
          <div className="md:hidden flex justify-between items-center px-4 py-3 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 shrink-0 z-30 sticky top-0">
            <div className="flex items-center gap-1.5">
              <Camera className={`w-6 h-6 ${iAmVIP ? 'text-yellow-400' : 'text-blue-500'}`} />
              <span className={`font-black text-sm tracking-widest ${iAmVIP ? 'text-yellow-400' : 'text-blue-400'}`}>ASTEME SOCIAL</span>
            </div>
            <button onClick={() => { setCurrentTab('inbox'); markNotifsRead(); }} className="relative text-neutral-300">
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 w-3.5 h-3.5 rounded-full border-2 border-neutral-900"></span>}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          
          {/* TAB 1: HOME FEED */}
          {currentTab === 'feed' && (
            <div className="max-w-xl mx-auto p-4 space-y-6 pb-24 md:pb-6">
              
              <div className="flex justify-between items-center bg-neutral-900/60 p-2 rounded-xl border border-neutral-800 backdrop-blur-sm">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input type="text" placeholder="Search @users, tags..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent border-none pl-9 pr-4 py-2 text-sm focus:outline-none text-neutral-200" />
                  {searchQuery && <button onClick={()=>setSearchQuery('')} className="absolute right-2 top-2.5 text-neutral-500"><X className="w-4 h-4"/></button>}
                </div>
                <div className="flex bg-neutral-950 rounded-lg p-1 ml-2 border border-neutral-800">
                  <button onClick={() => setFeedFilter('all')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-colors ${feedFilter === 'all' ? (iAmVIP ? 'bg-yellow-600 text-black shadow-sm' : 'bg-neutral-800 text-white shadow-sm') : 'text-neutral-500'}`}>Global</button>
                  <button onClick={() => setFeedFilter('friends')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-colors ${feedFilter === 'friends' ? (iAmVIP ? 'bg-yellow-600 text-black shadow-sm' : 'bg-neutral-800 text-white shadow-sm') : 'text-neutral-500'}`}>Friends</button>
                </div>
              </div>

              {/* 24-HOUR STORIES (FLEETS) HORIZONTAL BAR */}
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide items-center">
                <button onClick={() => { setCurrentTab('create'); setIsPostingToStories(true); }} className="flex flex-col items-center gap-1.5 min-w-[72px] shrink-0 group">
                  <div className={`w-16 h-16 rounded-full border-2 border-dashed bg-neutral-900 flex items-center justify-center transition-colors relative ${iAmVIP ? 'border-yellow-600/50 group-hover:border-yellow-400' : 'border-neutral-600 group-hover:border-blue-500 group-hover:bg-neutral-800'}`}>
                    <PlusCircle className={`w-6 h-6 ${iAmVIP ? 'text-yellow-500' : 'text-neutral-400 group-hover:text-blue-400'}`}/>
                    <div className={`absolute -bottom-1 -right-1 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] shadow-sm border border-neutral-900 ${iAmVIP ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'}`}>+</div>
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400">Add Story</span>
                </button>

                {Array.from(new Set(fleets.map(f => f.authorId))).map(authorId => {
                  const userFleets = fleets.filter(f => f.authorId === authorId);
                  const latest = userFleets[0];
                  if (!latest) return null;
                  const isMine = authorId === user?.uid;
                  const authorIsVIP = isVIP(latest.authorName);
                  
                  return (
                    <button key={authorId} onClick={() => setActiveStoryView(userFleets)} className="flex flex-col items-center gap-1.5 min-w-[72px] shrink-0 group">
                      <div className={`w-16 h-16 rounded-full p-[2px] group-hover:scale-105 transition-transform ${authorIsVIP ? 'bg-gradient-to-tr from-yellow-300 via-amber-500 to-yellow-600 animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500'}`}>
                        <div className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center text-3xl overflow-hidden border-2 border-neutral-900">
                          {latest.imageUrl ? <img src={latest.imageUrl} className="w-full h-full object-cover"/> : latest.authorEmoji}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold truncate w-16 text-center ${authorIsVIP ? 'text-yellow-400' : 'text-neutral-200'}`}>
                        {isMine ? 'You' : latest.authorName} {authorIsVIP && '👑'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* MAIN POST FEED */}
              {filteredStories.length === 0 ? (
                <div className="py-20 text-center opacity-40">
                  <Smile className="w-16 h-16 mx-auto mb-4 text-neutral-600" />
                  <p className="text-sm font-medium">No posts found. Change your filter or start creating!</p>
                </div>
              ) : (
                filteredStories.map((story) => {
                  const isMine = story.authorId === user?.uid;
                  const isFriend = friends.includes(story.authorId);
                  const isBookmarked = bookmarks.includes(story.id);
                  const postComments = comments.filter(c => c.storyId === story.id);
                  const profileData = allProfiles.find(p => p.id === story.authorId) || {};
                  const isPlaying = currentAudio.postId === story.id;
                  
                  const reactionsArray = story.reactions ? Object.values(story.reactions) : [];
                  const isTrending = reactionsArray.length >= 3;
                  const myReaction = story.reactions?.[user?.uid];
                  const authorIsVIP = isVIP(story.authorName);
                  
                  return (
                    <article key={story.id} className={`bg-neutral-900 border rounded-3xl overflow-hidden transition-all duration-300 ${isPlaying ? 'border-blue-500 shadow-xl shadow-blue-500/20' : 'border-neutral-800/80'} ${authorIsVIP ? 'shadow-[0_0_20px_rgba(250,204,21,0.1)] border-yellow-900/30' : ''}`}>
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-xl shadow-lg ${authorIsVIP ? 'bg-gradient-to-tr from-yellow-300 via-amber-500 to-yellow-600 animate-pulse border-yellow-200' : 'bg-neutral-950 border-neutral-800'}`}>
                            {story.authorEmoji}
                          </div>
                          <div>
                            <div className="font-bold text-sm flex items-center gap-1.5 text-neutral-100">
                              {story.authorName} 
                              {authorIsVIP ? <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" /> : (profileData.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />)}
                              {isMine && <span className="text-[9px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-bold tracking-wide">YOU</span>}
                            </div>
                            <div className="text-[10px] text-neutral-500 flex items-center gap-2 mt-0.5">
                              {timeAgo(story.createdAt)}
                              {isTrending && <span className="flex items-center gap-1 text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse"><Flame className="w-3 h-3" /> Trending</span>}
                            </div>
                            {story.location && (
                              <div className="text-[9px] mt-1 text-blue-300 font-semibold tracking-wider flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {story.location}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!isMine && (
                            <button onClick={() => toggleFriend(story.authorId)} className={`p-2 rounded-full transition-colors ${isFriend ? 'bg-blue-500/10 text-blue-400' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>
                              {isFriend ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                            </button>
                          )}
                          {(isMine || iAmVIP) && (
                            <button onClick={() => deleteStory(story.id)} className="p-2 text-neutral-500 hover:text-red-400 transition-colors bg-neutral-950 rounded-full">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="w-full relative bg-black aspect-[4/5] flex items-center justify-center overflow-hidden">
                        {/* Split Screen Logic for Duets / Remixes */}
                        {story.remixData ? (
                           <div className="flex w-full h-full">
                              <div className="w-1/2 h-full border-r border-neutral-800 relative">
                                 {story.remixData.imageUrl && <img src={story.remixData.imageUrl} className="w-full h-full object-cover" />}
                                 <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm">@{story.remixData.authorName}</span>
                              </div>
                              <div className="w-1/2 h-full relative">
                                 {story.imageUrl && <img src={story.imageUrl} className="w-full h-full object-cover" />}
                              </div>
                           </div>
                        ) : story.imageUrl ? (
                          <img src={story.imageUrl} alt="Uploaded Post" className="w-full h-full object-cover" />
                        ) : story.voiceNote ? (
                          <div className={`w-full h-full bg-gradient-to-br ${story.bgGradient} flex flex-col items-center justify-center p-8`}>
                            <Mic className="w-16 h-16 text-white mb-6 animate-pulse drop-shadow-xl" />
                            <audio controls src={story.voiceNote} className="w-full max-w-[200px]" />
                          </div>
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${story.bgGradient} p-8 flex flex-col items-center justify-center text-center`}>
                            <p className="text-2xl md:text-3xl font-extrabold tracking-wide text-white drop-shadow-xl mb-4">{renderCaptionWithTags(story.textContent)}</p>
                            
                            {/* Poll Rendering */}
                            {story.pollOptions && story.pollOptions.length > 0 && (
                              <div className="w-full space-y-2 max-w-sm">
                                {story.pollOptions.map((opt, idx) => {
                                  const votesForOpt = story.votes?.[idx] || 0;
                                  const totalVotes = story.votes ? Object.values(story.votes).reduce((a,b)=>a+b, 0) : 0;
                                  const pct = totalVotes ? Math.round((votesForOpt/totalVotes)*100) : 0;
                                  const hasVoted = story.votedBy?.includes(user?.uid);
                                  
                                  return (
                                    <button key={idx} onClick={(e) => { e.stopPropagation(); handleVote(story.id, idx); }} disabled={hasVoted} className="w-full relative bg-black/40 border border-white/20 rounded-xl p-3 text-left overflow-hidden hover:border-blue-400 transition-colors group disabled:cursor-default">
                                      <div className="absolute inset-y-0 left-0 bg-blue-500/40 transition-all duration-1000 ease-out" style={{width: `${hasVoted ? pct : 0}%`}} />
                                      <div className="relative flex justify-between items-center text-white text-sm font-bold z-10">
                                        <span>{opt}</span>
                                        {hasVoted && <span>{pct}%</span>}
                                      </div>
                                    </button>
                                  )
                                })}
                                <p className="text-[10px] text-white/60 font-bold uppercase pt-2">{story.votedBy?.length || 0} Votes</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Audio Player Overlay */}
                        {story.soundtrack && story.soundtrack !== 'None' && AUDIO_MAP[story.soundtrack] && (
                          <button 
                            onClick={() => toggleAudio(story)}
                            className={`absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-full border transition-all ${isPlaying ? 'border-blue-400 scale-110 shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 'border-white/20 hover:scale-105'}`}
                          >
                            <div className="relative flex items-center justify-center w-8 h-8">
                              <Disc className={`absolute inset-0 w-full h-full text-white ${isPlaying ? 'animate-[spin_2s_linear_infinite]' : ''}`} />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                                {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
                              </div>
                            </div>
                          </button>
                        )}
                      </div>

                      <div className="p-4 bg-neutral-900">
                        {story.soundtrack && story.soundtrack !== 'None' && (
                          <div className={`flex items-center gap-2 mb-3 text-xs font-bold ${isPlaying ? 'text-blue-400' : 'text-neutral-400'}`}>
                            <Music className="w-3.5 h-3.5" /> 
                            {isPlaying ? <span className="animate-pulse">Now Playing: {story.soundtrack}</span> : <span>{story.soundtrack}</span>}
                          </div>
                        )}

                        <div className="flex justify-between mb-3 relative items-center">
                          <div className="flex gap-3">
                            
                            {/* NEW: Reaction Bar */}
                            <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-full px-2 py-1">
                               <button onClick={(e) => toggleReaction(story, '❤️', e)} className={`text-sm hover:scale-125 transition-transform ${myReaction === '❤️' ? 'opacity-100 scale-110' : 'opacity-60 grayscale'}`}>❤️</button>
                               <button onClick={(e) => toggleReaction(story, '😂', e)} className={`text-sm hover:scale-125 transition-transform ${myReaction === '😂' ? 'opacity-100 scale-110' : 'opacity-60 grayscale'}`}>😂</button>
                               <button onClick={(e) => toggleReaction(story, '🔥', e)} className={`text-sm hover:scale-125 transition-transform ${myReaction === '🔥' ? 'opacity-100 scale-110' : 'opacity-60 grayscale'}`}>🔥</button>
                               <span className="text-xs font-bold text-neutral-400 pl-1">{reactionsArray.length}</span>
                            </div>

                            <button onClick={() => setActiveCommentPost(story)} className="flex items-center gap-1.5 text-sm font-bold text-neutral-300 hover:text-white transition-transform hover:scale-110">
                              <MessageCircle className="w-6 h-6" /> {postComments.length}
                            </button>
                            <button onClick={(e) => sendGift(story, e)} className="flex items-center gap-1.5 text-sm font-bold text-neutral-300 hover:text-cyan-400 transition-transform hover:scale-110">
                              <Gem className={`w-6 h-6 ${story.diamonds > 0 ? 'fill-cyan-500 text-cyan-400' : ''}`} /> {story.diamonds || 0}
                            </button>
                            
                            {/* Remix Button */}
                            {story.imageUrl && (
                              <button onClick={() => initiateRemix(story)} className="flex items-center gap-1.5 text-sm font-bold text-neutral-300 hover:text-purple-400 transition-transform hover:scale-110" title="Remix this Post">
                                <SplitSquareHorizontal className="w-5 h-5" />
                              </button>
                            )}

                            <button onClick={() => shareToClipboard(story.id)} className="flex items-center gap-1.5 text-sm font-bold text-neutral-300 hover:text-white transition-transform hover:scale-110">
                              <Share className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <button onClick={() => toggleBookmark(story.id)} className={`transition-transform hover:scale-110 ${isBookmarked ? 'text-yellow-500' : 'text-neutral-400 hover:text-white'}`}>
                             <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-yellow-500' : ''}`} />
                          </button>
                        </div>

                        {story.caption && (
                          <div className="text-xs text-neutral-200">
                            <span className="font-bold mr-2">{story.authorName}</span>{renderCaptionWithTags(story.caption)}
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          )}

          {/* TAB: ASTEME SHORTS */}
          {currentTab === 'shorts' && (
            <div className="h-full w-full max-w-md mx-auto snap-y snap-mandatory overflow-y-scroll scrollbar-hide pb-16 md:pb-0 bg-black">
              {stories.filter(s => s.imageUrl && !s.remixData).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-4">
                  <Video className="w-16 h-16 opacity-30" />
                  <p className="font-bold">No Shorts Available</p>
                </div>
              ) : (
                stories.filter(s => s.imageUrl && !s.remixData).map((story, i) => {
                  const reactionsArray = story.reactions ? Object.values(story.reactions) : [];
                  const isBookmarked = bookmarks.includes(story.id);
                  const profileData = allProfiles.find(p => p.id === story.authorId) || {};
                  const authorIsVIP = isVIP(story.authorName);
                  const isMine = story.authorId === user?.uid;
                  
                  return (
                    <div key={`short-${story.id}`} className="h-full w-full snap-start relative flex items-center justify-center bg-neutral-950 border-b border-neutral-900">
                      
                      <img src={story.imageUrl} className="absolute inset-0 w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />
                      
                      <div className="absolute right-4 bottom-28 md:bottom-20 flex flex-col gap-6 items-center z-10">
                        <button onClick={(e) => toggleReaction(story, '❤️', e)} className="flex flex-col items-center gap-1 group">
                          <div className="bg-black/40 p-3 rounded-full backdrop-blur-md group-hover:scale-110 transition-transform">
                            <Heart className={`w-7 h-7 ${story.reactions?.[user?.uid] ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
                          </div>
                          <span className="text-white text-xs font-bold drop-shadow-md">{reactionsArray.length}</span>
                        </button>
                        
                        <button onClick={() => setActiveCommentPost(story)} className="flex flex-col items-center gap-1 group">
                          <div className="bg-black/40 p-3 rounded-full backdrop-blur-md group-hover:scale-110 transition-transform">
                            <MessageCircle className="w-7 h-7 text-white" />
                          </div>
                          <span className="text-white text-xs font-bold drop-shadow-md">{comments.filter(c => c.storyId === story.id).length}</span>
                        </button>

                        <button onClick={(e) => sendGift(story, e)} className="flex flex-col items-center gap-1 group">
                          <div className="bg-black/40 p-3 rounded-full backdrop-blur-md group-hover:scale-110 transition-transform">
                            <Gem className={`w-7 h-7 ${story.diamonds > 0 ? 'text-cyan-400 fill-cyan-500' : 'text-white'}`} />
                          </div>
                          <span className="text-white text-xs font-bold drop-shadow-md">{story.diamonds || 0}</span>
                        </button>

                        <button onClick={() => shareToClipboard(story.id)} className="flex flex-col items-center gap-1 group">
                          <div className="bg-black/40 p-3 rounded-full backdrop-blur-md group-hover:scale-110 transition-transform">
                            <Share className="w-7 h-7 text-white" />
                          </div>
                          <span className="text-white text-xs font-bold drop-shadow-md">Share</span>
                        </button>
                        
                        {(isMine || iAmVIP) && (
                          <button onClick={() => deleteStory(story.id)} className="flex flex-col items-center gap-1 group mt-2">
                            <div className="bg-red-500/80 p-3 rounded-full backdrop-blur-md group-hover:scale-110 transition-transform shadow-lg shadow-red-500/20">
                              <Trash2 className="w-7 h-7 text-white" />
                            </div>
                            <span className="text-red-200 text-xs font-bold drop-shadow-md">Delete</span>
                          </button>
                        )}
                      </div>

                      <div className="absolute bottom-20 md:bottom-12 left-4 right-20 text-white z-10 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-xl shadow-lg ${authorIsVIP ? 'bg-gradient-to-tr from-yellow-300 via-amber-500 to-yellow-600 animate-pulse border-yellow-200' : 'bg-neutral-900 border-white/20'}`}>
                            {story.authorEmoji}
                          </div>
                          <h3 className={`font-bold text-base flex items-center gap-1.5 drop-shadow-lg ${authorIsVIP ? 'text-yellow-400' : 'text-white'}`}>
                            @{story.authorName} {authorIsVIP ? <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400" /> : (profileData.isVerified && <BadgeCheck className="w-4 h-4 text-blue-400" />)}
                          </h3>
                        </div>
                        {story.caption && (
                          <p className="text-sm font-medium drop-shadow-lg leading-snug line-clamp-2">
                            {renderCaptionWithTags(story.caption)}
                          </p>
                        )}
                        {story.soundtrack && story.soundtrack !== 'None' && (
                          <button onClick={() => toggleAudio(story)} className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold w-max border border-white/10 hover:bg-black/60 transition-colors">
                            <Music className="w-3.5 h-3.5" /> 
                            <span className="marquee-text max-w-[150px] truncate">{story.soundtrack}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 2: EXPLORE (GRID) */}
          {currentTab === 'explore' && (
            <div className="p-2 md:p-6 pb-24 md:pb-6">
              <h2 className={`text-xl font-extrabold tracking-wide mb-4 px-2 ${iAmVIP ? 'text-yellow-500' : 'text-blue-400'}`}>EXPLORE WORLD</h2>
              <div className="grid grid-cols-3 gap-1 md:gap-3">
                {stories.filter(s => s.imageUrl).length === 0 ? (
                  <div className="col-span-3 text-center py-20 text-neutral-500 text-sm">No visual posts to explore yet!</div>
                ) : (
                  stories.filter(s => s.imageUrl).map(story => (
                    <div key={`exp-${story.id}`} onClick={() => setFocusedExplorePost(story)} className="aspect-[3/4] relative group cursor-pointer overflow-hidden rounded-md md:rounded-xl bg-neutral-900 border border-neutral-800">
                      <img src={story.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <Heart className="w-6 h-6 text-white fill-white" />
                        <span className="text-white font-bold text-xs">{story.reactions ? Object.keys(story.reactions).length : 0}</span>
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
              <div className="flex justify-between items-center">
                <h2 className={`text-xl font-extrabold tracking-wide flex items-center gap-2 ${iAmVIP ? 'text-yellow-500' : 'text-blue-400'}`}>
                  CREATIVE STUDIO
                  {remixPost && <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-0.5 rounded-full border border-purple-500/30">REMIX MODE</span>}
                </h2>
                
                {!remixPost && (
                  <button 
                    onClick={() => setIsPostingToStories(!isPostingToStories)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${isPostingToStories ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-neutral-700 bg-neutral-800 text-neutral-400'}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> {isPostingToStories ? 'Posting to 24h Story' : 'Posting to Feed'}
                  </button>
                )}
                {remixPost && (
                  <button onClick={() => setRemixPost(null)} className="text-xs text-red-400 hover:underline">Cancel Remix</button>
                )}
              </div>
              
              <div className="grid grid-cols-5 gap-1.5 bg-neutral-900 p-1.5 rounded-xl border border-neutral-800">
                <button onClick={() => setCreationType('camera')} className={`py-2 text-[10px] font-bold rounded-lg transition-all ${creationType === 'camera' ? (iAmVIP ? 'bg-yellow-600 text-black' : 'bg-blue-500 text-white') : 'text-neutral-400'}`}>Camera</button>
                <button onClick={() => setCreationType('audio')} className={`py-2 text-[10px] font-bold rounded-lg transition-all flex justify-center items-center gap-1 ${creationType === 'audio' ? (iAmVIP ? 'bg-yellow-600 text-black' : 'bg-blue-500 text-white') : 'text-neutral-400'}`}><Mic className="w-3 h-3"/> Voice</button>
                <button onClick={() => {setCreationType('text'); setPollOptions(['', ''])}} className={`py-2 text-[10px] font-bold rounded-lg transition-all ${creationType === 'text' ? (iAmVIP ? 'bg-yellow-600 text-black' : 'bg-blue-500 text-white') : 'text-neutral-400'}`}>Text</button>
                <button onClick={() => setCreationType('upload')} className={`py-2 text-[10px] font-bold rounded-lg transition-all ${creationType === 'upload' ? (iAmVIP ? 'bg-yellow-600 text-black' : 'bg-blue-500 text-white') : 'text-neutral-400'}`}>Upload</button>
                <button onClick={() => setCreationType('gif')} className={`py-2 text-[10px] font-bold rounded-lg transition-all ${creationType === 'gif' ? (iAmVIP ? 'bg-yellow-600 text-black' : 'bg-blue-500 text-white') : 'text-neutral-400'}`}>GIFs</button>
              </div>

              {/* Remix Preview Header */}
              {remixPost && creationType === 'camera' && (
                <div className="flex items-center gap-3 bg-neutral-900 p-2 rounded-xl border border-neutral-800 mb-2">
                   <img src={remixPost.imageUrl} className="w-12 h-12 rounded object-cover" />
                   <div className="text-xs text-neutral-300">Duetting with <b>@{remixPost.authorName}</b>. This will appear side-by-side!</div>
                </div>
              )}

              {/* CAMERA STUDIO */}
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

              {/* VOICE STUDIO */}
              {creationType === 'audio' && (
                <div className="space-y-4">
                  <div className={`aspect-[4/5] rounded-3xl bg-gradient-to-br ${textPostGradient} p-8 flex flex-col items-center justify-center relative border border-neutral-800 shadow-2xl`}>
                    {!recordedAudio ? (
                      <div className="flex flex-col items-center">
                         <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all ${isRecordingAudio ? 'bg-red-500 animate-pulse scale-110' : 'bg-black/40 border-4 border-white/20'}`}>
                            <Mic className={`w-12 h-12 ${isRecordingAudio ? 'text-white' : 'text-white/60'}`} />
                         </div>
                         <div className="mt-8">
                           {isRecordingAudio ? (
                             <button onClick={stopAudioRecording} className="px-6 py-2 bg-white text-black font-bold rounded-full flex items-center gap-2 shadow-lg"><Square className="w-4 h-4 fill-black"/> Stop Recording</button>
                           ) : (
                             <button onClick={startAudioRecording} className="px-6 py-2 bg-red-500 text-white font-bold rounded-full flex items-center gap-2 shadow-lg shadow-red-500/30">Start Recording</button>
                           )}
                         </div>
                         <p className="mt-4 text-xs text-white/50 font-bold uppercase tracking-widest">Max 15 Seconds</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full">
                         <Mic className="w-16 h-16 text-white mb-6 drop-shadow-xl" />
                         <audio controls src={recordedAudio} className="w-full max-w-[250px]" />
                         <button onClick={() => setRecordedAudio(null)} className="mt-6 text-xs font-bold text-red-200 hover:text-white underline">Discard & Record Again</button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-center p-2 bg-neutral-900 rounded-2xl border border-neutral-800">
                    {GRADIENTS.map(grad => <button key={grad} onClick={() => setTextPostGradient(grad)} className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} border-2 ${textPostGradient === grad ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`} />)}
                  </div>
                </div>
              )}

              {/* TEXT STUDIO */}
              {creationType === 'text' && (
                <div className="space-y-4">
                  <div className={`aspect-[4/5] rounded-3xl bg-gradient-to-br ${textPostGradient} p-8 flex flex-col items-center justify-center relative border border-neutral-800 shadow-2xl`}>
                    <textarea placeholder="Type something bold..." value={textPostContent} onChange={(e) => setTextPostContent(e.target.value)} maxLength={180} className="w-full bg-transparent border-none text-center font-black text-2xl md:text-4xl text-white placeholder-white/50 focus:outline-none resize-none overflow-hidden drop-shadow-xl mb-6" />
                    
                    <div className="w-full space-y-2">
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <PieChart className="w-4 h-4 text-white/50" />
                          <input type="text" placeholder={`Poll Option ${idx + 1}`} value={opt} onChange={(e) => handlePollChange(idx, e.target.value)} className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors" />
                        </div>
                      ))}
                    </div>
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
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5"><Type className="w-3.5 h-3.5"/> Caption & Tags</label>
                  <div className="relative">
                    <input type="text" placeholder="Write a description, @mention friends, or use #hashtags..." value={customCaption} onChange={(e) => setCustomCaption(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-4 pr-12 py-3 text-xs focus:outline-none focus:border-blue-500 text-white" />
                    <button type="button" onClick={generateMagicCaption} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-neutral-900 hover:bg-neutral-800 text-blue-400 rounded-lg transition-colors" title="Magic Auto-Caption">
                      <Wand2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5"><Music className="w-3.5 h-3.5"/> Soundtrack</label>
                    <select value={selectedSoundtrack} onChange={(e) => setSelectedSoundtrack(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500 text-white appearance-none">
                      {SOUNDTRACKS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Location Tag</label>
                    <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500 text-white appearance-none">
                      {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button onClick={handleCreatePost} disabled={isPosting || (creationType==='camera'&&!capturedPhoto) || (creationType==='upload'&&!uploadFile) || (creationType==='gif'&&!selectedGif) || (creationType==='text'&&!textPostContent) || (creationType==='audio'&&!recordedAudio)} className={`w-full py-4 text-sm font-bold text-white rounded-2xl flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 transition-all ${isPostingToStories ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/20' : (iAmVIP ? 'bg-gradient-to-r from-yellow-500 to-yellow-700 shadow-yellow-600/20 hover:brightness-110 text-black' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20 hover:brightness-110')}`}>
                {isPosting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />} Publish {remixPost ? 'Duet' : (isPostingToStories ? 'to 24h Story' : 'to World')}
              </button>
            </div>
          )}

          {/* TAB 4: COMBINED INBOX & NOTIFICATIONS */}
          {currentTab === 'inbox' && (
            <div className="max-w-4xl mx-auto p-4 flex flex-col h-[80vh] md:h-[90vh]">
              <h2 className={`text-xl font-extrabold tracking-wide mb-4 hidden md:block ${iAmVIP ? 'text-yellow-500' : 'text-blue-400'}`}>INBOX HUB</h2>
              
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
                      {displayFriends.map(friend => (
                        <button key={friend.id} onClick={() => setActiveChatUser(friend)} className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${activeChatUser?.id === friend.id ? 'bg-blue-500/15 border border-blue-500/30' : 'hover:bg-neutral-800/60 border border-transparent'}`}>
                          <span className="text-2xl bg-neutral-950 p-1 rounded-lg">{friend.emoji}</span>
                          <div className="text-left overflow-hidden">
                             <span className="text-xs font-bold truncate text-neutral-200 block">{friend.username} {isVIP(friend.username) && '👑'}</span>
                             {friend.id === 'asteme_ai' && <span className="text-[9px] text-blue-400 uppercase tracking-widest font-bold">Always Online</span>}
                          </div>
                        </button>
                      ))}
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
                              {activeChatUser.id === 'asteme_ai' ? <Bot className="w-10 h-10 mb-2 text-blue-400" /> : <MessageSquare className="w-10 h-10 mb-2 text-blue-400" />}
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
                          <div ref={chatEndRef} />
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

          {/* TAB 5: PROFILE, SAVED POSTS, AND ANALYTICS */}
          {currentTab === 'profile' && profile && (
            <div className="max-w-xl mx-auto p-4 space-y-6 pb-24 md:pb-6">
              <h2 className={`text-xl font-extrabold tracking-wide ${iAmVIP ? 'text-yellow-500' : 'text-blue-400'}`}>YOUR ACCOUNT</h2>
              
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Award className={`w-32 h-32 ${iAmVIP ? 'text-yellow-400' : 'text-blue-500'}`} /></div>
                
                <div className="space-y-3 mb-6 relative z-10">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Avatar Sticker</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {EMOJIS.map(e => <button key={e} type="button" onClick={() => setEditEmoji(e)} className={`text-3xl p-2 rounded-2xl transition-all ${editEmoji === e ? 'bg-blue-500/20 border-2 border-blue-500 scale-105 shadow-md shadow-blue-500/20' : 'bg-neutral-950 border-2 border-transparent hover:bg-neutral-800'}`}>{e}</button>)}
                  </div>
                </div>

                <div className="space-y-5 relative z-10">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Display Name (Locked)</label>
                    <div className="relative">
                      <input type="text" value={profile.username} disabled className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none text-neutral-500 font-bold cursor-not-allowed" />
                      <Lock className="w-4 h-4 text-neutral-600 absolute right-4 top-3.5" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Public Bio</label>
                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} maxLength={100} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white resize-none h-20" />
                  </div>
                </div>

                <button onClick={handleUpdateProfile} disabled={isUpdatingProfile} className="w-full mt-6 py-3.5 bg-white text-black text-xs font-black rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-lg relative z-10">
                  <Check className="w-4 h-4" /> Save Profile Details
                </button>

                <button onClick={handleLogout} className="w-full mt-4 py-3.5 bg-red-600/20 text-red-500 hover:bg-red-600/30 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 relative z-10">
                  <LogOut className="w-4 h-4" /> Sign Out securely
                </button>
              </div>

              {/* Profile Sub-tabs */}
              <div className="pt-4 space-y-4">
                <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1.5">
                  <button onClick={() => setProfileSubTab('posts')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${profileSubTab === 'posts' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500'}`}>
                    <ImageIcon className="w-3.5 h-3.5" /> Posts
                  </button>
                  <button onClick={() => setProfileSubTab('saved')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${profileSubTab === 'saved' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500'}`}>
                    <Bookmark className="w-3.5 h-3.5" /> Saved
                  </button>
                  <button onClick={() => setProfileSubTab('analytics')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${profileSubTab === 'analytics' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500'}`}>
                    <BarChart2 className="w-3.5 h-3.5" /> Analytics
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Posts View */}
                  {profileSubTab === 'posts' && (
                    stories.filter(s => s.authorId === user?.uid).length === 0 ? <p className="col-span-2 text-xs text-neutral-600 p-4 text-center bg-neutral-900 rounded-xl">No posts published yet.</p> : 
                      stories.filter(s => s.authorId === user?.uid).map(story => (
                      <div key={story.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden aspect-[4/5] relative group shadow-lg">
                        {story.remixData ? (
                            <div className="flex w-full h-full">
                               <div className="w-1/2 h-full"><img src={story.remixData.imageUrl} className="w-full h-full object-cover"/></div>
                               <div className="w-1/2 h-full border-l border-neutral-800"><img src={story.imageUrl} className="w-full h-full object-cover"/></div>
                            </div>
                        ) : story.imageUrl ? <img src={story.imageUrl} alt="My post" className="w-full h-full object-cover" /> 
                        : story.voiceNote ? <div className={`w-full h-full bg-gradient-to-br ${story.bgGradient} flex items-center justify-center`}><Mic className="w-8 h-8 text-white opacity-50"/></div>
                        : <div className={`w-full h-full bg-gradient-to-br ${story.bgGradient} p-4 flex items-center justify-center text-center text-[10px] font-bold leading-tight`}>{story.textContent}</div>}
                        <button onClick={() => deleteStory(story.id)} className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center bg-black/80 hover:bg-red-600 rounded-full text-white transition-colors backdrop-blur-sm">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}

                  {/* Saved View */}
                  {profileSubTab === 'saved' && (
                    stories.filter(s => bookmarks.includes(s.id)).length === 0 ? <p className="col-span-2 text-xs text-neutral-600 p-4 text-center bg-neutral-900 rounded-xl">No saved posts yet.</p> : 
                      stories.filter(s => bookmarks.includes(s.id)).map(story => (
                      <div key={story.id} onClick={() => { setFocusedExplorePost(story); }} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden aspect-[4/5] relative group shadow-lg cursor-pointer">
                        {story.imageUrl ? <img src={story.imageUrl} alt="Saved post" className="w-full h-full object-cover transition-transform group-hover:scale-105" /> : <div className={`w-full h-full bg-gradient-to-br ${story.bgGradient} p-4 flex items-center justify-center text-center text-[10px] font-bold leading-tight`}>{story.textContent}</div>}
                        <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-black/60 rounded-full text-white backdrop-blur-sm"><Bookmark className="w-3 h-3 fill-yellow-500 text-yellow-500" /></div>
                      </div>
                    ))
                  )}
                </div>

                {/* Creator Analytics Dashboard */}
                {profileSubTab === 'analytics' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-neutral-900 p-5 rounded-3xl border border-neutral-800 flex flex-col items-center justify-center text-center">
                        <TrendingUp className="w-8 h-8 text-emerald-400 mb-3" />
                        <div className="text-4xl font-black text-white">{stories.filter(s=>s.authorId===user?.uid).reduce((acc, curr) => acc + (curr.likes?.length || 0), 0)}</div>
                        <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Total Likes</div>
                      </div>
                      <div className="bg-neutral-900 p-5 rounded-3xl border border-neutral-800 flex flex-col items-center justify-center text-center">
                        <Gem className="w-8 h-8 text-cyan-400 mb-3" />
                        <div className="text-4xl font-black text-white">{profile.diamondsEarned || 0}</div>
                        <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Diamonds Earned</div>
                      </div>
                    </div>
                    <div className="bg-neutral-900 p-5 rounded-3xl border border-neutral-800 flex items-center justify-between">
                       <div>
                         <div className="text-2xl font-black text-white">{stories.filter(s=>s.authorId===user?.uid).length}</div>
                         <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Total Posts Made</div>
                       </div>
                       <ImageIcon className="w-10 h-10 text-purple-400 opacity-50" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ===== FULL-SCREEN 24H STORY VIEWER ===== */}
      {activeStoryView && activeStoryView.length > 0 && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
          {/* Progress Bars */}
          <div className="flex gap-1 p-2 pt-safe-top z-10 absolute top-0 left-0 right-0">
            {activeStoryView.map((_, i) => (
               <div key={i} className={`h-1 flex-1 rounded-full ${i===0 ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
          
          {/* Story Header */}
          <div className="absolute top-6 left-0 right-0 p-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-2 drop-shadow-md">
              <span className="text-2xl bg-neutral-900 p-1 rounded-full border border-neutral-700">{activeStoryView[0].authorEmoji}</span>
              <div className="text-white font-bold text-sm">{activeStoryView[0].authorName} <span className="text-[10px] font-normal opacity-70 ml-2">{timeAgo(activeStoryView[0].createdAt)}</span></div>
            </div>
            <button onClick={() => setActiveStoryView(null)} className="p-2 bg-black/40 rounded-full text-white backdrop-blur-sm"><X className="w-5 h-5"/></button>
          </div>
          
          {/* Story Content */}
          <div className="flex-1 flex items-center justify-center bg-neutral-900 relative">
            {activeStoryView[0].imageUrl ? (
              <img src={activeStoryView[0].imageUrl} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${activeStoryView[0].bgGradient} flex items-center justify-center p-8`}>
                <p className="text-3xl font-black text-center drop-shadow-xl">{activeStoryView[0].textContent}</p>
              </div>
            )}
            {activeStoryView[0].caption && (
              <div className="absolute bottom-16 left-4 right-4 text-center">
                 <span className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold shadow-lg inline-block">{renderCaptionWithTags(activeStoryView[0].caption)}</span>
              </div>
            )}
          </div>
          {/* Delete Story if Mine or VIP */}
          {(activeStoryView[0].authorId === user?.uid || iAmVIP) && (
            <button onClick={() => { deleteStory(activeStoryView[0].id, true); setActiveStoryView(null); }} className="absolute bottom-4 right-4 p-3 bg-red-600 rounded-full text-white shadow-xl z-10"><Trash2 className="w-5 h-5"/></button>
          )}
        </div>
      )}

      {/* ===== EXPLORE MODAL DRAWER ===== */}
      {focusedExplorePost && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setFocusedExplorePost(null)}>
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
             <button onClick={() => setFocusedExplorePost(null)} className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/80 rounded-full z-10 text-white backdrop-blur-sm"><X className="w-4 h-4" /></button>
             <div className="aspect-[4/5] bg-black">
               {focusedExplorePost.imageUrl ? (
                 <img src={focusedExplorePost.imageUrl} className="w-full h-full object-cover" />
               ) : (
                 <div className={`w-full h-full bg-gradient-to-br ${focusedExplorePost.bgGradient} p-8 flex items-center justify-center text-center text-xl font-bold`}>{focusedExplorePost.textContent}</div>
               )}
             </div>
             <div className="p-4 flex items-center justify-between bg-neutral-900">
               <div className="flex items-center gap-2">
                 <span className="text-xl bg-neutral-950 p-1 rounded-lg border border-neutral-800">{focusedExplorePost.authorEmoji}</span>
                 <span className="text-xs font-bold">{focusedExplorePost.authorName}</span>
               </div>
               <div className="flex gap-3 items-center">
                 <div className="flex items-center gap-1.5 text-pink-500 font-bold text-xs"><Heart className="w-4 h-4 fill-pink-500" /> {focusedExplorePost.likes?.length || 0}</div>
                 {(focusedExplorePost.authorId === user?.uid || iAmVIP) && (
                   <button onClick={() => { deleteStory(focusedExplorePost.id); setFocusedExplorePost(null); }} className="text-red-500 hover:text-red-400">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 )}
               </div>
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

      {/* ===== UPGRADED MOBILE BOTTOM NAVBAR BAR ===== */}
      <nav className="md:hidden absolute bottom-0 left-0 right-0 bg-neutral-950/95 border-t border-neutral-800 flex justify-around p-2 pb-safe z-40 backdrop-blur-xl">
        <button onClick={() => setCurrentTab('feed')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentTab === 'feed' ? (iAmVIP ? 'text-yellow-500' : 'text-blue-500') : 'text-neutral-500 hover:text-neutral-300'}`}>
          <Home className="w-6 h-6" />
        </button>
        <button onClick={() => setCurrentTab('shorts')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentTab === 'shorts' ? (iAmVIP ? 'text-yellow-500' : 'text-blue-500') : 'text-neutral-500 hover:text-neutral-300'}`}>
          <Video className="w-6 h-6" />
        </button>
        <button onClick={() => { setCurrentTab('create'); setRemixPost(null); }} className="flex flex-col items-center justify-center -mt-8">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center border-[3px] border-neutral-950 text-white transition-transform active:scale-95 ${iAmVIP ? 'bg-yellow-500 hover:bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] text-black' : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]'}`}>
            <PlusCircle className="w-7 h-7" />
          </div>
        </button>
        <button onClick={() => { setCurrentTab('inbox'); markNotifsRead(); }} className={`relative flex flex-col items-center gap-1 p-2 transition-colors ${currentTab === 'inbox' ? (iAmVIP ? 'text-yellow-500' : 'text-blue-500') : 'text-neutral-500 hover:text-neutral-300'}`}>
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-neutral-950"></span>}
        </button>
        <button onClick={() => { setCurrentTab('profile'); setProfileSubTab('posts'); }} className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentTab === 'profile' ? (iAmVIP ? 'text-yellow-500' : 'text-blue-500') : 'text-neutral-500 hover:text-neutral-300'}`}>
          <User className="w-6 h-6" />
        </button>
      </nav>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0.5rem); }
        .pt-safe-top { padding-top: env(safe-area-inset-top, 0.5rem); }
        
        @keyframes float-up {
          0% { transform: translate(0, 0) scale(0.5); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(1.5); opacity: 0; }
        }
        .animate-float-up { animation: float-up 1s ease-out forwards; }
        .marquee-text { display: inline-block; white-space: nowrap; animation: marquee 5s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}} />
    </div>
  );
}