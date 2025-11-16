// cloudfunctions/main/image.js
const cloud = require('wx-server-sdk');
const sharp = require('sharp');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

async function processUpload(event, context) {
  console.log('Received COS event:', JSON.stringify(event));
  const fileList = event.Records.map(record => ({
    bucket: record.cos.cosBucket.name,
    key: decodeURIComponent(record.cos.cosObject.key),
    size: record.cos.cosObject.size,
  }));

  const promises = fileList.map(async file => {
    if (file.size === 0 || file.key.includes('thumbnails/')) {
      return;
    }

    const fileID = `cloud://${file.bucket}/${file.key}`;
    const thumbnailKey = file.key.replace('uploads/', 'thumbnails/');

    try {
      const downloadRes = await cloud.downloadFile({ fileID: fileID });
      if (!downloadRes.fileContent) {
        throw new Error('Failed to download file content.');
      }
      const imageBuffer = downloadRes.fileContent;

      const thumbnailBuffer = await sharp(imageBuffer)
        .resize({ width: 400, withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();

      const uploadRes = await cloud.uploadFile({
        cloudPath: thumbnailKey,
        fileContent: thumbnailBuffer,
      });

      console.log(`Thumbnail created successfully: ${uploadRes.fileID}`);
      return uploadRes.fileID;
    } catch (err) {
      console.error(`Failed to process file ${fileID}. Error:`, err);
      return null;
    }
  });

  await Promise.all(promises);
  return { success: true, message: "Image processing complete." };
}

module.exports = {
  processUpload
};
