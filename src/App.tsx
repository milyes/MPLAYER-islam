/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Search, Music, Download, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [audioSrc, setAudioSrc] = useState('');
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const filteredSurahs = surahs.filter(s => {
    const matchesSearch = s.name_arabic.includes(searchQuery) || 
      s.name_english.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !showDownloadedOnly || downloadedSurahs.has(s.id);
    return matchesSearch && matchesFilter;
  });

  // Initialize downloaded surahs
  useEffect(() => {
    getAllCachedSurahIds().then(ids => setDownloadedSurahs(new Set(ids)));
  }, []);

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

  const playNext = () => {
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
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-emerald-500/50" />
            </div>
            <input
              type="text"
              placeholder="Search Surah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-emerald-950/30 border border-emerald-800/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-emerald-100 placeholder-emerald-500/50 transition-all backdrop-blur-sm"
            />
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

        {/* Surah List */}
        <div className="flex-1 overflow-y-auto pr-2 pb-32 space-y-2 custom-scrollbar">
            {filteredSurahs.map((surah) => {
              const isActive = currentSurah.id === surah.id;
              return (
                <motion.button
                  key={surah.id}
                  whileHover={{ 
                    scale: 1.01, 
                    backgroundColor: 'rgba(6, 78, 59, 0.4)',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)'
                  }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => playSurah(surah)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border group relative overflow-hidden ${
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm transition-all ${
                      isActive ? 'bg-emerald-500 text-emerald-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-emerald-900/50 text-emerald-400 group-hover:bg-emerald-800'
                    }`}>
                      {isActive && isPlaying ? <PlayingAnimation /> : surah.id}
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
                </motion.button>
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
            src={audioSrc}
            onTimeUpdate={handleTimeUpdate}
            onEnded={playNext}
            onLoadedMetadata={handleTimeUpdate}
            muted={isMuted}
          />
          
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            {/* Current Track Info */}
            <div className="flex-1 text-center md:text-left w-full">
              <h2 className="text-xl font-serif text-emerald-300 mb-1">{currentSurah.name_arabic}</h2>
              <p className="text-sm text-emerald-200/60">{currentSurah.name_english}</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center w-full md:w-auto flex-2">
              <div className="flex items-center space-x-6 mb-3">
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

            {/* Volume & Speed */}
            <div className="flex flex-1 justify-between md:justify-end items-center w-full md:w-auto space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-widest text-emerald-500/50 font-bold">Speed</span>
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
              
              <button 
                onClick={toggleMute}
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </motion.div>
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

