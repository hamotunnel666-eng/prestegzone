export const MAX_PRODUCT_IMAGE_BYTES = 500_000;
const MAX_PRODUCT_IMAGE_EDGE = 1200;
const WEBP_QUALITIES = [0.86, 0.78, 0.7, 0.62, 0.54];

export function assertProductImageSize(size: number): void {
  if (!Number.isFinite(size) || size < 0 || size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error('حجم الصورة بعد الضغط يجب ألا يزيد عن 500 كيلوبايت');
  }
}

function encodeCanvas(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('تعذر تجهيز الصورة بصيغة WebP'));
    }, 'image/webp', quality);
  });
}

export async function toWebpUnderLimit(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  try {
    const scale = Math.min(1, MAX_PRODUCT_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('تعذر تجهيز الصورة');

    for (let resizeAttempt = 0; resizeAttempt < 9; resizeAttempt += 1) {
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of WEBP_QUALITIES) {
        const result = await encodeCanvas(canvas, quality);
        if (result.type === 'image/webp' && result.size <= MAX_PRODUCT_IMAGE_BYTES) {
          assertProductImageSize(result.size);
          return result;
        }
      }

      width = Math.max(1, Math.floor(width * 0.82));
      height = Math.max(1, Math.floor(height * 0.82));
    }

    throw new Error('تعذر ضغط الصورة إلى أقل من 500 كيلوبايت');
  } finally {
    bitmap.close();
  }
}