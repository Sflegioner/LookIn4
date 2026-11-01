/**
 * Окремий парсер CV: читає PDF, звіряє його зі словником data/skills.json
 * і друкує знайдені навички.
 *
 *   npm run parse:cv -- ./user_files/<uuid>.pdf
 *   npm run parse:cv -- ./cv.pdf --json
 *
 * Той самий код використовує бекенд під час завантаження PDF,
 * тож результат у скрипті й у застосунку однаковий.
 */
import { loadSkills } from '../skills/skills.data';
import { parseCvFile } from '../skills/cv-parser';
import { SKILL_CATEGORIES } from '../skills/skills.types';

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const file = args.find((arg) => !arg.startsWith('--'));

  if (!file) {
    console.error('Використання: npm run parse:cv -- <file.pdf> [--json]');
    process.exitCode = 1;
    return;
  }

  const dictionary = loadSkills();
  const { skills, textLength } = await parseCvFile(file, dictionary);
  const found = dictionary.filter((skill) => skills.includes(skill.id));

  if (asJson) {
    console.log(JSON.stringify({ file, textLength, skills: found }, null, 2));
    return;
  }

  console.log(`Файл:    ${file}`);
  console.log(`Текст:   ${textLength} символів`);
  console.log(`Словник: ${dictionary.length} навичок`);

  if (found.length === 0) {
    console.log('\nНічого не знайдено.');
    if (textLength === 0) {
      console.log('Текстового шару в PDF немає — схоже, це скан.');
    }
    return;
  }

  for (const category of SKILL_CATEGORIES) {
    const inCategory = found.filter((skill) => skill.category === category);
    if (inCategory.length === 0) continue;

    console.log(`\n${category} (${inCategory.length}):`);
    for (const skill of inCategory) {
      console.log(`  - ${skill.label}`);
    }
  }

  console.log(`\nВсього: ${found.length}`);
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
