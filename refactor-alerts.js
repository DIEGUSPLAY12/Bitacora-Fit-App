const fs = require('fs');
const path = require('path');

const files = [
  'app/peso.tsx',
  'app/notificaciones.tsx',
  'app/compartir.tsx',
  'app/entrenos/[id]/comentarios.tsx',
  'app/chats/nuevo.tsx',
  'app/ajustes.tsx',
  'app/(tabs)/perfil.tsx',
  'app/(auth)/reset-password.tsx',
  'app/(auth)/register.tsx'
];

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.log('Not found:', file);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // 1. Remove Alert from react-native imports
  content = content.replace(/import\s+\{([^}]*)\bAlert\b([^}]*)\}\s+from\s+['"]react-native['"];?/g, (match, before, after) => {
    let newImport = before + after;
    newImport = newImport.replace(/,\s*,/g, ',').replace(/\{\s*,/g, '{').replace(/,\s*\}/g, '}').trim();
    if (newImport === '{ }' || newImport === '{}') {
      return '';
    }
    return `import { ${newImport.replace(/^\{\s*|\s*\}$/g, '').trim()} } from 'react-native';`;
  });

  // 2. Determine relative path to store
  const parts = file.split('/');
  const depth = parts.length - 1;
  const up = '../'.repeat(depth);
  const storePath = `${up}store/alert-store`;

  // 3. Add customAlert import after react-native import
  const importStatement = `import { customAlert as Alert } from '${storePath}';`;
  
  // Find where to insert it (after the first import)
  if (!content.includes(importStatement)) {
    content = content.replace(/(import .* from ['"]react-native['"];?)/, `$1\n${importStatement}`);
  }
  
  fs.writeFileSync(fullPath, content);
  console.log('Updated:', file);
});
