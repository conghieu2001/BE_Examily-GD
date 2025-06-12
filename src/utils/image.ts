import * as sharp from 'sharp';
import * as fs from 'fs';
const path = require('path');

export async function generateThumbnail(originalPath: string): Promise<string> {
  const ext = path.extname(originalPath);
  const base = path.basename(originalPath, ext);
  const dir = path.dirname(originalPath);
  const thumbName = `${base}_thumb${ext}`;
  const thumbPath = path.join(dir, thumbName);

  await sharp(originalPath)
    .resize(300) 
    .jpeg({ quality: 70 }) 
    .toFile(thumbPath);

  return thumbPath;
}
