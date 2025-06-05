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
    // Use Al-Quran Cloud API as primary source
    const alQuranResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/ar.alafasy`);
    
    if (alQuranResponse.ok) {
      const alQuranData = await alQuranResponse.json();
      console.log('Al-Quran Cloud API response:', alQuranData);
      
      if (alQuranData.code === 200 && alQuranData.data) {
        // Test primary audio URL
        if (alQuranData.data.audio) {
          const isAccessible = await testAudioUrl(alQuranData.data.audio);
          if (isAccessible) {
            console.log('Found working audio URL from Al-Quran Cloud:', alQuranData.data.audio);
            return alQuranData.data.audio;
          }
        }
        
        // Test secondary audio URLs if primary fails
        if (alQuranData.data.audioSecondary && alQuranData.data.audioSecondary.length > 0) {
          for (const secondaryUrl of alQuranData.data.audioSecondary) {
            const isAccessible = await testAudioUrl(secondaryUrl);
            if (isAccessible) {
              console.log('Found working secondary audio URL:', secondaryUrl);
              return secondaryUrl;
            }
          }
        }
      }
    }
    
    // Try alternative reciter if primary fails
    const altResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/ar.abdurrahmaansudais`);
    
    if (altResponse.ok) {
      const altData = await altResponse.json();
      
      if (altData.code === 200 && altData.data && altData.data.audio) {
        const isAccessible = await testAudioUrl(altData.data.audio);
        if (isAccessible) {
          console.log('Found working audio URL from alternative reciter:', altData.data.audio);
          return altData.data.audio;
        }
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