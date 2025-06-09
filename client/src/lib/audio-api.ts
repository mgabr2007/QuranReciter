// Authentic Quran audio API integration
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

// Helper function to test if an audio URL is accessible
const testAudioUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

export const getAyahAudio = async (surahId: number, ayahNumber: number): Promise<string> => {
  console.log(`Fetching audio for Surah ${surahId}, Ayah ${ayahNumber}`);
  
  // Primary source: EveryAyah CDN (confirmed working with CORS)
  const everyAyahUrl = `https://everyayah.com/data/Alafasy_128kbps/${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
  
  console.log('Using EveryAyah CDN:', everyAyahUrl);
  return everyAyahUrl;
};

export const getAlternativeAyahAudio = async (surahId: number, ayahNumber: number): Promise<string> => {
  // Use EveryAyah CDN with alternative reciter
  const alternativeUrl = `https://everyayah.com/data/AbdurRahmaanAs-Sudais_128kbps/${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
  
  console.log('Using alternative EveryAyah CDN:', alternativeUrl);
  return alternativeUrl;
};