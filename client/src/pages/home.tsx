import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { SurahSelector } from "@/components/surah-selector";
import { PauseSettings } from "@/components/pause-settings";
import { AudioPlayer } from "@/components/audio-player";
import { AyahDisplay } from "@/components/ayah-display";
import { RecitationStatus } from "@/components/recitation-status";
import { QuickActions } from "@/components/quick-actions";
import { VerseSearch } from "@/components/verse-search";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Settings, History as HistoryIcon, Heart, Search } from "lucide-react";
import type { Surah, Ayah, UserPreferences, BookmarkedAyah } from "@shared/schema";
import { getSurahDisplayName } from "@/lib/quran-data";

export default function Home() {
  const { toast } = useToast();
  
  // State for selections
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(7);
  const [pauseDuration, setPauseDuration] = useState(5);
  const [autoRepeat, setAutoRepeat] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showVerseSearch, setShowVerseSearch] = useState(false);

  // Load user preferences
  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  // Load current surah
  const { data: currentSurah } = useQuery<Surah>({
    queryKey: ["/api/surahs", selectedSurah],
    enabled: !!selectedSurah,
  });

  // Load ayahs for selected range
  const { data: allAyahs = [], isLoading: ayahsLoading, error: ayahsError } = useQuery<Ayah[]>({
    queryKey: [`/api/surahs/${selectedSurah}/ayahs`],
    enabled: !!selectedSurah,
  });

  // Load bookmarks
  const { data: bookmarks = [] } = useQuery<BookmarkedAyah[]>({
    queryKey: ["/api/bookmarks"],
  });

  // Get ayahs in selected range
  const selectedAyahs = allAyahs.filter(
    ayah => ayah.number >= startAyah && ayah.number <= endAyah
  );

  console.log('Ayah loading debug:', { 
    selectedSurah, 
    allAyahsCount: allAyahs.length, 
    selectedAyahsCount: selectedAyahs.length,
    startAyah,
    endAyah,
    ayahsLoading,
    ayahsError
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (data: Partial<UserPreferences>) =>
      apiRequest("PUT", "/api/preferences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
    },
  });

  // Create bookmark mutation
  const createBookmarkMutation = useMutation({
    mutationFn: (data: { surahId: number; ayahNumber: number; notes?: string }) =>
      apiRequest("POST", "/api/bookmarks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "Bookmark Added",
        description: "Current ayah has been bookmarked",
      });
    },
  });

  // Session tracking mutations
  const createSessionMutation = useMutation({
    mutationFn: (data: {
      surahId: number;
      surahName: string;
      startAyah: number;
      endAyah: number;
      pauseDuration: number;
    }) => apiRequest("POST", "/api/sessions", data),
    onSuccess: (session: any) => {
      setCurrentSessionId(session.id);
      setSessionStartTime(new Date());
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: (data: {
      sessionId: number;
      completedAyahs: number;
      sessionTime: number;
      isCompleted?: boolean;
    }) => apiRequest("PUT", `/api/sessions/${data.sessionId}`, {
      completedAyahs: data.completedAyahs,
      sessionTime: data.sessionTime,
      isCompleted: data.isCompleted,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
  });

  // Initialize preferences
  useEffect(() => {
    if (preferences) {
      setPauseDuration(preferences.pauseDuration);
      setAutoRepeat(preferences.autoRepeat);
      if (preferences.lastSurah) {
        setSelectedSurah(preferences.lastSurah);
      }
      if (preferences.lastAyah) {
        setStartAyah(preferences.lastAyah);
      }
    }
  }, [preferences]);

  // Audio player hook
  const audioPlayer = useAudioPlayer({
    ayahs: selectedAyahs,
    pauseDuration,
    autoRepeat,
    onAyahChange: (ayahIndex) => {
      const ayah = selectedAyahs[ayahIndex];
      if (ayah) {
        // Update last position in preferences
        updatePreferencesMutation.mutate({
          lastSurah: selectedSurah,
          lastAyah: ayah.number,
        });
      }
    },
    onSessionComplete: () => {
      // Complete the session
      if (currentSessionId && sessionStartTime) {
        const sessionTime = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
        updateSessionMutation.mutate({
          sessionId: currentSessionId,
          completedAyahs: selectedAyahs.length,
          sessionTime,
          isCompleted: true,
        });
        
        toast({
          title: "Session Completed",
          description: `Completed ${selectedAyahs.length} ayahs in ${Math.floor(sessionTime / 60)}m ${sessionTime % 60}s`,
        });
        
        setCurrentSessionId(null);
        setSessionStartTime(null);
      }
    },
  });

  const handleSelectionChange = (surah: number, start: number, end: number) => {
    // Stop current playback
    audioPlayer.stop();
    
    setSelectedSurah(surah);
    setStartAyah(start);
    setEndAyah(end);
    
    // Update preferences
    updatePreferencesMutation.mutate({
      lastSurah: surah,
      lastAyah: start,
    });
  };

  const handlePauseDurationChange = (duration: number) => {
    setPauseDuration(duration);
    updatePreferencesMutation.mutate({ pauseDuration: duration });
  };

  const handleAutoRepeatChange = (repeat: boolean) => {
    setAutoRepeat(repeat);
    updatePreferencesMutation.mutate({ autoRepeat: repeat });
  };

  const handleReset = () => {
    audioPlayer.stop();
    audioPlayer.skipToAyah(0);
    toast({
      title: "Session Reset",
      description: "Recitation has been reset to the beginning",
    });
  };

  const handleBookmark = () => {
    const currentAyah = audioPlayer.currentAyah;
    if (currentAyah) {
      createBookmarkMutation.mutate({
        surahId: currentAyah.surahId,
        ayahNumber: currentAyah.number,
      });
    }
  };

  const handlePlayVerseFromSearch = (surahId: number, ayahNumber: number) => {
    // Stop current playback
    audioPlayer.stop();
    
    // Switch to the selected surah and ayah
    setSelectedSurah(surahId);
    setStartAyah(ayahNumber);
    setEndAyah(ayahNumber);
    
    // Update preferences
    updatePreferencesMutation.mutate({
      lastSurah: surahId,
      lastAyah: ayahNumber,
    });
  };

  const isCurrentAyahBookmarked = () => {
    const currentAyah = audioPlayer.currentAyah;
    if (!currentAyah) return false;
    
    return bookmarks.some(
      bookmark => 
        bookmark.surahId === currentAyah.surahId && 
        bookmark.ayahNumber === currentAyah.number
    );
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--surface))]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-islamic-green rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-arabic">ق</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Tilawah Assistant</h1>
                <p className="text-sm text-gray-600">Quran Recitation with Pause</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-gray-900"
                onClick={() => setShowVerseSearch(true)}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Link href="/bookmarks">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <Heart className="h-4 w-4 mr-2" />
                  Bookmarks
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <HistoryIcon className="h-4 w-4 mr-2" />
                  History
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Surah Selector */}
        <SurahSelector
          selectedSurah={selectedSurah}
          startAyah={startAyah}
          endAyah={endAyah}
          onSelectionChange={handleSelectionChange}
        />

        {/* Pause Settings */}
        <PauseSettings
          pauseDuration={pauseDuration}
          autoRepeat={autoRepeat}
          onPauseDurationChange={handlePauseDurationChange}
          onAutoRepeatChange={handleAutoRepeatChange}
        />

        {/* Audio Player */}
        <AudioPlayer
          currentAyah={audioPlayer.currentAyah}
          isPlaying={audioPlayer.isPlaying}
          isPaused={audioPlayer.isPaused}
          isLoading={audioPlayer.isLoading}
          currentTime={audioPlayer.currentTime}
          duration={audioPlayer.duration}
          progress={audioPlayer.progress}
          pauseDuration={pauseDuration}
          surahName={currentSurah ? getSurahDisplayName(currentSurah) : ""}
          currentAyahNumber={audioPlayer.currentAyah?.number || 1}
          totalAyahs={selectedAyahs.length}
          error={audioPlayer.error}
          onPlay={audioPlayer.play}
          onPause={audioPlayer.pause}
          onPrevious={audioPlayer.previousAyah}
          onNext={audioPlayer.nextAyah}
          onRewind={() => audioPlayer.seek(Math.max(0, audioPlayer.currentTime - 10))}
          onForward={() => audioPlayer.seek(Math.min(audioPlayer.duration, audioPlayer.currentTime + 10))}
          onRepeat={audioPlayer.repeatCurrent}
          onSeek={audioPlayer.seek}
        />

        {/* Ayah Display with Translation */}
        <AyahDisplay
          currentAyah={audioPlayer.currentAyah}
          surahName={currentSurah ? getSurahDisplayName(currentSurah) : ""}
          currentAyahNumber={audioPlayer.currentAyah?.number || 1}
          totalAyahs={selectedAyahs.length}
          isPlaying={audioPlayer.isPlaying}
          showTranslation={showTranslation}
          onTranslationToggle={setShowTranslation}
        />

        {/* Recitation Status */}
        <RecitationStatus
          completedAyahs={audioPlayer.getCompletedAyahs()}
          remainingAyahs={audioPlayer.getRemainingAyahs()}
          sessionTime={audioPlayer.getSessionTime()}
        />

        {/* Quick Actions */}
        <QuickActions
          currentSurahId={selectedSurah}
          currentAyahNumber={audioPlayer.currentAyah?.number || 1}
          isBookmarked={isCurrentAyahBookmarked()}
          onReset={handleReset}
          onBookmark={handleBookmark}
        />
      </main>

      {/* Mobile Mini Player */}
      {audioPlayer.isPlaying && (
        <div className="fixed bottom-4 right-4 md:hidden bg-white rounded-full shadow-lg border border-gray-200 p-3">
          <Button
            size="icon"
            onClick={audioPlayer.isPlaying ? audioPlayer.pause : audioPlayer.play}
            className="w-12 h-12 bg-islamic-green hover:bg-islamic-dark rounded-full"
          >
            {audioPlayer.isPlaying ? (
              <span className="text-white text-lg">⏸</span>
            ) : (
              <span className="text-white text-lg">▶️</span>
            )}
          </Button>
        </div>
      )}

      {/* Verse Search Modal */}
      {showVerseSearch && (
        <VerseSearch
          onPlayVerse={handlePlayVerseFromSearch}
          onClose={() => setShowVerseSearch(false)}
        />
      )}
    </div>
  );
}
