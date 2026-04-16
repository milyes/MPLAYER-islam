/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Search, Music, Download, Trash2, CheckCircle, Loader2, ListMusic, Plus, X, GripVertical, Mic, MicOff, ClosedCaption, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { surahs } from './data/surahs';
import { isSurahCached, downloadSurah, deleteCachedSurah, getCachedAudioUrl, getAllCachedSurahIds } from './lib/cache';

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
  const [verses, setVerses] = useState<{ number: number, text: string, numberInSurah?: number }[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);

  const filteredSurahs = surahs.filter(s => {
    const matchesSearch = s.name_arabic.includes(searchQuery) || 
      s.name_english.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !showDownloadedOnly || downloadedSurahs.has(s.id);
    return matchesSearch && matchesFilter;
  });

  // Initialize downloaded surahs
  useEffect(() => {
    getAllCachedSurahIds().then(ids => setDownloadedSurahs(new Set(ids)));

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

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

  // Fetch verses for CC
  useEffect(() => {
    if (showCC) {
      const fetchVerses = async () => {
        setIsLoadingVerses(true);
        try {
          const response = await fetch(`https://api.alquran.cloud/v1/surah/${currentSurah.id}`);
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
  }, [currentSurah.id, showCC]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
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
        setAudioSrc(`https://server7.mp3quran.net/shur/${paddedId}.mp3`);
      }
    };
    updateAudioSrc();
  }, [currentSurah]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      } else {
        audioRef.current.pause();
      }
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [isPlaying, currentSurah, playbackSpeed]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  const skipToBeginning = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
    }
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
      // If deleting the current playing surah, we might need to refresh the src
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

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-emerald-50 font-sans selection:bg-emerald-900/50">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-emerald-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-900/20 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 h-screen flex flex-col">
        {/* Header */}
        <header className="flex flex-col items-center justify-center mb-10 space-y-2">
          <h1 className="text-4xl md:text-5xl font-serif text-emerald-400 tracking-wide text-center">
            القرآن الكريم
          </h1>
          <p className="text-emerald-200/60 text-lg tracking-widest uppercase font-medium">
            بصوت الشيخ سعود الشريم
          </p>
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center space-x-2 text-emerald-400 text-sm font-mono mt-2"
              >
                <PlayingAnimation />
                <span>Now Reciting: {currentSurah.name_english}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-8 max-w-2xl mx-auto w-full">
          <div className="relative flex-1 w-full flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-emerald-500/50" />
            </div>
            <input
              type="text"
              placeholder="Search Surah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-3 bg-emerald-950/30 border border-emerald-800/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-emerald-100 placeholder-emerald-500/50 transition-all backdrop-blur-sm"
            />
            <button
              onClick={toggleListening}
              className={`absolute right-3 p-2 rounded-xl transition-all ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10'
              }`}
              title={isListening ? "Stop Listening" : "Voice Search"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          <button
            onClick={() => setShowDownloadedOnly(!showDownloadedOnly)}
            className={`px-6 py-3 rounded-2xl border transition-all flex items-center space-x-2 whitespace-nowrap ${
              showDownloadedOnly 
                ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-emerald-950/30 border-emerald-800/30 text-emerald-400 hover:border-emerald-500/50'
            }`}
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Offline Only</span>
          </button>
        </div>

        {/* Featured Surah Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={currentSurah.id}
          className="mb-8 p-6 rounded-3xl bg-emerald-900/20 border border-emerald-800/30 backdrop-blur-md flex flex-col items-stretch gap-6"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl font-mono text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                {currentSurah.id}
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h2 className="text-3xl font-serif text-emerald-50">{currentSurah.name_english}</h2>
                  <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                    Surah {currentSurah.id}
                  </span>
                </div>
                <p className="text-emerald-400/60 flex items-center space-x-2">
                  <Music className="w-4 h-4" />
                  <span>Recitation by Sheikh Saud Al-Shuraim</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-serif text-emerald-400 mb-2">
                {currentSurah.name_arabic}
              </div>
              <div className="flex items-center justify-end space-x-4">
                <div className="text-xs text-emerald-500/40 font-mono uppercase tracking-widest">
                  Quran Position: {currentSurah.id} / 114
                </div>
              </div>
            </div>
          </div>

          {/* CC Module (Verses Display) */}
          {showCC && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-6 border-t border-emerald-800/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-emerald-400 text-sm font-medium flex items-center space-x-2">
                  <ClosedCaption className="w-4 h-4" />
                  <span>Verses (Arabic)</span>
                </h3>
                {isLoadingVerses && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
              </div>
              <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {verses.length > 0 ? (
                  verses.map((ayah) => (
                    <div key={ayah.number} className="text-right">
                      <p className="text-2xl font-serif text-emerald-50 leading-relaxed">
                        {ayah.text}
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-emerald-500/20 text-xs font-mono text-emerald-500/50 mr-2">
                          {ayah.numberInSurah || ayah.number}
                        </span>
                      </p>
                    </div>
                  ))
                ) : !isLoadingVerses && (
                  <p className="text-center text-emerald-500/30 italic py-4">Loading verses...</p>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Surah List */}
        <div className="flex-1 overflow-y-auto pr-2 pb-32 space-y-2 custom-scrollbar">
            {filteredSurahs.map((surah) => {
              const isActive = currentSurah.id === surah.id;
              return (
                <motion.div
                  key={surah.id}
                  role="button"
                  tabIndex={0}
                  whileHover={{ 
                    scale: 1.01, 
                    backgroundColor: 'rgba(6, 78, 59, 0.4)',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)'
                  }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => playSurah(surah)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      playSurah(surah);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border group relative overflow-hidden cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isActive 
                      ? 'bg-emerald-900/40 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                      : 'bg-emerald-950/20 border-transparent hover:border-emerald-800/30'
                  }`}
                >
                  {isActive && isPlaying && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.05, 0.15, 0.05] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-emerald-400 pointer-events-none"
                    />
                  )}
                  <div className="flex items-center space-x-4 relative z-10">
                    <div className={`w-10 h-10 rounded-full flex flex-col items-center justify-center font-mono text-[10px] transition-all ${
                      isActive ? 'bg-emerald-500 text-emerald-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-emerald-900/50 text-emerald-400 group-hover:bg-emerald-800'
                    }`}>
                      {isActive && isPlaying ? <PlayingAnimation /> : (
                        <>
                          <span className="opacity-50 scale-75">NO.</span>
                          <span className="text-sm font-bold -mt-1">{surah.id}</span>
                        </>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-medium text-lg transition-colors ${isActive ? 'text-emerald-400' : 'text-emerald-50'}`}>
                          {surah.name_english}
                        </h3>
                        {isActive && (
                          <motion.span 
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-tighter font-bold"
                          >
                            Now Playing
                          </motion.span>
                        )}
                      </div>
                      <p className="text-sm text-emerald-400/60">Surah {surah.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 relative z-10">
                    <div className={`text-2xl font-serif transition-colors relative z-10 ${isActive ? 'text-emerald-400' : 'text-emerald-300'}`}>
                      {surah.name_arabic}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => addToQueue(e, surah)}
                        className="p-2 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                        title="Add to queue"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      
                      {downloadedSurahs.has(surah.id) ? (
                        <button
                          onClick={(e) => handleDelete(e, surah.id)}
                          className="p-2 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                          title="Delete offline copy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleDownload(e, surah.id)}
                          disabled={downloadingSurahs.has(surah.id)}
                          className="p-2 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                          title="Download for offline"
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
                </motion.div>
              );
            })}
          {filteredSurahs.length === 0 && (
            <div className="text-center text-emerald-500/50 py-10">
              No Surahs found matching "{searchQuery}"
            </div>
          )}
        </div>

        <motion.div 
          animate={isPlaying ? { boxShadow: "0 0 40px rgba(16,185,129,0.15)" } : { boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl bg-emerald-950/80 backdrop-blur-xl border border-emerald-800/50 rounded-3xl p-4 md:p-6 shadow-2xl z-50 overflow-hidden"
        >
          {isPlaying && (
            <motion.div
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/5 to-transparent pointer-events-none"
            />
          )}
          <audio
            ref={audioRef}
            src={audioSrc || undefined}
            onTimeUpdate={handleTimeUpdate}
            onEnded={playNext}
            onLoadedMetadata={handleTimeUpdate}
            muted={isMuted}
          />
          
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            {/* Current Track Info */}
            <div className="flex-1 flex items-center space-x-4 w-full md:w-auto">
              <div className="hidden sm:flex w-12 h-12 rounded-xl bg-emerald-900/50 border border-emerald-800/50 items-center justify-center text-emerald-400 font-mono text-lg shadow-inner">
                {currentSurah.id}
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-2">
                  <h2 className="text-xl font-serif text-emerald-300">{currentSurah.name_arabic}</h2>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tighter font-bold">
                    Surah {currentSurah.id}
                  </span>
                </div>
                <p className="text-sm text-emerald-200/60">{currentSurah.name_english}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center w-full md:w-auto flex-2">
              <div className="flex items-center space-x-6 mb-3">
                <button 
                  onClick={skipToBeginning}
                  className="text-emerald-400/60 hover:text-emerald-300 transition-colors"
                  title="Restart Surah"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button 
                  onClick={playPrevious}
                  disabled={currentSurah.id === 1}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-30"
                >
                  <SkipBack className="w-6 h-6" fill="currentColor" />
                </button>
                
                <button 
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-emerald-950 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" fill="currentColor" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" fill="currentColor" />
                  )}
                </button>

                <button 
                  onClick={playNext}
                  disabled={currentSurah.id === 114}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-30"
                >
                  <SkipForward className="w-6 h-6" fill="currentColor" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center w-full space-x-3 text-xs font-mono text-emerald-400/60">
                <span className="w-10 text-right">{formatTime(progress)}</span>
                <div className="relative flex-1 h-6 flex items-center group">
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
                    className="absolute w-full h-1.5 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-50 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(16,185,129,0.8)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                  />
                </div>
                <span className="w-10">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume & Speed & Queue & CC */}
            <div className="flex flex-1 justify-between md:justify-end items-center w-full md:w-auto space-x-4 md:space-x-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowCC(!showCC)}
                  className={`p-2 rounded-xl border transition-all ${
                    showCC 
                      ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                      : 'bg-emerald-900/40 border-emerald-800/30 text-emerald-400 hover:border-emerald-500/50'
                  }`}
                  title="Toggle Closed Captions (Verses)"
                >
                  <ClosedCaption className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setIsQueueOpen(!isQueueOpen)}
                  className={`p-2 rounded-xl border transition-all relative ${
                    isQueueOpen 
                      ? 'bg-emerald-500 text-emerald-950 border-emerald-400' 
                      : 'bg-emerald-900/40 border-emerald-800/30 text-emerald-400 hover:border-emerald-500/50'
                  }`}
                  title="Playback Queue"
                >
                  <ListMusic className="w-5 h-5" />
                  {queue.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 text-emerald-950 text-[10px] font-bold rounded-full flex items-center justify-center border border-emerald-950">
                      {queue.length}
                    </span>
                  )}
                </button>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase tracking-widest text-emerald-500/50 font-bold hidden sm:inline">Speed</span>
                  <div className="relative">
                    <select 
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="bg-emerald-900/40 text-emerald-400 text-xs font-mono py-1 px-2 pr-6 rounded-lg border border-emerald-800/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 cursor-pointer appearance-none"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1}>1.0x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2.0x</option>
                    </select>
                    <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none">
                      <svg className="w-3 h-3 text-emerald-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={toggleMute}
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Queue Panel */}
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
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-emerald-950 border-l border-emerald-800/50 z-[70] shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-emerald-800/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ListMusic className="w-6 h-6 text-emerald-400" />
                    <h2 className="text-xl font-serif text-emerald-50">Playback Queue</h2>
                  </div>
                  <button 
                    onClick={() => setIsQueueOpen(false)}
                    className="p-2 rounded-full hover:bg-emerald-900/50 text-emerald-400 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <Reorder.Group 
                    axis="y" 
                    values={queue} 
                    onReorder={setQueue}
                    className="space-y-3"
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      {queue.length === 0 ? (
                        <motion.div
                          key="empty-queue"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="h-full flex flex-col items-center justify-center text-emerald-500/40 space-y-4 py-20"
                        >
                          <Music className="w-12 h-12 opacity-20" />
                          <p className="text-center">Your queue is empty.<br/>Add Surahs from the list.</p>
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
                            transition={{ 
                              layout: {
                                type: 'spring',
                                stiffness: 600,
                                damping: 40
                              },
                              opacity: { duration: 0.2 },
                              scale: { duration: 0.2 }
                            }}
                            className="flex items-center justify-between p-3 rounded-xl bg-emerald-900/20 border border-emerald-800/20 group hover:border-emerald-500/30 transition-all shadow-sm cursor-grab active:cursor-grabbing"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="text-emerald-500/30 group-hover:text-emerald-500/60 transition-colors">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <motion.div 
                                layout="position"
                                className="w-8 h-8 rounded-lg bg-emerald-900/50 flex items-center justify-center text-xs font-mono text-emerald-400"
                              >
                                {index + 1}
                              </motion.div>
                              <div>
                                <motion.h4 layout="position" className="text-sm font-medium text-emerald-50">{surah.name_english}</motion.h4>
                                <motion.p layout="position" className="text-[10px] text-emerald-400/60 font-serif">{surah.name_arabic}</motion.p>
                              </div>
                            </div>
                            <button 
                              onClick={() => removeFromQueue(surah.queueId)}
                              className="p-2 rounded-lg text-emerald-500/40 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
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
                  <div className="p-6 border-t border-emerald-800/50">
                    <button 
                      onClick={clearQueue}
                      className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium border border-red-500/20"
                    >
                      Clear Queue
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(6, 78, 59, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
}

