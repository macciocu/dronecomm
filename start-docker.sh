docker run -p 8080:80 -p 5001:5001 -p 5000:5000 \
  --entrypoint "/bin/sh" -it -v /Users/x:/host --rm dronecomm:latest
