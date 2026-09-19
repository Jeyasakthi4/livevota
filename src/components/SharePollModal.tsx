import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Share2 } from 'lucide-react';
import { Poll } from '../types';
import { QRCodeDisplay } from './QRCodeDisplay';

interface SharePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  poll: Poll;
  onViewVote: (pollId: string) => void;
  onViewResults: (pollId: string) => void;
}

export const SharePollModal: React.FC<SharePollModalProps> = ({
  isOpen,
  onClose,
  poll,
  onViewVote,
  onViewResults,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = window.location.origin;
  const voteUrl = `${currentOrigin}/?poll=${poll.code}&mode=vote`;

  const copyToClipboard = (text: string, isCode: boolean) => {
    navigator.clipboard.writeText(text);
    if (isCode) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0A0D14] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4 bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-cyan-400" />
            <h2 className="text-base font-bold tracking-tight text-white">Share Poll Room</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
            id="share-modal-close-btn"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Room Code Callout */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              AUDIENCE ROOM CODE
            </span>
            <div className="my-2 flex items-center gap-3">
              <span className="font-mono text-3xl font-black tracking-widest text-white">
                {poll.code}
              </span>
              <button
                onClick={() => copyToClipboard(poll.code, true)}
                className="rounded-lg border border-white/[0.1] bg-white/[0.04] p-2 text-zinc-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
                title="Copy Room Code"
                id="share-copy-code-btn"
              >
                {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <span className="text-xs text-zinc-400">
              Voters can enter this code in the top bar to join instantly on mobile.
            </span>
          </div>

          {/* QR Code & Link */}
          <div className="flex flex-col items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <QRCodeDisplay value={voteUrl} size={140} showActions={false} title="Scan with camera to cast pulse" />

            <div className="w-full space-y-1.5">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={voteUrl}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0E1118] px-3 py-1.5 text-xs text-zinc-300 font-mono select-all focus:outline-none"
                  id="share-link-input"
                />
                <button
                  onClick={() => copyToClipboard(voteUrl, false)}
                  className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition cursor-pointer"
                  id="share-copy-link-btn"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <span>Copy</span>}
                </button>
              </div>

              <a
                href={voteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition pt-1"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Open Vote Remote in New Tab</span>
              </a>
            </div>
          </div>

          {/* Quick jump actions */}
          <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
            <button
              onClick={() => {
                onClose();
                onViewVote(poll.id);
              }}
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.06] transition"
            >
              Vote View
            </button>
            <button
              onClick={() => {
                onClose();
                onViewResults(poll.id);
              }}
              className="flex-1 rounded-xl bg-white py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition"
            >
              Live Stage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
