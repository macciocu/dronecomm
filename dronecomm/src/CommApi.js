'use strict';

const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const { Drones } = require('./Drones');
const drones = new Drones();

// Communication server API abstract base class
class CommApi {
  constructor(port) {
    const server = http.Server(express());
    this.sockio = socketio(server);

    const serverName = this.constructor.name;
    server.listen(port, function() {
      console.info(serverName + ' server listening on port: ' + port);
    });

    this._handleConnect = this._handleConnect.bind(this);
    this.sockio.on('connection', this._handleConnect);
  }

  ///
  // INTERFACE
  ///

  // eslint-disable-next-line
  _handleConnect(socket) {
    throw new Error(
      this.constructor.name + ' MUST implement `_handleConnect(socket)`)',
    );
  }
}

class DroneCommApi extends CommApi {
  constructor(port) {
    super(port);
    this._update = this._update.bind(this);
    this._register = this._register.bind(this);
  }

  _handleConnect(socket) {
    console.debug('a drone connected to ' + this.constructor.name);
    socket.on('r', this._register);
    socket.on('g', this._update);
  }

  _register(buffer) {
    drones.addDrone(this._extractBuffferData(buffer));
  }

  _update(buffer) {
    drones.updatePos(this._extractBuffferData(buffer));
  }

  _extractBuffferData(buffer) {
    return {
      id: buffer.toString('utf8', 0, 18),
      latitude: buffer.readFloatLE(18),
      longitude: buffer.readFloatLE(50),
      flightTime: buffer.readFloatLE(82),
    };
  }
}

class DashboardCommApi extends CommApi {
  constructor(port) {
    super(port);
  }

  _handleConnect(socket) {
    console.debug('a dashboard connected to ' + this.constructor.name);

    socket.on('subscribe', interval => {
      console.info(
        'a dashboard client subscribed to drones location update with interval: ' +
          interval,
      );
      setInterval(() => {
        socket.emit('dronesdata', drones.getData());
      }, interval);
    });
  }
}

module.exports = {
  DroneCommApi,
  DashboardCommApi,
};
