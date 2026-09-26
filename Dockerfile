FROM docker.io/svenstaro/miniserve:alpine

ARG VERSION=2.1.0
LABEL org.opencontainers.image.title="Balatro Completionist++ Tracker" \
      org.opencontainers.image.version=$VERSION \
      org.opencontainers.image.source="https://github.com/blackfan321/balatro-completionist-plus-plus-tracker"

COPY index.html /srv/index.html
COPY static /srv/static

EXPOSE 8080

HEALTHCHECK --interval=5s --timeout=2s --start-period=10s --retries=3 \
  CMD wget -qO- -Y off http://127.0.0.1:8080/__miniserve_internal/healthcheck || exit 1

CMD ["--index", "index.html", "--interfaces", "0.0.0.0", "--port", "8080", "/srv"]
