const { Drones } = require('./Drones');

test('drones data initialisation', () => {
  const input = [
    { id: 0, latitude: 1, longitude: 4 },
    { id: 1, latitude: 2, longitude: 5 },
    { id: 2, latitude: 3, longitude: 6 },
  ];
  let expected = [
    { droneID: 0, latitude: 1, longitude: 4, velocity: 0, inactive: "false" },
    { droneID: 1, latitude: 2, longitude: 5, velocity: 0, inactive: "false" },
    { droneID: 2, latitude: 3, longitude: 6, velocity: 0, inactive: "false" },
  ];

  const drones = new Drones();
  for (let inp of input) {
    drones.addDrone(inp);
  }

  // NB: We are testing for the expected JSON nodes to be returned,
  // however we don't care in which order they are returned.
  let match = 0;
  const dronesData = drones.getData();
  for (let data of dronesData) {
    for (let i in expected) {
      if (JSON.stringify(expected[i]) === JSON.stringify(data)) {
        expected.splice(i, 1);
        ++match;
        break;
      }
    }
  }
  expect(match).toBe(input.length);
});

test('drone velocity', () => {
  // flight paths (latitude, longitude pairs); generated with https://www.geoplaner.com/
  // partial circle over the north of spain
  const trajectoryNorthSpain = [
    [41.6272, 5.70376],
    [41.88928, 5.33012],
    [42.36157, 4.95647],
    [42.66909, 4.49491],
    [42.7175, 4.07731],
    [42.65294, 3.61575],
    [42.58831, 3.33002],
    [42.44264, 3.00033],
  ];
  // flying over longitude pos / neg crossing
  const trajectoryLatitudeCornerCase = [
    [90, 0],
    [-90, 0],
  ];
  // flying over longitude pos / neg crossing
  const trajectoryLongitudeCornerCase = [
    [0, -45],
    [0, 45],
  ];

  // distances in km, calculated by use of https://www.nhc.noaa.gov/gccalc.shtml
  // → for easy calculation, in this test the drone provides trajectory update each hour,
  // hence distance equals velocity in km/h
  const expectedDroneVelocityNorthSpain = [0, 43, 61, 51, 35, 38, 24, 31];
  const expectedDroneVelocityLatitudeCornerCase = [0, 20002];
  const expectedDroneVelocityLongitudeCornerCase = [0, 10001];

  const trajectories = [
    trajectoryNorthSpain,
    trajectoryLatitudeCornerCase,
    trajectoryLongitudeCornerCase,
  ];
  const expectedDroneVelocities = [
    expectedDroneVelocityNorthSpain,
    expectedDroneVelocityLatitudeCornerCase,
    expectedDroneVelocityLongitudeCornerCase,
  ];

  //  margin (percentage over expected drone velocity) we allow for the velocity computation
  const velocityMarginPercentage = 0.03;

  for (let iTestCase = 0; iTestCase < trajectories.length; ++iTestCase) {
    const drones = new Drones();
    const trajectory = trajectories[iTestCase];
    const expectedDroneVelocity = expectedDroneVelocities[iTestCase];

    for (let i = 0; i < trajectory.length; ++i) {
      const tx = {
        id: 0,
        latitude: trajectory[i][0],
        longitude: trajectory[i][1],
        flightTime: i * 3600, // + 1hr
      };

      if (i === 0) {
        drones.addDrone(tx);
      } else {
        drones.updatePos(tx);
      }

      const velocityMargin =
        expectedDroneVelocity[i] * velocityMarginPercentage;
      const reportedVelocity = drones.getData()[0].velocity;
      const deltaVelocity = Math.abs(
        reportedVelocity - expectedDroneVelocity[i],
      );
      expect(deltaVelocity <= velocityMargin).toBeTruthy();
    }
  }
});

test('drone activity', () => {
  // trajcectory with interval of 1 sec, inactive at 10 sec < 1m drone movement
  const trajectory = [
    [41.6272, 5.70376], // [0] active
    [41.88928, 5.33012], // [1]
    [42.36157, 4.95647], // [2]
    [42.36157, 4.95647], // [3]
    [42.36157, 4.95647], // [4]
    [42.36157, 4.95647], // [5]
    [42.36157, 4.95647], // [6]
    [42.36157, 4.95647], // [7]
    [42.36157, 4.95647], // [8]
    [42.36157, 4.95647], // [9]
    [42.36157, 4.95647], // [10]
    [42.36157, 4.95647], // [11]
    [42.36157, 4.95647], // [12] inactive
    [42.66909, 4.49491], // [13] active
    [42.7175, 4.07731], // [14]
    [42.65294, 3.61575], // [15]
    [42.58831, 3.33002], // [16]
    [42.58831, 3.33002], // [17]
    [42.58831, 3.33002], // [18]
    [42.58831, 3.33002], // [19]
    [42.58831, 3.33002], // [20]
    [42.58831, 3.33002], // [21]
    [42.58831, 3.33002], // [22]
    [42.58831, 3.33002], // [23]
    [42.58831, 3.33002], // [24]
    [42.58831, 3.33002], // [25]
    [42.58831, 3.33002], // [26] inactive
    [42.58831, 3.33002], // [27] inactive
    [42.44264, 3.00033], // [28] active
  ];

  const drones = new Drones();
  for (let i = 0; i < trajectory.length; ++i) {
    const tx = {
      id: 0,
      latitude: trajectory[i][0],
      longitude: trajectory[i][1],
      flightTime: i,
    };

    if (i === 0) {
      drones.addDrone(tx);
    } else {
      drones.updatePos(tx);
    }

    console.log(i);
    console.log(drones.getData()[0].inactive);

    const inactive = drones.getData()[0].inactive;
    switch (i) {
      case 12: // intentional fall through
      case 26: // intentional fall through
      case 27:
        expect(inactive === "true").toBeTruthy();
        break;
      default:
        expect(inactive === "false").toBeTruthy();
    }
  }
});
