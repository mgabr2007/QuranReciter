import { useState, useRef, useEffect, useCallback } from "react";
import type { Ayah } from "@shared/schema";

interface UseSimpleAudioProps {
  ayahs: Ayah[];
  pauseDuration: number;
  autoRepeat: boolean;
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
}

export const useSimpleAudio = ({
  ayahs,
  pauseDuration,
  autoRepeat,
  onAyahChange,
  onSessionComplete,
}: UseSimpleAudioProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs to store latest callbacks and values to avoid stale closures
  const onAyahChangeRef = useRef(onAyahChange);
  const onSessionCompleteRef = useRef(onSessionComplete);
  const ayahsRef = useRef(ayahs);
  const autoRepeatRef = useRef(autoRepeat);
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
  });

  // Update refs when props change
  useEffect(() => {
    onAyahChangeRef.current = onAyahChange;
    onSessionCompleteRef.current = onSessionComplete;
    ayahsRef.current = ayahs;
    autoRepeatRef.current = autoRepeat;
    pauseDurationRef.current = pauseDuration;
  }, [onAyahChange, onSessionComplete, ayahs, autoRepeat, pauseDuration]);

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
    if (!ayah || !audioRef.current) return;

    const audioUrl = getAudioUrl(ayah.surahId, ayah.number);
    console.log(`Loading ayah ${ayah.number} from ${audioUrl}`);
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    audioRef.current.src = audioUrl;
    audioRef.current.load();
  }, [state.currentAyahIndex]);

  const play = useCallback(() => {
    if (!audioRef.current) return;
    
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
    
    audioRef.current.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // Use functional setState to read current state instead of closure
  const goToNext = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentAyahIndex + 1;
      if (nextIndex < ayahsRef.current.length) {
        onAyahChangeRef.current?.(nextIndex);
        return { ...prev, currentAyahIndex: nextIndex };
      } else if (autoRepeatRef.current) {
        onAyahChangeRef.current?.(0);
        return { ...prev, currentAyahIndex: 0 };
      } else {
        onSessionCompleteRef.current?.();
        return { ...prev, sessionCompleted: true };
      }
    });
  }, []);

  const goToPrevious = useCallback(() => {
    setState(prev => {
      const prevIndex = Math.max(0, prev.currentAyahIndex - 1);
      onAyahChangeRef.current?.(prevIndex);
      return { ...prev, currentAyahIndex: prevIndex };
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
      };
      
      const onTimeUpdate = () => {
        setState(prev => ({ ...prev, currentTime: audio.currentTime }));
      };
      
      const onEnded = () => {
        setState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
        
        // Start pause between ayahs
        pauseTimeoutRef.current = setTimeout(() => {
          setState(prev => ({ ...prev, isPaused: false }));
          goToNext();
        }, pauseDurationRef.current * 1000);
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
      
      audio.addEventListener('loadstart', onLoadStart);
      audio.addEventListener('loadeddata', onLoadedData);
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      audio.addEventListener('canplaythrough', onCanPlayThrough);
      
      return () => {
        audio.removeEventListener('loadstart', onLoadStart);
        audio.removeEventListener('loadeddata', onLoadedData);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('canplaythrough', onCanPlayThrough);
      };
    }
  }, [goToNext]);

  // Load ayah when index changes - only depend on index
  useEffect(() => {
    if (ayahsRef.current.length > 0) {
      loadCurrentAyah();
    }
  }, [state.currentAyahIndex, loadCurrentAyah]);

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  const stop = useCallback(() => {
    pause();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, [pause]);

  const skipToAyah = useCallback((index: number) => {
    if (index >= 0 && index < ayahsRef.current.length) {
      setState(prev => ({ ...prev, currentAyahIndex: index }));
      onAyahChangeRef.current?.(index);
    }
  }, []);

  const getCompletedAyahs = useCallback(() => {
    return state.currentAyahIndex;
  }, [state.currentAyahIndex]);

  const getRemainingAyahs = useCallback(() => {
    return ayahsRef.current.length - state.currentAyahIndex - 1;
  }, [state.currentAyahIndex]);

  const getSessionTime = useCallback(() => {
    return Math.floor(state.currentTime);
  }, [state.currentTime]);

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
    getCompletedAyahs,
    getRemainingAyahs,
    getSessionTime,
  };
};