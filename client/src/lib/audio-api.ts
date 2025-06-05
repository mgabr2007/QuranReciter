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
    // Try QuranAPI.pages.dev first (no authentication required)
    const quranApiResponse = await fetch(`https://quranapi.pages.dev/api/verses/${surahId}:${ayahNumber}/ar.alafasy`);
    
    if (quranApiResponse.ok) {
      const quranApiData = await quranApiResponse.json();
      console.log('QuranAPI.pages.dev response:', quranApiData);
      
      if (quranApiData.audio) {
        console.log('Found audio URL from QuranAPI.pages.dev:', quranApiData.audio);
        return quranApiData.audio;
      }
    }
    
    // Fallback to Al-Quran Cloud API
    const alQuranResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/ar.alafasy`);
    
    if (alQuranResponse.ok) {
      const alQuranData = await alQuranResponse.json();
      console.log('Al-Quran Cloud API response:', alQuranData);
      
      if (alQuranData.code === 200 && alQuranData.data && alQuranData.data.audio) {
        console.log('Found audio URL from Al-Quran Cloud:', alQuranData.data.audio);
        return alQuranData.data.audio;
      }
    }
    
    // Try alternative reciter from QuranAPI.pages.dev
    const altQuranApiResponse = await fetch(`https://quranapi.pages.dev/api/verses/${surahId}:${ayahNumber}/ar.abdurrahmaansudais`);
    
    if (altQuranApiResponse.ok) {
      const altQuranApiData = await altQuranApiResponse.json();
      
      if (altQuranApiData.audio) {
        console.log('Found alternative audio URL from QuranAPI.pages.dev:', altQuranApiData.audio);
        return altQuranApiData.audio;
      }
    }
    
    throw new Error('No audio URL found from any API source');
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