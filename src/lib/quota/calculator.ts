// Credits cost for each service
export const CREDITS_COST = {
  search: {
    web: 1,
    news: 1,
    image: 2,
    video: 3,
  },
  storage: {
    uploadPerMB: 0.01,      // 0.01 credits per MB uploaded
    storagePerGB: 100,      // 100 credits per GB per month
    bandwidthPerGB: 10,     // 10 credits per GB bandwidth
  },
  voice: {
    clonePerVoice: 100,     // 100 credits per voice clone
    ttsPer100Chars: 0.01,   // 0.01 credits per 100 characters
  },
} as const;

/**
 * Calculate credits for search
 */
export function calculateSearchCredits(type: keyof typeof CREDITS_COST.search = 'web'): number {
  return CREDITS_COST.search[type];
}

/**
 * Calculate credits for storage upload
 */
export function calculateStorageUploadCredits(sizeInBytes: number): number {
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return Math.ceil(sizeInMB * CREDITS_COST.storage.uploadPerMB * 100) / 100;
}

/**
 * Calculate credits for storage (monthly)
 */
export function calculateStorageMonthlyCredits(sizeInBytes: number): number {
  const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
  return Math.ceil(sizeInGB * CREDITS_COST.storage.storagePerGB);
}

/**
 * Calculate credits for voice clone
 */
export function calculateVoiceCloneCredits(): number {
  return CREDITS_COST.voice.clonePerVoice;
}

/**
 * Calculate credits for TTS
 */
export function calculateTtsCredits(textLength: number): number {
  const hundredsOfChars = textLength / 100;
  return Math.ceil(hundredsOfChars * CREDITS_COST.voice.ttsPer100Chars * 100) / 100;
}