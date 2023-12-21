export default function takePhotoHelper(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  const width = video.videoWidth;
  const height = video.videoHeight;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  ctx.drawImage(video, 0, 0, width, height);

  const result = canvas.toDataURL('image/png');
  return result;
}
