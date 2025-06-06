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
  try {
    // Use Al-Quran Cloud API as primary source - it's working reliably
    const apiResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/ar.alafasy`);
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('API response received:', apiData);
      
      if (apiData.code === 200 && apiData.data && apiData.data.audio) {
        console.log('Found audio URL from API:', apiData.data.audio);
        return apiData.data.audio;
      }
    }
    
    // Try alternative reciter if primary fails
    const altResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/ar.abdurrahmaansudais`);
    
    if (altResponse.ok) {
      const altData = await altResponse.json();
      
      if (altData.code === 200 && altData.data && altData.data.audio) {
        console.log('Found alternative audio URL:', altData.data.audio);
        return altData.data.audio;
      }
    }
    
    // Try direct CDN URLs as final fallback
    const directUrls = [
      `https://everyayah.com/data/Alafasy_128kbps/${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`,
      `https://versebyversequran.com/downloads/audio/Alafasy/${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`
    ];

    for (const url of directUrls) {
      try {
        const testResponse = await fetch(url, { method: 'HEAD' });
        if (testResponse.ok) {
          console.log('Found working direct URL:', url);
          return url;
        }
      } catch {
        // Continue to next URL
      }
    }
    
    throw new Error('No accessible audio URL found from any source');
  } catch (error) {
    console.error('Error fetching ayah audio:', error);
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