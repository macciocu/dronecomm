'use strict';

class Drones {
  constructor() {
    this.dronesData = new Map();
    this.RADIUS_EARTH = 6378100; // [meters]
  }

  getData() {
    let data = [];
    for (const [droneID, droneData] of this.dronesData) {
      data.push({
        droneID: droneID,
        latitude: droneData.latitude,
        longitude: droneData.longitude,
        velocity: droneData.velocity,
        inactive: droneData.inactive.toString()
      });
    }
    return data;
  }

  addDrone(rx) {
    console.debug(
      'Drones.addDrone(' +
        'id=' +
        rx.id +
        ', ' +
        'latitude=' +
        rx.latitude +
        ', ' +
        'longitude=' +
        rx.longitude +
        ')',
    );
    this.dronesData.set(
      rx.id,
      new DroneData(rx.latitude, rx.longitude, rx.flightTime),
    );
  }

  updatePos(rx) {
    const drone = this.dronesData.get(rx.id);
    const p = this._computeXYZPos(drone.latitude, drone.longitude);
    const q = this._computeXYZPos(rx.latitude, rx.longitude);

    let velocity = 0;
    let deltaDistanceInKm = 0;
    if (!(p.x === q.x && p.y === q.y && p.z === q.z)) {
      // compute orthodromic distance between `p` and `q` (which are both two
      // points on the surface of sphere earth
      const dot = p.x * q.x + p.y * q.y + p.z * q.z;
      deltaDistanceInKm =
        this.RADIUS_EARTH *
        Math.acos(dot / (this.RADIUS_EARTH * this.RADIUS_EARTH)) *
        0.001;
      // compute velocity
      const deltaTimeInHours = (rx.flightTime - drone.flightTime) / 3600;
      velocity = deltaDistanceInKm / deltaTimeInHours;
    }

    console.debug(
      '[drone status update]\n' +
        'id: ' +
        rx.id +
        '\n' +
        'latitude: ' +
        rx.latitude +
        '\n' +
        'longitude: ' +
        rx.longitude +
        '\n' +
        'velocity: ' +
        velocity,
    );

    this.dronesData
      .get(rx.id)
      .setData(
        rx.latitude,
        rx.longitude,
        rx.flightTime,
        velocity,
        deltaDistanceInKm,
      );
  }

  // translate latitude/longitude to a 3D position vector
  // latitude: north-south position in degrees
  // longitude: east-west position in degrees
  _computeXYZPos(latitude, longitude) {
    const latitudeInRadians = (latitude * Math.PI) / 180.0;
    const longitudeInRadians = (longitude * Math.PI) / 180.0;
    const rho = this.RADIUS_EARTH * Math.cos(latitudeInRadians);
    const z = this.RADIUS_EARTH * Math.sin(latitudeInRadians);
    const x = rho * Math.cos(longitudeInRadians);
    const y = rho * Math.sin(longitudeInRadians);
    return { z: z, x: x, y: y };
  }
}

class DroneData {
  constructor(latitude, longitude, flightTime) {
    this.latitude = latitude; // north-south position in degrees
    this.longitude = longitude; // east-west position in degrees
    this.flightTime = flightTime; // flight duration in sec.
    this.velocity = 0; // speed in km / hour
    this.inactive = false; // true if drone has not moved more than 1m during 10 sec.
    this.deltaDistanceInMeters10secWindow = 0;
    this.deltaFlightTime10secWindow = 0;
  }

  setData(latitude, longitude, flightTime, velocity, deltaDistanceInKm) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.velocity = velocity;
    const deltaFlightTime = flightTime - this.flightTime;
    this.flightTime = flightTime;
    this.deltaFlightTime10secWindow += deltaFlightTime;
    this.deltaDistanceInMeters10secWindow += deltaDistanceInKm * 1000;

    if (this.deltaDistanceInMeters10secWindow > 1) {
      this.deltaDistanceInMeters10secWindow = 0;
      this.deltaFlightTime10secWindow = 0;
      this.inactive = false;
    } else if (this.deltaFlightTime10secWindow >= 10) {
      this.deltaDistanceInMeters10secWindow = 0;
      this.deltaFlightTime10secWindow = 0;
      this.inactive = true;
    }
  }
}

module.exports = {
  Drones,
};
