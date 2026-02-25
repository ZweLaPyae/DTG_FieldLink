import { S3Client } from '@aws-sdk/client-s3';

export const spacesClient = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_ENDPOINT}`, // https://sgp1.digitaloceanspaces.com
  region: 'sgp1',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
  forcePathStyle: true,
  signatureVersion: 'v4',
});

