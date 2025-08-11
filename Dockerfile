# Dockerfile for Lunsj-BotWork
FROM node:20-alpine3.20
RUN apk update && apk upgrade

# Sett arbeidskatalog
WORKDIR /app

# Kopier package.json og package-lock.json
COPY package*.json ./

# Installer avhengigheter
RUN npm install --production

# Kopier resten av prosjektet
COPY . .

# Sett miljøvariabler fra .env hvis ønskelig
# COPY .env .env

# Start boten
CMD ["node", "index.js"]
