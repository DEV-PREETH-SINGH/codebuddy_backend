const { exec } = require('child_process');
const path = require('path');

console.log('Starting load test...');

// Run artillery using the YAML config file
const configPath = path.join(__dirname, 'load-test-config.yml');
const artilleryCommand = `artillery run ${configPath}`;

exec(artilleryCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('Load test failed:', error);
    return;
  }

  if (stderr) {
    console.error('Load test stderr:', stderr);
  }

  console.log('Load test output:', stdout);
  console.log('Load test completed successfully');
}); 