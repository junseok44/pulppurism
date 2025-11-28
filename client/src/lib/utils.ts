import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "created":
      return "안건 생성";
    case "voting":
      return "투표 중";
    case "proposing":
      return "제안 중";
    case "answered":
      return "답변 완료";
    case "executing":
      return "실행 중";
    case "executed":
      return "실행 완료";
    default:
      return status;
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "created":
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800";
    case "voting":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "proposing":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800";
    case "answered":
      return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800";
    case "executing":
      return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    case "executed":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800";
  }
}
