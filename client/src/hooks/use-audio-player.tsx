import { useState, useRef, useEffect, useCallback } from "react";
import type { Ayah } from "@shared/schema";

interface UseAudioPlayerProps {
  ayahs: Ayah[];
  pauseDuration: number;
  autoRepeat: boolean;
  onAyahChange?: (ayahIndex: number) => void;
  onSessionComplete?: () => void;
}

interface AudioPlayerState {
  isPlaying: boolean;
  currentAyahIndex: number;
  currentTime: number;
  duration: number;
  isPaused: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAudioPlayer = ({
  ayahs,
  pauseDuration,
  autoRepeat,
  onAyahChange,
  onSessionComplete,
}: UseAudioPlayerProps) => {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentAyahIndex: 0,
    currentTime: 0,
    duration: 0,
    isPaused: false,
    isLoading: false,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const currentAyah = ayahs[state.currentAyahIndex];

  const clearPauseTimeout = useCallback(() => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  }, []);

  const loadAyah = useCallback(async (ayahIndex: number) => {
    if (!ayahs[ayahIndex]) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // For demo purposes, we'll simulate audio loading
      // In a real app, you would load actual audio files
      const audioUrl = `/audio/surah_${ayahs[ayahIndex].surahId}_ayah_${ayahs[ayahIndex].number}.mp3`;
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setState(prev => ({ ...prev, isLoading: false, duration: 10 })); // Simulated 10-second duration
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to load audio. Please check your connection.' 
      }));
    }
  }, [ayahs]);

  const playNextAyah = useCallback(() => {
    const nextIndex = state.currentAyahIndex + 1;
    
    if (nextIndex >= ayahs.length) {
      // Session complete
      setState(prev => ({ ...prev, isPlaying: false, currentAyahIndex: 0 }));
      onSessionComplete?.();
      return;
    }

    setState(prev => ({ ...prev, currentAyahIndex: nextIndex, isPaused: true }));
    onAyahChange?.(nextIndex);
    
    // Start pause between ayahs
    pauseTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isPaused: false }));
      loadAyah(nextIndex);
    }, pauseDuration * 1000);
  }, [state.currentAyahIndex, ayahs.length, pauseDuration, onAyahChange, onSessionComplete, loadAyah]);

  const play = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: true }));
    startTimeRef.current = Date.now();
    
    if (currentAyah) {
      loadAyah(state.currentAyahIndex);
    }
  }, [currentAyah, state.currentAyahIndex, loadAyah]);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
    clearPauseTimeout();
  }, [clearPauseTimeout]);

  const stop = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentAyahIndex: 0,
      currentTime: 0,
      isPaused: false 
    }));
    clearPauseTimeout();
  }, [clearPauseTimeout]);

  const skipToAyah = useCallback((ayahIndex: number) => {
    if (ayahIndex >= 0 && ayahIndex < ayahs.length) {
      setState(prev => ({ 
        ...prev, 
        currentAyahIndex: ayahIndex,
        currentTime: 0,
        isPaused: false 
      }));
      clearPauseTimeout();
      onAyahChange?.(ayahIndex);
      
      if (state.isPlaying) {
        loadAyah(ayahIndex);
      }
    }
  }, [ayahs.length, state.isPlaying, clearPauseTimeout, onAyahChange, loadAyah]);

  const previousAyah = useCallback(() => {
    const prevIndex = Math.max(0, state.currentAyahIndex - 1);
    skipToAyah(prevIndex);
  }, [state.currentAyahIndex, skipToAyah]);

  const nextAyah = useCallback(() => {
    const nextIndex = Math.min(ayahs.length - 1, state.currentAyahIndex + 1);
    skipToAyah(nextIndex);
  }, [state.currentAyahIndex, ayahs.length, skipToAyah]);

  const seek = useCallback((time: number) => {
    setState(prev => ({ ...prev, currentTime: time }));
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const repeatCurrent = useCallback(() => {
    setState(prev => ({ ...prev, currentTime: 0 }));
    if (state.isPlaying) {
      loadAyah(state.currentAyahIndex);
    }
  }, [state.isPlaying, state.currentAyahIndex, loadAyah]);

  // Simulate audio progress
  useEffect(() => {
    if (state.isPlaying && !state.isPaused && !state.isLoading) {
      const interval = setInterval(() => {
        setState(prev => {
          const newTime = prev.currentTime + 1;
          if (newTime >= prev.duration) {
            // Ayah finished, play next or repeat
            if (autoRepeat) {
              return { ...prev, currentTime: 0 };
            } else {
              playNextAyah();
              return prev;
            }
          }
          return { ...prev, currentTime: newTime };
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state.isPlaying, state.isPaused, state.isLoading, autoRepeat, playNextAyah]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPauseTimeout();
    };
  }, [clearPauseTimeout]);

  const getSessionTime = useCallback(() => {
    return Math.floor((Date.now() - startTimeRef.current) / 1000);
  }, []);

  const getCompletedAyahs = useCallback(() => {
    return state.currentAyahIndex;
  }, [state.currentAyahIndex]);

  const getRemainingAyahs = useCallback(() => {
    return ayahs.length - state.currentAyahIndex;
  }, [ayahs.length, state.currentAyahIndex]);

  const getProgress = useCallback(() => {
    if (state.duration === 0) return 0;
    return (state.currentTime / state.duration) * 100;
  }, [state.currentTime, state.duration]);

  return {
    ...state,
    currentAyah,
    play,
    pause,
    stop,
    skipToAyah,
    previousAyah,
    nextAyah,
    seek,
    repeatCurrent,
    getSessionTime,
    getCompletedAyahs,
    getRemainingAyahs,
    getProgress,
  };
};
