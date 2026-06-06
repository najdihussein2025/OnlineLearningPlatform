const packageJson = require('../package.json');

test('frontend project exposes expected React scripts', () => {
  expect(packageJson.scripts.start).toBe('react-scripts start');
  expect(packageJson.scripts.build).toBe('react-scripts build');
  expect(packageJson.scripts.test).toBe('react-scripts test');
});

test('frontend includes the core app dependencies', () => {
  expect(packageJson.dependencies.react).toBeDefined();
  expect(packageJson.dependencies['react-router-dom']).toBeDefined();
  expect(packageJson.dependencies.axios).toBeDefined();
  expect(packageJson.dependencies['@microsoft/signalr']).toBeDefined();
});
