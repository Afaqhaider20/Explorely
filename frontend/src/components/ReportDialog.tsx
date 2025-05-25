"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/store/AuthContext";

type ReportType = 'review' | 'post' | 'user' | 'community';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  type: ReportType;
  contentTitle?: string;
  itemId: string;
}

export function ReportDialog({ isOpen, onClose, onSubmit, type, contentTitle, itemId }: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      setSelectedReason("");
    }
  }, [isOpen]);

  const reasons = [
    "Harassment or bullying",
    "Hate speech or symbols",
    "Misinformation",
    "Spam",
    "Inappropriate content"
  ];

  const getTitle = () => {
    switch (type) {
      case 'review':
        return 'Report Review';
      case 'post':
        return 'Report Post';
      case 'user':
        return 'Report User';
      case 'community':
        return 'Report Community';
      default:
        return 'Report';
    }
  };

  const getDescription = () => {
    const baseText = "Help us understand what's wrong with this";
    const contentText = contentTitle ? ` "${contentTitle}"` : '';
    
    switch (type) {
      case 'review':
        return `${baseText} review${contentText}. Your report will be kept anonymous.`;
      case 'post':
        return `${baseText} post${contentText}. Your report will be kept anonymous.`;
      case 'user':
        return `${baseText} user${contentText}. Your report will be kept anonymous.`;
      case 'community':
        return `${baseText} community${contentText}. Your report will be kept anonymous.`;
      default:
        return `${baseText} content. Your report will be kept anonymous.`;
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;
    
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reports`,
        {
          reportedType: type,
          reportedItemId: itemId,
          reason: selectedReason
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201) {
        onSubmit(selectedReason);
        setSelectedReason("");
        onClose();
        toast.success('Report submitted successfully');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        if (error.response?.status === 400 && errorMessage === 'You have already reported this item') {
          toast.error('You have already reported this item');
          onClose();
        } else {
          toast.error(errorMessage || 'Failed to submit report');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setSelectedReason("");
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          {reasons.map((reason) => (
            <Button
              key={reason}
              variant={selectedReason === reason ? "secondary" : "ghost"}
              className="w-full justify-start text-left"
              onClick={() => setSelectedReason(reason)}
            >
              {reason}
            </Button>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => {
            setSelectedReason("");
            onClose();
          }}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : getTitle()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
