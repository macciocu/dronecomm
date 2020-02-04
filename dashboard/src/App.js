import React from 'react';
import './App.css';

import openSocket from 'socket.io-client';

import ReactTable from 'react-table'
import 'react-table/react-table.css'

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      dronesData: []
    };
  }

  componentDidMount() {
    const socket = openSocket('http://localhost:5000');
    const that = this;
    socket.on('connect', function () {
      socket.on('dronesdata', that.rxDronesData);
      socket.emit('subscribe', 1000);
    });
  }

  rxDronesData = (dronesData) => {
    this.setState({
      dronesData: dronesData
    });
  }

  render() {
    const columns = [
      {
        Header: 'droneID',
        accessor: 'droneID',
      },
      {
        Header: 'latitude [deg]',
        accessor: 'latitude',
      },
      {
        Header: 'longitude [deg]',
        accessor: 'longitude'
      },
      {
        Header: 'velocity [km/h]',
        accessor: 'velocity'
      },
      {
        Header: 'inactive',
        accessor: 'inactive'
      }
    ];

    return (
      <ReactTable data={this.state.dronesData} columns={columns} />
    );
  }
}

export default App;
