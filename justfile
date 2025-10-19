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

[group('manage')]
update-dev:
    npx npm-check-updates -u --dep dev --target minor

[group('manage')]
update-prod:
    npx npm-check-updates -u --dep prod --target minor

[group('manage')]
check:
    npx eslint . --ext .ts

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

[group('publish')]
publish-rc: build
    npm publish --tag rc

