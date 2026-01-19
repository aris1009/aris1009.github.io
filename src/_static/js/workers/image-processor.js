// Image processing worker for background image optimization
// Handles image resizing, format conversion, and compression

self.addEventListener('message', async (event) => {
  const { action, data } = event.data;

  try {
    switch (action) {
      case 'resize':
        const resizedImage = await resizeImage(data.imageData, data.width, data.height);
        self.postMessage({ success: true, result: resizedImage });
        break;

      case 'compress':
        const compressedImage = await compressImage(data.imageData, data.quality);
        self.postMessage({ success: true, result: compressedImage });
        break;

      case 'convert':
        const convertedImage = await convertImageFormat(data.imageData, data.format);
        self.postMessage({ success: true, result: convertedImage });
        break;

      default:
        self.postMessage({ success: false, error: `Unknown action: ${action}` });
    }
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
});

async function resizeImage(imageData, width, height) {
  // Create an offscreen canvas for image processing
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Create image bitmap from the data
  const imageBitmap = await createImageBitmap(imageData);

  // Calculate aspect ratio and draw
  const aspectRatio = imageBitmap.width / imageBitmap.height;
  let drawWidth = width;
  let drawHeight = height;

  if (width / height > aspectRatio) {
    drawWidth = height * aspectRatio;
  } else {
    drawHeight = width / aspectRatio;
  }

  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;

  ctx.drawImage(imageBitmap, x, y, drawWidth, drawHeight);

  // Return the canvas as blob
  return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
}

async function compressImage(imageData, quality = 0.8) {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d');

  const imageBitmap = await createImageBitmap(imageData);
  ctx.drawImage(imageBitmap, 0, 0);

  return canvas.convertToBlob({ type: 'image/jpeg', quality });
}

async function convertImageFormat(imageData, format) {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d');

  const imageBitmap = await createImageBitmap(imageData);
  ctx.drawImage(imageBitmap, 0, 0);

  const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
  return canvas.convertToBlob({ type: mimeType, quality: 0.9 });
}