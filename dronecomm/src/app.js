const { DroneCommApi, DashboardCommApi } = require('./CommApi');

if (
  !(
    process.argv.length > 2 &&
    (process.argv[2] == 'd' || process.argv[2] == 'debug')
  )
) {
  console.debug = function() {};
}

new DroneCommApi(5001);
new DashboardCommApi(5000);
