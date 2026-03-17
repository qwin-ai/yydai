import crypto from 'crypto';
import { getQwenTTSConfig } from './config';

// Voice types
export type VoiceGender = 'male' | 'female';
export type VoiceLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

export interface VoiceCloneRequest {
  audioUrl: string;
  voiceName?: string;
  userId: string;
}

export interface VoiceCloneResult {
  success: boolean;
  voiceId?: string;
  error?: string;
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  speed?: number;
  pitch?: number;
  format?: 'mp3' | 'wav' | 'pcm';
}

export interface TTSResult {
  success: boolean;
  audioUrl?: string;
  duration?: number;
  taskId?: string;
  error?: string;
}

export interface Voice {
  id: string;
  name: string;
  gender: VoiceGender;
  language: VoiceLanguage;
  isCustom: boolean;
  createdAt?: string;
}

/**
 * Qwen TTS Voice Service Client
 * Documentation: https://help.aliyun.com/document_detail/QWEN_TTS
 */
export class QwenTTSService {
  private config: ReturnType<typeof getQwenTTSConfig>;

  constructor() {
    this.config = getQwenTTSConfig();
  }

  /**
   * Clone a voice from audio sample
   */
  async cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResult> {
    const { audioUrl, voiceName, userId } = request;

    try {
      const response = await fetch(`${this.config.endpoint}/voice/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessKeyId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          audio_url: audioUrl,
          voice_name: voiceName || `voice_${Date.now()}`,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Voice clone error: ${response.status} - ${errorText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        voiceId: data.voice_id,
      };
    } catch (error) {
      console.error('Qwen TTS clone error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Synthesize speech from text
   */
  async synthesize(request: TTSRequest): Promise<TTSResult> {
    const { text, voiceId, speed = 1.0, pitch = 1.0, format = 'mp3' } = request;

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessKeyId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          input: {
            text,
            voice: voiceId,
          },
          parameters: {
            speed,
            pitch,
            format,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `TTS error: ${response.status} - ${errorText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        audioUrl: data.output?.audio_url,
        duration: data.output?.duration,
        taskId: data.request_id,
      };
    } catch (error) {
      console.error('Qwen TTS synthesize error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check TTS task status
   */
  async getTaskStatus(taskId: string): Promise<TTSResult> {
    try {
      const response = await fetch(`${this.config.endpoint}/task/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessKeyId}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Task status error: ${response.status}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        audioUrl: data.output?.audio_url,
        duration: data.output?.duration,
        taskId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List available voices for a user
   */
  async listVoices(userId: string): Promise<Voice[]> {
    try {
      const response = await fetch(`${this.config.endpoint}/voices?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessKeyId}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return (data.voices || []).map((v: any) => ({
        id: v.voice_id || v.id,
        name: v.voice_name || v.name,
        gender: v.gender || 'female',
        language: v.language || 'zh-CN',
        isCustom: v.is_custom ?? true,
        createdAt: v.created_at,
      }));
    } catch (error) {
      console.error('List voices error:', error);
      return [];
    }
  }

  /**
   * Get default/predefined voices
   */
  getDefaultVoices(): Voice[] {
    return [
      { id: 'zhitian_emo', name: 'Zhi Tian', gender: 'female', language: 'zh-CN', isCustom: false },
      { id: 'zhiyan_emo', name: 'Zhi Yan', gender: 'female', language: 'zh-CN', isCustom: false },
      { id: 'zhida_emo', name: 'Zhi Da', gender: 'male', language: 'zh-CN', isCustom: false },
      { id: 'zhiping_emo', name: 'Zhi Ping', gender: 'male', language: 'zh-CN', isCustom: false },
      { id: 'emma', name: 'Emma', gender: 'female', language: 'en-US', isCustom: false },
      { id: 'ethan', name: 'Ethan', gender: 'male', language: 'en-US', isCustom: false },
    ];
  }
}

// Singleton instance
let qwenTTSService: QwenTTSService | null = null;

export function getQwenTTSService(): QwenTTSService {
  if (!qwenTTSService) {
    qwenTTSService = new QwenTTSService();
  }
  return qwenTTSService;
}