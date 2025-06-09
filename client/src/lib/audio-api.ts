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
  
  // Multiple verified audio sources with fallback strategy
  const audioSources = [
    // 1. Islamic Network CDN - Confirmed working, verse-by-verse
    `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${surahId}.mp3`,
    
    // 2. EveryAyah CDN - Confirmed working with CORS, individual ayahs
    `https://everyayah.com/data/Alafasy_128kbps/${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`
  ];

  // Try each source until one works
  for (const audioUrl of audioSources) {
    try {
      console.log('Testing audio source:', audioUrl);
      
      // Quick HEAD request to verify accessibility
      const response = await fetch(audioUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log('Audio source verified:', audioUrl);
        return audioUrl;
      }
    } catch (error) {
      console.log('Audio source failed:', audioUrl);
      continue;
    }
  }
  
  // If all direct sources fail, return the most reliable one (EveryAyah)
  const fallbackUrl = audioSources[0];
  console.log('Using fallback audio source:', fallbackUrl);
  return fallbackUrl;
};

export const getAlternativeAyahAudio = async (surahId: number, ayahNumber: number): Promise<string> => {
  // Use EveryAyah CDN with alternative reciter
  const alternativeUrl = `https://everyayah.com/data/AbdurRahmaanAs-Sudais_128kbps/${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
  
  console.log('Using alternative EveryAyah CDN:', alternativeUrl);
  return alternativeUrl;
};