const config = {
  collectCoverage: true,
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
  resetMocks: true,
  setupFilesAfterEnv: [
    'core-js/stable',
    'jest-extended/all',
  ],
  transform: {},
};

export default config;