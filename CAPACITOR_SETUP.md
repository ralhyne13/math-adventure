# Capacitor Setup

## 1. Install Node dependencies

```bash
npm install
```

This installs the Capacitor packages already declared in `package.json`.

## 2. Build the web app once

```bash
npm run build
```

This generates the web bundle in `dist/`.

## 3. Add native platforms

```bash
npx cap add android
npx cap add ios
```

Run each command only once per platform.

## 4. Sync web assets into native shells

```bash
npm run mobile:sync
```

Or rebuild and sync in one step:

```bash
npm run mobile:build
```

## 5. Open native IDEs

```bash
npm run mobile:android
npm run mobile:ios
```

## 6. Recommended first native checks

- Launch on a real Android device.
- Launch on an iPhone simulator.
- Verify portrait lock behavior.
- Verify install/offline startup.
- Verify audio, vibration, keyboard, and safe areas.

## 7. After each frontend change

```bash
npm run mobile:build
```

This keeps native projects synced with the latest web build.

## 8. If native config changes

If you change `capacitor.config.ts`, run:

```bash
npm run mobile:sync
```

## 9. Asset validation

```bash
npm run assets:check
```

Use this before generating final store icons and splash screens.
