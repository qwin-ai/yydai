// Alibaba Cloud configuration

export interface AliyunConfig {
  accessKeyId: string;
  accessKeySecret: string;
  region: string;
}

export interface IQSConfig extends AliyunConfig {
  endpoint: string;
  appKey: string;
}

export interface OSSConfig extends AliyunConfig {
  bucket: string;
  endpoint: string;
  cdnUrl?: string;
}

export interface QwenTTSConfig extends AliyunConfig {
  endpoint: string;
  model: string;
}

// Get configuration from environment
export function getAliyunConfig(): AliyunConfig {
  return {
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
    region: process.env.ALIYUN_REGION || 'cn-hangzhou',
  };
}

export function getIQSConfig(): IQSConfig {
  const baseConfig = getAliyunConfig();
  return {
    ...baseConfig,
    endpoint: process.env.ALIYUN_IQS_ENDPOINT || 'https://iqs.cn-hangzhou.aliyuncs.com',
    appKey: process.env.ALIYUN_IQS_APP_KEY || '',
  };
}

export function getOSSConfig(): OSSConfig {
  const baseConfig = getAliyunConfig();
  return {
    ...baseConfig,
    bucket: process.env.ALIYUN_OSS_BUCKET || '',
    endpoint: process.env.ALIYUN_OSS_ENDPOINT || 'https://oss-cn-hangzhou.aliyuncs.com',
    cdnUrl: process.env.ALIYUN_OSS_CDN_URL,
  };
}

export function getQwenTTSConfig(): QwenTTSConfig {
  const baseConfig = getAliyunConfig();
  return {
    ...baseConfig,
    endpoint: process.env.ALIYUN_QWEN_TTS_ENDPOINT || 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts',
    model: process.env.ALIYUN_QWEN_TTS_MODEL || 'cosyvoice-v1',
  };
}