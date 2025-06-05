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

export const getAyahAudio = async (surahId: number, ayahNumber: number): Promise<string> => {
  try {
    // Try to get cached audio from database first
    const cachedResponse = await fetch(`/api/audio/${surahId}/${ayahNumber}`);
    if (cachedResponse.ok) {
      const cachedData = await cachedResponse.json();
      console.log('Using cached audio URL:', cachedData.audioUrl);
      
      // Return verified URL or fallback to alternative
      if (cachedData.isVerified && cachedData.audioUrl) {
        return cachedData.audioUrl;
      } else if (cachedData.alternativeUrl) {
        return cachedData.alternativeUrl;
      }
    }
    
    // Fallback to Al-Quran Cloud API if caching fails
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/ar.alafasy`);
    
    if (!response.ok) {
      throw new Error(`Al-Quran Cloud API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Al-Quran Cloud API response:', data);
    
    if (data.code === 200 && data.data && data.data.audio) {
      console.log('Found audio URL from Al-Quran Cloud:', data.data.audio);
      return data.data.audio;
    }
    
    throw new Error('No audio URL found in API response');
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