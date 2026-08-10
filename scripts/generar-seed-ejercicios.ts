import fs from 'fs';
import path from 'path';

const inputPath = path.join(__dirname, 'exercises.json');
const outputDir = path.join(__dirname, '../supabase');
const baseUrl = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/';

try {
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const exercises = JSON.parse(rawData);

  const escapeSql = (str: string | null | undefined) => {
    if (str === null || str === undefined) return 'NULL';
    return `'${String(str).replace(/'/g, "''")}'`;
  };

  const formatArray = (arr: any[]) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return "'{}'";
    // Format postgres array string: '{element1,element2}'
    // For safety with elements containing commas, quote them inside the array
    const elements = arr.map(item => `"${String(item).replace(/"/g, '\\"')}"`);
    return `'{${elements.join(',')}}'`;
  };

  const values = exercises.map((ex: any) => {
    const id = escapeSql(ex.id);
    const name = escapeSql(ex.name);
    const category = escapeSql(ex.category);
    const equipment = escapeSql(ex.equipment);
    const target = escapeSql(ex.target);
    const muscle_group = escapeSql(ex.muscle_group || ex.bodyPart); 
    const secondary_muscles = formatArray(ex.secondary_muscles || ex.secondaryMuscles);
    const instructions_es = escapeSql(ex.instructions?.es || '');
    
    // Convert relative paths to public raw github URLs
    const image_url = ex.image ? escapeSql(baseUrl + ex.image) : 'NULL';
    const gif_url = ex.gif_url || ex.gifUrl ? escapeSql(baseUrl + (ex.gif_url || ex.gifUrl)) : 'NULL';

    return `(${id}, ${name}, ${category}, ${equipment}, ${target}, ${muscle_group}, ${secondary_muscles}, ${instructions_es}, ${image_url}, ${gif_url})`;
  });

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const BATCH_SIZE = 150;
  let fileCount = 0;

  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    fileCount++;
    const batchValues = values.slice(i, i + BATCH_SIZE);
    
    let sql = `-- Insertar catálogo de ejercicios (Parte ${fileCount})\n`;
    sql += `INSERT INTO exercises (id, name, category, equipment, target, muscle_group, secondary_muscles, instructions_es, image_url, gif_url) VALUES\n`;
    sql += batchValues.join(',\n') + ';\n';
    
    const fileNum = String(fileCount).padStart(2, '0');
    const outputPath = path.join(outputDir, `seed-exercises-${fileNum}.sql`);
    fs.writeFileSync(outputPath, sql, 'utf8');
  }

  console.log(`✅ ¡Éxito! Se generaron ${values.length} filas repartidas en ${fileCount} archivos en la carpeta supabase/`);
} catch (error) {
  console.error('Error al generar el seed:', error);
}
