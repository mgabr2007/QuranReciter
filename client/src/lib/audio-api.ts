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
  
  try {
    // Primary: Al-Quran Cloud API with Alafasy recitation
    const apiResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/ar.alafasy`);
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('Al-Quran Cloud API response:', apiData);
      
      if (apiData.code === 200 && apiData.data && apiData.data.audio) {
        console.log('Using primary API audio URL:', apiData.data.audio);
        return apiData.data.audio;
      }
    }
    
    console.log('Primary API failed, trying direct CDN sources...');
    
    // Direct CDN fallbacks - these often work when API URLs fail due to CORS
    const directUrls = [
      // EveryAyah.com - reliable source with proper CORS headers
      `https://everyayah.com/data/Alafasy_128kbps/${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`,
      
      // Alternative direct sources
      `https://audio.qurancdn.com/${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`
    ];

    for (const url of directUrls) {
      try {
        console.log('Testing direct URL:', url);
        const testResponse = await fetch(url, { method: 'HEAD' });
        if (testResponse.ok) {
          console.log('Direct URL accessible:', url);
          return url;
        }
      } catch (error) {
        console.log('Direct URL failed:', url, error);
      }
    }
    
    throw new Error(`No accessible audio found for Surah ${surahId}, Ayah ${ayahNumber}`);
  } catch (error) {
    console.error('Error in getAyahAudio:', error);
    throw error;
  }
};

export const getAlternativeAyahAudio = async (surahId: number, ayahNumber: number): Promise<string> => {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/ar.abdurrahmaansudais`);
    const data = await response.json();
    
    if (data.code === 200 && data.data && data.data.audio) {
      return data.data.audio;
    }
    
    throw new Error('No alternative audio URL found in API response');
  } catch (error) {
    console.error('Error fetching alternative ayah audio:', error);
    throw error;
  }
};