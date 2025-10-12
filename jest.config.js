const config = {
  collectCoverage: true,
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
  resetMocks: true,
  transform: {},
};

export default config;