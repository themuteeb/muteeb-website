import { useEffect, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { X } from 'lucide-react';
import 'react-easy-crop/react-easy-crop.css';

interface ImageCropModalProps {
  imageUrl: string;
  fileName: string;
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void>;
}

const CARD_IMAGE_ASPECT = 16 / 9;

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load the selected image.'));
    image.src = url;
  });
}

async function makeCroppedFile(
  imageUrl: string,
  area: Area,
  fileName: string,
): Promise<File> {
  const image = await createImage(imageUrl);
  const scale = Math.min(1, 1920 / area.width, 1080 / area.height);
  const width = Math.max(1, Math.round(area.width * scale));
  const height = Math.max(1, Math.round(area.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not prepare the cropped image.');

  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    width,
    height,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.88);
  });
  if (!blob) throw new Error('Could not export the cropped image. Please try again.');

  const baseName = fileName.replace(/\.[^/.]+$/, '') || 'project-image';
  return new File([blob], `${baseName}-crop.jpg`, { type: 'image/jpeg' });
}

export function ImageCropModal({ imageUrl, fileName, onCancel, onConfirm }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => URL.revokeObjectURL(imageUrl), [imageUrl]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isProcessing) onCancel();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isProcessing, onCancel]);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || isProcessing) return;
    setIsProcessing(true);
    setError('');
    try {
      const croppedFile = await makeCroppedFile(imageUrl, croppedAreaPixels, fileName);
      await onConfirm(croppedFile);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not crop this image.');
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6"
      onClick={() => !isProcessing && onCancel()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-image-crop-title"
        className="w-full max-w-3xl rounded-2xl border border-line bg-surface p-4 text-ink shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="project-image-crop-title" className="font-mono text-sm font-black uppercase tracking-wider">
              Crop project image
            </h2>
            <p className="mt-1 text-xs text-ink-3">
              Drag to choose the visible area. The crop matches the project card’s 16:9 image frame.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            aria-label="Cancel image crop"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:border-accent/60 hover:text-accent disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mx-auto h-[min(62vw,390px)] min-h-[190px] w-full overflow-hidden rounded-xl bg-black sm:h-[390px]">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={CARD_IMAGE_ASPECT}
            minZoom={1}
            maxZoom={3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_area, areaPixels) => setCroppedAreaPixels(areaPixels)}
            showGrid
            restrictPosition
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label htmlFor="project-image-zoom" className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-3">
            Zoom
          </label>
          <input
            id="project-image-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            disabled={isProcessing}
            className="w-full accent-accent"
          />
        </div>

        {error && (
          <p role="alert" className="mt-3 text-xs font-semibold text-rose-400">{error}</p>
        )}

        <div className="mt-5 flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded-full border border-line px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-2 transition-colors hover:border-line-2 hover:text-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!croppedAreaPixels || isProcessing}
            className="rounded-full bg-accent px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {isProcessing ? 'Preparing image…' : 'Use this crop'}
          </button>
        </div>
      </section>
    </div>
  );
}
