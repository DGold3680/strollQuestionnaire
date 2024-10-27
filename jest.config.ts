module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
      '^.+\\.ts$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    testPathIgnorePatterns: ['<rootDir>/dist/'], // Ignore the dist folder if you don’t want to run tests from there.
  };
  