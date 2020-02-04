# dronecomm

This project contains the **dronecomm** application which consists of a
backend (nodejs) application "dronecomm" which receives and processes drone geo
location data and a frontend (react) application "dashboard" which displays the
drones last location and inactivity status (i.e drones which haven't moved more
than 1 meter during 10 sec.)

## Dependencies

All dependencies for this project are contained within the accompanying docker
image. For running anything outside the container, the only needed dependency
is `yarn`.

## Getting started

Build docker image:

```sh
docker build . -t dronecomm
```

Run docker container:

```sh
docker run -d --name dronecomm -p 8080:80 -p 5001:5001 -p 5000:5000 dronecomm:latest
```

This runs the docker container, in detached mode, named as "dronecomm", and at
which `-p 8080:80` exposes the "dashboard" (react) application on `localhost:8080`;
`-p 5000:5000` is needed for socket.io communication between "dashboard" (client)
app and "dronecomm" (server) application (over this connection the drone data is
send from backend to frontend); `-p 5001:5001` is needed for communication
between drones and "dronecomm" (server) appication (over this connection drones
send data to the server).

We can now browse to [localhost:8080](http://localhost:8080) to see the
dashboard application. In order to see things in action we can spin up a 10k
drone simulation as follows:

```sh
docker exec -it dronecomm node /app/simulator/src/app.js
```

## Nginx Tips

### Nginx

 - Stop nginx application server (iow send stop signal): `nginx -s stop`
 - Test nginx configuration: `nginx -t`
 - Start nginx in background: `nginx`

## Drone / Server Communication API

### Protocol

Drone communication MUST be based on the [socket.io protocol](https://github.com/socketio/socket.io-protocol).

### Messages

The first message a drone sends MUST be a **drone registration message**:

- message string: "r"
- message value type: Buffer

All subsequent messages MUST be **geo location update messages**:

- message string: "g"
- message value type: Buffer

For both registration and update messages the **Buffer** (a.k.a transmission
buffer) contents MUST bet he following:

- Byte 0..17: (string) unique drone identifier
- Byte 0..17: (float32) latitude in degrees
- Byte 0..17: (float32) longitude in degrees
- Byte 0..17: (float32) flight time / duration  (starting at 0), in seconds

All buffer values are in LE (Little Endian) format.
