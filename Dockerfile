FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Generar cliente Prisma
RUN npx prisma generate

# Exponer puerto
EXPOSE 3001

# Comando para producción
CMD ["npm", "start"]