# Mobile Build Notes

## Capacitor setup

The project is prepared for Capacitor packaging.

### Install dependencies

Run:

```bash
npm install
```

### Add native platforms

```bash
npx cap add android
npx cap add ios
```

### Build and sync web assets

```bash
npm run mobile:build
```

### Open native projects

```bash
npm run mobile:android
npm run mobile:ios
```

## Notes

- Web assets are emitted to `dist/`.
- Capacitor reads from `dist/` via `webDir`.
- App id is `com.mathroyale.app`.
- Native icons and splash screens should be generated next for store builds.
