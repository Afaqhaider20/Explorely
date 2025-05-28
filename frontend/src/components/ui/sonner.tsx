"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:border group-[.toaster]:border-slate-200 dark:group-[.toaster]:border-slate-700",
          description: "group-[.toast]:text-slate-600 dark:group-[.toast]:text-slate-300 group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-white group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:transition-colors group-[.toast]:hover:bg-primary/90",
          cancelButton:
            "group-[.toast]:bg-slate-100 dark:group-[.toast]:bg-slate-800 group-[.toast]:text-slate-700 dark:group-[.toast]:text-slate-200 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:transition-colors group-[.toast]:hover:bg-slate-200 dark:group-[.toast]:hover:bg-slate-700",
          title: "group-[.toast]:text-slate-900 dark:group-[.toast]:text-slate-50 group-[.toast]:text-base group-[.toast]:font-semibold",
          closeButton: "group-[.toast]:text-slate-400 dark:group-[.toast]:text-slate-500 group-[.toast]:hover:text-slate-600 dark:group-[.toast]:hover:text-slate-300 group-[.toast]:transition-colors",
          success: "group-[.toast]:bg-emerald-50 group-[.toast]:text-emerald-800 dark:group-[.toast]:bg-emerald-950/40 dark:group-[.toast]:text-emerald-300 group-[.toast]:border-emerald-200 dark:group-[.toast]:border-emerald-800/50",
          error: "group-[.toast]:bg-red-50 group-[.toast]:text-red-800 dark:group-[.toast]:bg-red-950/40 dark:group-[.toast]:text-red-300 group-[.toast]:border-red-200 dark:group-[.toast]:border-red-800/50",
          warning: "group-[.toast]:bg-amber-50 group-[.toast]:text-amber-800 dark:group-[.toast]:bg-amber-950/40 dark:group-[.toast]:text-amber-300 group-[.toast]:border-amber-200 dark:group-[.toast]:border-amber-800/50",
          info: "group-[.toast]:bg-blue-50 group-[.toast]:text-blue-800 dark:group-[.toast]:bg-blue-950/40 dark:group-[.toast]:text-blue-300 group-[.toast]:border-blue-200 dark:group-[.toast]:border-blue-800/50",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
