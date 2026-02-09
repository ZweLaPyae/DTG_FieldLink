// lib/services/spaces_upload_service.dart
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:mime/mime.dart';
import 'package:path/path.dart' as path;
import '../config/spaces_config.dart';
import '../config/api_config.dart';

/// DigitalOcean Spaces Upload Service
/// Handles file uploads to DO Spaces via backend pre-signed URLs
class SpacesUploadService {
  
  /// Upload a photo to DigitalOcean Spaces
  /// Returns the CDN URL of the uploaded file
  Future<String> uploadPhoto(File file, String ticketId) async {
    return await _uploadFile(file, ticketId, 'photos');
  }

  /// Upload a video to DigitalOcean Spaces
  /// Returns the CDN URL of the uploaded file
  Future<String> uploadVideo(File file, String ticketId) async {
    return await _uploadFile(file, ticketId, 'videos');
  }

  /// Internal method to upload file
  Future<String> _uploadFile(File file, String ticketId, String fileType) async {
    try {
      // Step 1: Validate file
      await _validateFile(file, fileType);

      // Step 2: Get file info
      final filename = path.basename(file.path);
      final fileExtension = path.extension(filename).toLowerCase().replaceFirst('.', '');
      final filePath = SpacesConfig.getFilePath(ticketId, fileType, filename);

      print('Uploading $fileType: $filename to $filePath');

      // Step 3: Get pre-signed URL from backend
      // TODO: Backend must implement this endpoint: POST /api/upload/get-signed-url
      final signedUrlResponse = await _getSignedUrl(filePath, fileExtension);
      
      if (signedUrlResponse == null) {
        throw 'Failed to get upload URL from server'; // Backend not configured
      }

      final uploadUrl = signedUrlResponse['uploadUrl'] as String;
      final cdnUrl = signedUrlResponse['cdnUrl'] as String;

      // Step 4: Upload file to Spaces using signed URL
      final bytes = await file.readAsBytes();
      final mimeType = lookupMimeType(filename) ?? 'application/octet-stream';

      final uploadResponse = await http.put(
        Uri.parse(uploadUrl),
        headers: {
          'Content-Type': mimeType,
          'Content-Length': bytes.length.toString(),
        },
        body: bytes,
      );

      if (uploadResponse.statusCode != 200 && uploadResponse.statusCode != 201) {
        throw 'Upload failed with status: ${uploadResponse.statusCode}';
      }

      print('Upload successful! CDN URL: $cdnUrl');
      return cdnUrl;

    } catch (e) {
      print('Error uploading $fileType: $e');
      rethrow;
    }
  }

  /// Get pre-signed URL from backend
  Future<Map<String, dynamic>?> _getSignedUrl(String filePath, String fileExtension) async {
    try {
      // TODO: Implement this backend endpoint
      // Backend should:
      // 1. Generate pre-signed URL for DO Spaces
      // 2. Return both uploadUrl and cdnUrl
      // 3. Set expiration time (e.g., 15 minutes)
      
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/upload/get-signed-url'), // TODO: Create this endpoint
        headers: {'Content-Type': 'application/json'},
        body: '{"filePath": "$filePath", "fileExtension": "$fileExtension"}',
      );

      if (response.statusCode == 200) {
        final data = response.body;
        // Parse JSON response
        // Expected: {"uploadUrl": "...", "cdnUrl": "..."}
        return {}; // TODO: Parse actual response
      }

      return null;
    } catch (e) {
      print('Error getting signed URL: $e');
      // ⚠️ This will fail if backend endpoint doesn't exist
      throw 'Backend not configured for file uploads. See DO_SPACES_SETUP.md';
    }
  }

  /// Validate file before upload
  Future<void> _validateFile(File file, String fileType) async {
    // Check if file exists
    if (!await file.exists()) {
      throw 'File does not exist';
    }

    // Check file size
    final fileSize = await file.length();
    final maxSize = fileType == 'photos' 
        ? SpacesConfig.maxPhotoSize 
        : SpacesConfig.maxVideoSize;

    if (fileSize > maxSize) {
      final maxSizeMB = (maxSize / (1024 * 1024)).toStringAsFixed(1);
      throw 'File too large. Maximum size: $maxSizeMB MB';
    }

    // Check file extension
    final filename = path.basename(file.path);
    final extension = path.extension(filename).toLowerCase().replaceFirst('.', '');
    
    final allowedExtensions = fileType == 'photos'
        ? SpacesConfig.allowedPhotoExtensions
        : SpacesConfig.allowedVideoExtensions;

    if (!allowedExtensions.contains(extension)) {
      throw 'Invalid file type. Allowed: ${allowedExtensions.join(", ")}';
    }

    print('File validation passed: $filename (${(fileSize / 1024).toStringAsFixed(1)} KB)');
  }

  /// Delete a file from Spaces (requires backend endpoint)
  Future<bool> deleteFile(String cdnUrl) async {
    try {
      // Extract file path from CDN URL
      final uri = Uri.parse(cdnUrl);
      final filePath = uri.path.replaceFirst('/', '');

      // TODO: Implement backend endpoint: DELETE /api/upload/delete
      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/upload/delete'),
        headers: {'Content-Type': 'application/json'},
        body: '{"filePath": "$filePath"}',
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting file: $e');
      return false;
    }
  }
}

// ⚠️ IMPORTANT NOTES:
//
// 1. Backend Endpoints Required:
//    - POST /api/upload/get-signed-url
//      - Generates pre-signed URL for DO Spaces upload
//      - Returns: {"uploadUrl": "...", "cdnUrl": "..."}
//    - DELETE /api/upload/delete
//      - Deletes file from DO Spaces
//      - Requires filePath in body
//
// 2. Backend Configuration Required (.env):
//    DO_SPACES_ENDPOINT=sgp1.digitaloceanspaces.com
//    DO_SPACES_REGION=sgp1
//    DO_SPACES_BUCKET=your-bucket-name
//    DO_SPACES_ACCESS_KEY=your-access-key
//    DO_SPACES_SECRET_KEY=your-secret-key
//    DO_SPACES_CDN_URL=https://your-bucket.sgp1.cdn.digitaloceanspaces.com
//
// 3. Without Backend Setup:
//    - _getSignedUrl() will fail
//    - Uploads will not work
//    - You'll see "Backend not configured" error
//
// 4. Alternative: Direct Upload (Less Secure)
//    - Can upload directly from mobile using access keys
//    - NOT RECOMMENDED: Exposes credentials in app
//    - Better to use backend as proxy for security
