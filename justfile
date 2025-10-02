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

[group('manage')]
outdated:
    npm outdated --omit=dev

[group('build')]
clean:
    rm -rf dist

[group('build')]
build:
    npm run build

# Rebuild
[group('build')]
rb:
    just clean & just build

[group('publish')]
publish: build
    npm publish
