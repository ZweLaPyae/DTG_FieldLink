// lib/config/spaces_config.dart
// DigitalOcean Spaces Configuration for File Uploads

class SpacesConfig {
  // ✅ SECURITY NOTE: These values are SAFE to expose publicly
  // Bucket names, endpoints, and CDN URLs are already visible in file URLs
  // Anyone viewing a photo can see the CDN URL anyway

  // ⚠️ CRITICAL: Access keys are NEVER stored here!
  // Access/Secret keys are in backend/.env (protected by .gitignore)
  // Mobile app gets pre-signed upload URLs from backend

  // Space endpoint (Public - safe to share)
  // Format: {region}.digitaloceanspaces.com
  static const String endpoint = 'sgp1.digitaloceanspaces.com';

  // Space region (Public - safe to share)
  static const String region = 'sgp1';

  // Space name/bucket (Public - safe to share)
  static const String bucket = 'dtg-field-link';

  // CDN URL (Public - safe to share)
  // This URL is visible in every photo/video URL anyway
  static const String cdnUrl =
      'https://dtg-field-link.sgp1.cdn.digitaloceanspaces.com';

  // File size limits (in bytes)
  static const int maxPhotoSize = 10 * 1024 * 1024; // 10 MB
  static const int maxVideoSize = 100 * 1024 * 1024; // 100 MB

  // Allowed file extensions
  static const List<String> allowedPhotoExtensions = [
    'jpg',
    'jpeg',
    'png',
    'heic',
  ];
  static const List<String> allowedVideoExtensions = ['mp4', 'mov', 'avi'];

  // Configuration check
  static bool get isConfigured {
    return bucket != 'dtg-field-link' || // Default bucket name changed
        !cdnUrl.contains('dtg-field-link'); // Default CDN changed
  }

  // Generate file path in Space for tickets
  static String getFilePath(String ticketId, String fileType, String filename) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    return 'tickets/$ticketId/$fileType/$timestamp-$filename';
  }

  // Generate file path for technician profile pictures
  static String getTechnicianProfilePath(String technicianId, String filename) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    return 'technicians/$technicianId/$timestamp-$filename';
  }

  // Get CDN URL for uploaded file
  static String getCdnUrl(String filePath) {
    return '$cdnUrl/$filePath';
  }
}
