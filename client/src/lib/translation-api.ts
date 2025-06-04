// Authentic Quran translation API integration
export interface AyahTranslationData {
  text: string;
  edition: {
    identifier: string;
    language: string;
    name: string;
    englishName: string;
  };
  surah: {
    number: number;
    name: string;
    englishName: string;
  };
  numberInSurah: number;
}

export const getAyahTranslation = async (surahId: number, ayahNumber: number): Promise<string> => {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/en.sahih`);
    const data = await response.json();
    
    if (data.code === 200 && data.data.text) {
      return data.data.text;
    }
    
    throw new Error('Translation not found');
  } catch (error) {
    console.warn('Failed to fetch ayah translation:', error);
    return '';
  }
};

export const getAyahArabicText = async (surahId: number, ayahNumber: number): Promise<string> => {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/ar.alafasy`);
    const data = await response.json();
    
    if (data.code === 200 && data.data.text) {
      return data.data.text;
    }
    
    throw new Error('Arabic text not found');
  } catch (error) {
    console.warn('Failed to fetch Arabic text:', error);
    return '';
  }
};

export const getSurahTranslations = async (surahId: number): Promise<Array<{ayahNumber: number, arabic: string, translation: string}>> => {
  try {
    const [arabicResponse, translationResponse] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${surahId}/ar.alafasy`),
      fetch(`https://api.alquran.cloud/v1/surah/${surahId}/en.sahih`)
    ]);
    
    const [arabicData, translationData] = await Promise.all([
      arabicResponse.json(),
      translationResponse.json()
    ]);
    
    if (arabicData.code === 200 && translationData.code === 200) {
      const results = [];
      const arabicAyahs = arabicData.data.ayahs;
      const translationAyahs = translationData.data.ayahs;
      
      for (let i = 0; i < arabicAyahs.length; i++) {
        results.push({
          ayahNumber: arabicAyahs[i].numberInSurah,
          arabic: arabicAyahs[i].text,
          translation: translationAyahs[i].text
        });
      }
      
      return results;
    }
    
    return [];
  } catch (error) {
    console.warn('Failed to fetch surah translations:', error);
    return [];
  }
};