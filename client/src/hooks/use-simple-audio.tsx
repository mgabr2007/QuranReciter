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

  const formatNumber = (num: number, padding: number): string => {
    return num.toString().padStart(padding, '0');
  };

  const getAudioUrl = (surahId: number, ayahNumber: number): string => {
    const filename = `${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
    return `/audio/alafasy/${filename}`;
  };

  const getCurrentAyah = () => ayahs[state.currentAyahIndex];

  const loadCurrentAyah = useCallback(() => {
    const ayah = getCurrentAyah();
    if (!ayah || !audioRef.current) return;

    const audioUrl = getAudioUrl(ayah.surahId, ayah.number);
    console.log(`Loading ayah ${ayah.number} from ${audioUrl}`);
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    audioRef.current.src = audioUrl;
    audioRef.current.load();
  }, [state.currentAyahIndex, ayahs]);

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

  const goToNext = useCallback(() => {
    const nextIndex = state.currentAyahIndex + 1;
    if (nextIndex < ayahs.length) {
      setState(prev => ({ ...prev, currentAyahIndex: nextIndex }));
      onAyahChange?.(nextIndex);
    } else if (autoRepeat) {
      setState(prev => ({ ...prev, currentAyahIndex: 0 }));
      onAyahChange?.(0);
    } else {
      setState(prev => ({ ...prev, sessionCompleted: true }));
      onSessionComplete?.();
    }
  }, [state.currentAyahIndex, ayahs.length, autoRepeat, onAyahChange, onSessionComplete]);

  const goToPrevious = useCallback(() => {
    const prevIndex = Math.max(0, state.currentAyahIndex - 1);
    setState(prev => ({ ...prev, currentAyahIndex: prevIndex }));
    onAyahChange?.(prevIndex);
  }, [state.currentAyahIndex, onAyahChange]);

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

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // Audio event listeners
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
        }, pauseDuration * 1000);
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
  }, [goToNext, pauseDuration]);

  // Load ayah when index changes
  useEffect(() => {
    if (ayahs.length > 0) {
      loadCurrentAyah();
    }
  }, [state.currentAyahIndex, ayahs, loadCurrentAyah]);

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
    if (index >= 0 && index < ayahs.length) {
      setState(prev => ({ ...prev, currentAyahIndex: index }));
      onAyahChange?.(index);
    }
  }, [ayahs.length, onAyahChange]);

  const getCompletedAyahs = useCallback(() => {
    return state.currentAyahIndex;
  }, [state.currentAyahIndex]);

  const getRemainingAyahs = useCallback(() => {
    return ayahs.length - state.currentAyahIndex - 1;
  }, [ayahs.length, state.currentAyahIndex]);

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