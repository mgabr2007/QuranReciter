import { audioDownloader } from './audio-downloader';

// Download surahs 13-114
const downloadRemainingAudio = async () => {
  console.log('🎵 Starting bulk download for remaining surahs (13-114)...');
  
  const startSurah = 13;
  const endSurah = 114;
  
  for (let surahId = startSurah; surahId <= endSurah; surahId++) {
    console.log(`\n📖 Processing Surah ${surahId}/${endSurah}...`);
    await audioDownloader.downloadSurahAudio(surahId, 'alafasy');
  }
  
  console.log('\n🎉 All remaining surahs downloaded successfully!');
};

downloadRemainingAudio().catch(console.error);
