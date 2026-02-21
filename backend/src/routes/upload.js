// backend/src/routes/upload.js
// API endpoints for file uploads to DigitalOcean Spaces

import express from 'express';
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

const router = express.Router();

// Ensure directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

// Create admin-pictures directory if it doesn't exist
ensureDirectoryExists('uploads/admin-pictures');

// Configure multer for admin picture uploads
const adminPictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/admin-pictures/'); // Directory for admin pictures
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `admin-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const adminPictureUpload = multer({
  storage: adminPictureStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// ⚠️ TODO: Add these to backend/.env file
// DO_SPACES_ENDPOINT=sgp1.digitaloceanspaces.com
// DO_SPACES_REGION=sgp1
// DO_SPACES_BUCKET=your-bucket-name
// DO_SPACES_ACCESS_KEY=your-access-key
// DO_SPACES_SECRET_KEY=your-secret-key
// DO_SPACES_CDN_URL=https://your-bucket.sgp1.cdn.digitaloceanspaces.com

// Configure AWS SDK v3 for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_ENDPOINT || 'sgp1.digitaloceanspaces.com'}`,
  region: process.env.DO_SPACES_REGION || 'sgp1',
  credentials: {
    accessKeyId: process.env.DO_SPACES_ATTACHMENTS_ACCESS_KEY,
    secretAccessKey: process.env.DO_SPACES_ATTACHMENTS_SECRET_KEY,
  },
  forcePathStyle: false,
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'dtg-field-link'; // TODO: Update in .env
const CDN_URL = process.env.DO_SPACES_CDN_URL; // TODO: Add to .env

// POST /api/upload/admin-picture
// Upload admin profile picture
router.post('/admin-picture', adminPictureUpload.single('picture'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/admin-pictures/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading admin picture:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/upload/admin-profile-url
// Generate pre-signed URL for admin profile picture upload
router.post('/admin-profile-url', async (req, res) => {
  try {
    const { adminId, fileExtension } = req.body;

    if (!adminId) {
      return res.status(400).json({ error: 'adminId is required' });
    }

    if (!fileExtension) {
      return res.status(400).json({ error: 'fileExtension is required' });
    }

    // Validate environment variables
    if (!process.env.DO_SPACES_ATTACHMENTS_ACCESS_KEY || !process.env.DO_SPACES_ATTACHMENTS_SECRET_KEY) {
      console.error('❌ DigitalOcean Spaces not configured!');
      return res.status(500).json({ 
        error: 'File upload not configured. Contact administrator.' 
      });
    }

    // Generate file path: profiles/admin-{id}/{timestamp}-profile.{ext}
    const timestamp = Date.now();
    const filename = `${timestamp}-profile.${fileExtension}`;
    const filePath = `profiles/admin-${adminId}/${filename}`;

    // Determine content type
    const contentType = getContentType(fileExtension);

    // Generate pre-signed URL for PUT request (15 minutes expiration)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      ContentType: contentType,
      ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

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
    console.error('Error generating admin profile upload URL:', error);
    res.status(500).json({ error: error.message });
  }
});

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
      return res.status(500).json({ 
        error: 'File upload not configured. Contact administrator.' 
      });
    }

    // Determine content type
    const contentType = getContentType(fileExtension);

    // Generate pre-signed URL for PUT request (15 minutes expiration)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      ContentType: contentType,
      ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

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
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    });
    await s3Client.send(command);

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

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });
    const response = await s3Client.send(command);

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
