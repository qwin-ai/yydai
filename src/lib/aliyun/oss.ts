import OSS from 'ali-oss';
import { getOSSConfig } from './config';

export interface UploadOptions {
  filename: string;
  content: Buffer | Blob | File;
  contentType?: string;
  userId: string;
  path?: string;
}

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  cdnUrl?: string;
  size?: number;
  error?: string;
}

export interface FileListOptions {
  userId: string;
  prefix?: string;
  limit?: number;
  marker?: string;
}

export interface FileInfo {
  key: string;
  name: string;
  size: number;
  lastModified: Date;
  url: string;
  cdnUrl?: string;
}

/**
 * OSS Storage Service Client
 */
export class OSSService {
  private config: ReturnType<typeof getOSSConfig>;
  private client: OSS | null = null;

  constructor() {
    this.config = getOSSConfig();
    this.initClient();
  }

  private initClient() {
    if (!this.config.accessKeyId || !this.config.accessKeySecret || !this.config.bucket) {
      console.warn('OSS configuration incomplete');
      return;
    }

    this.client = new OSS({
      region: this.config.region.replace('cn-', ''), // OSS SDK expects region without 'cn-'
      accessKeyId: this.config.accessKeyId,
      accessKeySecret: this.config.accessKeySecret,
      bucket: this.config.bucket,
      secure: true,
    });
  }

  /**
   * Upload a file
   */
  async upload(options: UploadOptions): Promise<UploadResult> {
    if (!this.client) {
      return { success: false, error: 'OSS client not initialized' };
    }

    try {
      const { filename, content, contentType, userId, path } = options;
      
      // Generate unique key
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const key = path 
        ? `${userId}/${path}/${timestamp}-${sanitizedFilename}`
        : `${userId}/${timestamp}-${sanitizedFilename}`;

      // Upload to OSS
      const result = await this.client.put(key, content, {
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
        },
      });

      const url = result.url;
      const cdnUrl = this.config.cdnUrl 
        ? `${this.config.cdnUrl}/${key}`
        : undefined;

      return {
        success: true,
        key,
        url,
        cdnUrl,
        size: content instanceof Buffer ? content.length : (content as Blob).size,
      };
    } catch (error) {
      console.error('OSS upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Get a signed URL for download
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string | null> {
    if (!this.client) return null;

    try {
      const url = this.client.signatureUrl(key, {
        expires: expiresIn,
        method: 'GET',
      });
      return url;
    } catch (error) {
      console.error('OSS getSignedUrl error:', error);
      return null;
    }
  }

  /**
   * Delete a file
   */
  async delete(key: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'OSS client not initialized' };
    }

    try {
      await this.client.delete(key);
      return { success: true };
    } catch (error) {
      console.error('OSS delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  /**
   * List files for a user
   */
  async listFiles(options: FileListOptions): Promise<FileInfo[]> {
    if (!this.client) return [];

    try {
      const { userId, prefix, limit = 100, marker } = options;
      const listPrefix = prefix ? `${userId}/${prefix}` : userId;

      const result = await this.client.list({
        prefix: listPrefix,
        'max-keys': limit,
        marker,
      });

      if (!result.objects) return [];

      return result.objects.map((obj) => ({
        key: obj.name,
        name: obj.name.split('/').pop() || obj.name,
        size: obj.size,
        lastModified: new Date(obj.lastModified),
        url: obj.url,
        cdnUrl: this.config.cdnUrl 
          ? `${this.config.cdnUrl}/${obj.name}`
          : undefined,
      }));
    } catch (error) {
      console.error('OSS listFiles error:', error);
      return [];
    }
  }

  /**
   * Get file metadata
   */
  async getFileInfo(key: string): Promise<FileInfo | null> {
    if (!this.client) return null;

    try {
      const result = await this.client.head(key);
      return {
        key,
        name: key.split('/').pop() || key,
        size: parseInt(result.res.headers['content-length'] || '0', 10),
        lastModified: new Date(result.res.headers['last-modified'] || new Date()),
        url: result.res.requestUrls[0],
        cdnUrl: this.config.cdnUrl 
          ? `${this.config.cdnUrl}/${key}`
          : undefined,
      };
    } catch (error) {
      console.error('OSS getFileInfo error:', error);
      return null;
    }
  }
}

// Singleton instance
let ossService: OSSService | null = null;

export function getOSSService(): OSSService {
  if (!ossService) {
    ossService = new OSSService();
  }
  return ossService;
}