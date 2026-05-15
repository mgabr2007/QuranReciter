import { audioDownloader } from './audio-downloader';

// Download surahs 38-114
const downloadBatch2 = async () => {
  console.log('🎵 Continuing download from surah 38-114...');
  
  const startSurah = 38;
  const endSurah = 114;
  
  for (let surahId = startSurah; surahId <= endSurah; surahId++) {
    console.log(`\n📖 Processing Surah ${surahId}/${endSurah}...`);
    await audioDownloader.downloadSurahAudio(surahId, 'alafasy');
  }
  
  console.log('\n🎉 Batch 2 download complete!');
};

downloadBatch2().catch(console.error);
