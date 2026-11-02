FROM node:22-alpine AS build

RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3000
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY --from=build --chown=node:node /app ./
RUN mkdir -p /app/prisma && chown -R node:node /app/prisma
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "start:container"]
