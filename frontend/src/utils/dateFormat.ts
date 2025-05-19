/**
 * Format a date to show time elapsed in a human-readable format
 * e.g. "2 days ago", "3 weeks ago", "5 minutes ago"
 */
export const formatTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const targetDate = date instanceof Date ? date : new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }
  
  return "just now";
};

/**
 * Format date to display month and year
 * e.g. "January 2023"
 */
export const formatMonthYear = (date: Date | string): string => {
  const targetDate = date instanceof Date ? date : new Date(date);
  return targetDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });
};
