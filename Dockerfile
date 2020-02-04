FROM alpine:3.10.3

WORKDIR /app

RUN apk --no-cache add \
  nodejs=10.16.3-r0 \
  yarn=1.16.0-r0 \
  nginx=1.16.1-r1 \
  rsync=3.1.3-r1 \
  supervisor

COPY nginx/nginx.conf /etc/nginx/
COPY nginx/dashboard.conf /etc/nginx/conf.d/
COPY dashboard dashboard
COPY dronecomm dronecomm
COPY simulator simulator
COPY supervisord.conf /etc/supervisord.conf

RUN cd ./dashboard && \
  yarn install && \
  yarn build && \
  yarn deploy && \
  cd ../dronecomm && \
  yarn install && \
  cd ../simulator && \
  yarn install

ENTRYPOINT ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
