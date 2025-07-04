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
  
  // Use EveryAyah CDN directly - confirmed working with proper CORS headers
  const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
  
  console.log('Generated audio URL:', audioUrl);
  
  // Test URL accessibility
  try {
    const response = await fetch(audioUrl, { method: 'HEAD' });
    console.log('Audio URL test response:', response.status, response.statusText);
    if (response.ok) {
      console.log('✅ Audio URL verified accessible');
    } else {
      console.warn('⚠️ Audio URL returned error status:', response.status);
    }
  } catch (error) {
    console.warn('⚠️ Audio URL test failed:', error);
  }
  
  return audioUrl;
};

export const getAlternativeAyahAudio = async (surahId: number, ayahNumber: number): Promise<string> => {
  // Use EveryAyah CDN with alternative reciter
  const alternativeUrl = `https://everyayah.com/data/AbdurRahmaanAs-Sudais_128kbps/${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
  
  console.log('Using alternative EveryAyah CDN:', alternativeUrl);
  return alternativeUrl;
};