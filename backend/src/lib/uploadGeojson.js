import { PutObjectCommand } from '@aws-sdk/client-s3';
import { spacesClient } from './spaces.js';

export async function uploadGeoJson({ customerId, geojson }) {
  const key = `splitter-maps/${customerId}-splitter.geojson`;

  await spacesClient.send(
    new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: key,
      Body: JSON.stringify(geojson),
      ContentType: 'application/geo+json',
      ACL: 'public-read',
    })
  );

  return `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT.replace(
    'https://',
    ''
  )}/${key}`;
}
