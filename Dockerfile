# syntax=docker/dockerfile:1
#
# Production image: build the SPA, then serve the static output from nginx.
#
# Note that VITE_API_BASE_URL is a *build* argument, not a runtime one. Vite
# inlines import.meta.env at build time, so the API origin is compiled into the
# bundle and cannot be changed by setting an environment variable on the running
# container. The image is therefore specific to one environment. If you would
# rather build once and deploy everywhere, the app needs to fetch its config at
# runtime instead — see the note in README.md.

FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL
# Fail here rather than shipping a bundle that calls /undefined/api/... The
# config module throws on a missing value too, but a build-time failure is far
# cheaper to diagnose than one that only appears in a browser.
RUN test -n "$VITE_API_BASE_URL" || \
      (echo "ERROR: build arg VITE_API_BASE_URL is required (e.g. https://api.example.com)" >&2; exit 1)
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build


FROM nginx:1.27-alpine AS runtime

# Carried through to the runtime stage so the CSP's connect-src names the same
# origin the bundle was built against. Keeping both from one build argument is
# what stops the two drifting apart — a mismatch would show up as every API call
# being blocked by the browser, which is an unpleasant thing to debug.
ARG VITE_API_BASE_URL
ENV API_ORIGIN=$VITE_API_BASE_URL

# The nginx entrypoint runs envsubst over everything in this directory at
# container start, writing the result to /etc/nginx/conf.d/. It substitutes only
# variables that are actually defined in the environment, so nginx's own $uri
# and $host survive untouched.
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost/ || exit 1
