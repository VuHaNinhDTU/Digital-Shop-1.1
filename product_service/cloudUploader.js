class CloudUploader {
  async uploadImage(fileBuffer, fileName) {
    // Upload ảnh lên Cloud Storage (mock)
    return { url: `https://mock-cloud/${fileName}` };
  }
  async uploadQRCode(qrBuffer, fileName) {
    // Upload QR code lên Cloud Storage (mock)
    return { url: `https://mock-cloud/qr/${fileName}` };
  }
  async uploadMetadata(meta, fileName) {
    // Upload metadata lên Cloud Storage (mock)
    return { url: `https://mock-cloud/meta/${fileName}` };
  }
}

module.exports = new CloudUploader(); 