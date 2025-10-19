import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { SurahSelector } from "@/components/surah-selector";
import { PauseSettings } from "@/components/pause-settings";
import { AudioPlayer } from "@/components/audio-player";
import { AyahDisplay } from "@/components/ayah-display";
import { QuickActions } from "@/components/quick-actions";
import { VerseSearch } from "@/components/verse-search";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useSimpleAudio } from "@/hooks/use-simple-audio";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { Surah, Ayah, UserPreferences } from "@shared/schema";
import { getSurahDisplayName } from "@/lib/quran-data";

export default function Home() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  
  // State for selections
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(7);
  const [pauseDuration, setPauseDuration] = useState(5);
  const [autoRepeat, setAutoRepeat] = useState(false);
  const [autoRepeatAyah, setAutoRepeatAyah] = useState(false);
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
    queryKey: [`/api/surahs/${selectedSurah}`],
    enabled: !!selectedSurah,
  });

  // Load ayahs for selected range
  const { data: allAyahs = [], isLoading: ayahsLoading, error: ayahsError } = useQuery<Ayah[]>({
    queryKey: [`/api/surahs/${selectedSurah}/ayahs`],
    enabled: !!selectedSurah,
  });

  // Get ayahs in selected range - memoized to prevent recreation on every render
  const selectedAyahs = useMemo(() => {
    return allAyahs.filter(
      ayah => ayah.number >= startAyah && ayah.number <= endAyah
    );
  }, [allAyahs, startAyah, endAyah]);

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
      setAutoRepeatAyah(preferences.autoRepeatAyah || false);
      if (preferences.lastSurah) {
        setSelectedSurah(preferences.lastSurah);
      }
      if (preferences.lastAyah) {
        setStartAyah(preferences.lastAyah);
      }
    }
  }, [preferences]);

  // Audio player hook
  const audioPlayer = useSimpleAudio({
    ayahs: selectedAyahs,
    pauseDuration,
    autoRepeat,
    autoRepeatAyah,
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
          title: t('sessionCompleted'),
          description: t('completedAyahsTime', { 
            count: selectedAyahs.length, 
            time: `${Math.floor(sessionTime / 60)}m ${sessionTime % 60}s` 
          }),
        });
        
        setCurrentSessionId(null);
        setSessionStartTime(null);
      }
    },
  });

  // Reset audio player when surah or ayah range changes
  useEffect(() => {
    if (selectedAyahs.length > 0) {
      audioPlayer.skipToAyah(0);
    }
  }, [selectedSurah, startAyah, endAyah]);

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

  const handleAutoRepeatAyahChange = (repeat: boolean) => {
    setAutoRepeatAyah(repeat);
    updatePreferencesMutation.mutate({ autoRepeatAyah: repeat });
  };

  const handleReset = () => {
    audioPlayer.stop();
    audioPlayer.skipToAyah(0);
    toast({
      title: t('sessionReset'),
      description: t('recitationReset'),
    });
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

  return (
    <>
      <PageHeader
        icon={<span className="text-white text-lg font-arabic">ق</span>}
        title={t('appTitle')}
        subtitle={t('appSubtitle')}
        actions={
          <>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-gray-900"
              onClick={() => setShowVerseSearch(true)}
              data-testid="button-search"
            >
              <Search className="h-4 w-4 mr-2" />
              {t('search')}
            </Button>
            
            <LanguageSwitcher />
          </>
        }
      />

      <PageLayout>
        <div className="space-y-6">
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
          autoRepeatAyah={autoRepeatAyah}
          pauseCountdown={audioPlayer.pauseCountdown}
          lastAyahDuration={audioPlayer.lastAyahDuration}
          onPauseDurationChange={handlePauseDurationChange}
          onAutoRepeatChange={handleAutoRepeatChange}
          onAutoRepeatAyahChange={handleAutoRepeatAyahChange}
        />

        {/* Ayah Display with Translation */}
        <AyahDisplay
          currentAyah={audioPlayer.currentAyah}
          surahName={currentSurah ? getSurahDisplayName(currentSurah, language) : ""}
          currentAyahNumber={audioPlayer.currentAyah?.number || 1}
          totalAyahs={currentSurah?.totalAyahs || selectedAyahs.length}
          isPlaying={audioPlayer.isPlaying}
          showTranslation={showTranslation}
          onTranslationToggle={setShowTranslation}
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
          surahName={currentSurah ? getSurahDisplayName(currentSurah, language) : ""}
          currentAyahNumber={audioPlayer.currentAyah?.number || 1}
          totalAyahs={currentSurah?.totalAyahs || selectedAyahs.length}
          error={audioPlayer.error}
          onPlay={audioPlayer.play}
          onPause={audioPlayer.pause}
          onPrevious={audioPlayer.goToPrevious}
          onNext={audioPlayer.goToNext}
          onRewind={audioPlayer.rewind}
          onForward={audioPlayer.forward}
          onRepeat={audioPlayer.repeat}
          onSeek={audioPlayer.seek}
        />

        {/* Quick Actions */}
        <QuickActions
          currentSurahId={selectedSurah}
          currentSurahName={currentSurah ? getSurahDisplayName(currentSurah, language) : ""}
          currentAyahNumber={audioPlayer.currentAyah?.number || 1}
          onReset={handleReset}
        />
        </div>
      </PageLayout>

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
    </>
  );
}
