[private]
just:
    just -l

[group('test')]
test:
    npm run test

[group('build')]
build:
    npm run build

[group('publish')]
publish: build
    npm publish
