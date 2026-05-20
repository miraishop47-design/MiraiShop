# Proyecto MiraiShop

![Next.js](https://img.shields.io/badge/Next.js-16.2.6-brightgreen) ![React](https://img.shields.io/badge/React-19.2.4-blue) ![Node.js](https://img.shields.io/badge/Node-20.x-green)

## 🛠️ Descripción

Este es un proyecto **Next.js** (versión 16) que implementa una tienda online llamada **MiraiShop**. La aplicación está basada en el nuevo **App Router** de Next.js, utiliza **TailwindCSS** para el estilo y **Prisma** como ORM para la base de datos. También integra **Firebase** para autenticación y **bcryptjs** para el hashing de contraseñas.

## 🚀 Empezar rápidamente

### Prerrequisitos

- **Node.js** (versión 20 o superior) 
- **npm**, **yarn**, **pnpm** o **bun** (elige el que prefieras)
- **Git**

### Instalación
```bash
# Clona el repositorio
git clone https://github.com/jairoortiz19/MiraiShop.git
cd MiraiShop

# Instala dependencias
npm install    # o `yarn`, `pnpm install`, `bun install`
```

### Configurar variables de entorno
Copia el archivo de ejemplo y rellena los valores necesarios:
```bash
cp .env.example .env
# Edita .env con tus credenciales de Firebase, base de datos, etc.
```

### Base de datos
```bash
# Genera el cliente Prisma
npx prisma generate
# Aplica migraciones (crea la base de datos sqlite por defecto)
npx prisma migrate dev --name init
```

### Ejecutar en modo desarrollo
```bash
npm run dev   # o `yarn dev`, `pnpm dev`, `bun dev`
```
Visita **http://localhost:3000** en tu navegador.

## 📦 Scripts disponibles
| Script | Descripción |
|--------|-------------|
| `dev`   | Inicia el servidor de desarrollo (`next dev`). |
| `build` | Compila la aplicación para producción (`next build`). |
| `start` | Inicia la aplicación en modo producción (`next start`). |
| `lint`  | Ejecuta ESLint sobre el código. |

## 🧩 Tecnologías usadas
- **Next.js 16** – Framework React con renderizado híbrido.
- **React 19** – Biblioteca UI.
- **TailwindCSS 4** – Utility‑first CSS.
- **Prisma 6** – ORM y migraciones de base de datos.
- **Firebase** – Autenticación y hosting opcional.
- **bcryptjs** – Hashing de contraseñas.
- **TypeScript** – Tipado estático.

## 📂 Estructura del proyecto
```
.
├─ public/                # Recursos estáticos (imágenes, favicon, etc.)
├─ src/                   # Código fuente de la app (pages, componentes, lib)
├─ prisma/                # Esquema y migraciones de la base de datos
├─ .env.example           # Ejemplo de variables de entorno
├─ next.config.ts         # Configuración de Next.js
├─ tailwind.config.cjs    # Configuración de Tailwind
└─ README.md              # Este archivo
```

## 📦 Despliegue
Puedes desplegar la aplicación directamente en **Vercel** (la plataforma oficial de Next.js) con un solo clic:

[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repo=https://github.com/jairoortiz19/MiraiShop)

O bien, construir y servir los archivos estáticos en cualquier servidor Node.js:
```bash
npm run build
npm start
```

## 🤝 Contribuir
Las contribuciones son bienvenidas. Sigue estos pasos:
1. Haz fork del repositorio.
2. Crea una rama para tu feature (`git checkout -b feature/mi-feature`).
3. Realiza tus cambios y escribe pruebas si corresponde.
4. Envía un Pull Request describiendo los cambios.

## 📜 Licencia
Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---

*Hecho con ❤️ por **Jairo Ortiz**.*
