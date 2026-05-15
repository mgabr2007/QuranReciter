import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";

interface Surah {
  id: number;
  name: string;
  nameArabic: string;
  nameEnglish?: string;
  totalAyahs: number;
  revelationType: string;
}

interface Ayah {
  id: number;
  surahId: number;
  number: number;
  text: string;
  translation?: string;
  translationSahih?: string;
}

function padNum(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

function getAudioUrl(baseUrl: string, surahId: number, ayahNumber: number): string {
  const filename = `${padNum(surahId, 3)}${padNum(ayahNumber, 3)}.mp3`;
  return `${baseUrl}/audio/alafasy/${filename}`;
}

export default function ReciteScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL, language } = useLanguage();
  const { baseUrl } = useAuth();

  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [allAyahs, setAllAyahs] = useState<Ayah[]>([]);
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(7);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [showSurahPicker, setShowSurahPicker] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [pauseDuration, setPauseDuration] = useState(3);
  const [autoRepeat, setAutoRepeat] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  const soundRef = useRef<Audio.Sound | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);

  // Derived: ayahs within the selected range
  const rangeAyahs = allAyahs.filter(
    (a) => a.number >= startAyah && a.number <= endAyah
  );

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentIndexRef.current = currentAyahIndex; }, [currentAyahIndex]);

  // Load surahs
  useEffect(() => {
    fetch(`${baseUrl}/api/surahs`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: Surah[]) => {
        setSurahs(data);
        if (data.length > 0) {
          setSelectedSurah(data[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSurahs(false));
  }, [baseUrl]);

  // Load ayahs when surah changes
  useEffect(() => {
    if (!selectedSurah) return;
    setAllAyahs([]);
    fetch(`${baseUrl}/api/surahs/${selectedSurah.id}/ayahs`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data: Ayah[]) => {
        setAllAyahs(data);
        setStartAyah(1);
        setEndAyah(Math.min(7, selectedSurah.totalAyahs));
        setCurrentAyahIndex(0);
      })
      .catch(() => {});
  }, [selectedSurah, baseUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) { soundRef.current.unloadAsync(); }
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  const stopAll = useCallback(async () => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const playAyah = useCallback(
    async (index: number) => {
      if (!rangeAyahs[index] || !selectedSurah) return;

      setIsLoading(true);
      setAudioError(null);
      setCurrentAyahIndex(index);

      if (soundRef.current) {
        try { await soundRef.current.unloadAsync(); } catch {}
        soundRef.current = null;
      }

      const ayah = rangeAyahs[index];
      const audioUrl = getAudioUrl(baseUrl, selectedSurah.id, ayah.number);

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        );
        soundRef.current = sound;
        setIsLoading(false);
        setIsPlaying(true);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            const idx = currentIndexRef.current;
            if (!isPlayingRef.current) return;

            if (autoRepeat) {
              setTimeout(() => {
                if (isPlayingRef.current) playAyah(idx);
              }, pauseDuration * 1000);
              return;
            }

            const nextIdx = idx + 1;
            if (nextIdx < rangeAyahs.length) {
              setCompletedCount((c) => c + 1);
              pauseTimerRef.current = setTimeout(() => {
                if (isPlayingRef.current) playAyah(nextIdx);
              }, pauseDuration * 1000);
            } else {
              setIsPlaying(false);
              setCompletedCount((c) => c + 1);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("", t("sessionCompleted"));
            }
          }
        });
      } catch {
        setIsLoading(false);
        setAudioError(t("tryAgain"));
        setIsPlaying(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rangeAyahs, selectedSurah, baseUrl, pauseDuration, autoRepeat, t]
  );

  const handlePlay = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      if (soundRef.current) await soundRef.current.pauseAsync();
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      setIsPlaying(false);
    } else {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      } else {
        playAyah(currentAyahIndex);
      }
    }
  }, [isPlaying, currentAyahIndex, playAyah]);

  const handlePrevious = useCallback(async () => {
    await stopAll();
    setCurrentAyahIndex((i) => Math.max(0, i - 1));
  }, [stopAll]);

  const handleNext = useCallback(async () => {
    await stopAll();
    setCurrentAyahIndex((i) => Math.min(rangeAyahs.length - 1, i + 1));
  }, [stopAll, rangeAyahs.length]);

  const handleSurahSelect = useCallback(
    async (surah: Surah) => {
      await stopAll();
      setSelectedSurah(surah);
      setCurrentAyahIndex(0);
      setCompletedCount(0);
      setShowSurahPicker(false);
    },
    [stopAll]
  );

  const handleRangeChange = useCallback(
    async (field: "start" | "end", delta: number) => {
      await stopAll();
      if (field === "start") {
        setStartAyah((v) => {
          const next = Math.max(1, Math.min(v + delta, endAyah));
          return next;
        });
      } else {
        setEndAyah((v) => {
          const max = selectedSurah?.totalAyahs ?? 1;
          const next = Math.max(startAyah, Math.min(v + delta, max));
          return next;
        });
      }
      setCurrentAyahIndex(0);
    },
    [stopAll, endAyah, startAyah, selectedSurah]
  );

  const currentAyah = rangeAyahs[currentAyahIndex];
  const progress =
    rangeAyahs.length > 0 ? (currentAyahIndex + 1) / rangeAyahs.length : 0;

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad + 8,
          paddingBottom: botPad,
          paddingHorizontal: 16,
          gap: 16,
        }}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.screenTitle, { color: colors.foreground }]}>
              {t("recite")}
            </Text>
            <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
              {t("appSubtitle")}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowTranslation((v) => !v)}
            style={[
              styles.iconBtn,
              {
                backgroundColor: showTranslation
                  ? colors.islamicGreen + "22"
                  : colors.muted,
              },
            ]}
          >
            <Ionicons
              name="language"
              size={20}
              color={showTranslation ? colors.islamicGreen : colors.mutedForeground}
            />
          </Pressable>
        </View>

        {/* Surah Selector */}
        <Pressable
          onPress={() => setShowSurahPicker(true)}
          style={[
            styles.surahSelector,
            { borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <LinearGradient
            colors={[colors.islamicGreen, colors.islamicLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.surahGradient, { borderRadius: colors.radius - 1 }]}
          >
            <View style={styles.surahSelectorInner}>
              <View>
                <Text style={styles.surahSelectorLabel}>{t("selectSurah")}</Text>
                <Text style={styles.surahSelectorName}>
                  {loadingSurahs
                    ? t("loadingSurahs")
                    : selectedSurah
                    ? language === "ar"
                      ? selectedSurah.nameArabic
                      : selectedSurah.nameEnglish ?? selectedSurah.name
                    : t("selectASurah")}
                </Text>
              </View>
              <View style={styles.surahMeta}>
                {selectedSurah && (
                  <Text style={styles.surahAyahCount}>
                    {selectedSurah.totalAyahs} {t("ayahs")}
                  </Text>
                )}
                <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Ayah Range Picker */}
        {selectedSurah && allAyahs.length > 0 && (
          <View
            style={[
              styles.rangeCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.rangeTitle, { color: colors.mutedForeground }]}>
              {t("ayahRange")}
            </Text>
            <View style={styles.rangeRow}>
              {/* From */}
              <View style={styles.rangeStepper}>
                <Text style={[styles.rangeLabel, { color: colors.mutedForeground }]}>
                  {t("from")}
                </Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    onPress={() => handleRangeChange("start", -1)}
                    style={[
                      styles.stepBtn,
                      { backgroundColor: colors.muted, borderRadius: 8 },
                    ]}
                  >
                    <Ionicons name="remove" size={16} color={colors.foreground} />
                  </Pressable>
                  <Text style={[styles.stepValue, { color: colors.foreground }]}>
                    {startAyah}
                  </Text>
                  <Pressable
                    onPress={() => handleRangeChange("start", 1)}
                    style={[
                      styles.stepBtn,
                      { backgroundColor: colors.muted, borderRadius: 8 },
                    ]}
                  >
                    <Ionicons name="add" size={16} color={colors.foreground} />
                  </Pressable>
                </View>
              </View>

              <View
                style={[styles.rangeDivider, { backgroundColor: colors.border }]}
              />

              {/* To */}
              <View style={styles.rangeStepper}>
                <Text style={[styles.rangeLabel, { color: colors.mutedForeground }]}>
                  {t("to")}
                </Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    onPress={() => handleRangeChange("end", -1)}
                    style={[
                      styles.stepBtn,
                      { backgroundColor: colors.muted, borderRadius: 8 },
                    ]}
                  >
                    <Ionicons name="remove" size={16} color={colors.foreground} />
                  </Pressable>
                  <Text style={[styles.stepValue, { color: colors.foreground }]}>
                    {endAyah}
                  </Text>
                  <Pressable
                    onPress={() => handleRangeChange("end", 1)}
                    style={[
                      styles.stepBtn,
                      { backgroundColor: colors.muted, borderRadius: 8 },
                    ]}
                  >
                    <Ionicons name="add" size={16} color={colors.foreground} />
                  </Pressable>
                </View>
              </View>

              {/* Count badge */}
              <View
                style={[
                  styles.rangeBadge,
                  { backgroundColor: colors.islamicGreen + "22" },
                ]}
              >
                <Text style={[styles.rangeBadgeText, { color: colors.islamicGreen }]}>
                  {rangeAyahs.length}
                </Text>
                <Text style={[styles.rangeBadgeLabel, { color: colors.islamicGreen }]}>
                  {t("ayahs")}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Arabic Text Display */}
        <View
          style={[
            styles.ayahCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          {currentAyah ? (
            <>
              <View style={styles.ayahHeader}>
                <View
                  style={[
                    styles.ayahBadge,
                    { backgroundColor: colors.islamicGreen + "22" },
                  ]}
                >
                  <Text
                    style={[styles.ayahBadgeText, { color: colors.islamicGreen }]}
                  >
                    {currentAyah.number}
                  </Text>
                </View>
                <Text
                  style={[styles.ayahProgress, { color: colors.mutedForeground }]}
                >
                  {currentAyahIndex + 1} / {rangeAyahs.length}
                </Text>
              </View>

              {/* Arabic Text */}
              <Text style={[styles.arabicText, { color: colors.foreground }]}>
                {currentAyah.text}
              </Text>

              {/* Translation */}
              {showTranslation && (
                <View
                  style={[
                    styles.translationBox,
                    {
                      backgroundColor: colors.muted,
                      borderRadius: colors.radius - 4,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.translationText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {currentAyah.translationSahih ?? currentAyah.translation ?? ""}
                  </Text>
                </View>
              )}

              {/* Progress bar using flexGrow instead of % string */}
              <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: colors.islamicGreen,
                      flexGrow: progress,
                    },
                  ]}
                />
                <View style={{ flexGrow: 1 - progress }} />
              </View>
            </>
          ) : (
            <View style={styles.emptyAyah}>
              <Text
                style={[styles.arabicPlaceholder, { color: colors.mutedForeground }]}
              >
                ﷽
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t("selectAndPlay")}
              </Text>
            </View>
          )}
        </View>

        {/* Audio Error */}
        {audioError && (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: colors.destructive + "22",
                borderRadius: colors.radius,
              },
            ]}
          >
            <Ionicons name="warning-outline" size={16} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {audioError}
            </Text>
          </View>
        )}

        {/* Audio Controls */}
        <View
          style={[
            styles.controlsCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View style={styles.mainControls}>
            <Pressable
              onPress={handlePrevious}
              disabled={currentAyahIndex === 0}
              style={({ pressed }) => [
                styles.controlBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Ionicons
                name="play-skip-back"
                size={26}
                color={
                  currentAyahIndex === 0
                    ? colors.mutedForeground
                    : colors.foreground
                }
              />
            </Pressable>

            <Pressable
              onPress={handlePlay}
              disabled={!selectedSurah || rangeAyahs.length === 0}
              style={({ pressed }) => [
                styles.playBtn,
                {
                  backgroundColor: colors.islamicGreen,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={28}
                  color="#FFFFFF"
                  style={!isPlaying ? { marginLeft: 3 } : {}}
                />
              )}
            </Pressable>

            <Pressable
              onPress={handleNext}
              disabled={currentAyahIndex >= rangeAyahs.length - 1}
              style={({ pressed }) => [
                styles.controlBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Ionicons
                name="play-skip-forward"
                size={26}
                color={
                  currentAyahIndex >= rangeAyahs.length - 1
                    ? colors.mutedForeground
                    : colors.foreground
                }
              />
            </Pressable>
          </View>

          {/* Pause Duration + Auto Repeat */}
          <View style={styles.settingsRow}>
            <View style={styles.pauseControl}>
              <Ionicons
                name="timer-outline"
                size={14}
                color={colors.mutedForeground}
              />
              <Pressable
                onPress={() => setPauseDuration((v) => Math.max(0, v - 1))}
                style={styles.smallBtn}
              >
                <Ionicons name="remove" size={16} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.pauseValue, { color: colors.foreground }]}>
                {pauseDuration}s
              </Text>
              <Pressable
                onPress={() => setPauseDuration((v) => Math.min(30, v + 1))}
                style={styles.smallBtn}
              >
                <Ionicons name="add" size={16} color={colors.foreground} />
              </Pressable>
            </View>

            <Pressable
              onPress={() => setAutoRepeat((v) => !v)}
              style={[
                styles.repeatBtn,
                {
                  backgroundColor: autoRepeat
                    ? colors.islamicGreen + "22"
                    : colors.muted,
                  borderRadius: 8,
                },
              ]}
            >
              <Ionicons
                name="repeat"
                size={16}
                color={autoRepeat ? colors.islamicGreen : colors.mutedForeground}
              />
            </Pressable>
          </View>
        </View>

        {/* Stats */}
        {completedCount > 0 && (
          <View
            style={[
              styles.statsRow,
              {
                backgroundColor: colors.islamicGreen + "15",
                borderRadius: colors.radius,
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.islamicGreen}
            />
            <Text style={[styles.statsText, { color: colors.islamicGreen }]}>
              {completedCount} {t("ayahs")} {t("completed")}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Surah Picker Modal */}
      <Modal
        visible={showSurahPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSurahPicker(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {t("selectSurah")}
            </Text>
            <Pressable onPress={() => setShowSurahPicker(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>
          <FlatList
            data={surahs}
            keyExtractor={(s) => String(s.id)}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSurahSelect(item)}
                style={({ pressed }) => [
                  styles.surahItem,
                  {
                    backgroundColor:
                      selectedSurah?.id === item.id
                        ? colors.islamicGreen + "18"
                        : pressed
                        ? colors.muted
                        : "transparent",
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.surahNumber,
                    { backgroundColor: colors.islamicGreen + "22" },
                  ]}
                >
                  <Text
                    style={[
                      styles.surahNumText,
                      { color: colors.islamicGreen },
                    ]}
                  >
                    {item.id}
                  </Text>
                </View>
                <View style={styles.surahItemInfo}>
                  <Text
                    style={[styles.surahItemName, { color: colors.foreground }]}
                  >
                    {item.nameEnglish ?? item.name}
                  </Text>
                  <Text
                    style={[
                      styles.surahItemMeta,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {item.totalAyahs} {t("ayahs")} · {item.revelationType}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.surahItemArabic,
                    { color: colors.islamicGreen },
                  ]}
                >
                  {item.nameArabic}
                </Text>
              </Pressable>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  screenTitle: { fontSize: 26, fontWeight: "700" as const },
  screenSubtitle: { fontSize: 13, marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  surahSelector: {
    borderWidth: 1,
    overflow: "hidden",
  },
  surahGradient: {},
  surahSelectorInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  surahSelectorLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "500" as const,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  surahSelectorName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700" as const,
    marginTop: 2,
  },
  surahMeta: { alignItems: "flex-end", gap: 4 },
  surahAyahCount: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  rangeCard: {
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  rangeTitle: {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rangeStepper: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  rangeLabel: { fontSize: 12, fontWeight: "500" as const },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: { fontSize: 18, fontWeight: "700" as const, minWidth: 36, textAlign: "center" },
  rangeDivider: { width: 1, height: 40, alignSelf: "center" },
  rangeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  rangeBadgeText: { fontSize: 20, fontWeight: "700" as const },
  rangeBadgeLabel: { fontSize: 10, fontWeight: "500" as const },
  ayahCard: {
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  ayahHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ayahBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ayahBadgeText: { fontSize: 13, fontWeight: "700" as const },
  ayahProgress: { fontSize: 12 },
  arabicText: {
    fontSize: 26,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 52,
    fontFamily: "AmiriQuran",
  },
  translationBox: { padding: 12 },
  translationText: { fontSize: 14, lineHeight: 22 },
  progressBarTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    flexDirection: "row",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  emptyAyah: { alignItems: "center", paddingVertical: 16, gap: 8 },
  arabicPlaceholder: { fontSize: 40, fontFamily: "AmiriQuran" },
  emptyText: { fontSize: 14, textAlign: "center" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  errorText: { fontSize: 13, flex: 1 },
  controlsCard: {
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  mainControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  controlBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  pauseControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    minWidth: 32,
    textAlign: "center",
  },
  repeatBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  statsText: { fontSize: 13, fontWeight: "600" as const },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: "700" as const },
  surahItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  surahNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  surahNumText: { fontSize: 13, fontWeight: "700" as const },
  surahItemInfo: { flex: 1 },
  surahItemName: { fontSize: 15, fontWeight: "600" as const },
  surahItemMeta: { fontSize: 12, marginTop: 2 },
  surahItemArabic: { fontSize: 18, fontWeight: "400" as const },
});
