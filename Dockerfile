# The card builder as a container, run by Warkah Kad's Worker on Cloudflare Containers (linux/amd64).
# It starts the pull build server (scripts/build-server.mjs), which asks Warkah Kad for jobs (KAD_URL, BUILD_SECRET), builds each preview or
# real card and uploads the result. `container/serve.mjs` answers the Worker's health pings on port 8080, which keep the container awake
# while there is work, and restarts the build server if it ever exits.
# Built by `wrangler deploy` in warkah-kad (Docker must be running); the image lives in the account's private registry and is never public.
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production ASTRO_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY . .
RUN mkdir -p events .stage dist
EXPOSE 8080
CMD ["node", "container/serve.mjs"]
