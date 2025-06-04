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
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/ar.alafasy`);
    const data = await response.json();
    
    if (data.code === 200 && data.data.audio) {
      return data.data.audio;
    }
    
    // Fallback to direct CDN URL
    return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${surahId}.mp3`;
  } catch (error) {
    console.warn('Failed to fetch ayah audio, using fallback:', error);
    return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${surahId}.mp3`;
  }
};

export const getAlternativeAyahAudio = async (surahId: number, ayahNumber: number): Promise<string> => {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/ar.abdurrahmaansudais`);
    const data = await response.json();
    
    if (data.code === 200 && data.data.audio) {
      return data.data.audio;
    }
    
    // Fallback to direct CDN URL
    return `https://cdn.islamic.network/quran/audio/128/ar.abdurrahmaansudais/${surahId}.mp3`;
  } catch (error) {
    console.warn('Failed to fetch alternative ayah audio, using fallback:', error);
    return `https://cdn.islamic.network/quran/audio/128/ar.abdurrahmaansudais/${surahId}.mp3`;
  }
};