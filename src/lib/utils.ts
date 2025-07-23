import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses a Zoom meeting link and extracts the meeting number and password.
 * @param link The Zoom meeting link (e.g. https://go.zoom.us/j/1234567890?pwd=xxxx)
 * @returns { meetingNumber: string, password: string } | null
 */
export function parseZoomMeetingLink(
  link: string,
): { meetingNumber: string; password: string } | null {
  try {
    const url = new URL(link.trim());
    // Match /j/{meetingNumber}
    const match = url.pathname.match(/\/j\/(\d+)/);
    if (!match) {
      return null;
    }
    const meetingNumber = match[1];
    const password = url.searchParams.get("pwd") || "";
    if (!meetingNumber || !password) {
      return null;
    }
    return { meetingNumber, password };
  } catch {
    return null;
  }
}

export function removeJsonTags(input: string): string {
  return input.replace(
    /^```(json|css|html|vue|javascript|markdown|typescript|scss|sql)|```$/gm,
    "",
  );
}
