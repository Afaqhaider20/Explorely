"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function ReportDialog({ isOpen, onClose, onSubmit }: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");

  const reasons = [
    "Breaks community rules",
    "Harassment or bullying",
    "Hate speech or symbols",
    "Misinformation",
    "Spam",
    "Violence or dangerous behavior",
  ];

  const handleSubmit = () => {
    if (selectedReason) {
      onSubmit(selectedReason);
      setSelectedReason("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Post</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Help us understand what&apos;s wrong with this post.
            Your report will be kept anonymous.
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
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!selectedReason}
          >
            Report Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
