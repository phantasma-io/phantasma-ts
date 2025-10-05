module.exports = {
  testEnvironment: 'node',
  testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }] }
};