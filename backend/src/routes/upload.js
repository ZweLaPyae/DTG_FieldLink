// backend/src/routes/upload.js
// API endpoints for file uploads to DigitalOcean Spaces

import express from 'express';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// ⚠️ TODO: Add these to backend/.env file
// DO_SPACES_ENDPOINT=sgp1.digitaloceanspaces.com
// DO_SPACES_REGION=sgp1
// DO_SPACES_BUCKET=your-bucket-name
// DO_SPACES_ACCESS_KEY=your-access-key
// DO_SPACES_SECRET_KEY=your-secret-key
// DO_SPACES_CDN_URL=https://your-bucket.sgp1.cdn.digitaloceanspaces.com

// Configure AWS SDK for DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT || 'sgp1.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_ATTACHMENTS_ACCESS_KEY, // TODO: Add to .env
  secretAccessKey: process.env.DO_SPACES_ATTACHMENTS_SECRET_KEY, // TODO: Add to .env
  region: process.env.DO_SPACES_REGION || 'sgp1',
  signatureVersion: 'v4',
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'dtg-field-link'; // TODO: Update in .env
const CDN_URL = process.env.DO_SPACES_CDN_URL; // TODO: Add to .env

// POST /api/upload/get-signed-url
// Generate pre-signed URL for direct upload to Spaces
router.post('/get-signed-url', async (req, res) => {
  try {
    const { filePath, fileExtension } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'filePath is required' });
    }

    // Validate environment variables
    if (!process.env.DO_SPACES_ATTACHMENTS_ACCESS_KEY || !process.env.DO_SPACES_ATTACHMENTS_SECRET_KEY) {
      console.error('❌ DigitalOcean Spaces not configured!');
      console.error('⚠️  Add DO_SPACES_ATTACHMENTS_ACCESS_KEY and DO_SPACES_ATTACHMENTS_SECRET_KEY to .env');
      console.error('⚠️  See DO_SPACES_SETUP.md for instructions');
      return res.status(500).json({ 
        error: 'File upload not configured. Contact administrator.' 
      });
    }

    // Determine content type
    const contentType = getContentType(fileExtension);

    // Generate pre-signed URL for PUT request (15 minutes expiration)
    const uploadUrl = await s3.getSignedUrlPromise('putObject', {
      Bucket: BUCKET_NAME,
      Key: filePath,
      Expires: 900, // 15 minutes
      ContentType: contentType,
      ACL: 'public-read', // Make file publicly accessible via CDN
    });

    // Generate CDN URL for accessing the file after upload
    const cdnUrl = CDN_URL 
      ? `${CDN_URL}/${filePath}`
      : `https://${BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT}/${filePath}`;

    res.status(200).json({
      uploadUrl,
      cdnUrl,
      expiresIn: 900,
    });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/upload/delete
// Delete file from Spaces
router.delete('/delete', async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'filePath is required' });
    }

    // Delete object from Spaces
    await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: filePath,
    }).promise();

    res.status(200).json({ success: true, message: 'File deleted successfully' });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/upload/list/:ticketId
// List all files for a ticket
router.get('/list/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const prefix = `tickets/${ticketId}/`;

    const response = await s3.listObjectsV2({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    }).promise();

    const files = response.Contents?.map(obj => ({
      key: obj.Key,
      url: CDN_URL 
        ? `${CDN_URL}/${obj.Key}`
        : `https://${BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT}/${obj.Key}`,
      size: obj.Size,
      lastModified: obj.LastModified,
    })) || [];

    res.status(200).json({ files });

  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to determine content type
function getContentType(extension) {
  const types = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    heic: 'image/heic',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
  };
  return types[extension?.toLowerCase()] || 'application/octet-stream';
}

export default router;

// ⚠️ IMPORTANT: Register this router in backend/src/index.js
// Add this line to index.js:
// import uploadRoutes from './routes/upload.js';
// app.use('/api/upload', uploadRoutes);
//
// ⚠️ WITHOUT ENVIRONMENT VARIABLES:
// - Endpoints will return 500 error
// - Error: "File upload not configured"
// - Check backend/.env has DO_SPACES_* variables
//
// ⚠️ WITHOUT CORS IN SPACES:
// - Direct uploads from mobile will fail
// - Error: "CORS policy: No 'Access-Control-Allow-Origin' header"
// - Configure CORS in DigitalOcean Spaces settings
//
// 📝 SECURITY NOTES:
// - Pre-signed URLs expire in 15 minutes
// - Files are public-read (accessible via CDN)
// - Consider adding authentication middleware
// - Validate file types and sizes
// - Implement rate limiting for production
