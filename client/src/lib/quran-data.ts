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

export const createAudioUrl = async (surahId: number, ayahNumber: number): Promise<string> => {
  try {
    // Using Al-Quran Cloud API for individual ayah audio
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/ar.alafasy`);
    const data = await response.json();
    
    if (data.code === 200 && data.data.audio) {
      return data.data.audio;
    }
  } catch (error) {
    console.warn('API request failed, using direct audio URL');
  }
  
  // Direct authentic audio URL as backup
  const paddedSurah = surahId.toString().padStart(3, '0');
  const paddedAyah = ayahNumber.toString().padStart(3, '0');
  return `https://everyayah.com/data/Alafasy_128kbps/${paddedSurah}${paddedAyah}.mp3`;
};

export const createAlternativeAudioUrl = async (surahId: number, ayahNumber: number): Promise<string> => {
  try {
    // Alternative reciter - Sheikh Abdul Rahman Al-Sudais
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/ar.abdurrahmaansudais`);
    const data = await response.json();
    
    if (data.code === 200 && data.data.audio) {
      return data.data.audio;
    }
  } catch (error) {
    console.warn('Alternative API request failed, using direct audio URL');
  }
  
  // Direct authentic audio URL as backup
  const paddedSurah = surahId.toString().padStart(3, '0');
  const paddedAyah = ayahNumber.toString().padStart(3, '0');
  return `https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/${paddedSurah}${paddedAyah}.mp3`;
};

export const getEstimatedDuration = (numberOfAyahs: number, pauseDuration: number): number => {
  // Estimate ~10 seconds per ayah + pause duration
  const averageAyahDuration = 10;
  return numberOfAyahs * (averageAyahDuration + pauseDuration);
};
