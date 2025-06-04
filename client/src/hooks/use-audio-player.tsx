import { useState, useRef, useEffect, useCallback } from "react";
import type { Ayah } from "@shared/schema";
import { getAyahAudio, getAlternativeAyahAudio } from "@/lib/audio-api";

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
  sessionCompleted: boolean;
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
    sessionCompleted: false,
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

  const tryLoadAudio = useCallback(async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!audioRef.current) {
        resolve(false);
        return;
      }

      const audio = audioRef.current;
      
      const cleanup = () => {
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('loadstart', onLoadStart);
      };

      const onCanPlay = () => {
        console.log('Audio loaded successfully:', url);
        cleanup();
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          duration: audio.duration || 10 
        }));
        
        // Set volume and prepare for user interaction
        audio.volume = 0.7;
        console.log('Audio ready for user interaction');
        
        resolve(true);
      };
      
      const onError = () => {
        console.warn('Failed to load audio from:', url);
        cleanup();
        resolve(false);
      };

      const onLoadStart = () => {
        console.log('Loading audio from:', url);
      };
      
      audio.addEventListener('canplay', onCanPlay);
      audio.addEventListener('error', onError);
      audio.addEventListener('loadstart', onLoadStart);
      
      audio.src = url;
      audio.load();
      
      // Timeout after 8 seconds
      setTimeout(() => {
        cleanup();
        resolve(false);
      }, 8000);
    });
  }, []);

  const loadAyah = useCallback(async (ayahIndex: number) => {
    if (!ayahs[ayahIndex]) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const ayah = ayahs[ayahIndex];
    
    try {
      console.log(`Loading audio for Surah ${ayah.surahId}, Ayah ${ayah.number}`);
      const primaryUrl = await getAyahAudio(ayah.surahId, ayah.number);
      console.log('Primary audio URL:', primaryUrl);
      
      const success = await tryLoadAudio(primaryUrl);
      if (success) return;
      
      console.log('Primary failed, trying alternative...');
      const alternativeUrl = await getAlternativeAyahAudio(ayah.surahId, ayah.number);
      console.log('Alternative audio URL:', alternativeUrl);
      
      const alternativeSuccess = await tryLoadAudio(alternativeUrl);
      if (!alternativeSuccess) {
        throw new Error('Both audio sources failed to load');
      }
    } catch (error: any) {
      console.error('Failed to load audio:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Failed to load audio: ${error.message}` 
      }));
    }
  }, [ayahs, tryLoadAudio]);

  const playNextAyah = useCallback(() => {
    if (!ayahs.length) return;

    setState(prev => ({ ...prev, isPlaying: false }));
    startTimeRef.current = Date.now();

    if (currentAyah) {
      loadAyah(state.currentAyahIndex);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setState(prev => ({ ...prev, currentTime: 0 }));
      }
    }
  }, [ayahs, currentAyah, state.currentAyahIndex, loadAyah]);

  const nextAyah = useCallback(() => {
    if (!currentAyah || state.currentAyahIndex >= ayahs.length - 1) {
      loadAyah(state.currentAyahIndex);
      return;
    }

    setState(prev => ({ ...prev, currentAyahIndex: prev.currentAyahIndex + 1 }));
    if (audioRef.current) {
      audioRef.current.pause();
    }
    clearPauseTimeout();
  }, [currentAyah, state.currentAyahIndex, ayahs.length, loadAyah, clearPauseTimeout]);

  const previousAyah = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      currentAyahIndex: Math.max(0, prev.currentAyahIndex - 1) 
    }));
  }, []);

  const rewind = useCallback(() => {
    clearPauseTimeout();
    onAyahChange?.(state.currentAyahIndex);
    
    if (state.currentAyahIndex > 0) {
      loadAyah(state.currentAyahIndex - 1);
    }
  }, [state.currentAyahIndex, clearPauseTimeout, onAyahChange, loadAyah]);

  const forward = useCallback(() => {
    if (state.currentAyahIndex < ayahs.length - 1) {
      setState(prev => ({ ...prev, currentAyahIndex: prev.currentAyahIndex + 1 }));
    }
  }, [state.currentAyahIndex, ayahs.length]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  const play = useCallback(() => {
    if (audioRef.current && !state.isLoading) {
      console.log('Attempting to play audio:', audioRef.current.src);
      
      const audio = audioRef.current;
      
      // Reset any previous errors
      setState(prev => ({ ...prev, error: null }));
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Audio playback started successfully');
          setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
        }).catch(error => {
          console.error('Failed to play audio:', error);
          setState(prev => ({ 
            ...prev, 
            error: `Playback failed: ${error.message}. Try clicking play again.` 
          }));
        });
      } else {
        // For older browsers
        setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
      }
    } else if (state.isLoading) {
      setState(prev => ({ ...prev, error: 'Audio is still loading, please wait...' }));
    } else {
      setState(prev => ({ ...prev, error: 'No audio loaded. Please select a different verse.' }));
    }
  }, [state.isLoading]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
    }
    clearPauseTimeout();
  }, [clearPauseTimeout]);

  const repeat = useCallback(() => {
    if (autoRepeat && state.currentAyahIndex === ayahs.length - 1) {
      setState(prev => ({ 
        ...prev, 
        currentAyahIndex: 0, 
        sessionCompleted: false 
      }));
      onSessionComplete?.();
    }
  }, [autoRepeat, state.currentAyahIndex, ayahs.length, onSessionComplete]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false, 
      currentTime: 0 
    }));
    clearPauseTimeout();
  }, [clearPauseTimeout]);

  const skipToAyah = useCallback((ayahIndex: number) => {
    if (ayahIndex >= 0 && ayahIndex < ayahs.length) {
      setState(prev => ({ ...prev, currentAyahIndex: ayahIndex }));
      loadAyah(ayahIndex);
    }
  }, [ayahs.length, loadAyah]);

  const getCompletedAyahs = useCallback(() => {
    return state.currentAyahIndex;
  }, [state.currentAyahIndex]);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleLoadedMetadata = () => {
      setState(prev => ({ ...prev, duration: audio.duration }));
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      
      if (state.currentAyahIndex < ayahs.length - 1) {
        setState(prev => ({ ...prev, isPaused: true }));
        onAyahChange?.(state.currentAyahIndex + 1);
        
        pauseTimeoutRef.current = setTimeout(() => {
          setState(prev => ({ ...prev, currentAyahIndex: prev.currentAyahIndex + 1 }));
          loadAyah(state.currentAyahIndex + 1);
        }, pauseDuration * 1000);
      } else {
        setState(prev => ({ ...prev, sessionCompleted: true }));
        onSessionComplete?.();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      clearPauseTimeout();
    };
  }, [
    state.currentAyahIndex, 
    ayahs.length, 
    pauseDuration, 
    onAyahChange, 
    onSessionComplete, 
    loadAyah, 
    clearPauseTimeout
  ]);

  // Load first ayah on mount
  useEffect(() => {
    if (ayahs.length > 0 && !currentAyah) {
      loadAyah(0);
    }
  }, [ayahs, currentAyah, loadAyah]);

  return {
    // State
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    isLoading: state.isLoading,
    currentTime: state.currentTime,
    duration: state.duration,
    progress,
    error: state.error,
    currentAyah,
    currentAyahIndex: state.currentAyahIndex,
    sessionCompleted: state.sessionCompleted,
    
    // Actions
    play,
    pause,
    stop,
    nextAyah,
    previousAyah,
    rewind,
    forward,
    seek,
    repeat,
    skipToAyah,
    getCompletedAyahs,
    getRemainingAyahs: () => ayahs.length - state.currentAyahIndex - 1,
    getSessionTime: () => Math.floor((Date.now() - startTimeRef.current) / 1000),
    repeatCurrent: () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        play();
      }
    }
  };
};