const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read the selected image'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error('Could not read the selected image'));
    reader.onabort = () => reject(new Error('Image reading was cancelled'));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(
  file: File,
  folder: string = 'general',
  adminPasscode: string | null = null,
): Promise<string> {
  if (!adminPasscode) throw new Error('Admin session expired. Please sign in again.');
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Choose a PNG, JPEG, WebP, or GIF image.');
  }
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error('Images must be smaller than 3 MB.');
  }

  const fileBase64 = await readAsDataUrl(file);
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Auth': adminPasscode,
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileBase64,
      folder,
    }),
  });

  const data = await response.json().catch(() => ({})) as {
    url?: string;
    error?: string;
  };
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Admin session expired. Please sign in again.');
    }
    throw new Error(data.error || `Upload failed (${response.status})`);
  }
  if (!data.url) throw new Error('Upload completed but no image URL was returned.');
  return data.url;
}

export async function deleteImage(path: string, adminPasscode: string): Promise<void> {
  const response = await fetch('/api/upload', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Auth': adminPasscode,
    },
    body: JSON.stringify({ path }),
  });
  if (!response.ok) throw new Error(`Image deletion failed (${response.status})`);
}
