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
        console.error('No audio element available');
        resolve(false);
        return;
      }

      const audio = audioRef.current;
      let timeoutId: NodeJS.Timeout;
      
      const cleanup = () => {
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('loadeddata', onLoadedData);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('loadstart', onLoadStart);
        if (timeoutId) clearTimeout(timeoutId);
      };

      const onCanPlay = () => {
        console.log('Audio can play through:', url);
        cleanup();
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          duration: audio.duration || 0 
        }));
        audio.volume = 0.8;
        resolve(true);
      };

      const onLoadedData = () => {
        console.log('Audio data loaded:', url);
        // Continue to wait for canplaythrough
      };
      
      const onError = (event: Event) => {
        console.error('Audio loading error:', event, 'URL:', url);
        console.error('Audio error details:', audio.error);
        cleanup();
        resolve(false);
      };

      const onLoadStart = () => {
        console.log('Starting to load audio:', url);
      };
      
      // Add event listeners
      audio.addEventListener('canplaythrough', onCanPlay);
      audio.addEventListener('loadeddata', onLoadedData);
      audio.addEventListener('error', onError);
      audio.addEventListener('loadstart', onLoadStart);
      
      // Set audio properties for better compatibility
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      
      try {
        audio.src = url;
        audio.load();
        console.log('Audio load initiated for:', url);
      } catch (loadError) {
        console.error('Error setting audio src:', loadError);
        cleanup();
        resolve(false);
        return;
      }
      
      // Timeout after 15 seconds
      timeoutId = setTimeout(() => {
        console.warn('Audio loading timeout for:', url);
        cleanup();
        resolve(false);
      }, 15000);
    });
  }, []);

  const loadAyah = useCallback(async (ayahIndex: number) => {
    if (!ayahs[ayahIndex]) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const ayah = ayahs[ayahIndex];
    
    try {
      console.log(`Loading audio for Surah ${ayah.surahId}, Ayah ${ayah.number}`);
      
      // Get primary audio URL (no network verification to avoid timeouts)
      const primaryUrl = await getAyahAudio(ayah.surahId, ayah.number);
      console.log('Primary audio URL:', primaryUrl);
      
      // Try to load the audio directly
      const success = await tryLoadAudio(primaryUrl);
      if (success) {
        console.log('Primary audio loaded successfully');
        return;
      }
      
      console.log('Primary failed, trying alternative reciter...');
      const alternativeUrl = await getAlternativeAyahAudio(ayah.surahId, ayah.number);
      console.log('Alternative audio URL:', alternativeUrl);
      
      const alternativeSuccess = await tryLoadAudio(alternativeUrl);
      if (alternativeSuccess) {
        console.log('Alternative audio loaded successfully');
        return;
      }
      
      throw new Error('Audio loading failed from all sources');
    } catch (error: any) {
      console.error('Failed to load audio:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Audio unavailable. Please check your internet connection and try again.` 
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
    console.log('Play button clicked. State:', { 
      isLoading: state.isLoading, 
      hasAudio: !!audioRef.current,
      audioSrc: audioRef.current?.src || 'No src',
      currentAyahIndex: state.currentAyahIndex,
      ayahsLength: ayahs.length
    });

    if (!audioRef.current || !audioRef.current.src) {
      console.log('No audio loaded, attempting to load first ayah');
      if (ayahs.length > 0) {
        loadAyah(state.currentAyahIndex);
        setState(prev => ({ ...prev, error: 'Loading audio, please try again in a moment...' }));
        return;
      } else {
        setState(prev => ({ ...prev, error: 'No verses available to play' }));
        return;
      }
    }

    if (state.isLoading) {
      setState(prev => ({ ...prev, error: 'Audio is still loading, please wait...' }));
      return;
    }

    const audio = audioRef.current;
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
          error: `Playback failed: ${error.message}. Click play again to retry.` 
        }));
      });
    } else {
      setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
    }
  }, [state.isLoading, state.currentAyahIndex, ayahs.length, loadAyah]);

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
    if (ayahs.length > 0) {
      console.log('Loading first ayah on mount, ayahs:', ayahs.length);
      loadAyah(0);
    }
  }, [ayahs, loadAyah]);

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