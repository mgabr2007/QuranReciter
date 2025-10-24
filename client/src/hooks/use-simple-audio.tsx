import { useState, useRef, useEffect, useCallback } from "react";
import type { Ayah } from "@shared/schema";

interface UseSimpleAudioProps {
  ayahs: Ayah[];
  pauseDuration: number;
  autoRepeat: boolean;
  autoRepeatAyah: boolean;
  onAyahChange?: (ayahIndex: number) => void;
  onSessionComplete?: () => void;
}

interface AudioState {
  isPlaying: boolean;
  currentAyahIndex: number;
  currentTime: number;
  duration: number;
  isPaused: boolean;
  isLoading: boolean;
  error: string | null;
  sessionCompleted: boolean;
  pauseCountdown: number;
  lastAyahDuration: number;
  sessionTimeUpdate: number;
}

export const useSimpleAudio = ({
  ayahs,
  pauseDuration,
  autoRepeat,
  autoRepeatAyah,
  onAyahChange,
  onSessionComplete,
}: UseSimpleAudioProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldAutoPlayRef = useRef(false);
  const lastLoadedUrlRef = useRef<string>('');
  const startTimeRef = useRef<number>(0);
  const sessionUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs to store latest callbacks and values to avoid stale closures
  const onAyahChangeRef = useRef(onAyahChange);
  const onSessionCompleteRef = useRef(onSessionComplete);
  const ayahsRef = useRef(ayahs);
  const autoRepeatRef = useRef(autoRepeat);
  const autoRepeatAyahRef = useRef(autoRepeatAyah);
  const pauseDurationRef = useRef(pauseDuration);
  
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentAyahIndex: 0,
    currentTime: 0,
    duration: 0,
    isPaused: false,
    isLoading: false,
    error: null,
    sessionCompleted: false,
    pauseCountdown: 0,
    lastAyahDuration: 0,
    sessionTimeUpdate: 0,
  });

  // Trigger to force reload of the same ayah (for auto-repeat ayah feature)
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Update refs when props change
  useEffect(() => {
    onAyahChangeRef.current = onAyahChange;
    onSessionCompleteRef.current = onSessionComplete;
    ayahsRef.current = ayahs;
    autoRepeatRef.current = autoRepeat;
    autoRepeatAyahRef.current = autoRepeatAyah;
    pauseDurationRef.current = pauseDuration;
  }, [onAyahChange, onSessionComplete, ayahs, autoRepeat, autoRepeatAyah, pauseDuration]);

  const formatNumber = (num: number, padding: number): string => {
    return num.toString().padStart(padding, '0');
  };

  const getAudioUrl = (surahId: number, ayahNumber: number): string => {
    const filename = `${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
    return `/audio/alafasy/${filename}`;
  };

  const getCurrentAyah = useCallback(() => {
    return ayahsRef.current[state.currentAyahIndex];
  }, [state.currentAyahIndex]);

  const loadCurrentAyah = useCallback(() => {
    const ayah = ayahsRef.current[state.currentAyahIndex];
    if (!ayah || !audioRef.current) {
      console.log('Cannot load ayah:', { ayah, hasAudioRef: !!audioRef.current });
      return;
    }

    const audioUrl = getAudioUrl(ayah.surahId, ayah.number);
    
    console.log(`Loading ayah ${ayah.number} from ${audioUrl}`, { surahId: ayah.surahId, ayahNumber: ayah.number });
    lastLoadedUrlRef.current = audioUrl;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    audioRef.current.src = audioUrl;
    audioRef.current.load();
  }, [state.currentAyahIndex, reloadTrigger]);

  const play = useCallback(() => {
    if (!audioRef.current) {
      console.error('No audio element');
      return;
    }
    
    if (!audioRef.current.src) {
      console.error('No audio source loaded. Current src:', audioRef.current.src);
      setState(prev => ({ 
        ...prev, 
        error: 'No audio loaded' 
      }));
      return;
    }
    
    // Start session timer if not already started
    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now();
    }
    
    // Start session time update interval
    if (!sessionUpdateIntervalRef.current) {
      sessionUpdateIntervalRef.current = setInterval(() => {
        setState(prev => ({ ...prev, sessionTimeUpdate: Date.now() }));
      }, 1000);
    }
    
    console.log('Starting playback, src:', audioRef.current.src);
    shouldAutoPlayRef.current = true;
    setState(prev => ({ ...prev, isPlaying: true, error: null }));
    audioRef.current.play().catch(error => {
      console.error('Play failed:', error);
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        error: 'Failed to play audio' 
      }));
    });
  }, []);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    
    shouldAutoPlayRef.current = false;
    audioRef.current.pause();
    
    // Clear countdown if pausing manually
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    
    setState(prev => ({ ...prev, isPlaying: false, isPaused: false, pauseCountdown: 0 }));
  }, []);

  // Use functional setState to read current state instead of closure
  const goToNext = useCallback(() => {
    // Clear any pending pause countdown to prevent double-advance
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    
    setState(prev => {
      const nextIndex = prev.currentAyahIndex + 1;
      console.log('goToNext - Moving to next ayah:', { currentIndex: prev.currentAyahIndex, nextIndex, totalAyahs: ayahsRef.current.length });
      if (nextIndex < ayahsRef.current.length) {
        onAyahChangeRef.current?.(nextIndex);
        return { ...prev, currentAyahIndex: nextIndex, isPaused: false, pauseCountdown: 0 };
      } else if (autoRepeatRef.current) {
        console.log('goToNext - Auto-repeat enabled, resetting to 0');
        onAyahChangeRef.current?.(0);
        return { ...prev, currentAyahIndex: 0, isPaused: false, pauseCountdown: 0 };
      } else {
        // Session completed - stop auto-play
        console.log('goToNext - Session completed');
        shouldAutoPlayRef.current = false;
        onSessionCompleteRef.current?.();
        return { ...prev, sessionCompleted: true, isPlaying: false, isPaused: false, pauseCountdown: 0 };
      }
    });
  }, []);

  const goToPrevious = useCallback(() => {
    // Clear any pending pause countdown to prevent double-advance
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    
    setState(prev => {
      const prevIndex = Math.max(0, prev.currentAyahIndex - 1);
      onAyahChangeRef.current?.(prevIndex);
      return { ...prev, currentAyahIndex: prevIndex, isPaused: false, pauseCountdown: 0 };
    });
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
  }, []);

  const rewind = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  }, []);

  const forward = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10);
  }, []);

  const repeat = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    play();
  }, [play]);

  // Initialize audio element - use refs for event handlers
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      const audio = audioRef.current;
      
      const onLoadStart = () => {
        setState(prev => ({ ...prev, isLoading: true }));
      };
      
      const onLoadedData = () => {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          duration: audio.duration || 0,
          error: null 
        }));
        
        // Auto-play if we should continue playing
        if (shouldAutoPlayRef.current && audio.src) {
          console.log('Auto-playing next ayah after load');
          audio.play().catch(error => {
            console.error('Auto-play failed:', error);
            setState(prev => ({ 
              ...prev, 
              isPlaying: false, 
              error: 'Failed to auto-play audio' 
            }));
          });
        }
      };
      
      const onTimeUpdate = () => {
        setState(prev => ({ ...prev, currentTime: audio.currentTime }));
      };
      
      const onEnded = () => {
        const ayahDuration = Math.ceil(audio.duration); // Duration of ayah that just finished (rounded up)
        const extraPause = pauseDurationRef.current; // Extra pause time configured by user
        
        // If pauseDuration is 0 (no pause mode), skip pause entirely and advance immediately
        if (extraPause === 0) {
          setState(prev => {
            // If auto-repeat ayah is enabled, repeat the current ayah
            if (autoRepeatAyahRef.current) {
              console.log('onEnded (no pause) - Auto-repeat ayah enabled, repeating current ayah:', prev.currentAyahIndex);
              // Trigger a reload of the same ayah
              setReloadTrigger(t => t + 1);
              return { ...prev, isPaused: false, pauseCountdown: 0 };
            }
            
            const nextIndex = prev.currentAyahIndex + 1;
            console.log('onEnded (no pause) - Moving to next ayah immediately:', { currentIndex: prev.currentAyahIndex, nextIndex, totalAyahs: ayahsRef.current.length });
            if (nextIndex < ayahsRef.current.length) {
              onAyahChangeRef.current?.(nextIndex);
              return { ...prev, currentAyahIndex: nextIndex, isPaused: false, pauseCountdown: 0 };
            } else if (autoRepeatRef.current) {
              console.log('onEnded (no pause) - Auto-repeat surah enabled, resetting to 0');
              onAyahChangeRef.current?.(0);
              return { ...prev, currentAyahIndex: 0, isPaused: false, pauseCountdown: 0 };
            } else {
              // Session completed - stop auto-play
              console.log('onEnded (no pause) - Session completed');
              shouldAutoPlayRef.current = false;
              onSessionCompleteRef.current?.();
              return { ...prev, sessionCompleted: true, isPlaying: false, isPaused: false, pauseCountdown: 0 };
            }
          });
          return; // Exit early for no-pause mode
        }
        
        // Normal pause mode: total pause = ayah duration + extra pause
        const totalPause = ayahDuration + extraPause;
        
        setState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          isPaused: true, 
          pauseCountdown: totalPause,
          lastAyahDuration: ayahDuration
        }));
        
        // Start countdown interval
        let remaining = totalPause;
        countdownIntervalRef.current = setInterval(() => {
          remaining -= 1;
          if (remaining > 0) {
            setState(prev => ({ ...prev, pauseCountdown: remaining }));
          } else {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
          }
        }, 1000);
        
        // Start pause between ayahs - use ref-based approach to avoid recreating event listeners
        pauseTimeoutRef.current = setTimeout(() => {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          
          // Advance to next ayah using setState with functional update
          setState(prev => {
            // If auto-repeat ayah is enabled, repeat the current ayah
            if (autoRepeatAyahRef.current) {
              console.log('onEnded auto-advance - Auto-repeat ayah enabled, repeating current ayah:', prev.currentAyahIndex);
              // Trigger a reload of the same ayah
              setReloadTrigger(t => t + 1);
              return { ...prev, isPaused: false, pauseCountdown: 0 };
            }
            
            const nextIndex = prev.currentAyahIndex + 1;
            console.log('onEnded auto-advance - Moving to next ayah:', { currentIndex: prev.currentAyahIndex, nextIndex, totalAyahs: ayahsRef.current.length });
            if (nextIndex < ayahsRef.current.length) {
              onAyahChangeRef.current?.(nextIndex);
              return { ...prev, currentAyahIndex: nextIndex, isPaused: false, pauseCountdown: 0 };
            } else if (autoRepeatRef.current) {
              console.log('onEnded auto-advance - Auto-repeat surah enabled, resetting to 0');
              onAyahChangeRef.current?.(0);
              return { ...prev, currentAyahIndex: 0, isPaused: false, pauseCountdown: 0 };
            } else {
              // Session completed - stop auto-play
              console.log('onEnded auto-advance - Session completed');
              shouldAutoPlayRef.current = false;
              onSessionCompleteRef.current?.();
              return { ...prev, sessionCompleted: true, isPlaying: false, isPaused: false, pauseCountdown: 0 };
            }
          });
        }, totalPause * 1000);
      };
      
      const onError = () => {
        console.error('Audio error:', audio.error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          isPlaying: false, 
          error: 'Audio failed to load' 
        }));
      };
      
      const onCanPlayThrough = () => {
        setState(prev => ({ ...prev, isLoading: false }));
      };
      
      const onPlay = () => {
        setState(prev => ({ ...prev, isPlaying: true, error: null }));
      };
      
      const onPause = () => {
        setState(prev => ({ ...prev, isPlaying: false }));
      };
      
      audio.addEventListener('loadstart', onLoadStart);
      audio.addEventListener('loadeddata', onLoadedData);
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      audio.addEventListener('canplaythrough', onCanPlayThrough);
      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);
      
      return () => {
        audio.removeEventListener('loadstart', onLoadStart);
        audio.removeEventListener('loadeddata', onLoadedData);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('canplaythrough', onCanPlayThrough);
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
      };
    }
  }, []); // Empty dependency array - event listeners only created once

  // Load ayah when index changes OR when ayahs first become available
  useEffect(() => {
    console.log('Load effect triggered:', { 
      ayahsLength: ayahs.length, 
      currentIndex: state.currentAyahIndex,
      hasAudioRef: !!audioRef.current 
    });
    
    if (ayahs.length > 0) {
      loadCurrentAyah();
    }
  }, [state.currentAyahIndex, ayahs.length, loadCurrentAyah]);

  // Clean up timeouts and intervals
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (sessionUpdateIntervalRef.current) {
        clearInterval(sessionUpdateIntervalRef.current);
      }
    };
  }, []);

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  const stop = useCallback(() => {
    shouldAutoPlayRef.current = false;
    pause();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, [pause]);

  const skipToAyah = useCallback((index: number) => {
    if (index >= 0 && index < ayahsRef.current.length) {
      // Clear any pending pause countdown to prevent double-advance
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
      
      setState(prev => ({ ...prev, currentAyahIndex: index, isPaused: false, pauseCountdown: 0 }));
      onAyahChangeRef.current?.(index);
    }
  }, []);

  // Calculate stats directly for reactivity
  const completedAyahs = state.currentAyahIndex;
  const remainingAyahs = Math.max(0, ayahsRef.current.length - state.currentAyahIndex - 1);
  // Use sessionTimeUpdate state to trigger re-renders, but calculate from startTimeRef for accuracy
  const sessionTime = startTimeRef.current === 0 ? 0 : Math.floor((state.sessionTimeUpdate - startTimeRef.current) / 1000) || Math.floor((Date.now() - startTimeRef.current) / 1000);

  return {
    // State
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    isLoading: state.isLoading,
    currentTime: state.currentTime,
    duration: state.duration,
    progress,
    error: state.error,
    sessionCompleted: state.sessionCompleted,
    currentAyahIndex: state.currentAyahIndex,
    currentAyah: getCurrentAyah(),
    pauseCountdown: state.pauseCountdown,
    lastAyahDuration: state.lastAyahDuration,
    completedAyahs,
    remainingAyahs,
    sessionTime,
    
    // Actions
    play,
    pause,
    stop,
    goToNext,
    goToPrevious,
    seek,
    rewind,
    forward,
    repeat,
    skipToAyah,
  };
};