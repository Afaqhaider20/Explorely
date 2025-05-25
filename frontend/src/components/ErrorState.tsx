import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Home, UserX, AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  type: 'not-found' | 'unauthorized' | 'server-error';
  message?: string;
}

const errorMessages = {
  'not-found': {
    title: "Oops! User Not Found",
    description: "Looks like this explorer has wandered off the map! 🗺️",
    icon: UserX
  },
  'unauthorized': {
    title: "Access Denied",
    description: "You need to be logged in to view this profile! 🔒",
    icon: AlertTriangle
  },
  'server-error': {
    title: "Server Error",
    description: "Our servers are taking a coffee break! ☕",
    icon: AlertTriangle
  }
};

export function ErrorState({ type, message }: ErrorStateProps) {
  const router = useRouter();
  const { title, description, icon: Icon } = errorMessages[type];

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 mb-6 text-muted-foreground">
        <Icon className="w-full h-full" />
      </div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        {message || description}
      </p>
      <Button
        onClick={() => router.push('/')}
        className="gap-2"
      >
        <Home className="w-4 h-4" />
        Back to Home
      </Button>
    </div>
  );
} 