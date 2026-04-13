import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isObject = (value: any) =>
  typeof value === "object" && value !== null;
const isEmptyString = (value: any) =>
  typeof value === "string" && value.trim() === "";
const isEmptyArray = (value: any) => Array.isArray(value) && value.length === 0;
const isEmptyObject = (value: any) =>
  isObject(value) && Object.keys(value).length === 0;

export const isNil = (value: any) =>
  value === null ||
  value === undefined ||
  value === "" ||
  isEmptyString(value) ||
  isEmptyArray(value) ||
  isEmptyObject(value);
