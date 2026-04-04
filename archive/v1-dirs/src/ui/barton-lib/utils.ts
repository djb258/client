/*
 * CTB Metadata
 * ctb_id: CTB-0F5A31615D02
 * ctb_branch: ui
 * ctb_path: ui/barton-lib/utils.ts
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:01.398531
 * checksum: 1d8011eb
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
