import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

type ProductImageProps = {
  imageUrl?: string | null;
  alt: string;
  preview?: boolean;
};

export function ProductImage({
  imageUrl,
  alt,
  preview = false,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  const hasImage = Boolean(imageUrl?.trim()) && !failed;

  return (
    <div className={preview ? 'image-preview' : 'product-image'}>
      {hasImage ? (
        <img
          src={imageUrl ?? undefined}
          alt={alt}
          loading={preview ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="image-fallback" role="img" aria-label="No product image">
          <ImageOff size={preview ? 30 : 36} />
          <span>{failed ? 'Image URL could not load' : 'No image'}</span>
        </div>
      )}
    </div>
  );
}
