# Usa una imagen base de Node.js
FROM node:22

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos esenciales primero (para aprovechar la caché de Docker)
COPY package.json package-lock.json ./

# Instala las dependencias
RUN npm install

# Copia el código fuente
COPY . .

# Expone el puerto en el que correrá NestJS (debe coincidir con el que usa tu aplicación)
EXPOSE 3000

# Compila el proyecto (si usas TypeScript)
RUN npm run build

# Comando de inicio en modo producción
CMD ["npm", "run", "start:prod"]
