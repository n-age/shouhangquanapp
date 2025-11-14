// cloudfunctions/main/image.js
const cloud = require('wx-server-sdk');
const sharp = require('sharp'); // Using sharp for image processing

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * Processes images uploaded to COS, creating thumbnails.
 * This function is triggered by the COS trigger.
 * @param {object} event - The COS trigger event.
 */
async function processUpload(event, context) {
  console.log('Received COS event:', JSON.stringify(event));
  const fileList = event.Records.map(record => ({
    bucket: record.cos.cosBucket.name,
    key: decodeURIComponent(record.cos.cosObject.key), // Decode URL-encoded key
    size: record.cos.cosObject.size,
  }));

  const promises = fileList.map(async file => {
    if (file.size === 0 || file.key.includes('thumbnails/')) {
      // Ignore empty files or files already in the thumbnails directory
      return;
    }

    const fileID = `cloud://${file.bucket}/${file.key}`;
    const thumbnailKey = file.key.replace('uploads/', 'thumbnails/');

    try {
      // 1. Download the original image
      const downloadRes = await cloud.downloadFile({ fileID: fileID });
      if (!downloadRes.fileContent) {
        throw new Error('Failed to download file content.');
      }
      const imageBuffer = downloadRes.fileContent;

      // 2. Process the image using sharp
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize({ width: 400, withoutEnlargement: true }) // Resize to max 400px width, don't enlarge smaller images
        .jpeg({ quality: 80, progressive: true }) // Compress to JPEG with 80% quality
        .toBuffer();

      // 3. Upload the thumbnail back to COS
      const uploadRes = await cloud.uploadFile({
        cloudPath: thumbnailKey,
        fileContent: thumbnailBuffer,
      });

      console.log(`Thumbnail created successfully: ${uploadRes.fileID}`);
      return uploadRes.fileID;
    } catch (err) {
      console.error(`Failed to process file ${fileID}. Error:`, err);
      // Log the error but don't cause the whole function to fail
      return null;
    }
  });

  await Promise.all(promises);
  return { success: true, message: "Image processing complete." };
}

module.exports = {
  processUpload
};
