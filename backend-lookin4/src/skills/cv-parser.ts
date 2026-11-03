import { readFile } from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';
import { loadSkills } from './skills.data';
import { matchSkills } from './skills.matcher';
import type { Skill } from './skills.types';

/** Витягує суцільний текст із PDF. Порожній рядок означає скан без текстового шару. */
export async function extractPdfText(data: Buffer): Promise<string> {
  const parser = new PDFParse({ data });

  try {
    const result = await parser.getText();
    return result.text ?? '';
  } finally {
    // Без destroy pdfjs лишає воркер живим і процес не завершується.
    await parser.destroy();
  }
}

export type CvParseResult = {
  /** id знайдених навичок зі словника */
  skills: string[];
  /** скільки символів тексту вдалося прочитати — 0 для сканів */
  textLength: number;
};

export async function parseCvBuffer(
  data: Buffer,
  skills: Skill[] = loadSkills(),
): Promise<CvParseResult> {
  const text = await extractPdfText(data);

  return { skills: matchSkills(text, skills), textLength: text.trim().length };
}

export async function parseCvFile(
  path: string,
  skills: Skill[] = loadSkills(),
): Promise<CvParseResult> {
  return parseCvBuffer(await readFile(path), skills);
}
