// Local and external Quran audio integration
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

// Check if local audio file exists via API endpoint
const checkLocalAudio = async (surahId: number, ayahNumber: number, reciter: string = 'alafasy'): Promise<string | null> => {
  const filename = `${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
  
  try {
    // Check via API endpoint instead of direct file access
    const response = await fetch(`/api/audio/check/${reciter}/${filename}`);
    if (response.ok) {
      const data = await response.json();
      if (data.exists) {
        const localUrl = `/audio/${reciter}/${filename}`;
        console.log('✅ Local audio file available:', localUrl);
        return localUrl;
      }
    }
  } catch (error) {
    console.log('⚠️ Local audio check failed, using external source');
  }
  
  return null;
};

export const getAyahAudio = async (surahId: number, ayahNumber: number): Promise<string> => {
  console.log(`🎵 Getting audio for Surah ${surahId}, Ayah ${ayahNumber}`);
  
  // First, try local audio file
  const localAudio = await checkLocalAudio(surahId, ayahNumber, 'alafasy');
  if (localAudio) {
    console.log('🏠 Using local audio file:', localAudio);
    return localAudio;
  }
  
  // Fallback to external CDN
  const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
  console.log('🌐 Using external audio:', audioUrl);
  
  return audioUrl;
};

export const getAlternativeAyahAudio = async (surahId: number, ayahNumber: number): Promise<string> => {
  console.log(`🎵 Getting alternative audio for Surah ${surahId}, Ayah ${ayahNumber}`);
  
  // First, try local alternative reciter
  const localAudio = await checkLocalAudio(surahId, ayahNumber, 'abdul_basit');
  if (localAudio) {
    console.log('🏠 Using local alternative audio:', localAudio);
    return localAudio;
  }
  
  // Fallback to external CDN with alternative reciter
  const alternativeUrl = `https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
  console.log('🌐 Using external alternative audio:', alternativeUrl);
  
  return alternativeUrl;
};