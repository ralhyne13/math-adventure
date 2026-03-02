# Android Release Checklist

## 1. Install dependencies

```bash
npm install
```

## 2. Add Android platform

```bash
npx cap add android
```

## 3. Build and sync the web app

```bash
npm run mobile:build
```

## 4. Open Android Studio

```bash
npm run mobile:android
```

## 5. In Android Studio

- Let Gradle sync completely.
- Set the app name and launcher icons if needed.
- Test on a device in portrait mode.
- Verify install prompt, offline load, and audio.

## 6. Generate signed release

- Build an `AAB` for Play Store.
- Keep the keystore safe.
- Use the package id: `com.mathroyale.app`.

## 7. Store polish before upload

- Replace temporary icons with final branded assets.
- Add a real splash screen.
- Verify no placeholder labels remain.
- Test on small and large Android screens.
- Check performance on low-end devices.

## 8. Recommended next native plugins

- `@capacitor/splash-screen`
- `@capacitor/status-bar`
- `@capacitor/keyboard`
- `@capacitor/app`
- `@capacitor/haptics`
