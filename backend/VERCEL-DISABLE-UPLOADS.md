# File Uploads Disabled for Vercel

## What Was Changed

All file upload endpoints have been disabled because Vercel has a read-only filesystem.

### Disabled Endpoints:
1. `POST /buyers/upload-profile-picture` - Returns 501 error
2. `POST /sellers/upload-profile-picture` - Returns 501 error  
3. `POST /deals/:id/upload-documents` - Needs to be disabled
4. `POST /deals/:id/add-documents` - Needs to be disabled

## Solution

Use Cloudinary for file uploads. See `CLOUDINARY-SETUP.md` for implementation guide.

## Temporary Workaround

For now, file uploads will return:
```json
{
  "error": "File uploads are not supported on Vercel's read-only filesystem",
  "message": "Please use Cloudinary or AWS S3 for file uploads",
  "documentation": "See CLOUDINARY-SETUP.md in the repository"
}
```

## Next Steps

1. Setup Cloudinary account
2. Add Cloudinary environment variables to Vercel
3. Implement Cloudinary upload in controllers
4. Update frontend to handle Cloudinary URLs
