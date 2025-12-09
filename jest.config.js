module.exports = {
  testEnvironment: 'node',
  testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/USE_ONLY_AS_DOCUMENTATION/'],
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }] }
};
