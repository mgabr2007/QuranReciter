import { db } from "../server/db";
import { surahs } from "../shared/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const AUDIO_BASE_URL = "http://www.everyayah.com/data/Alafasy_128kbps";
const AUDIO_DIR = path.join(process.cwd(), "public", "audio", "alafasy");

function padNumber(num: number, length: number): string {
  return num.toString().padStart(length, "0");
}

async function downloadFile(url: string, filepath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return false;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync(filepath, buffer);
    return true;
  } catch (error) {
    return false;
  }
}

function fileExists(filepath: string): boolean {
  return fs.existsSync(filepath);
}

async function downloadAudioForSurah(surahId: number, totalAyahs: number): Promise<{ success: number; failed: number }> {
  let successCount = 0;
  let failedCount = 0;
  
  const surahStr = padNumber(surahId, 3);
  
  for (let ayahNum = 1; ayahNum <= totalAyahs; ayahNum++) {
    const ayahStr = padNumber(ayahNum, 3);
    const filename = `${surahStr}${ayahStr}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);
    
    // Skip if file already exists
    if (fileExists(filepath)) {
      successCount++;
      continue;
    }
    
    // Download file
    const url = `${AUDIO_BASE_URL}/${filename}`;
    const success = await downloadFile(url, filepath);
    
    if (success) {
      successCount++;
    } else {
      failedCount++;
      console.error(`  ✗ Failed to download ${filename}`);
    }
    
    // Add a small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return { success: successCount, failed: failedCount };
}

async function downloadAllAudio(startFrom: number = 1, endAt: number = 114) {
  console.log(`Starting audio download for surahs ${startFrom}-${endAt}...\n`);
  console.log(`Downloading to: ${AUDIO_DIR}\n`);
  
  // Ensure audio directory exists
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
  
  // Fetch surahs from database in the specified range
  const allSurahs = await db.select().from(surahs)
    .where(sql`${surahs.id} >= ${startFrom} AND ${surahs.id} <= ${endAt}`)
    .orderBy(surahs.id);
  
  let totalSuccess = 0;
  let totalFailed = 0;
  let surahsProcessed = 0;
  
  for (const surah of allSurahs) {
    console.log(`Surah ${surah.id} (${surah.name}) - ${surah.totalAyahs} ayahs`);
    
    const result = await downloadAudioForSurah(surah.id, surah.totalAyahs);
    
    totalSuccess += result.success;
    totalFailed += result.failed;
    surahsProcessed++;
    
    if (result.failed === 0) {
      console.log(`  ✓ All ${result.success} audio files present\n`);
    } else {
      console.log(`  ⚠ Success: ${result.success}, Failed: ${result.failed}\n`);
    }
  }
  
  console.log("=== Download Complete ===");
  console.log(`Total surahs processed: ${surahsProcessed}`);
  console.log(`Total audio files present: ${totalSuccess}`);
  console.log(`Total failures: ${totalFailed}`);
}

// Run the download script
// Get start and end from command line args or use defaults
const startFrom = parseInt(process.argv[2] || "1");
const endAt = parseInt(process.argv[3] || "114");

downloadAllAudio(startFrom, endAt)
  .then(() => {
    console.log("\nScript completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nScript failed with error:", error);
    process.exit(1);
  });
