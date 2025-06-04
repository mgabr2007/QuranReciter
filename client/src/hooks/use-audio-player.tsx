import { useState, useRef, useEffect, useCallback } from "react";
import type { Ayah } from "@shared/schema";
import { createAudioUrl, createAlternativeAudioUrl } from "@/lib/quran-data";

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

  const loadAyah = useCallback(async (ayahIndex: number) => {
    if (!ayahs[ayahIndex]) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const ayah = ayahs[ayahIndex];
    const primaryUrl = createAudioUrl(ayah.surahId, ayah.number);
    const alternativeUrl = createAlternativeAudioUrl(ayah.surahId, ayah.number);
    
    const tryLoadAudio = async (url: string): Promise<boolean> => {
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
          
          // Test audio playback capability
          audio.volume = 0.1;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              audio.pause();
              audio.currentTime = 0;
              console.log('Audio playback test successful');
            }).catch(error => {
              console.warn('Audio autoplay blocked:', error.message);
            });
          }
          
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
    };

    try {
      // Try primary source first
      const primarySuccess = await tryLoadAudio(primaryUrl);
      
      if (!primarySuccess) {
        console.log('Trying alternative audio source...');
        const alternativeSuccess = await tryLoadAudio(alternativeUrl);
        
        if (!alternativeSuccess) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Audio temporarily unavailable. Please try again later.' 
          }));
        }
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to load audio. Please check your internet connection.' 
      }));
    }
  }, [ayahs]);

  const playNextAyah = useCallback(() => {
    const nextIndex = state.currentAyahIndex + 1;
    
    if (nextIndex >= ayahs.length) {
      // Session complete - only call once
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        currentAyahIndex: 0,
        sessionCompleted: true 
      }));
      if (!state.sessionCompleted) {
        onSessionComplete?.();
      }
      return;
    }

    setState(prev => ({ ...prev, currentAyahIndex: nextIndex, isPaused: true }));
    onAyahChange?.(nextIndex);
    
    // Start pause between ayahs
    pauseTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isPaused: false }));
      loadAyah(nextIndex);
    }, pauseDuration * 1000);
  }, [state.currentAyahIndex, state.sessionCompleted, ayahs.length, pauseDuration, onAyahChange, onSessionComplete, loadAyah]);

  const play = useCallback(async () => {
    setState(prev => ({ ...prev, isPlaying: true }));
    startTimeRef.current = Date.now();
    
    if (currentAyah) {
      await loadAyah(state.currentAyahIndex);
      if (audioRef.current) {
        try {
          await audioRef.current.play();
        } catch (error) {
          setState(prev => ({ 
            ...prev, 
            isPlaying: false, 
            error: 'Failed to play audio. Please try again.' 
          }));
        }
      }
    }
  }, [currentAyah, state.currentAyahIndex, loadAyah]);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
    if (audioRef.current) {
      audioRef.current.pause();
    }
    clearPauseTimeout();
  }, [clearPauseTimeout]);

  const stop = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentAyahIndex: 0,
      currentTime: 0,
      isPaused: false,
      sessionCompleted: false 
    }));
    clearPauseTimeout();
  }, [clearPauseTimeout]);

  const skipToAyah = useCallback((ayahIndex: number) => {
    if (ayahIndex >= 0 && ayahIndex < ayahs.length) {
      setState(prev => ({ 
        ...prev, 
        currentAyahIndex: ayahIndex,
        currentTime: 0,
        isPaused: false,
        sessionCompleted: false 
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
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const repeatCurrent = useCallback(async () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setState(prev => ({ ...prev, currentTime: 0 }));
      if (state.isPlaying) {
        try {
          await audioRef.current.play();
        } catch (error) {
          setState(prev => ({ 
            ...prev, 
            error: 'Failed to repeat audio. Please try again.' 
          }));
        }
      }
    }
  }, [state.isPlaying]);

  // Real audio progress tracking
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = "anonymous";
    }

    const audio = audioRef.current;

    const updateTime = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const onEnded = () => {
      if (autoRepeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNextAyah();
      }
    };

    const onLoadedMetadata = () => {
      setState(prev => ({ ...prev, duration: audio.duration }));
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [autoRepeat, playNextAyah]);

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
