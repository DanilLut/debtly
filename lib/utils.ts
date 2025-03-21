import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "UAH",
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function isOverdue(dateString: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day for fair comparison

  const dueDate = new Date(dateString);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}
