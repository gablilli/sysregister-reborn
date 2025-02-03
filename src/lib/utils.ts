import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { GradeType } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGradesAverage(array: GradeType[]) {
  const filteredArray = array.filter(mark => mark.color !== 'blue');
  const sum = filteredArray.reduce((acc, mark) => acc + mark.decimalValue, 0);
  return sum / filteredArray.length;
}