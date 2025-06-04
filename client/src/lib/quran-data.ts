import type { Surah, Ayah } from "@shared/schema";

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getSurahDisplayName = (surah: Surah): string => {
  return `${surah.name} (${surah.nameTranslation})`;
};

export const getAyahRange = (totalAyahs: number, startAyah?: number, endAyah?: number): { start: number; end: number } => {
  const start = startAyah && startAyah > 0 ? startAyah : 1;
  const end = endAyah && endAyah <= totalAyahs ? endAyah : totalAyahs;
  return { start: Math.min(start, end), end: Math.max(start, end) };
};

export const createAudioUrl = (surahId: number, ayahNumber: number): string => {
  // This would typically point to actual audio files
  // For demo purposes, we'll return a placeholder URL
  return `/audio/surah_${surahId.toString().padStart(3, '0')}/ayah_${ayahNumber.toString().padStart(3, '0')}.mp3`;
};

export const getEstimatedDuration = (numberOfAyahs: number, pauseDuration: number): number => {
  // Estimate ~10 seconds per ayah + pause duration
  const averageAyahDuration = 10;
  return numberOfAyahs * (averageAyahDuration + pauseDuration);
};
