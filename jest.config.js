module.exports = {
  preset: "ts-jest",
  testMatch: ["<rootDir>/test/**/*.(j|t)s?(x)", "<rootDir>/src/**/*.test.(j|t)s?(x)"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^test/(.*)": "<rootDir>/test/$1",
    "\\.(css|less)$": "<rootDir>/test/helpers/stubMapping.js"
  },
  moduleDirectories: ["src", "node_modules"],
  watchPathIgnorePatterns: ["<rootDir>/dist"],
  testPathIgnorePatterns: ["<rootDir>/test/helpers/.*"],
  setupTestFrameworkScriptFile: "<rootDir>/jest.init.ts",
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
