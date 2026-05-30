FROM node:26-alpine

WORKDIR /work
COPY package.json package-lock.json /work/
RUN npm ci

COPY index.js .env.example /work/
COPY src/ /work/src/
CMD ["node", "index.js"]
