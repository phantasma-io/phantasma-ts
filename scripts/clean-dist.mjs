import { rmSync } from 'fs';
import { resolve } from 'path';

rmSync(resolve(process.cwd(), 'dist'), { recursive: true, force: true });
