import crypto from 'crypto';
import { getIQSConfig } from './config';

// Search types
export type SearchType = 'web' | 'news' | 'image' | 'video';

export interface SearchRequest {
  query: string;
  type?: SearchType;
  limit?: number;
  offset?: number;
  lang?: string;
  region?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  imageUrl?: string;
  publishedDate?: string;
  source?: string;
}

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  total: number;
  query: string;
  error?: string;
}

/**
 * IQS Search Service Client
 * Documentation: https://help.aliyun.com/document_detail/IQS
 */
export class IQSService {
  private config: ReturnType<typeof getIQSConfig>;

  constructor() {
    this.config = getIQSConfig();
  }

  /**
   * Execute a web search
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const { query, type = 'web', limit = 10, offset = 0, lang, region } = request;

    try {
      const timestamp = new Date().toISOString();
      const nonce = crypto.randomBytes(16).toString('hex');
      
      // Build request parameters
      const params = new URLSearchParams({
        query,
        type,
        limit: limit.toString(),
        offset: offset.toString(),
        ...(lang && { lang }),
        ...(region && { region }),
      });

      // Build signature
      const signature = this.generateSignature('GET', params.toString(), timestamp, nonce);

      // Make API request
      const response = await fetch(`${this.config.endpoint}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `acs ${this.config.accessKeyId}:${signature}`,
          'Content-Type': 'application/json',
          'Date': timestamp,
          'x-acs-nonce': nonce,
          'x-acs-app-key': this.config.appKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          results: [],
          total: 0,
          query,
          error: `Search API error: ${response.status} - ${errorText}`,
        };
      }

      const data = await response.json();

      // Parse results
      const results = this.parseSearchResults(data, type);

      return {
        success: true,
        results,
        total: data.total || results.length,
        query,
      };
    } catch (error) {
      console.error('IQS Search error:', error);
      return {
        success: false,
        results: [],
        total: 0,
        query,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate API signature
   */
  private generateSignature(
    method: string,
    queryString: string,
    timestamp: string,
    nonce: string
  ): string {
    const stringToSign = [
      method,
      '',
      'application/json',
      timestamp,
      `x-acs-nonce:${nonce}`,
      `x-acs-app-key:${this.config.appKey}`,
      `?${queryString}`,
    ].join('\n');

    const hmac = crypto.createHmac('sha256', this.config.accessKeySecret);
    hmac.update(stringToSign);
    return hmac.digest('base64');
  }

  /**
   * Parse search results based on type
   */
  private parseSearchResults(data: any, type: SearchType): SearchResult[] {
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((item: any) => ({
      title: item.title || '',
      url: item.url || item.link || '',
      snippet: item.snippet || item.description || '',
      imageUrl: item.image || item.thumbnail,
      publishedDate: item.published_date || item.date,
      source: item.source || item.site,
    }));
  }
}

// Singleton instance
let iqsService: IQSService | null = null;

export function getIQSService(): IQSService {
  if (!iqsService) {
    iqsService = new IQSService();
  }
  return iqsService;
}