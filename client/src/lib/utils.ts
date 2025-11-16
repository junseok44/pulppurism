import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "voting":
      return "투표중";
    case "reviewing":
      return "검토중";
    case "passed":
      return "통과";
    case "rejected":
      return "반려";
    default:
      return status;
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "voting":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "reviewing":
      return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    case "passed":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800";
    case "rejected":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800";
  }
}
