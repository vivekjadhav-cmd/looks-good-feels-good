import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1024,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
};

export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, COMPRESSION_OPTIONS);
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix to get raw base64
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getMediaType(file: File): string {
  return file.type || "image/jpeg";
}
