import { audioDownloader } from './audio-downloader';

// Download final surahs 108-114
const downloadFinal = async () => {
  console.log('🎵 Downloading final surahs 108-114...');
  
  for (let surahId = 108; surahId <= 114; surahId++) {
    console.log(`\n📖 Processing Surah ${surahId}/114...`);
    await audioDownloader.downloadSurahAudio(surahId, 'alafasy');
  }
  
  console.log('\n🎉 ALL AUDIO FILES DOWNLOADED! Complete Quran audio coverage achieved!');
};

downloadFinal().catch(console.error);
