import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { GradeType } from "./types";
import { jwtVerify } from 'jose';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGradesAverage(array: GradeType[]) {
  const filteredArray = array.filter(mark => mark.color !== 'blue');
  const sum = filteredArray.reduce((acc, mark) => acc + mark.decimalValue, 0);
  return sum / filteredArray.length;
}

export async function getUserDetailsFromToken(token: string): Promise<{ uid: string, internalId: string } | false> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET), { algorithms: ['HS256'] });
    if (typeof payload !== 'object') {
      return false;
    }
    return payload as { uid: string, internalId: string };
  } catch {
    return false;
  }
}