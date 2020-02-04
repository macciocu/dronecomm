'use strict';

const io = require('socket.io-client');
const uniqid = require('uniqid');
const socket = io('http://localhost:5001/');

socket.on('connect', function() {
  const ds = new DroneSimulator();
  ds.start();
});

class Drone {
  constructor(trajectory) {
    this.id = uniqid();
    this.iTrajectory = 0;
    this.trajectory = trajectory;
    this.intervalObj = null;
    this.epochAtFlightStart = null;
    this.countdownToInactive = 10; // [sec]

    // Transmission buffer
    // All numeric values are written in LE (Little Endian) format.
    // B.0..17 → id: 18 bytes string
    // B.18..49 → latitude: 32 bits float [degrees]
    // B.50..81 → longitude 32 bits float [degrees]
    // B.82..113 → flightTime: 32 bits float [seconds]
    this.txBuffer = Buffer.alloc(114);
  }

  // write drone identifier to transmission buffer
  _writeId() {
    this.txBuffer.write(this.id, 0, 18);
  }

  // write latitude to transmission buffer
  _writeLatitude(latitude) {
    this.txBuffer.writeFloatLE(Math.fround(latitude), 18);
  }

  // write longitude to transmission buffer
  _writeLongitude(longitude) {
    this.txBuffer.writeFloatLE(Math.fround(longitude), 50);
  }

  _writeFlightTime() {
    const flightTime = new Date().getTime() / 1000 - this.epochAtFlightStart;
    this.txBuffer.writeFloatLE(Math.fround(flightTime), 82);
  }

  startFlight() {
    this._writeId(this.id);
    this._writeLatitude(this.trajectory[this.iTrajectory][0]);
    this._writeLongitude(this.trajectory[this.iTrajectory++][1]);
    this.epochAtFlightStart = new Date().getTime() / 1000;
    this._writeFlightTime();
    // drone liftoff; register drone with dronecomm api
    socket.emit('r', this.txBuffer);
    // fly drone; update location with interval of 1 second
    // (only sends update if location change > 1 meter)
    this.intervalObj = setInterval(() => {
      this.fly();
    }, 1000);
  }

  fly() {
    this._writeLatitude(this.trajectory[this.iTrajectory][0]);
    this._writeLongitude(this.trajectory[this.iTrajectory][1]);
    this._writeFlightTime();
    socket.emit('g', this.txBuffer);

    if (this.iTrajectory < this.trajectory.length - 1) {
      ++this.iTrajectory;
    } else if (this.countdownToInactive > 0) {
      // NOTE: Instead of stopping the loop directly, we keep sending the
      // final location for 10 seconds so that on the frontend side we can
      // actually see the drones become inactive (i.e. a drone is inactive
      // if it send updates but did not move more than 1 meter during 10
      // seconds);
      this.countdownToInactive--;
    } else {
      clearInterval(this.intervalObj);
    }
  }
}

class DroneSimulator {
  constructor() {
    const latitudeMin = -90;
    const latitudeMax = 90;
    const longitudeMin = -180;
    const longitudeMax = 180;
    const nDrondes = 10000;
    const nTrajectoryUpdates = 60; // number of trajectory updates per minute
    let trajectories = [];
    let latitude = latitudeMin;
    let longitude = longitudeMin;

    for (let iDrone = 0; iDrone < nDrondes; ++iDrone) {
      let trajectory = [];
      for (
        let iTrajectory = 0;
        iTrajectory < nTrajectoryUpdates;
        ++iTrajectory
      ) {
        trajectory.push([latitude, longitude]);
        latitude += 0.0001;
        longitude += 0.0001;
        if (latitude > latitudeMax) {
          latitude = latitudeMin;
        }
        if (longitude > longitudeMax) {
          longitude = longitudeMin;
        }
      }
      trajectories.push(trajectory);
    }

    this.drones = [];
    for (const trajectory of trajectories) {
      this.drones.push(new Drone(trajectory));
    }
  }

  start() {
    for (const drone of this.drones) {
      drone.startFlight();
    }
  }
}
