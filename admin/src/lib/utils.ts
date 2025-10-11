import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateString
  }
}

export function formatPhoneNumber(phone: string): string {
  // E.164形式を日本の電話番号形式に変換
  if (phone.startsWith('+81')) {
    const number = phone.substring(3)
    if (number.length === 10) {
      return `0${number.substring(0, 2)}-${number.substring(2, 6)}-${number.substring(6)}`
    }
  }
  return phone
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'screening_completed': 'bg-blue-100 text-blue-800',
    'under_review': 'bg-yellow-100 text-yellow-800',
    'qualified': 'bg-green-100 text-green-800',
    'disqualified': 'bg-red-100 text-red-800',
    'interview_scheduled': 'bg-purple-100 text-purple-800',
    'interview_completed': 'bg-indigo-100 text-indigo-800',
    'hired': 'bg-emerald-100 text-emerald-800',
    'rejected': 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'screening_completed': '審査完了',
    'under_review': '審査中',
    'qualified': '合格',
    'disqualified': '不合格',
    'interview_scheduled': '面接予約済み',
    'interview_completed': '面接完了',
    'hired': '採用決定',
    'rejected': '最終不採用',
  }
  return labels[status] || status
}
