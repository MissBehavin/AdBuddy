import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

export interface StorageConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface UploadResult {
  url: string;
  key: string;
}

export class StorageService {
  private s3: S3;
  private bucket: string;

  constructor(config: StorageConfig) {
    this.s3 = new S3({
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    });
    this.bucket = config.bucket;
  }

  async uploadFile(
    file: Buffer,
    contentType: string,
    prefix: string = 'uploads'
  ): Promise<UploadResult> {
    const key = `${prefix}/${uuidv4()}`;
    
    await this.s3
      .putObject({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      })
      .promise();

    const url = `https://${this.bucket}.s3.${this.s3.config.region}.amazonaws.com/${key}`;
    
    return {
      url,
      key,
    };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3
      .deleteObject({
        Bucket: this.bucket,
        Key: key,
      })
      .promise();
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.bucket,
      Key: key,
      Expires: expiresIn,
    });
  }
} 