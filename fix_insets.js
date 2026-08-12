const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'app');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Reemplazar paddingTop: 60 por paddingTop: 16 en los estilos
  if (content.includes('paddingTop: 60')) {
    content = content.replace(/paddingTop:\s*60/g, 'paddingTop: 16');
  }

  // 2. Insertar import si no existe
  if (!content.includes('useSafeAreaInsets')) {
    // Buscar el último import para insertar después
    const importRegex = /^import.*?;/gm;
    let match;
    let lastMatch;
    while ((match = importRegex.exec(content)) !== null) {
      lastMatch = match;
    }
    
    if (lastMatch) {
      const insertIndex = lastMatch.index + lastMatch[0].length;
      content = content.slice(0, insertIndex) + '\nimport { useSafeAreaInsets } from \'react-native-safe-area-context\';' + content.slice(insertIndex);
    }
  }

  // 3. Insertar la declaración insets dentro del componente principal
  // Buscar export default function ...() {
  const compRegex = /export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{/;
  const compMatch = compRegex.exec(content);
  if (compMatch && !content.includes('const insets = useSafeAreaInsets();')) {
    const insertIndex = compMatch.index + compMatch[0].length;
    content = content.slice(0, insertIndex) + '\n  const insets = useSafeAreaInsets();' + content.slice(insertIndex);
  }

  // 4. Modificar <View style={styles.header}>
  // O en auth screens es <View style={styles.container}> o <ScrollView>
  // Mejor buscar <View style={styles.header}>
  if (content.includes('<View style={styles.header}>')) {
    content = content.replace(/<View style=\{styles\.header\}>/g, '<View style={[styles.header, { paddingTop: insets.top + 16 }]}>');
  } else if (content.includes('paddingTop: 16')) { // Si tenía 60 y ahora 16, pero no se llama header
    // Para login/register
    if (filePath.includes('login.tsx') || filePath.includes('register.tsx')) {
      content = content.replace(/<ScrollView\s+contentContainerStyle=\{styles\.container\}/, '<ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}');
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Modified: ${filePath}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

traverseDir(directoryPath);

// Manual fix for ejercicios/[id].tsx
const ejPath = path.join(directoryPath, 'ejercicios', '[id].tsx');
let ejContent = fs.readFileSync(ejPath, 'utf8');
if (!ejContent.includes('useSafeAreaInsets')) {
  ejContent = ejContent.replace(/import \{ ArrowLeft \} from 'lucide-react-native';/, "import { ArrowLeft } from 'lucide-react-native';\nimport { useSafeAreaInsets } from 'react-native-safe-area-context';");
  ejContent = ejContent.replace(/export default function ExerciseDetailScreen\(\) \{/, "export default function ExerciseDetailScreen() {\n  const insets = useSafeAreaInsets();");
  ejContent = ejContent.replace(/<TouchableOpacity style=\{styles\.backButton\}/, "<TouchableOpacity style={[styles.backButton, { top: insets.top + 16 }]}");
  // Remove top: 60 from styles
  ejContent = ejContent.replace(/top: 60,/, '/* top: 60, replaced by insets */');
  fs.writeFileSync(ejPath, ejContent, 'utf8');
  console.log('Modified manual: ' + ejPath);
}

// Manual fix for bienvenida.tsx
const bienPath = path.join(directoryPath, 'bienvenida.tsx');
let bienContent = fs.readFileSync(bienPath, 'utf8');
if (!bienContent.includes('useSafeAreaInsets')) {
  bienContent = bienContent.replace(/import \{ Dumbbell \} from 'lucide-react-native';/, "import { Dumbbell } from 'lucide-react-native';\nimport { useSafeAreaInsets } from 'react-native-safe-area-context';");
  bienContent = bienContent.replace(/export default function BienvenidaScreen\(\) \{/, "export default function BienvenidaScreen() {\n  const insets = useSafeAreaInsets();");
  bienContent = bienContent.replace(/<View style=\{styles\.container\}>/, "<View style={[styles.container, { paddingTop: insets.top + 24 }]}>");
  fs.writeFileSync(bienPath, bienContent, 'utf8');
  console.log('Modified manual: ' + bienPath);
}
