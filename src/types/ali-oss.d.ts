declare module 'ali-oss' {
  interface OSSOptions {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    secure?: boolean;
    timeout?: string | number;
  }

  interface PutOptions {
    headers?: Record<string, string>;
    timeout?: number;
  }

  interface PutResult {
    name: string;
    url: string;
    res: {
      status: number;
      statusCode: number;
      headers: Record<string, string>;
    };
  }

  interface ListOptions {
    prefix?: string;
    marker?: string;
    'max-keys'?: number;
    delimiter?: string;
  }

  interface ListResult {
    objects?: Array<{
      name: string;
      url: string;
      size: number;
      lastModified: string;
      etag: string;
      type: string;
    }>;
    prefixes?: string[];
    isTruncated: boolean;
    nextMarker?: string;
  }

  interface HeadResult {
    status: number;
    meta: Record<string, string>;
    res: {
      headers: Record<string, string>;
      requestUrls: string[];
    };
  }

  interface SignatureUrlOptions {
    expires?: number;
    method?: 'GET' | 'PUT' | 'POST' | 'DELETE';
    'Content-Type'?: string;
    process?: string;
    response?: {
      'content-type'?: string;
      'content-disposition'?: string;
      'cache-control'?: string;
    };
  }

  class OSS {
    constructor(options: OSSOptions);
    put(name: string, file: Buffer | Blob | File | string, options?: PutOptions): Promise<PutResult>;
    get(name: string): Promise<{ content: Buffer; res: any }>;
    delete(name: string): Promise<{ res: any }>;
    head(name: string): Promise<HeadResult>;
    list(query?: ListOptions): Promise<ListResult>;
    signatureUrl(name: string, options?: SignatureUrlOptions): string;
    putACL(name: string, acl: string): Promise<void>;
    getACL(name: string): Promise<{ acl: string }>;
  }

  export = OSS;
}