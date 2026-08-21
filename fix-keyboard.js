const fs = require('fs');
const path = require('path');

const files = [
  'app/template/editar/[id].tsx',
  'app/template/crear.tsx',
  'app/peso.tsx',
  'app/entrenos/[id]/comentarios.tsx',
  'app/entreno-completado.tsx',
  'app/chats/nuevo.tsx',
  'app/chats/[id].tsx',
  'app/ajustes.tsx',
  'app/(auth)/login.tsx',
  'app/(auth)/recover.tsx',
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
  
  const newContent = content.replace(/behavior=\{Platform\.OS === 'ios' \? 'padding' : 'height'\}/g, "behavior={Platform.OS === 'ios' ? 'padding' : undefined}");
  
  if (content !== newContent) {
    fs.writeFileSync(fullPath, newContent);
    console.log('Fixed behavior in:', file);
  }
});
