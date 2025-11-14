// miniprogram/components/image-uploader/image-uploader.js
Component({
  properties: {
    title: { type: String, value: '上传照片' },
    subtitle: { type: String, value: '' },
    icon: { type: String, value: 'add_a_photo' }
  },
  data: {
    tempFilePath: ''
  },
  methods: {
    chooseImage() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'], // Enable compression
        success: res => {
          this.setData({ tempFilePath: res.tempFiles[0].tempFilePath });
        }
      });
    },

    deleteImage() {
      this.setData({ tempFilePath: '' });
    },

    // Public method for parent page to call
    upload(cloudPath) {
      return new Promise((resolve, reject) => {
        if (!this.data.tempFilePath) {
          return reject(new Error('No file selected'));
        }
        wx.cloud.uploadFile({
          cloudPath: cloudPath + this.data.tempFilePath.match(/\.[^.]+?$/)[0],
          filePath: this.data.tempFilePath
        }).then(res => {
          resolve(res.fileID);
        }).catch(err => {
          reject(err);
        });
      });
    }
  }
});
