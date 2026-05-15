import { promises as fs } from 'fs';
import { join } from 'path';
import { db } from "./db";
import { surahs, ayahs } from "@shared/schema";

// Available reciters from versebyversequran.com
const RECITERS = {
  'alafasy': 'Alafasy_128kbps',
  'abdul_basit': 'Abdul_Basit_Murattal_192kbps',
  'sudais': 'Abdurrahmaan_As-Sudais_192kbps',
  'husary': 'Husary_128kbps',
  'maher': 'MaherAlMuaiqly128kbps'
};

const BASE_URL = 'https://everyayah.com/data';
const AUDIO_DIR = join(process.cwd(), 'public', 'audio');

// Helper function to format numbers with leading zeros
const formatNumber = (num: number, padding: number): string => {
  return num.toString().padStart(padding, '0');
};

// Helper function to download a file
const downloadFile = async (url: string, filepath: string): Promise<boolean> => {
  try {
    console.log(`Downloading: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to download ${url}: ${response.status} ${response.statusText}`);
      return false;
    }

    const buffer = await response.arrayBuffer();
    await fs.writeFile(filepath, Buffer.from(buffer));
    console.log(`✅ Downloaded: ${filepath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error downloading ${url}:`, error);
    return false;
  }
};

// Create directory structure
const ensureDirectoryExists = async (dirPath: string) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
};

// Download audio for a specific ayah
const downloadAyahAudio = async (
  surahId: number, 
  ayahNumber: number, 
  reciter: string = 'alafasy'
): Promise<boolean> => {
  const reciterFolder = RECITERS[reciter as keyof typeof RECITERS] || RECITERS.alafasy;
  const filename = `${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
  const url = `${BASE_URL}/${reciterFolder}/${filename}`;
  
  // Create reciter directory
  const reciterDir = join(AUDIO_DIR, reciter);
  await ensureDirectoryExists(reciterDir);
  
  const filepath = join(reciterDir, filename);
  
  // Check if file already exists
  try {
    await fs.access(filepath);
    console.log(`⏭️  File already exists: ${filepath}`);
    return true;
  } catch {
    // File doesn't exist, download it
  }
  
  return await downloadFile(url, filepath);
};

// Download all audio for a specific surah
const downloadSurahAudio = async (surahId: number, reciter: string = 'alafasy'): Promise<void> => {
  console.log(`🕌 Downloading Surah ${surahId} audio (${reciter})`);
  
  // Get surah info from database
  const surahData = await db.query.surahs.findFirst({
    where: (surahs, { eq }) => eq(surahs.id, surahId)
  });
  
  if (!surahData) {
    console.error(`❌ Surah ${surahId} not found in database`);
    return;
  }
  
  console.log(`📖 ${surahData.name} (${surahData.totalAyahs} ayahs)`);
  
  let downloadedCount = 0;
  let failedCount = 0;
  
  for (let ayahNumber = 1; ayahNumber <= surahData.totalAyahs; ayahNumber++) {
    const success = await downloadAyahAudio(surahId, ayahNumber, reciter);
    if (success) {
      downloadedCount++;
    } else {
      failedCount++;
    }
    
    // Small delay to be respectful to the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ Surah ${surahId} complete: ${downloadedCount} downloaded, ${failedCount} failed`);
};

// Download audio for multiple surahs
const downloadMultipleSurahs = async (
  surahIds: number[], 
  reciter: string = 'alafasy'
): Promise<void> => {
  console.log(`🎵 Starting download for ${surahIds.length} surahs with reciter: ${reciter}`);
  
  for (const surahId of surahIds) {
    await downloadSurahAudio(surahId, reciter);
  }
  
  console.log(`🎉 All downloads complete for reciter: ${reciter}`);
};

// Download essential surahs (most commonly recited)
const downloadEssentialSurahs = async (): Promise<void> => {
  console.log('🌟 Downloading essential surahs...');
  
  // Essential surahs for daily recitation
  const essentialSurahs = [
    1,   // Al-Fatiha
    2,   // Al-Baqarah (first 10 ayahs)
    18,  // Al-Kahf
    36,  // Ya-Sin
    55,  // Ar-Rahman
    67,  // Al-Mulk
    112, // Al-Ikhlas
    113, // Al-Falaq
    114  // An-Nas
  ];
  
  await downloadMultipleSurahs(essentialSurahs, 'alafasy');
  
  // Also download in alternative reciter
  await downloadMultipleSurahs([1, 112, 113, 114], 'abdul_basit');
};

// Download specific ayah range
const downloadAyahRange = async (
  surahId: number,
  startAyah: number,
  endAyah: number,
  reciter: string = 'alafasy'
): Promise<void> => {
  console.log(`📚 Downloading Surah ${surahId}, Ayahs ${startAyah}-${endAyah} (${reciter})`);
  
  let downloadedCount = 0;
  let failedCount = 0;
  
  for (let ayahNumber = startAyah; ayahNumber <= endAyah; ayahNumber++) {
    const success = await downloadAyahAudio(surahId, ayahNumber, reciter);
    if (success) {
      downloadedCount++;
    } else {
      failedCount++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ Range complete: ${downloadedCount} downloaded, ${failedCount} failed`);
};

// Get local audio file path
export const getLocalAudioPath = (
  surahId: number, 
  ayahNumber: number, 
  reciter: string = 'alafasy'
): string => {
  const filename = `${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
  return `/audio/${reciter}/${filename}`;
};

// Check if audio file exists locally
export const audioFileExists = async (
  surahId: number, 
  ayahNumber: number, 
  reciter: string = 'alafasy'
): Promise<boolean> => {
  const filename = `${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
  const filepath = join(AUDIO_DIR, reciter, filename);
  
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
};

// Main execution functions
export const audioDownloader = {
  downloadAyahAudio,
  downloadSurahAudio,
  downloadMultipleSurahs,
  downloadEssentialSurahs,
  downloadAyahRange,
  getLocalAudioPath,
  audioFileExists,
  RECITERS
};

// CLI execution for ESM modules
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;

if (isMainModule) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'essential':
      downloadEssentialSurahs().catch(console.error);
      break;
      
    case 'surah':
      const surahId = parseInt(args[1]);
      const reciter = args[2] || 'alafasy';
      if (surahId) {
        downloadSurahAudio(surahId, reciter).catch(console.error);
      } else {
        console.error('Usage: npx tsx server/audio-downloader.ts surah <surah_id> [reciter]');
      }
      break;
      
    case 'range':
      const rangesurahId = parseInt(args[1]);
      const startAyah = parseInt(args[2]);
      const endAyah = parseInt(args[3]);
      const rangeReciter = args[4] || 'alafasy';
      if (rangesurahId && startAyah && endAyah) {
        downloadAyahRange(rangesurahId, startAyah, endAyah, rangeReciter).catch(console.error);
      } else {
        console.error('Usage: npx tsx server/audio-downloader.ts range <surah_id> <start_ayah> <end_ayah> [reciter]');
      }
      break;
      
    default:
      console.log('Available commands:');
      console.log('  essential - Download essential surahs');
      console.log('  surah <id> [reciter] - Download specific surah');
      console.log('  range <surah_id> <start> <end> [reciter] - Download ayah range');
      console.log('\nAvailable reciters:', Object.keys(RECITERS).join(', '));
  }
}