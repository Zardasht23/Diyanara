import * as path from 'path';
import { promises as fs } from 'fs';

/** Root directory for persistent data (labels, uploads, exports). */
export function getDataDir(): string {
  return process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
}

/** Directory where PostNord shipping label PDFs are stored. */
export function getLabelsDir(): string {
  return process.env.LABELS_DIR || path.join(getDataDir(), 'labels');
}

/** Directory for uploaded product images and user content. */
export function getUploadsDir(): string {
  return process.env.UPLOADS_DIR || path.join(getDataDir(), 'uploads');
}

/** Ensure persistent data directories exist (safe to call on every startup). */
export async function ensureDataDirs(): Promise<void> {
  await fs.mkdir(getLabelsDir(), { recursive: true });
  await fs.mkdir(getUploadsDir(), { recursive: true });
}
