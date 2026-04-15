/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = 'quran-audio-cache-v1';

export async function isSurahCached(id: number): Promise<boolean> {
  const cache = await caches.open(CACHE_NAME);
  const paddedId = id.toString().padStart(3, '0');
  const url = `https://server7.mp3quran.net/shur/${paddedId}.mp3`;
  const response = await cache.match(url);
  return !!response;
}

export async function downloadSurah(id: number): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  const paddedId = id.toString().padStart(3, '0');
  const url = `https://server7.mp3quran.net/shur/${paddedId}.mp3`;
  
  // Fetch and cache the audio file
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to download Surah');
  
  await cache.put(url, response);
}

export async function deleteCachedSurah(id: number): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  const paddedId = id.toString().padStart(3, '0');
  const url = `https://server7.mp3quran.net/shur/${paddedId}.mp3`;
  await cache.delete(url);
}

export async function getCachedAudioUrl(id: number): Promise<string | null> {
  const cache = await caches.open(CACHE_NAME);
  const paddedId = id.toString().padStart(3, '0');
  const url = `https://server7.mp3quran.net/shur/${paddedId}.mp3`;
  const response = await cache.match(url);
  
  if (!response) return null;
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function getAllCachedSurahIds(): Promise<number[]> {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  return keys.map(request => {
    const url = request.url;
    const match = url.match(/\/(\d+)\.mp3$/);
    return match ? parseInt(match[1], 10) : null;
  }).filter((id): id is number => id !== null);
}
