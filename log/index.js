// Perbaiki error handling dan optimalkan operasi file
import fs from "fs/promises" // <-- Gunakan promises API
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const CACHE_DIR = __dirname + "/../cache_log"

// Helper function untuk pengecekan
async function ensureDirExists() {
  try {
    await fs.access(CACHE_DIR, fs.constants.F_OK)
  } catch {
    await fs.mkdir(CACHE_DIR)
  }
}

export const newline = "\n"

export async function check(path) {
  try {
    await fs.access(path, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function writeLog(string) {
  await ensureDirExists()
  const logFile = `${CACHE_DIR}/log.txt`
  
  try {
    await fs.appendFile(logFile, `${string}${newline}`)
  } catch (error) {
    console.error('Failed to write log:', error)
  }
}

export async function writeCount(count) {
  await ensureDirExists()
  const countFile = `${CACHE_DIR}/count.txt`
  
  try {
    await fs.writeFile(countFile, String(count))
  } catch (error) {
    console.error('Failed to write count:', error)
  }
}

export async function readCount() {
  await ensureDirExists()
  const countFile = `${CACHE_DIR}/count.txt`
  
  try {
    const data = await fs.readFile(countFile, 'utf8')
    return parseInt(data) || 0
  } catch {
    return 0
  }
}
