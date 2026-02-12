import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Resolve monorepo root (dmap-web/) for .env loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MONOREPO_ROOT = path.resolve(__dirname, '../../..');

dotenv.config({ path: path.join(MONOREPO_ROOT, '.env') });

// Resolve DMAP project dir relative to monorepo root
// Default: dmap-web/../ = dmap/ (the DMAP plugin root)
export const DMAP_PROJECT_DIR = process.env.DMAP_PROJECT_DIR
  ? path.resolve(MONOREPO_ROOT, process.env.DMAP_PROJECT_DIR)
  : path.resolve(MONOREPO_ROOT, '..');

export const DATA_DIR = MONOREPO_ROOT;
export const PORT = process.env.PORT || 3001;
