import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Facebook, 
  MessageCircle, 
  Instagram, 
  Linkedin, 
  Copy, 
  X,
  Share2,
  ExternalLink
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    title: string;
    description: string;
    type: 'issue' | 'campaign';
    authorName?: string;
    communityName?: string;
  };
}

export default function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Generate shareable link
  const shareUrl = `https://solvetogather.onrender.com/post/${post.id}`;
  const shareText = `${post.title} - ${post.description}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Post link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleSocialShare = (platform: string) => {
    let url = '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing, so we'll copy the link
        handleCopyLink();
        toast({
          title: "Instagram",
          description: "Link copied! You can paste it in your Instagram story or post.",
        });
        return;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      default:
        return;
    }

    window.open(url, '_blank', 'width=600,height=400');
  };

  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => handleSocialShare('facebook'),
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => handleSocialShare('whatsapp'),
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      onClick: () => handleSocialShare('instagram'),
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      onClick: () => handleSocialShare('linkedin'),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            <span>Share {post.type === 'issue' ? 'Issue' : 'Campaign'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Post Preview */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">
              {post.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {post.description}
            </p>
            {post.authorName && (
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                by {post.authorName}
              </p>
            )}
          </div>

          {/* Social Media Buttons */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200">
              Share on social media
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {socialPlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <motion.div
                    key={platform.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={platform.onClick}
                      className={`w-full ${platform.color} text-white border-0`}
                      size="sm"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {platform.name}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200">
              Copy link
            </h4>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
              />
              <Button
                onClick={handleCopyLink}
                variant={copied ? "default" : "outline"}
                size="sm"
                className={`${copied ? "bg-green-600 hover:bg-green-700" : ""} w-full sm:w-auto`}
              >
                {copied ? (
                  <>
                    <X className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Native Share (if available) */}
          {navigator.share && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                onClick={() => {
                  navigator.share({
                    title: post.title,
                    text: post.description,
                    url: shareUrl,
                  });
                }}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Share via device
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
