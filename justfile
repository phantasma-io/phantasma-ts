[private]
just:
    just -l

[group('test')]
test:
    npm run test

[group('manage')]
reinstall:
    rm -rf node_modules package-lock.json
    npm install

[group('build')]
build:
    npm run build

[group('publish')]
publish: build
    npm publish
