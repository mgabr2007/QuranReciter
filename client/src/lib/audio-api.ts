// Simple local Quran audio integration
export interface AyahAudioData {
  audio: string;
  audioSecondary?: string[];
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
  };
  numberInSurah: number;
}

// Helper function to format numbers with leading zeros for URL paths
const formatNumber = (num: number, padding: number): string => {
  return num.toString().padStart(padding, '0');
};

export const getAyahAudio = async (surahId: number, ayahNumber: number): Promise<string> => {
  // Return local audio path directly
  const filename = `${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
  return `/audio/alafasy/${filename}`;
};

export const getAlternativeAyahAudio = async (surahId: number, ayahNumber: number): Promise<string> => {
  // Return alternative external CDN since we don't have all alternative reciters locally
  const filename = `${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
  return `https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/${filename}`;
};