import { clsx, type ClassValue } from "clsx"
import { nanoid } from "nanoid"
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
dayjs.extend(relativeTime)

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId() {
  return nanoid()
}

type DateConvertable = number | string | Date

export function fromNow(date: DateConvertable) {
  return dayjs(date).fromNow()
}
