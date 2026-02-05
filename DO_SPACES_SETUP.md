# DigitalOcean Spaces Setup Guide

## What is DigitalOcean Spaces?
DigitalOcean Spaces is an S3-compatible object storage service for storing and serving files (photos, videos, documents).

## Prerequisites
- DigitalOcean account (https://www.digitalocean.com)
- Credit card for billing (around $5/month for 250GB storage)

## Step 1: Use Your Existing Space

**Good News**: You already have a Space! No need to create a new one.

### If you want to use the same Space as your GeoJSON files:
1. Log in to DigitalOcean: https://cloud.digitalocean.com
2. Go to your existing Space (the one with geojson folder)
3. Note down:
   - Space name (e.g., `dtg-fieldlink-uploads`)
   - Region (e.g., `sgp1`)
   - CDN URL (found in Space settings)
4. Photos/videos will be stored in a **separate folder** from GeoJSON files
5. Skip to Step 2 below

### If you want a separate Space for media files:
1. Click "Create" > "Spaces Object Storage"
2. Choose datacenter region: **Singapore (SGP1)** (closest to you)
3. Enable CDN (recommended for faster image loading)
4. Choose a unique name: `dtg-media-files` (different from existing)
5. Select project or create new one
6. Click "Create a Space"

**Recommendation**: Use your existing Space to save costs ($5/month per Space)

## Step 2: Generate API Keys (Access Keys)

1. Go to "API" in left sidebar
2. Scroll to "Spaces access keys"
3. Click "Generate New Key"
4. Name it: `DTG-FieldLink-Mobile-App`
5. **COPY AND SAVE IMMEDIATELY**:
   - Access Key ID (e.g., `DO00ABC123XYZ`)
   - Secret Access Key (e.g., `abc123xyz789...`)
   - ⚠️ **Secret key is shown only once!**

## Step 3: Configure CORS (Important!)

To allow mobile app to upload files directly:

1. In your Space, click "Settings"
2. Scroll to "CORS Configurations"
3. Click "Add"
4. Use these settings:
   ```
   Origin: *
   Allowed Methods: GET, PUT, POST, DELETE, HEAD
   Allowed Headers: *
   Access Control Max Age: 3600
   ```
5. Click "Save"

## Step 4: Update Configuration Files

### Backend Configuration (`backend/.env`)

Add these lines (create `.env` file if it doesn't exist):

```bash
# DigitalOcean Spaces Configuration
DO_SPACES_ENDPOINT=sgp1.digitaloceanspaces.com  # Change SGP1 to your region
DO_SPACES_REGION=sgp1                            # Your chosen region
DO_SPACES_BUCKET=your-existing-space-name        # ⚠️ YOUR ACTUAL SPACE NAME HERE
DO_SPACES_ACCESS_KEY=YOUR_ACCESS_KEY_ID          # From Step 2
DO_SPACES_SECRET_KEY=YOUR_SECRET_ACCESS_KEY      # From Step 2
DO_SPACES_CDN_URL=https://your-existing-space-name.sgp1.cdn.digitaloceanspaces.com  # Your Space CDN URL
```

**Where to find these values:**
1. **Space Name**: In DigitalOcean Spaces dashboard, top of the page
2. **Region**: Shown next to Space name (e.g., "Singapore - SGP1")
3. **Endpoint**: Region code + `.digitaloceanspaces.com` (e.g., `sgp1.digitaloceanspaces.com`)
4. **CDN URL**: In Space "Settings" tab, look for "Edge" or "CDN Endpoint"
   - Format: `https://{YOUR-SPACE-NAME}.{REGION}.cdn.digitaloceanspaces.com`

### Mobile App Configuration (`mobile_app/lib/config/spaces_config.dart`)

```dart
// TODO: Update these values fyour-existing-space-name';       // ⚠️ YOUR ACTUAL SPACE NAME HERE
static const String cdnUrl = 'https://your-existing-space-name.sgp1.cdn.digitaloceanspaces.com';  // Your CDN URL
```

**To find your Space name and CDN URL:**
1. Go to DigitalOcean → Spaces
2. Click on your Space
3. Space name is at the top
4. CDN URL is in Settings tabtic const String region = 'sgp1';                           // Your region
static const String bucket = 'dtg-fieldlink-uploads';          // Your Space name
static const String cdnUrl = 'https://dtg-fieldlink-uploads.sgp1.cdn.digitaloceanspaces.com';  // Your CDN URL
```

## Step 5: Test Upload

After implementing the code, test by:
1. Opening a ticket in mobile app
2. Click "Add Photos" or "Add Videos"
3. Select a file
4. Check upload progress
5. Verify file appears in DigitalOcean Spaces dashboard

## What Won't Work Without Proper Setup:

### Without creating a Space:
- ❌ File uploads will fail
- ❌ Error: "The specified bucket does not exist"

### Without API Keys:
- ❌ Uploads will be rejected
- ❌ Error: "Access Denied" or "Invalid Access Key"

### Without CORS Configuration:
- ❌ Direct uploads from mobile will be blocked
- ❌ Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

### With wrong CDN URL:
- ❌ Photos/videos won't display in app
- ⚠️ Files upload successfully but won't be visible

## Directory Structure in Space

### If using existing Space with GeoJSON files:

Your Space will look like this:
```
your-space-name/
├── geojson/                    ← Your existing folder (untouched)
│   └── your-geojson-files.geojson
├── tickets/                    ← NEW folder for photos/videos
│   ├── {ticket-id}/
│   │   ├── photos/
│   │   │   ├── {timestamp}-{filename}.jpg
│   │   │   └── {timestamp}-{filename}.png
│   │   └── videos/
│   │       ├── {timestamp}-{filename}.mp4
│   │       └── {timestamp}-{filename}.mov
```

**Example with both GeoJSON and media files:**
```
dtg-fieldlink-uploads/
├── geojson/
│   └── MockLocation.geojson
├── tickets/
│   ├── MMI-225110594/
│   │   ├── photos/
│   │   │   └── 1738419600000-repair-before.jpg
│   │   └── videos/
│   │       └── 1738419700000-issue-demo.mp4
```

**The folders are completely separate** - your GeoJSON files won't be affected.

## Cost Breakdown

DigitalOcean Spaces Pricing (as of 2026):
- **Base**: $5/month for 250 GB storage + 1 TB transfer
- **Additional Storage**: $0.02/GB/month
- **Additional Transfer**: $0.01/GB

**Estimated Monthly Cost for Field Service App:**
- 100 tickets/month
- Average 5 photos per ticket (2MB each)
- Average 1 video per ticket (20MB each)
- Total: ~2.5GB/month storage
- Cost: **$5/month** (within free tier)

## Security Best Practices

1. **Never commit API keys to Git**
   - Add `.env` to `.gitignore`
   - Use environment variables

2. **Restrict API key permissions**
   - In DigitalOcean, use scoped tokens
   - Limit to Spaces read/write only

3. **Use CDN for serving files**
   - Faster load times
   - Reduced bandwidth costs
   - Better caching

4. **Implement file size limits**
   - Photos: Max 10MB
   - Videos: Max 100MB
   - Already implemented in code

5. **Add file type validation**
   - Only allow: jpg, png, mp4, mov
   - Already implemented in code

## Alternative: Use Backend as Proxy

If you want more control, you can:
1. Upload from mobile → backend
2. Backend validates and uploads to Spaces
3. Returns CDN URL to mobile

This requires updating the backend endpoints (not implemented yet).

## Monitoring Usage

1. Go to DigitalOcean Spaces dashboard
2. Click "Usage" or "Analytics"
3. View:
   - Storage used
   - Bandwidth used
   - Number of requests
   - Costs

## Troubleshooting

### Upload fails with "Access Denied"
- Check API keys are correct
- Verify Space name matches configuration
- Check key hasn't been revoked

### Images don't display
- Verify CDN URL is correct
- Check file was uploaded successfully in Spaces dashboard
- Ensure file permissions are set to "public" (CDN enabled)

### Slow uploads
- Check internet connection
- Consider compressing images before upload
- Use lower video quality settings

## Next Steps

After Spaces is working:
1. Implement image compression before upload
2. Add upload progress indicators
3. Implement retry logic for failed uploads
4. Add thumbnail generation for photos
5. Consider video transcoding for smaller file sizes
