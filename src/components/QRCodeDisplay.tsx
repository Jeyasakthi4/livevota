import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, ExternalLink, Check, Copy, QrCode } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  showActions?: boolean;
  className?: string;
  title?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 180,
  showActions = true,
  className = '',
  title = 'Scan with phone camera to vote',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setError(null);

    // Generate high-resolution, compliant QR code with high error correction (M)
    QRCode.toDataURL(value, {
      width: Math.max(size * 2, 400),
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#090d16',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[QRCode Generation Error]', err);
          setError('Failed to render QR Code');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `livevota-qr-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col items-center gap-2.5 ${className}`}>
      {/* High contrast QR Container with quiet zone for reliable mobile camera scanning */}
      <div
        className="relative flex items-center justify-center rounded-2xl bg-white p-3 shadow-lg ring-1 ring-slate-200/20"
        style={{ width: size + 24, height: size + 24 }}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={title}
            width={size}
            height={size}
            className="rounded-lg object-contain select-none"
            referrerPolicy="no-referrer"
          />
        ) : error ? (
          <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-rose-600">
            {error}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
        <QrCode className="h-3.5 w-3.5 text-indigo-400" />
        <span>{title}</span>
      </div>

      {showActions && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
            title="Copy direct voting link"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-slate-400" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {dataUrl && (
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
              title="Download QR code image for print or slides"
            >
              <Download className="h-3 w-3 text-slate-400" />
              <span>Download PNG</span>
            </button>
          )}

          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-2.5 py-1 text-[11px] font-medium text-indigo-300 transition hover:bg-indigo-900/50 hover:text-white"
            title="Open voting screen in new tab"
          >
            <ExternalLink className="h-3 w-3 text-indigo-400" />
            <span>Open Link</span>
          </a>
        </div>
      )}
    </div>
  );
};
