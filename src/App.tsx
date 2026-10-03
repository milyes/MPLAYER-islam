/**
 * @license NETSECUREPRO.CA - GEMIN CORE V7 PRO FINAL
 * IA_LOGIC_SIGNATURE: ZOUBIROU-IA-2025
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Search, Music, Download, 
  Trash2, Loader2, ListMusic, Plus, X, GripVertical, Mic, MicOff, 
  ClosedCaption, RotateCcw, Bookmark, Library, GraduationCap, Square,
  ChevronUp, ChevronDown, BookOpen, SlidersHorizontal, Sliders, Settings,
  HardDrive, FileCode, Database, Check, Copy, ExternalLink, RefreshCw, Upload, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { surahs } from './data/surahs';
import { isSurahCached, downloadSurah, deleteCachedSurah, getCachedAudioUrl, getAllCachedSurahIds } from './lib/cache';

type Language = 'en' | 'fr' | 'ar';

const t = {
  en: {
    appTitle: "The Holy Quran",
    recitationBy: "Sheikh Saud Al-Shuraim",
    search: "Search Surah...",
    offlineOnly: "Offline Only",
    nowReciting: "Now Reciting:",
    quranPos: "Quran Position",
    verses: "Verses",
    loadingVerses: "Loading verses...",
    noSurahsFound: "No Surahs found matching",
    speed: "Speed",
    queue: "Playback Queue",
    clearQueue: "Clear Queue",
    emptyQueue: "Your queue is empty.",
    addFromList: "Add Surahs from the list.",
    bookmarks: "Verse Bookmarks",
    noBookmarks: "No bookmarks yet.",
    tapBookmark: "Tap the bookmark icon on any verse.",
    voiceTraining: "Voice Training",
    recordRecitation: "Record your recitation to compare.",
    stop: "Stop",
    record: "Record",
    yourRecitation: "Your Recitation",
    discard: "Discard",
    trainingDesc: "Tap the microphone to start recording your voice. When you stop, you'll be able to play it back.",
    surahs: "Surahs",
    nowPlaying: "Now Playing",
    close: "Close",
    openPlayer: "Open Player",
    fullPlayer: "Full Player",
    dragToReorder: "Drag to reorder",
    studioEditor: "Studio Editor",
    driveStore: "Drive Store",
    exportBin: "Export BIN_HTML",
    sahbiAi: "SAHBI SA AI23",
  },
  fr: {
    appTitle: "Le Saint Coran",
    recitationBy: "Cheikh Saoud Al-Chouraïm",
    search: "Rechercher une sourate...",
    offlineOnly: "Hors ligne",
    nowReciting: "En cours de lecture :",
    quranPos: "Position",
    verses: "Versets",
    loadingVerses: "Chargement des versets...",
    noSurahsFound: "Aucune sourate ne correspond à",
    speed: "Vitesse",
    queue: "File d'attente",
    clearQueue: "Vider la file",
    emptyQueue: "Votre file est vide.",
    addFromList: "Ajoutez des sourates depuis la liste.",
    bookmarks: "Vos Favoris",
    noBookmarks: "Aucun favori pour le moment.",
    tapBookmark: "Appuyez sur l'icône de favori d'un verset.",
    voiceTraining: "Entraînement Vocal",
    recordRecitation: "Enregistrez votre récitation pour comparer.",
    stop: "Arrêter",
    record: "Enregistrer",
    yourRecitation: "Votre Récitation",
    discard: "Jeter",
    trainingDesc: "Appuyez sur le microphone pour enregistrer votre voix. Vous pourrez réécouter une fois terminé.",
    surahs: "Sourates",
    nowPlaying: "Lecture en cours",
    close: "Fermer",
    openPlayer: "Ouvrir le lecteur",
    fullPlayer: "Lecteur Complet",
    dragToReorder: "Glisser pour réorganiser",
    studioEditor: "Éditeur Studio",
    driveStore: "Stockage Drive",
    exportBin: "Exporter BIN_HTML",
    sahbiAi: "SAHBI SA AI23",
  },
  ar: {
    appTitle: "القرآن الكريم",
    recitationBy: "بصوت الشيخ سعود الشريم",
    search: "ابحث عن سورة...",
    offlineOnly: "بدون إنترنت",
    nowReciting: "يقرأ الآن:",
    quranPos: "ترتيب السورة",
    verses: "الآيات",
    loadingVerses: "جاري تحميل الآيات...",
    noSurahsFound: "لم يتم العثور على سورة تطابق",
    speed: "السرعة",
    queue: "قائمة التشغيل",
    clearQueue: "مسح القائمة",
    emptyQueue: "القائمة فارغة.",
    addFromList: "أضف سوراً من القائمة.",
    bookmarks: "العلامات المرجعية",
    noBookmarks: "لا توجد علامات مرجعية.",
    tapBookmark: "انقر على أيقونة المرجعية لأي آية.",
    voiceTraining: "تدريب الصوت",
    recordRecitation: "سجّل تلاوتك للمقارنة.",
    stop: "إيقاف",
    record: "تسجيل",
    yourRecitation: "تلاوتك",
    discard: "حذف",
    trainingDesc: "انقر على الميكروفون لبدء التسجيل. عند الإيقاف، ستتمكن من الاستماع إليه.",
    surahs: "السور",
    nowPlaying: "يتم التشغيل",
    close: "إغلاق",
    openPlayer: "فتح المشغل",
    fullPlayer: "المشغل الكامل",
    dragToReorder: "اسحب لإعادة الترتيب",
    studioEditor: "محرر الاستوديو",
    driveStore: "مخزن درايف",
    exportBin: "تصدير BIN_HTML",
    sahbiAi: "صحبي ش.م AI23",
  }
};

const editions = {
  en: 'en.sahih',
  fr: 'fr.hamidullah',
  ar: 'quran-uthmani'
};

const PlayingAnimation = () => (
  <div className="flex items-end space-x-0.5 h-4 w-4">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{
          height: ["20%", "100%", "20%"],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.2,
          ease: "easeInOut",
        }}
        className="w-1 bg-emerald-400 rounded-full"
      />
    ))}
  </div>
);

export default function App() {
  const [theme, setTheme] = useState<'emerald' | 'mythos'>('emerald');
  const [lang, setLang] = useState<Language>('en');
  const [currentSurah, setCurrentSurah] = useState(surahs[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDownloadedOnly, setShowDownloadedOnly] = useState(false);
  const [downloadedSurahs, setDownloadedSurahs] = useState<Set<number>>(new Set());
  const [downloadingSurahs, setDownloadingSurahs] = useState<Set<number>>(new Set());
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [queue, setQueue] = useState<(typeof surahs[0] & { queueId: string })[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCC, setShowCC] = useState(false);
  const [verses, setVerses] = useState<{ number: number; text: string; numberInSurah?: number }[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [bookmarks, setBookmarks] = useState<{ id: string; surahId: number; surahName: string; verseNumber: number; text: string }[]>([]);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'surahs' | 'bookmarks' | 'queue' | 'training' | 'studio'>('surahs');
  
  // Studio Editor & Drive Store State
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<'editor' | 'export' | 'drivestore' | 'ai23'>('editor');
  const [customCdnUrl, setCustomCdnUrl] = useState<string>('https://server7.mp3quran.net/shur/');
  const [reciterName, setReciterName] = useState<string>('Sheikh Saud Al-Shuraim');
  const [audioQuality, setAudioQuality] = useState<string>('128k');
  const [autoCacheOnPlay, setAutoCacheOnPlay] = useState<boolean>(false);
  const [driveStoreSavedTime, setDriveStoreSavedTime] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const filteredSurahs = surahs.filter(s => {
    const matchesSearch = s.name_arabic.includes(searchQuery) || 
      s.name_english.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !showDownloadedOnly || downloadedSurahs.has(s.id);
    return matchesSearch && matchesFilter;
  });

  // Initialize downloaded surahs and bookmarks
  useEffect(() => {
    getAllCachedSurahIds().then(ids => setDownloadedSurahs(new Set(ids)));

    const savedBookmarks = localStorage.getItem('quran_bookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    }

    const savedTheme = localStorage.getItem('quran_theme');
    if (savedTheme === 'mythos' || savedTheme === 'emerald') {
      setTheme(savedTheme);
    }

    // Initialize Studio Editor & Drive Store Settings
    const savedCdn = localStorage.getItem('quran_studio_cdn');
    if (savedCdn) setCustomCdnUrl(savedCdn);
    const savedReciter = localStorage.getItem('quran_studio_reciter');
    if (savedReciter) setReciterName(savedReciter);
    const savedQuality = localStorage.getItem('quran_studio_quality');
    if (savedQuality) setAudioQuality(savedQuality);
    const savedAutoCache = localStorage.getItem('quran_studio_autocache');
    if (savedAutoCache) setAutoCacheOnPlay(savedAutoCache === 'true');
    const savedTime = localStorage.getItem('quran_drivestore_time');
    if (savedTime) setDriveStoreSavedTime(savedTime);

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Sync recognition language
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US';
    }
  }, [lang]);

  // Fetch verses for CC
  useEffect(() => {
    if (showCC) {
      const fetchVerses = async () => {
        setIsLoadingVerses(true);
        try {
          const response = await fetch(`https://api.alquran.cloud/v1/surah/${currentSurah.id}/${editions[lang]}`);
          const data = await response.json();
          if (data.code === 200) {
            setVerses(data.data.ayahs);
          }
        } catch (error) {
          console.error("Error fetching verses:", error);
        } finally {
          setIsLoadingVerses(false);
        }
      };
      fetchVerses();
    } else {
      setVerses([]);
    }
  }, [currentSurah.id, showCC, lang]);

  useEffect(() => {
    localStorage.setItem('quran_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('quran_theme', theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition start failed:", e);
      }
    }
  };

  // Update audio source when current surah changes
  useEffect(() => {
    const updateAudioSrc = async () => {
      const cachedUrl = await getCachedAudioUrl(currentSurah.id);
      if (cachedUrl) {
        setAudioSrc(cachedUrl);
      } else {
        const paddedId = currentSurah.id.toString().padStart(3, '0');
        const baseUrl = customCdnUrl.endsWith('/') ? customCdnUrl : `${customCdnUrl}/`;
        setAudioSrc(`${baseUrl}${paddedId}.mp3`);

        if (autoCacheOnPlay && !downloadedSurahs.has(currentSurah.id)) {
          downloadSurah(currentSurah.id).then(() => {
            setDownloadedSurahs(prev => new Set(prev).add(currentSurah.id));
          }).catch(console.error);
        }
      }
    };
    updateAudioSrc();
  }, [currentSurah.id, customCdnUrl, autoCacheOnPlay]);

  // Studio Settings Persistence
  const saveStudioSettings = () => {
    localStorage.setItem('quran_studio_cdn', customCdnUrl);
    localStorage.setItem('quran_studio_reciter', reciterName);
    localStorage.setItem('quran_studio_quality', audioQuality);
    localStorage.setItem('quran_studio_autocache', String(autoCacheOnPlay));
    showToast('Paramètres du Studio enregistrés avec succès !');
  };

  // Export BIN_HTML.LANCER handlers
  const handleExportBinHtml = async () => {
    try {
      showToast('Génération du fichier BIN_HTML.LANCER.html...');
      const response = await fetch('/Lancer_bin.html');
      let htmlText = '';
      if (response.ok) {
        htmlText = await response.text();
      } else {
        htmlText = document.documentElement.outerHTML;
      }
      const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BIN_HTML.LANCER.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Export BIN_HTML.LANCER terminé !');
    } catch (e) {
      console.error(e);
      showToast('Erreur lors de l\'exportation');
    }
  };

  const handleCopyBinHtml = async () => {
    try {
      const response = await fetch('/Lancer_bin.html');
      const text = response.ok ? await response.text() : document.documentElement.outerHTML;
      await navigator.clipboard.writeText(text);
      showToast('Code BIN_HTML copié dans le presse-papiers !');
    } catch (e) {
      console.error(e);
      showToast('Impossible de copier dans le presse-papiers');
    }
  };

  // Drive Store Local Backup & Cloud Persistence
  const handleDriveStoreSave = () => {
    const backup = {
      version: 'SAHBI-SA-AI23-v2.0',
      savedAt: new Date().toISOString(),
      reciter: reciterName,
      cdn: customCdnUrl,
      quality: audioQuality,
      theme,
      lang,
      bookmarks,
      queue: queue.map(q => ({ id: q.id, name_english: q.name_english, name_arabic: q.name_arabic })),
      cachedSurahsCount: downloadedSurahs.size,
    };
    localStorage.setItem('quran_drivestore_backup', JSON.stringify(backup));
    const nowStr = new Date().toLocaleTimeString();
    localStorage.setItem('quran_drivestore_time', nowStr);
    setDriveStoreSavedTime(nowStr);
    showToast(`Drive Store synchronisé à ${nowStr}`);
  };

  const handleDriveStoreExport = () => {
    const backup = {
      app: 'MPLAYER-ISLAM · SAHBI S.A.',
      version: 'AI23-STUDIO-v2',
      exportedAt: new Date().toISOString(),
      bookmarks,
      theme,
      lang,
      customCdnUrl,
      reciterName,
      audioQuality,
      cachedSurahs: Array.from(downloadedSurahs)
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quran_drive_store_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Fichier Drive Store JSON téléchargé');
  };

  const handleDriveStoreRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.bookmarks) {
          setBookmarks(parsed.bookmarks);
          localStorage.setItem('quran_bookmarks', JSON.stringify(parsed.bookmarks));
        }
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.customCdnUrl) setCustomCdnUrl(parsed.customCdnUrl);
        if (parsed.reciterName) setReciterName(parsed.reciterName);
        if (parsed.audioQuality) setAudioQuality(parsed.audioQuality);
        showToast('Restauration Drive Store réussie !');
      } catch (err) {
        console.error(err);
        showToast('Erreur : fichier JSON invalide');
      }
    };
    reader.readAsText(file);
  };

  const handleClearDriveStore = async () => {
    if (confirm('Voulez-vous vraiment vider tout le cache et réinitialiser le Drive Store ?')) {
      for (const id of downloadedSurahs) {
        await deleteCachedSurah(id);
      }
      setDownloadedSurahs(new Set());
      setBookmarks([]);
      localStorage.removeItem('quran_bookmarks');
      localStorage.removeItem('quran_drivestore_backup');
      localStorage.removeItem('quran_drivestore_time');
      setDriveStoreSavedTime('');
      showToast('Cache et Drive Store réinitialisés');
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Audio playback error:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioSrc]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setProgress(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const skipToBeginning = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
    }
  };

  const toggleBookmark = (ayah: { number: number; text: string; numberInSurah?: number }) => {
    const verseNum = ayah.numberInSurah || ayah.number;
    const bookmarkId = `${currentSurah.id}:${verseNum}`;
    const exists = bookmarks.some(b => b.id === bookmarkId);

    if (exists) {
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    } else {
      setBookmarks(prev => [...prev, {
        id: bookmarkId,
        surahId: currentSurah.id,
        surahName: currentSurah.name_english,
        verseNumber: verseNum,
        text: ayah.text
      }]);
    }
  };

  const isBookmarked = (verseNum: number) => {
    return bookmarks.some(b => b.id === `${currentSurah.id}:${verseNum}`);
  };

  // Voice training methods
  const startTrainingRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone for training:", err);
    }
  };

  const stopTrainingRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const resetTraining = () => {
    setRecordedAudioUrl(null);
    audioChunksRef.current = [];
  };

  const handleDownload = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (downloadingSurahs.has(id)) return;
    
    setDownloadingSurahs(prev => new Set(prev).add(id));
    try {
      await downloadSurah(id);
      setDownloadedSurahs(prev => new Set(prev).add(id));
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloadingSurahs(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteCachedSurah(id);
      setDownloadedSurahs(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (currentSurah.id === id) {
        const paddedId = id.toString().padStart(3, '0');
        setAudioSrc(`https://server7.mp3quran.net/shur/${paddedId}.mp3`);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const playSurah = (surah: typeof surahs[0]) => {
    setCurrentSurah(surah);
    setIsPlaying(true);
  };

  const addToQueue = (e: React.MouseEvent, surah: typeof surahs[0]) => {
    e.stopPropagation();
    const queueItem = { ...surah, queueId: Math.random().toString(36).substring(7) + Date.now() };
    setQueue(prev => [...prev, queueItem]);
  };

  const removeFromQueue = (queueId: string) => {
    setQueue(prev => prev.filter(item => item.queueId !== queueId));
  };

  const clearQueue = () => setQueue([]);

  const playNext = () => {
    if (queue.length > 0) {
      const nextSurah = queue[0];
      setQueue(prev => prev.slice(1));
      playSurah(nextSurah);
      return;
    }

    const currentIndex = surahs.findIndex(s => s.id === currentSurah.id);
    if (currentIndex < surahs.length - 1) {
      playSurah(surahs[currentIndex + 1]);
    }
  };

  const playPrevious = () => {
    const currentIndex = surahs.findIndex(s => s.id === currentSurah.id);
    if (currentIndex > 0) {
      playSurah(surahs[currentIndex - 1]);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div data-theme={theme} className="min-h-[100dvh] bg-app-bg text-emerald-50 font-sans selection:bg-emerald-900/50 flex flex-col relative overflow-x-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-emerald-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-900/20 blur-[100px]" />
      </div>

      {/* Main Container */}
      <div 
        className={`relative z-10 max-w-5xl mx-auto px-4 pt-3 pb-36 md:py-8 min-h-[100dvh] flex flex-col w-full ${lang === 'ar' ? 'text-right' : 'text-left'}`} 
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Top Bar Navigation (Clean, responsive, mobile & desktop) */}
        <header className="flex items-center justify-between mb-4 md:mb-8 pt-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base md:text-xl font-serif font-bold text-emerald-400 tracking-wide block leading-tight">
                {t[lang].appTitle}
              </span>
              <span className="text-[11px] text-emerald-400/60 hidden sm:block">
                {t[lang].recitationBy}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Segmented Control */}
            <div className="flex items-center bg-emerald-950/60 p-0.5 rounded-xl border border-emerald-800/40">
              {(['en', 'fr', 'ar'] as Language[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`min-h-[36px] px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    lang === l 
                      ? 'bg-emerald-500 text-emerald-950 shadow-sm' 
                      : 'text-emerald-400/70 hover:text-emerald-300'
                  }`}
                  aria-label={`Language ${l}`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'emerald' ? 'mythos' : 'emerald')}
              className="min-h-[36px] min-w-[36px] px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-emerald-800/40 bg-emerald-950/60 text-emerald-400/80 hover:text-emerald-300 hover:border-emerald-500/40 flex items-center space-x-1"
              title="Toggle Mythos / Emerald Theme"
            >
              <span>{theme === 'emerald' ? 'Mythos' : 'Emerald'}</span>
            </button>

            {/* Studio Editor & Export button */}
            <button
              onClick={() => {
                setStudioTab('editor');
                setIsStudioOpen(true);
                setIsBookmarksOpen(false);
                setIsQueueOpen(false);
                setIsTrainingOpen(false);
              }}
              className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold tracking-wider transition-all border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 flex items-center space-x-1.5 shadow-sm"
              title="Studio Editor & Export"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Studio</span>
            </button>

            {/* Drive Store button */}
            <button
              onClick={() => {
                setStudioTab('drivestore');
                setIsStudioOpen(true);
                setIsBookmarksOpen(false);
                setIsQueueOpen(false);
                setIsTrainingOpen(false);
              }}
              className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold tracking-wider transition-all border border-emerald-800/40 bg-emerald-950/60 text-emerald-400/80 hover:text-emerald-300 hover:border-emerald-500/40 flex items-center space-x-1"
              title="Drive Store Storage"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Drive</span>
            </button>

            {/* SAHBI S.A. Lancer_bin.html launcher button */}
            <a
              href="/Lancer_bin.html"
              className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold tracking-wider transition-all border border-emerald-800/40 bg-emerald-950/60 text-emerald-400/80 hover:text-emerald-300 hover:border-emerald-500/40 flex items-center space-x-1 shadow-sm"
              title="SAHBI S.A. — Lancer_bin.html"
            >
              <span className="hidden sm:inline">SAHBI SA ·</span>
              <span>Bin</span>
            </a>
          </div>
        </header>

        {/* Sub-Header / Current Status on Desktop */}
        <div className="flex flex-col items-center justify-center mb-6 space-y-1">
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center space-x-2 text-emerald-400 text-xs md:text-sm font-mono"
              >
                <PlayingAnimation />
                <span>{t[lang].nowReciting} {currentSurah.name_english} ({currentSurah.name_arabic})</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 max-w-2xl mx-auto w-full">
          <div className="relative flex-1 w-full flex items-center">
            <div className={`absolute inset-y-0 ${lang === 'ar' ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none`}>
              <Search className="h-5 w-5 text-emerald-500/50" />
            </div>
            <input
              type="text"
              placeholder={t[lang].search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full min-h-[48px] ${lang === 'ar' ? 'pr-11 pl-12' : 'pl-11 pr-12'} py-3 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-emerald-100 placeholder-emerald-500/50 transition-all backdrop-blur-sm text-sm`}
            />
            <button
              onClick={toggleListening}
              className={`absolute ${lang === 'ar' ? 'left-2' : 'right-2'} min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl transition-all ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10'
              }`}
              title={isListening ? "Stop Listening" : "Voice Search"}
              aria-label="Voice Search"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          <button
            onClick={() => setShowDownloadedOnly(!showDownloadedOnly)}
            className={`min-h-[48px] px-5 rounded-2xl border transition-all flex items-center justify-center space-x-2 whitespace-nowrap w-full sm:w-auto ${
              showDownloadedOnly 
                ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400 hover:border-emerald-500/50'
            }`}
          >
            <Download className="w-4 h-4 mx-1" />
            <span className="text-xs md:text-sm font-medium">{t[lang].offlineOnly}</span>
          </button>
        </div>

        {/* Featured Surah Banner / Now Reciting Box */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          key={currentSurah.id}
          className="mb-6 p-4 md:p-6 rounded-3xl bg-emerald-900/20 border border-emerald-800/30 backdrop-blur-md flex flex-col items-stretch gap-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl md:text-2xl font-mono text-emerald-400 shrink-0">
                {currentSurah.id}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 mb-0.5">
                  <h2 className="text-xl md:text-2xl font-serif text-emerald-50 truncate">{currentSurah.name_english}</h2>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20 shrink-0">
                    #{currentSurah.id}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-emerald-400/70 truncate flex items-center space-x-1.5">
                  <Music className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t[lang].recitationBy}</span>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-3xl md:text-4xl font-serif text-emerald-400 leading-none mb-1">
                {currentSurah.name_arabic}
              </div>
              <button 
                onClick={() => setShowCC(!showCC)}
                className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition-all inline-flex items-center space-x-1 ${
                  showCC 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50' 
                    : 'text-emerald-400/60 border-emerald-800/30 hover:border-emerald-500/40'
                }`}
              >
                <ClosedCaption className="w-3.5 h-3.5 mx-0.5" />
                <span>{t[lang].verses}</span>
              </button>
            </div>
          </div>

          {/* Verses Reader (CC) Module */}
          <AnimatePresence>
            {showCC && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 border-t border-emerald-800/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-emerald-400 text-xs md:text-sm font-medium flex items-center space-x-2">
                    <ClosedCaption className="w-4 h-4 mx-1" />
                    <span>{t[lang].verses} ({currentSurah.name_english})</span>
                  </h3>
                  {isLoadingVerses && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
                </div>
                <div className={`max-h-56 overflow-y-auto ${lang === 'ar' ? 'pl-2' : 'pr-2'} custom-scrollbar space-y-3`}>
                  {verses.length > 0 ? (
                    verses.map((ayah) => {
                      const verseNum = ayah.numberInSurah || ayah.number;
                      const bookmarked = isBookmarked(verseNum);
                      return (
                        <div key={ayah.number} className={`relative p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/20 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                          <div className={`flex items-center justify-between mb-1 text-xs text-emerald-400/60`}>
                            <span className="font-mono text-[10px]">Verse {verseNum}</span>
                            <button 
                              onClick={() => toggleBookmark(ayah)}
                              className={`p-1.5 rounded-lg transition-all min-h-[36px] min-w-[36px] flex items-center justify-center ${
                                bookmarked 
                                  ? 'text-emerald-400 bg-emerald-500/20' 
                                  : 'text-emerald-500/40 hover:text-emerald-300'
                              }`}
                              title={bookmarked ? "Remove Bookmark" : "Add Bookmark"}
                            >
                              <Bookmark className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} />
                            </button>
                          </div>
                          <p className={`text-xl md:text-2xl font-serif text-emerald-50 leading-relaxed`}>
                            {ayah.text}
                          </p>
                        </div>
                      );
                    })
                  ) : !isLoadingVerses && (
                    <p className="text-center text-emerald-500/40 italic py-4 text-sm">{t[lang].loadingVerses}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Surahs List */}
        <div className={`flex-1 overflow-y-auto ${lang === 'ar' ? 'pl-1' : 'pr-1'} space-y-2.5 custom-scrollbar`}>
          {filteredSurahs.map((surah) => {
            const isActive = currentSurah.id === surah.id;
            return (
              <div
                key={surah.id}
                role="button"
                tabIndex={0}
                onClick={() => playSurah(surah)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playSurah(surah);
                  }
                }}
                className={`w-full flex items-center justify-between p-3.5 md:p-4 rounded-2xl transition-all border group relative cursor-pointer outline-none min-h-[64px] active:scale-[0.99] ${
                  isActive 
                    ? 'bg-emerald-900/40 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                    : 'bg-emerald-950/25 border-emerald-800/20 hover:border-emerald-700/40'
                }`}
              >
                <div className="flex items-center space-x-3.5 relative z-10 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all ${
                    isActive ? 'bg-emerald-500 text-emerald-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-emerald-900/50 text-emerald-400'
                  }`}>
                    {isActive && isPlaying ? <PlayingAnimation /> : surah.id}
                  </div>
                  <div className="text-left min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-medium text-base md:text-lg truncate transition-colors ${isActive ? 'text-emerald-400' : 'text-emerald-50'}`}>
                        {surah.name_english}
                      </h3>
                      {isActive && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold uppercase shrink-0">
                          {isPlaying ? 'PLAYING' : 'READY'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-400/60">Surah {surah.id}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 relative z-10 shrink-0">
                  <div className={`text-xl md:text-2xl font-serif ${isActive ? 'text-emerald-400' : 'text-emerald-300'}`}>
                    {surah.name_arabic}
                  </div>
                  
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={(e) => addToQueue(e, surah)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all"
                      title="Add to queue"
                      aria-label={`Add ${surah.name_english} to queue`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    
                    {downloadedSurahs.has(surah.id) ? (
                      <button
                        onClick={(e) => handleDelete(e, surah.id)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-red-500/20 hover:text-red-400 active:scale-95 transition-all"
                        title="Delete offline copy"
                        aria-label={`Delete offline copy of ${surah.name_english}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleDownload(e, surah.id)}
                        disabled={downloadingSurahs.has(surah.id)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                        title="Download for offline"
                        aria-label={`Download ${surah.name_english}`}
                      >
                        {downloadingSurahs.has(surah.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredSurahs.length === 0 && (
            <div className="text-center text-emerald-500/50 py-12">
              {t[lang].noSurahsFound} "{searchQuery}"
            </div>
          )}
        </div>

        {/* License Signature & SAHBI S.A. Launcher Footer Note */}
        <footer className="mt-8 text-center text-[10px] text-emerald-500/40 tracking-wider font-mono flex flex-col items-center gap-1.5">
          <div>SAHBI S.A. · LICENSE NETSECUREPRO.CA · GEMIN CORE V7 PRO FINAL · IA_LOGIC_SIGNATURE: ZOUBIROU-IA-2025</div>
          <div className="flex items-center space-x-3">
            <a href="/Lancer_bin.html" className="text-emerald-400/70 hover:text-emerald-300 underline transition-colors">
              SAHBI SA · Lancer_bin.html
            </a>
            <span className="text-emerald-700/50">·</span>
            <span className="text-emerald-500/30">Sheikh Saud Al-Shuraim 114 Surahs</span>
          </div>
        </footer>
      </div>

      {/* Hidden Audio Tag */}
      <audio
        ref={audioRef}
        src={audioSrc || undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={playNext}
        onLoadedMetadata={handleTimeUpdate}
        muted={isMuted}
      />

      {/* ========================================================================= */}
      {/* MOBILE MINI PLAYER BAR (Docked above bottom navigation)                    */}
      {/* ========================================================================= */}
      <div className="md:hidden fixed bottom-16 inset-x-0 z-40 bg-emerald-950/95 backdrop-blur-xl border-t border-emerald-800/40 shadow-2xl">
        {/* Progress bar line */}
        <div className="w-full h-1 bg-emerald-900/40 relative">
          <div 
            className="h-full bg-emerald-400 transition-all duration-150"
            style={{ width: `${(progress / (duration || 100)) * 100}%` }}
          />
        </div>

        <div className="px-3 py-2 flex items-center justify-between">
          {/* Tappable Surah info -> Opens Full Mobile Player Sheet */}
          <div 
            onClick={() => setIsMobilePlayerOpen(true)}
            className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-900/60 border border-emerald-800/50 flex items-center justify-center font-mono text-emerald-400 text-xs font-bold shrink-0">
              {currentSurah.id}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-serif text-sm text-emerald-200 font-bold truncate">
                  {currentSurah.name_arabic}
                </span>
                <span className="text-[10px] text-emerald-400/60 truncate">
                  · {currentSurah.name_english}
                </span>
              </div>
              <span className="text-[10px] text-emerald-500/60 font-mono tabular-nums block">
                {formatTime(progress)} / {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={skipToBeginning}
              className="min-h-[44px] min-w-[40px] flex items-center justify-center text-emerald-400/70 hover:text-emerald-300"
              title="Restart"
              aria-label="Restart current Surah"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-emerald-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-95 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
            </button>

            <button
              onClick={playNext}
              className="min-h-[44px] min-w-[40px] flex items-center justify-center text-emerald-400/70 hover:text-emerald-300"
              title="Next"
              aria-label="Next Surah"
            >
              <SkipForward className="w-4 h-4" fill="currentColor" />
            </button>

            <button
              onClick={() => setIsMobilePlayerOpen(true)}
              className="min-h-[44px] min-w-[36px] flex items-center justify-center text-emerald-400/60 hover:text-emerald-300"
              title="Expand Player"
              aria-label="Expand mobile full-screen player"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR                                              */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-emerald-950/95 backdrop-blur-xl border-t border-emerald-800/40 flex items-center justify-around px-2 pb-safe">
        <button
          onClick={() => {
            setActiveTab('surahs');
            setIsBookmarksOpen(false);
            setIsQueueOpen(false);
            setIsTrainingOpen(false);
          }}
          className={`min-h-[48px] flex-1 flex flex-col items-center justify-center transition-colors ${
            activeTab === 'surahs' && !isBookmarksOpen && !isQueueOpen && !isTrainingOpen
              ? 'text-emerald-400' 
              : 'text-emerald-500/50 hover:text-emerald-400'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">{t[lang].surahs}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('bookmarks');
            setIsBookmarksOpen(true);
            setIsQueueOpen(false);
            setIsTrainingOpen(false);
          }}
          className={`min-h-[48px] flex-1 flex flex-col items-center justify-center transition-colors relative ${
            isBookmarksOpen ? 'text-emerald-400' : 'text-emerald-500/50 hover:text-emerald-400'
          }`}
        >
          <div className="relative">
            <Library className="w-5 h-5 mb-0.5" />
            {bookmarks.length > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-emerald-400 text-emerald-950 text-[9px] font-bold rounded-full flex items-center justify-center">
                {bookmarks.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight">{t[lang].bookmarks}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('queue');
            setIsQueueOpen(true);
            setIsBookmarksOpen(false);
            setIsTrainingOpen(false);
          }}
          className={`min-h-[48px] flex-1 flex flex-col items-center justify-center transition-colors relative ${
            isQueueOpen ? 'text-emerald-400' : 'text-emerald-500/50 hover:text-emerald-400'
          }`}
        >
          <div className="relative">
            <ListMusic className="w-5 h-5 mb-0.5" />
            {queue.length > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-emerald-400 text-emerald-950 text-[9px] font-bold rounded-full flex items-center justify-center">
                {queue.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight">{t[lang].queue}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('training');
            setIsTrainingOpen(true);
            setIsBookmarksOpen(false);
            setIsQueueOpen(false);
          }}
          className={`min-h-[48px] flex-1 flex flex-col items-center justify-center transition-colors ${
            isTrainingOpen ? 'text-emerald-400' : 'text-emerald-500/50 hover:text-emerald-400'
          }`}
        >
          <GraduationCap className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">{t[lang].voiceTraining}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('studio');
            setIsStudioOpen(true);
            setIsBookmarksOpen(false);
            setIsQueueOpen(false);
            setIsTrainingOpen(false);
          }}
          className={`min-h-[48px] flex-1 flex flex-col items-center justify-center transition-colors ${
            isStudioOpen ? 'text-emerald-400' : 'text-emerald-500/50 hover:text-emerald-400'
          }`}
        >
          <Sliders className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Studio</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* DESKTOP FLOATING PLAYER BAR                                               */}
      {/* ========================================================================= */}
      <motion.div 
        animate={isPlaying ? { boxShadow: "0 0 40px rgba(16,185,129,0.15)" } : { boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
        className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl bg-emerald-950/85 backdrop-blur-xl border border-emerald-800/50 rounded-3xl p-5 shadow-2xl z-50 overflow-hidden"
      >
        {isPlaying && (
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/5 to-transparent pointer-events-none"
          />
        )}
        
        <div className="flex items-center gap-6">
          {/* Current Track Info */}
          <div className="flex items-center space-x-4 w-60 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-900/50 border border-emerald-800/50 flex items-center justify-center text-emerald-400 font-mono text-lg shadow-inner shrink-0">
              {currentSurah.id}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-serif text-emerald-300 truncate">{currentSurah.name_arabic}</h2>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-mono font-bold shrink-0">
                  #{currentSurah.id}
                </span>
              </div>
              <p className="text-xs text-emerald-200/60 truncate">{currentSurah.name_english}</p>
            </div>
          </div>

          {/* Controls & Scrubber */}
          <div className="flex-1 flex flex-col items-center">
            <div className="flex items-center space-x-6 mb-2">
              <button 
                onClick={skipToBeginning}
                className="text-emerald-400/60 hover:text-emerald-300 transition-colors"
                title="Restart Surah"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button 
                onClick={playPrevious}
                disabled={currentSurah.id === 1}
                className="text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-30"
              >
                <SkipBack className="w-5 h-5" fill="currentColor" />
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-emerald-950 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" fill="currentColor" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                )}
              </button>

              <button 
                onClick={playNext}
                disabled={currentSurah.id === 114}
                className="text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-30"
              >
                <SkipForward className="w-5 h-5" fill="currentColor" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center w-full space-x-3 text-xs font-mono text-emerald-400/60">
              <span className="w-10 text-right tabular-nums">{formatTime(progress)}</span>
              <div className="relative flex-1 h-5 flex items-center group">
                <div className="absolute w-full h-1.5 bg-emerald-900/30 rounded-full overflow-hidden">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                    style={{ width: `${(progress / (duration || 100)) * 100}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={progress}
                  onChange={handleSeek}
                  className="absolute w-full h-1.5 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-emerald-50 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-500"
                />
              </div>
              <span className="w-10 tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Actions & Speed Control */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setIsTrainingOpen(!isTrainingOpen)}
              className={`p-2.5 rounded-xl border transition-all ${
                isTrainingOpen 
                  ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                  : 'bg-emerald-900/40 border-emerald-800/30 text-emerald-400 hover:border-emerald-500/50'
              }`}
              title="Voice Training"
            >
              <GraduationCap className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsBookmarksOpen(!isBookmarksOpen)}
              className={`p-2.5 rounded-xl border transition-all relative ${
                isBookmarksOpen 
                  ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                  : 'bg-emerald-900/40 border-emerald-800/30 text-emerald-400 hover:border-emerald-500/50'
              }`}
              title="Bookmarks"
            >
              <Library className="w-4 h-4" />
              {bookmarks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 text-emerald-950 text-[10px] font-bold rounded-full flex items-center justify-center border border-emerald-950">
                  {bookmarks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              className={`p-2.5 rounded-xl border transition-all relative ${
                isQueueOpen 
                  ? 'bg-emerald-500 text-emerald-950 border-emerald-400' 
                  : 'bg-emerald-900/40 border-emerald-800/30 text-emerald-400 hover:border-emerald-500/50'
              }`}
              title="Queue"
            >
              <ListMusic className="w-4 h-4" />
              {queue.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 text-emerald-950 text-[10px] font-bold rounded-full flex items-center justify-center border border-emerald-950">
                  {queue.length}
                </span>
              )}
            </button>

            {/* Speed Selector */}
            <div className="flex flex-col items-center space-y-0.5 px-1">
              <span className="text-[9px] uppercase tracking-widest text-emerald-500/50 font-bold font-mono">
                {playbackSpeed.toFixed(2)}x
              </span>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.05}
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="w-20 h-1 bg-emerald-900/50 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>

            <button 
              onClick={toggleMute}
              className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* FULL-SCREEN MOBILE NOW PLAYING SHEET                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isMobilePlayerOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="md:hidden fixed inset-0 z-50 bg-emerald-950 flex flex-col justify-between p-6 pb-safe pt-safe overflow-y-auto"
          >
            {/* Top Bar with Chevron Down & Surah Info */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setIsMobilePlayerOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-emerald-400/80 hover:text-emerald-300 -ml-2"
                aria-label="Collapse player"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
              
              <div className="text-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400/60 block">
                  {t[lang].nowPlaying}
                </span>
                <span className="text-xs font-serif text-emerald-300 font-medium">
                  {t[lang].recitationBy}
                </span>
              </div>

              <button
                onClick={() => setShowCC(!showCC)}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-all ${
                  showCC 
                    ? 'bg-emerald-500 text-emerald-950 border-emerald-400' 
                    : 'text-emerald-400/70 border-emerald-800/40'
                }`}
                title="Verses CC"
              >
                <ClosedCaption className="w-5 h-5" />
              </button>
            </div>

            {/* Middle: Ornate Calligraphy Medallion */}
            <div className="flex-1 flex flex-col items-center justify-center py-6">
              <div className="relative w-48 h-48 rounded-full border-4 border-emerald-500/20 flex flex-col items-center justify-center p-6 shadow-[0_0_50px_rgba(16,185,129,0.1)] bg-emerald-900/20 backdrop-blur-md">
                {isPlaying && (
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.35, 0.15] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full border border-emerald-400/40 pointer-events-none"
                  />
                )}
                <span className="text-xs font-mono text-emerald-500/60 mb-1">SURAH {currentSurah.id}</span>
                <span className="text-4xl font-serif text-emerald-300 font-bold mb-2">
                  {currentSurah.name_arabic}
                </span>
                <span className="text-xs font-medium text-emerald-100 tracking-wider">
                  {currentSurah.name_english}
                </span>
              </div>

              {/* Verses inside player if CC active */}
              {showCC && (
                <div className="w-full mt-4 max-h-36 overflow-y-auto custom-scrollbar p-3 rounded-2xl bg-emerald-900/30 border border-emerald-800/40">
                  {isLoadingVerses ? (
                    <div className="flex items-center justify-center py-4 text-emerald-400">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      <span className="text-xs">{t[lang].loadingVerses}</span>
                    </div>
                  ) : verses.length > 0 ? (
                    <div className="space-y-2 text-right">
                      {verses.map(v => (
                        <p key={v.number} className="text-base font-serif text-emerald-50 leading-relaxed">
                          {v.text}
                          <span className="inline-block text-[10px] font-mono text-emerald-400/60 mx-1">
                            ({v.numberInSurah || v.number})
                          </span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-center text-emerald-500/40">{t[lang].loadingVerses}</p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Controls Area */}
            <div className="space-y-4">
              {/* Scrubber */}
              <div className="space-y-1.5">
                <div className="relative w-full h-8 flex items-center">
                  <div className="w-full h-2 bg-emerald-900/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400"
                      style={{ width: `${(progress / (duration || 100)) * 100}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={progress}
                    onChange={handleSeek}
                    className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-emerald-50 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-emerald-400/70 tabular-nums">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Primary Controls */}
              <div className="flex items-center justify-between px-4">
                <button
                  onClick={skipToBeginning}
                  className="min-h-[48px] min-w-[48px] flex items-center justify-center text-emerald-400/60 hover:text-emerald-300"
                  aria-label="Restart"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={playPrevious}
                  disabled={currentSurah.id === 1}
                  className="min-h-[48px] min-w-[48px] flex items-center justify-center text-emerald-400 hover:text-emerald-300 disabled:opacity-30"
                  aria-label="Previous Surah"
                >
                  <SkipBack className="w-7 h-7" fill="currentColor" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95 transition-transform"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" fill="currentColor" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" fill="currentColor" />
                  )}
                </button>

                <button
                  onClick={playNext}
                  disabled={currentSurah.id === 114}
                  className="min-h-[48px] min-w-[48px] flex items-center justify-center text-emerald-400 hover:text-emerald-300 disabled:opacity-30"
                  aria-label="Next Surah"
                >
                  <SkipForward className="w-7 h-7" fill="currentColor" />
                </button>

                <button
                  onClick={toggleMute}
                  className="min-h-[48px] min-w-[48px] flex items-center justify-center text-emerald-400/60 hover:text-emerald-300"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>

              {/* Speed Buttons Grid (Ergonomic thumb-friendly chips) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400/60">
                    {t[lang].speed}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    {playbackSpeed.toFixed(2)}x
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1 bg-emerald-900/30 p-1 rounded-xl border border-emerald-800/40">
                  {speedOptions.map(spd => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`min-h-[36px] py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                        playbackSpeed === spd 
                          ? 'bg-emerald-500 text-emerald-950 shadow-sm' 
                          : 'text-emerald-400/60 hover:text-emerald-300'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  onClick={() => {
                    setIsMobilePlayerOpen(false);
                    setIsTrainingOpen(true);
                  }}
                  className="min-h-[44px] px-4 rounded-xl bg-emerald-900/40 border border-emerald-800/40 text-emerald-300 text-xs font-medium flex items-center space-x-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{t[lang].voiceTraining}</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobilePlayerOpen(false);
                    setIsQueueOpen(true);
                  }}
                  className="min-h-[44px] px-4 rounded-xl bg-emerald-900/40 border border-emerald-800/40 text-emerald-300 text-xs font-medium flex items-center space-x-2"
                >
                  <ListMusic className="w-4 h-4" />
                  <span>{t[lang].queue}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* BOOKMARKS PANEL (Bottom Sheet on mobile, Right Drawer on desktop)          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isBookmarksOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookmarksOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 max-h-[85vh] h-[85vh] md:h-full md:top-0 md:right-0 md:left-auto md:w-full md:max-w-md bg-emerald-950 border-t md:border-t-0 md:border-l border-emerald-800/50 rounded-t-3xl md:rounded-none z-[70] shadow-2xl flex flex-col pb-safe"
            >
              {/* Mobile grab handle affordance */}
              <div className="w-12 h-1.5 bg-emerald-700/50 rounded-full mx-auto my-3 md:hidden" />

              <div className="p-4 md:p-6 border-b border-emerald-800/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Library className="w-6 h-6 text-emerald-400 mx-1" />
                  <h2 className="text-xl font-serif text-emerald-50">{t[lang].bookmarks}</h2>
                </div>
                <button 
                  onClick={() => setIsBookmarksOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-emerald-900/50 text-emerald-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {bookmarks.length === 0 ? (
                      <motion.div
                        key="empty-bookmarks"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center text-emerald-500/40 space-y-4 py-16"
                      >
                        <Bookmark className="w-12 h-12 opacity-20" />
                        <p className="text-center text-sm">{t[lang].noBookmarks}<br/>{t[lang].tapBookmark}</p>
                      </motion.div>
                    ) : (
                      bookmarks.map((bookmark) => (
                        <motion.div
                          layout
                          key={bookmark.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="p-4 rounded-2xl bg-emerald-900/20 border border-emerald-800/20 hover:border-emerald-500/30 transition-all cursor-pointer group active:scale-[0.99]"
                          onClick={() => {
                            const surah = surahs.find(s => s.id === bookmark.surahId);
                            if (surah) {
                              playSurah(surah);
                              setShowCC(true);
                              setIsBookmarksOpen(false);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-mono text-emerald-500/60">Surah {bookmark.surahId}</span>
                              <h4 className="text-sm font-medium text-emerald-400">{bookmark.surahName}</h4>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setBookmarks(prev => prev.filter(b => b.id !== bookmark.id));
                              }}
                              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-emerald-500/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-right text-lg font-serif text-emerald-50 leading-relaxed">
                            {bookmark.text}
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-emerald-500/20 text-[10px] font-mono text-emerald-500/50 mr-2">
                              {bookmark.verseNumber}
                            </span>
                          </p>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* VOICE TRAINING PANEL (Bottom Sheet on mobile, Right Drawer on desktop)    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isTrainingOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTrainingOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 max-h-[88vh] h-[88vh] md:h-full md:top-0 md:right-0 md:left-auto md:w-full md:max-w-md bg-emerald-950 border-t md:border-t-0 md:border-l border-emerald-800/50 rounded-t-3xl md:rounded-none z-[70] shadow-2xl flex flex-col pb-safe"
            >
              {/* Mobile grab handle affordance */}
              <div className="w-12 h-1.5 bg-emerald-700/50 rounded-full mx-auto my-3 md:hidden" />

              <div className="p-4 md:p-6 border-b border-emerald-800/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <GraduationCap className="w-6 h-6 text-emerald-400 mx-1" />
                  <h2 className="text-xl font-serif text-emerald-50">{t[lang].voiceTraining}</h2>
                </div>
                <button 
                  onClick={() => setIsTrainingOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-emerald-900/50 text-emerald-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center space-y-6 custom-scrollbar">
                <div className="text-center space-y-1">
                  <span className="text-xs font-mono uppercase tracking-widest text-emerald-500/60">
                    Surah {currentSurah.id} · {currentSurah.name_english}
                  </span>
                  <h3 className="text-3xl font-serif text-emerald-300">{currentSurah.name_arabic}</h3>
                  <p className="text-emerald-400/70 font-medium text-sm">{t[lang].recordRecitation}</p>
                </div>

                <div className="w-44 h-44 rounded-full border-4 border-emerald-800/30 flex items-center justify-center relative shadow-[0_0_50px_rgba(16,185,129,0.05)]">
                  {isRecording && (
                    <motion.div
                      animate={{ scale: [1, 1.25, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 bg-red-500/20 rounded-full"
                    />
                  )}
                  <button
                    onClick={isRecording ? stopTrainingRecording : startTrainingRecording}
                    className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all relative z-10 active:scale-95 ${
                      isRecording 
                        ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]' 
                        : 'bg-emerald-500 text-emerald-950 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 hover:bg-emerald-400'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-9 h-9 mb-1.5" fill="currentColor" />
                        <span className="text-xs font-bold uppercase tracking-wider">{t[lang].stop}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-9 h-9 mb-1.5" />
                        <span className="text-xs font-bold uppercase tracking-wider">{t[lang].record}</span>
                      </>
                    )}
                  </button>
                </div>

                {recordedAudioUrl && !isRecording && (
                  <motion.div 
                    key="recorded-audio"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-emerald-900/30 p-4 rounded-2xl border border-emerald-800/50 space-y-3"
                  >
                    <h4 className="text-sm font-medium text-emerald-400 text-center">{t[lang].yourRecitation}</h4>
                    <div className="w-full">
                      <audio 
                        controls 
                        src={recordedAudioUrl} 
                        className="w-full h-10"
                      />
                    </div>
                    <div className="flex justify-center">
                      <button 
                        onClick={resetTraining}
                        className="min-h-[40px] px-4 rounded-xl text-xs text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest font-bold"
                      >
                        {t[lang].discard}
                      </button>
                    </div>
                  </motion.div>
                )}
                
                {!recordedAudioUrl && !isRecording && (
                  <div className="text-xs text-emerald-500/50 text-center px-4 max-w-xs">
                    {t[lang].trainingDesc}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* QUEUE PANEL (Bottom Sheet on mobile, Right Drawer on desktop)             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isQueueOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQueueOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 max-h-[85vh] h-[85vh] md:h-full md:top-0 md:right-0 md:left-auto md:w-full md:max-w-md bg-emerald-950 border-t md:border-t-0 md:border-l border-emerald-800/50 rounded-t-3xl md:rounded-none z-[70] shadow-2xl flex flex-col pb-safe"
            >
              {/* Mobile grab handle affordance */}
              <div className="w-12 h-1.5 bg-emerald-700/50 rounded-full mx-auto my-3 md:hidden" />

              <div className="p-4 md:p-6 border-b border-emerald-800/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ListMusic className="w-6 h-6 text-emerald-400 mx-1" />
                  <h2 className="text-xl font-serif text-emerald-50">{t[lang].queue}</h2>
                </div>
                <button 
                  onClick={() => setIsQueueOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-emerald-900/50 text-emerald-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <Reorder.Group 
                  axis="y" 
                  values={queue} 
                  onReorder={setQueue}
                  className="space-y-2.5"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    {queue.length === 0 ? (
                      <motion.div
                        key="empty-queue"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="h-full flex flex-col items-center justify-center text-emerald-500/40 space-y-4 py-16"
                      >
                        <Music className="w-12 h-12 opacity-20" />
                        <p className="text-center text-sm">{t[lang].emptyQueue}<br/>{t[lang].addFromList}</p>
                      </motion.div>
                    ) : (
                      queue.map((surah, index) => (
                        <Reorder.Item
                          key={surah.queueId}
                          value={surah}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ 
                            opacity: 0, 
                            x: -50, 
                            filter: "blur(4px)",
                            transition: { duration: 0.2 } 
                          }}
                          className="flex items-center justify-between p-3 rounded-xl bg-emerald-900/20 border border-emerald-800/20 group hover:border-emerald-500/30 transition-all shadow-sm cursor-grab active:cursor-grabbing min-h-[52px]"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-emerald-500/40 group-hover:text-emerald-400 transition-colors p-1">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-emerald-900/50 flex items-center justify-center text-xs font-mono text-emerald-400">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-emerald-50">{surah.name_english}</h4>
                              <p className="text-[10px] text-emerald-400/60 font-serif">{surah.name_arabic}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFromQueue(surah.queueId)}
                            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-emerald-500/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </Reorder.Item>
                      ))
                    )}
                  </AnimatePresence>
                </Reorder.Group>
              </div>

              {queue.length > 0 && (
                <div className="p-4 md:p-6 border-t border-emerald-800/50">
                  <button 
                    onClick={clearQueue}
                    className="w-full min-h-[48px] rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-[0.99] transition-all text-sm font-medium border border-red-500/20"
                  >
                    {t[lang].clearQueue}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* STUDIO EDITOR & DRIVE STORE & EXPORT BIN_HTML MODAL                        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isStudioOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStudioOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80]"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-emerald-950/95 border border-emerald-700/50 rounded-3xl shadow-2xl z-[90] flex flex-col overflow-hidden text-emerald-50 backdrop-blur-xl"
            >
              {/* Modal Header */}
              <div className="p-4 md:p-6 border-b border-emerald-800/60 flex items-center justify-between bg-emerald-900/40">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-emerald-100 flex items-center gap-2">
                      <span>SAHBI S.A. · Studio Editor</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">AI23</span>
                    </h3>
                    <p className="text-xs text-emerald-400/70 font-mono">Bouton Export BIN_HTML.LANCER & Drive Store</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsStudioOpen(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-900/60 text-emerald-400/80 hover:text-emerald-200 hover:bg-emerald-800/60 transition-all border border-emerald-800/40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-emerald-800/50 bg-emerald-950/60 px-4 pt-2 gap-1 overflow-x-auto">
                <button
                  onClick={() => setStudioTab('editor')}
                  className={`min-h-[40px] px-3.5 py-2 rounded-t-xl text-xs font-semibold flex items-center space-x-2 transition-all border-b-2 ${
                    studioTab === 'editor'
                      ? 'border-emerald-400 text-emerald-300 bg-emerald-900/30'
                      : 'border-transparent text-emerald-400/60 hover:text-emerald-300'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Studio Editor</span>
                </button>
                <button
                  onClick={() => setStudioTab('export')}
                  className={`min-h-[40px] px-3.5 py-2 rounded-t-xl text-xs font-semibold flex items-center space-x-2 transition-all border-b-2 ${
                    studioTab === 'export'
                      ? 'border-emerald-400 text-emerald-300 bg-emerald-900/30'
                      : 'border-transparent text-emerald-400/60 hover:text-emerald-300'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Export BIN_HTML</span>
                </button>
                <button
                  onClick={() => setStudioTab('drivestore')}
                  className={`min-h-[40px] px-3.5 py-2 rounded-t-xl text-xs font-semibold flex items-center space-x-2 transition-all border-b-2 ${
                    studioTab === 'drivestore'
                      ? 'border-emerald-400 text-emerald-300 bg-emerald-900/30'
                      : 'border-transparent text-emerald-400/60 hover:text-emerald-300'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Drive Store</span>
                </button>
                <button
                  onClick={() => setStudioTab('ai23')}
                  className={`min-h-[40px] px-3.5 py-2 rounded-t-xl text-xs font-semibold flex items-center space-x-2 transition-all border-b-2 ${
                    studioTab === 'ai23'
                      ? 'border-emerald-400 text-emerald-300 bg-emerald-900/30'
                      : 'border-transparent text-emerald-400/60 hover:text-emerald-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SAHBI SA AI23</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
                {/* TAB 1: STUDIO EDITOR */}
                {studioTab === 'editor' && (
                  <div className="space-y-5">
                    <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-2xl p-4 space-y-4">
                      <h4 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                        <span>Paramètres Audio & Récitateur</span>
                      </h4>

                      <div>
                        <label className="text-xs text-emerald-400/80 block mb-1.5 font-medium">Nom du Récitateur</label>
                        <input
                          type="text"
                          value={reciterName}
                          onChange={(e) => setReciterName(e.target.value)}
                          className="w-full bg-emerald-950/80 border border-emerald-800/60 rounded-xl px-3 py-2 text-sm text-emerald-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-emerald-400/80 block mb-1.5 font-medium">Qualité Audio (Bitrate)</label>
                          <select
                            value={audioQuality}
                            onChange={(e) => setAudioQuality(e.target.value)}
                            className="w-full bg-emerald-950/80 border border-emerald-800/60 rounded-xl px-3 py-2 text-sm text-emerald-100 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="64k">64 kbps (Économie)</option>
                            <option value="128k">128 kbps (Standard MP3)</option>
                            <option value="192k">192 kbps (Haute Définition)</option>
                            <option value="320k">320 kbps (Studio Master)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-emerald-400/80 block mb-1.5 font-medium">Thème Visuel</label>
                          <select
                            value={theme}
                            onChange={(e) => setTheme(e.target.value as 'emerald' | 'mythos')}
                            className="w-full bg-emerald-950/80 border border-emerald-800/60 rounded-xl px-3 py-2 text-sm text-emerald-100 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="emerald">Emerald (Vert Émeraude)</option>
                            <option value="mythos">Mythos (Noir & Or Céleste)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-emerald-400/80 block mb-1.5 font-medium">URL Serveur / CDN Audio personnalisé</label>
                        <input
                          type="text"
                          value={customCdnUrl}
                          onChange={(e) => setCustomCdnUrl(e.target.value)}
                          placeholder="https://server7.mp3quran.net/shur/"
                          className="w-full bg-emerald-950/80 border border-emerald-800/60 rounded-xl px-3 py-2 text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                        />
                        <p className="text-[11px] text-emerald-400/60 mt-1">Exemple: https://server7.mp3quran.net/shur/ (suffixé par 001.mp3 à 114.mp3)</p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <span className="text-sm font-medium text-emerald-200 block">Mise en cache automatique à la lecture</span>
                          <span className="text-xs text-emerald-400/60">Télécharge automatiquement la sourate en local dès qu'elle est jouée</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={autoCacheOnPlay}
                          onChange={(e) => setAutoCacheOnPlay(e.target.checked)}
                          className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={saveStudioSettings}
                        className="flex-1 min-h-[46px] rounded-xl bg-emerald-500 text-emerald-950 font-bold hover:bg-emerald-400 active:scale-98 transition-all flex items-center justify-center space-x-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Enregistrer les Paramètres Studio</span>
                      </button>
                      <button
                        onClick={() => {
                          setCustomCdnUrl('https://server7.mp3quran.net/shur/');
                          setReciterName('Sheikh Saud Al-Shuraim');
                          setAudioQuality('128k');
                          setAutoCacheOnPlay(false);
                          showToast('Paramètres réinitialisés par défaut');
                        }}
                        className="min-h-[46px] px-4 rounded-xl border border-emerald-800/60 bg-emerald-950/60 text-emerald-400 hover:text-emerald-200 transition-all text-xs font-semibold"
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: EXPORT BIN_HTML.LANCER */}
                {studioTab === 'export' && (
                  <div className="space-y-5">
                    <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/20 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center space-x-2.5 text-emerald-300">
                        <FileCode className="w-5 h-5" />
                        <h4 className="text-base font-bold">Exportateur Binaire HTML (Lancer_bin.html)</h4>
                      </div>
                      <p className="text-xs md:text-sm text-emerald-200/80 leading-relaxed">
                        Le fichier autonome <strong>BIN_HTML.LANCER.html</strong> inclut l'intégralité du lecteur, des 114 sourates, du cache hors-ligne, de l'audio haute-fidélité, du Drive Store et de l'interface mobile sans dépendance externe requise.
                      </p>

                      <div className="pt-2 flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={handleExportBinHtml}
                          className="flex-1 min-h-[48px] rounded-xl bg-emerald-400 text-emerald-950 font-bold hover:bg-emerald-300 active:scale-98 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/50"
                        >
                          <Download className="w-4 h-4" />
                          <span>Télécharger BIN_HTML.LANCER.html</span>
                        </button>
                        <button
                          onClick={handleCopyBinHtml}
                          className="min-h-[48px] px-4 rounded-xl border border-emerald-600/40 bg-emerald-900/60 text-emerald-300 hover:bg-emerald-900/80 transition-all text-xs font-semibold flex items-center justify-center space-x-1.5"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copier HTML</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-2xl p-4 space-y-3">
                      <h5 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Lanceurs & Fichiers Compagnons</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <a
                          href="/Lancer_bin.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-between text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-900/30 transition-all"
                        >
                          <span className="font-mono font-medium">/Lancer_bin.html</span>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                        </a>
                        <a
                          href="/Lancer_bin.html#mobile"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-between text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-900/30 transition-all"
                        >
                          <span className="font-mono font-medium">Form Mobile Launcher</span>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: DRIVE STORE */}
                {studioTab === 'drivestore' && (
                  <div className="space-y-5">
                    <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-2xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                          <Database className="w-4 h-4 text-emerald-400" />
                          <span>Statut du Drive Store</span>
                        </h4>
                        {driveStoreSavedTime && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                            Dernière synchro : {driveStoreSavedTime}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/50">
                          <div className="text-lg font-bold text-emerald-400">{downloadedSurahs.size}</div>
                          <div className="text-[10px] text-emerald-500/70 uppercase">Sourates en Cache</div>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/50">
                          <div className="text-lg font-bold text-emerald-400">{bookmarks.length}</div>
                          <div className="text-[10px] text-emerald-500/70 uppercase">Favoris Sauvegardés</div>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/50">
                          <div className="text-lg font-bold text-emerald-400">{queue.length}</div>
                          <div className="text-[10px] text-emerald-500/70 uppercase">File d'Attente</div>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/50">
                          <div className="text-lg font-bold text-emerald-400">{theme.toUpperCase()}</div>
                          <div className="text-[10px] text-emerald-500/70 uppercase">Thème Actif</div>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col gap-2.5">
                        <button
                          onClick={handleDriveStoreSave}
                          className="w-full min-h-[46px] rounded-xl bg-emerald-500 text-emerald-950 font-bold hover:bg-emerald-400 transition-all flex items-center justify-center space-x-2"
                        >
                          <HardDrive className="w-4 h-4" />
                          <span>Synchroniser & Sauvegarder dans le Drive Store</span>
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={handleDriveStoreExport}
                            className="flex-1 min-h-[42px] rounded-xl border border-emerald-700/60 bg-emerald-900/50 text-emerald-200 hover:bg-emerald-900/80 transition-all text-xs font-semibold flex items-center justify-center space-x-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Exporter Sauvegarde (JSON)</span>
                          </button>

                          <label className="flex-1 min-h-[42px] rounded-xl border border-emerald-700/60 bg-emerald-900/50 text-emerald-200 hover:bg-emerald-900/80 transition-all text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Restaurer (JSON)</span>
                            <input
                              type="file"
                              accept=".json"
                              onChange={handleDriveStoreRestore}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleClearDriveStore}
                        className="w-full min-h-[40px] rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs font-medium"
                      >
                        Vider tout le cache et réinitialiser le Drive Store
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 4: SAHBI SA AI23 */}
                {studioTab === 'ai23' && (
                  <div className="space-y-4">
                    <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center space-x-2 text-emerald-300">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-sm font-bold">SAHBI S.A. AI23 Recitation Core</h4>
                      </div>
                      <p className="text-xs text-emerald-200/80 leading-relaxed font-mono">
                        IA_LOGIC_SIGNATURE: ZOUBIROU-IA-2025<br />
                        LICENSE: NETSECUREPRO.CA · GEMIN CORE V7 PRO FINAL<br />
                        FRAMEWORK: MPLAYER-ISLAM · 114 SURAHS
                      </p>
                    </div>

                    <div className="bg-emerald-950/80 border border-emerald-800/50 rounded-2xl p-4 space-y-2">
                      <h5 className="text-xs font-semibold text-emerald-300">Capacités & Modules Actifs</h5>
                      <ul className="text-xs text-emerald-300/80 space-y-1.5 list-disc list-inside">
                        <li>Reconnaissance vocale multilingue (Arabe, Français, Anglais)</li>
                        <li>Entraînement et enregistrement vocal en temps réel</li>
                        <li>Sous-titres & affichage verset par verset (API AlQuran Cloud)</li>
                        <li>Cache binaire local & persistance Drive Store (IndexedDB + Storage)</li>
                        <li>Exportateur binaire HTML tout-en-un autonome (Lancer_bin.html)</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-emerald-900/30 rounded-xl border border-emerald-500/30 text-center">
                      <span className="text-xs text-emerald-300 font-semibold block mb-1">Formulaire Mobile Optimisé</span>
                      <a 
                        href="/Lancer_bin.html" 
                        className="inline-block px-4 py-2 bg-emerald-500 text-emerald-950 text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors"
                      >
                        Ouvrir Lancer_bin.html Binaire
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 z-[100] bg-emerald-900/90 text-emerald-100 border border-emerald-500/40 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold flex items-center space-x-2 backdrop-blur-lg"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
