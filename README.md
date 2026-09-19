# 🏋️‍♂️ BitacoraFit

<p align="center">
  <strong>Tu diario inteligente y asistente integral de entrenamiento, fuerza y comunidad fitness.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Backend_&_DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <a href="https://diegusplay12.github.io/Bitacora-Fit-Web/">
    <img src="https://img.shields.io/badge/🌐_Sitio_Web-BitacoraFit_Web-FF5722?style=for-the-badge" alt="Sitio Web Oficial" />
  </a>
  <a href="https://diegusplay12.github.io/Bitacora-Fit-Web/">
    <img src="https://img.shields.io/badge/📲_Descargar_APK-Android-2ea44f?style=for-the-badge&logo=android&logoColor=white" alt="Descargar APK" />
  </a>
</p>

---

## 📖 Índice

- [Acerca del Proyecto](#-acerca-del-proyecto)
- [Características Principales](#-características-principales)
- [Capturas y Diseño](#-capturas-y-diseño)
- [Stack Tecnológico](#-stack-tecnológico)
- [📲 Descarga del APK (Última Versión)](#-descarga-del-apk-última-versión)
- [💻 Guía de Instalación y Ejecución Local](#-guía-de-instalación-y-ejecución-local)
- [📂 Estructura del Proyecto](#-estructura-del-proyecto)
- [👥 Colaboradores y Contacto](#-colaboradores-y-contacto)
- [📄 Licencia](#-licencia)

---

## 📌 Acerca del Proyecto

**BitacoraFit** es una aplicación móvil diseñada específicamente para atletas, levantadores y entusiastas del fitness que buscan llevar un control riguroso de su progresión, optimizar sus rutinas en el gimnasio y compartir sus logros con una comunidad activa.

A diferencia de las hojas de cálculo tradicionales o cuadernos físicos, BitacoraFit proporciona una experiencia fluida y en tiempo real para registrar series, cargas, repeticiones efectivas y descanso, respaldada por una potente arquitectura en la nube que garantiza la persistencia, análisis gráfico del progreso y sincronización instantánea.

---

## ✨ Características Principales

### 🏋️ Registro de Entrenamientos en Vivo
- **Control milimétrico:** Registra pesos, repeticiones, series y esfuerzo percibido (**RPE**).
- **Temporizador de descanso interactivo:** Gestión automática de tiempos de recuperación entre series con alertas hápticas.
- **Detección de récords (PRs):** Detección y celebración instantánea al romper marcas personales o superar marcas estimadas (1RM).

### 📋 Plantillas y Rutinas Personalizadas
- Creación de plantillas reutilizables organizadas por grupos musculares o días de la semana (Push/Pull/Legs, Torso/Pierna, Fullbody, etc.).
- Inicio de sesiones a partir de plantillas guardadas con solo un toque.

### 📚 Amplia Biblioteca de Ejercicios
- Catálogo precargado de cientos de ejercicios categorizados por grupo muscular primario/secundario y tipo de equipamiento.
- Creación de ejercicios personalizados adaptados al equipamiento disponible de cada usuario.

### 📈 Analíticas, Historial y Rachas
- Historial completo de entrenamientos con desglose detallado de volumen total acumulado e intensidad.
- Gráficos interactivos de evolución temporal.
- Sistema de **rachas consecutivas (streaks)** y control del peso corporal para evaluar la constancia.

### 👥 Comunidad y Funcionalidades Sociales
- **Feed Comunitario:** Publica tus entrenamientos finalizados, visualiza las sesiones de tus amigos y motívalos.
- **Red de Amigos:** Busca atletas, sigue sus perfiles y consulta su progreso.
- **Chat en Tiempo Real:** Mensajería instantánea privada entre usuarios impulsada por WebSockets / Supabase Realtime.
- **Notificaciones Push:** Alertas de interacciones sociales y recordatorios para no perder entrenamientos.

---

## 🛠️ Stack Tecnológico

| Capa / Área | Tecnologías Utilizadas |
| :--- | :--- |
| **Frontend Móvil** | [React Native](https://reactnative.dev/) (0.86), [Expo](https://expo.dev/) (SDK 57), [TypeScript](https://www.typescriptlang.org/) |
| **Navegación** | [Expo Router](https://docs.expo.dev/router/introduction/) *(File-based routing tipado)* |
| **Backend & Base de Datos** | [Supabase](https://supabase.com/) (Auth, PostgreSQL relacional, RLS, Storage y WebSockets Realtime) |
| **Gestión de Estado** | [Zustand](https://github.com/pmndrs/zustand) & [TanStack React Query](https://tanstack.com/query) *(Caché y sincronización optimista)* |
| **UI & Animaciones** | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/), [Moti](https://moti.fyi/), [Lucide React Native](https://lucide.dev/), [Shopify FlashList](https://shopify.github.io/flash-list/) |
| **Gráficos y Métricas** | [React Native Gifted Charts](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts) & [React Native SVG](https://github.com/software-mansion/react-native-svg) |
| **Compilación / CI** | [EAS (Expo Application Services)](https://expo.dev/eas) |

---

## 📲 Descarga del APK (Última Versión)

¡Puedes probar e instalar BitacoraFit directamente en tu dispositivo Android sin necesidad de compilar código!

### Opción 1: Desde la Web Oficial de la App
Puedes acceder a la web oficial de BitacoraFit donde encontrarás la presentación de la app y el botón directo para descargar el instalador `.apk` con la versión más reciente:
> 🌐 **Web oficial:** [BitacoraFit Web](https://diegusplay12.github.io/Bitacora-Fit-Web/)  
> 📲 **Descarga directa:** Haz clic en el botón de descarga del APK disponible en la página principal.

### Opción 2: Desde los Releases de GitHub
1. Ve a la sección de **[Releases del Repositorio](https://github.com/DIEGUSPLAY12/Bitacora-Fit-App/releases)**.
2. Descarga el archivo `BitacoraFit.apk` correspondiente a la última versión publicada.
3. En tu dispositivo Android:
   - Abre el archivo descargado.
   - Si es necesario, habilita la opción *"Permitir instalar aplicaciones de fuentes desconocidas"* en tu navegador o explorador de archivos.
   - Pulsa en **Instalar** y ¡listo para entrenar!

---

## 💻 Guía de Instalación y Ejecución Local

Si eres desarrollador y deseas ejecutar el proyecto en tu entorno local para contribuir o inspeccionar el código:

### 1. Prerrequisitos
- [Node.js](https://nodejs.org/) (versión 18.x o superior recomendada)
- Gestor de paquetes: **npm**, **yarn** o **bun**
- Dispositivo móvil con la app **Expo Go** instalada (Android/iOS) o un emulador configurado (Android Studio o Xcode).

### 2. Clonar el repositorio
```bash
git clone https://github.com/DIEGUSPLAY12/Bitacora-Fit-App.git
cd Bitacora-Fit-App
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto tomando como plantilla `.env.example`:

```bash
cp .env.example .env
```

Define tus credenciales de proyecto de **Supabase**:
```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica_anonima
```

### 5. Iniciar la aplicación
Ejecuta el servidor de desarrollo de Metro:

```bash
# Iniciar con Expo CLI
npx expo start
```

O utilizando los scripts directos:
```bash
# Ejecutar directamente en emulador o dispositivo Android
npm run android

# Ejecutar en simulador de iOS (requiere macOS)
npm run ios

# Ejecutar en entorno Web
npm run web
```

Escanea el código QR que aparece en la terminal con la app de **Expo Go** (Android) o la cámara nativa (iOS) para abrir el proyecto en tu dispositivo.

### 6. Generar tu propio APK con EAS
Si deseas compilar un nuevo archivo `.apk` autónomo utilizando Expo Application Services:
```bash
npx eas-cli build -p android --profile preview
```

---

## 📂 Estructura del Proyecto

```plaintext
Bitacora-Fit-App/
├── app/                  # Rutas y pantallas (Expo Router)
│   ├── (auth)/           # Flujos de inicio de sesión y registro
│   ├── (tabs)/           # Pestañas principales (Home, Feed, Chats, Historial, Perfil)
│   ├── chats/            # Pantallas de conversación en tiempo real
│   ├── entrenos/         # Seguimiento activo de rutinas
│   └── plantillas/       # Gestión de plantillas y rutinas
├── components/           # Componentes UI reutilizables y modulares
├── hooks/                # Custom React Hooks (queries, streaks, templates, auth)
├── lib/                  # Clientes de Supabase, utilidades y helpers
├── store/                # Estados globales con Zustand (rutina activa, timer, etc.)
├── supabase/             # Esquemas SQL, migraciones, triggers y funciones
├── theme/                # Paleta de colores y estilos globales
├── app.json              # Configuración del proyecto Expo
└── eas.json              # Configuración de compilaciones EAS (APK / Production)
```

---

## 👥 Colaboradores y Contacto

* **Diego García** - *Full Stack Mobile Developer*  
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/diego-garc%C3%ADa-senciales/)
  [![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat&logo=github&logoColor=white)](https://github.com/DIEGUSPLAY12)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
