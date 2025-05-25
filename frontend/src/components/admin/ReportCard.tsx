import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import Link from "next/link";
import { Report } from "@/types/report";

type StatusColors = {
  [key in Report['status']]: string;
};

interface ReportCardProps {
  report: Report;
  handleStatusChange: (reportId: string, newStatus: string) => void;
  statusColors: StatusColors;
  onUpdateNotes?: (reportId: string, notes: string) => void;
  onDeleteNotes?: (reportId: string) => void;
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'post': return 'Post';
    case 'community': return 'Community';
    case 'user': return 'User';
    case 'review': return 'Review';
    default: return type;
  }
};

const getViewLink = (report: Report) => {
  switch (report.reportedType) {
    case 'post':
      return report.reportedPost ? `/posts/${report.reportedPost._id}` : '#';
    case 'community':
      return report.reportedCommunity ? `/communities/${report.reportedCommunity._id}` : '#';
    case 'user':
      return report.reportedUser ? `/profile/${report.reportedUser._id}` : '#';
    case 'review':
      return report.reportedReview ? `/reviews/${report.reportedReview._id}` : '#';
    default:
      return '#';
  }
};

const ReportCard = ({ report, handleStatusChange, statusColors, onUpdateNotes, onDeleteNotes }: ReportCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(report.adminNotes || '');
  const typeLabel = getTypeLabel(report.reportedType);
  const viewLink = getViewLink(report);

  const handleSaveNotes = () => {
    if (onUpdateNotes) {
      onUpdateNotes(report._id, notes);
    }
    setIsEditing(false);
  };

  const handleDeleteNotes = () => {
    if (onDeleteNotes) {
      onDeleteNotes(report._id);
      setNotes('');
    }
  };

  const getTitle = () => {
    switch (report.reportedType) {
      case 'post': return report.reportedPost?.title;
      case 'community': return report.reportedCommunity?.name;
      case 'user': return report.reportedUser?.username;
      case 'review': return report.reportedReview?.title;
      default: return 'N/A';
    }
  };

  const getDescription = () => {
    switch (report.reportedType) {
      case 'post': return report.reportedPost?.content;
      case 'community': return report.reportedCommunity?.description;
      case 'user': return report.reportedUser?.bio;
      case 'review': return report.reportedReview?.content;
      default: return 'No description available';
    }
  };

  return (
    <Card 
      key={report._id} 
      className="overflow-hidden cursor-pointer transition-colors hover:bg-muted/50"
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={report.reporter?.avatar} />
              <AvatarFallback>{report.reporter?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm">Reported by {report.reporter?.username || 'Unknown User'}</CardTitle>
              <CardDescription className="text-xs">
                {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Date unknown'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report.status === 'pending' || report.status === 'reviewed' ? (
              <div onClick={(e) => e.stopPropagation()}>
                <Select
                  value={report.status}
                  onValueChange={(value) => handleStatusChange(report._id, value)}
                >
                  <SelectTrigger className={`w-[120px] h-7 text-xs ${statusColors[report.status] || ''}`}>
                    <SelectValue>
                      {report.status ? report.status.charAt(0).toUpperCase() + report.status.slice(1) : 'Unknown'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {report.status === 'pending' && (
                      <SelectItem value="reviewed">Mark as Reviewed</SelectItem>
                    )}
                    <SelectItem value="resolved">Resolve</SelectItem>
                    <SelectItem value="dismissed">Dismiss</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Badge className={statusColors[report.status] || ''}>
                {report.status ? report.status.charAt(0).toUpperCase() + report.status.slice(1) : 'Unknown'}
              </Badge>
            )}
            <Link href={viewLink} target="_blank" rel="noopener noreferrer" onClick={() => {
              if (report.status === 'pending') {
                handleStatusChange(report._id, 'reviewed');
              }
            }}>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                View {typeLabel}
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="flex flex-col gap-2">
              <div>
                <h4 className="text-xs font-medium mb-0.5">Report Type</h4>
                <p className="text-xs text-muted-foreground line-clamp-1">{typeLabel}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium mb-0.5">Reason</h4>
                <p className="text-xs text-muted-foreground">{report.reason || 'No reason provided'}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <h4 className="text-xs font-medium mb-0.5">Title</h4>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {getTitle()}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-medium mb-0.5">
                {report.reportedType === 'user' ? 'Bio' : 
                 report.reportedType === 'review' || report.reportedType === 'post' ? 'Content' : 'Description'}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {getDescription()}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium">Admin Notes</h4>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-7 text-xs"
                  >
                    {notes ? 'Edit Notes' : 'Add Notes'}
                  </Button>
                  {notes && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteNotes}
                      className="h-7 text-xs"
                    >
                      Delete Notes
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveNotes}
                    className="h-7 text-xs"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setNotes(report.adminNotes || '');
                    }}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
          {isEditing ? (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add admin notes here..."
              className="min-h-[100px] text-sm"
            />
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {notes || 'No admin notes available'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCard; 