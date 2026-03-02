# iOS Release Checklist

## 1. Install dependencies

```bash
npm install
```

## 2. Add iOS platform

```bash
npx cap add ios
```

## 3. Build and sync web assets

```bash
npm run mobile:build
```

## 4. Open Xcode project

```bash
npm run mobile:ios
```

## 5. In Xcode

- Let Swift packages and build settings finish syncing.
- Test on an iPhone simulator in portrait mode.
- Verify safe areas, keyboard behavior, audio, and haptics.
- Confirm the app launches in standalone mode without browser chrome.

## 6. Signing and release

- Configure the Apple Developer team.
- Set the bundle id to `com.mathroyale.app`.
- Archive the app and validate before App Store Connect upload.

## 7. Store polish before upload

- Replace temporary icons with final branded assets.
- Provide launch screen assets matching the dark theme.
- Check screenshots on multiple iPhone sizes.
- Verify no placeholder labels remain.
- Test install, resume, and offline startup.

## 8. Recommended native checks

- Status bar contrast on all screens.
- Keyboard resize behavior on auth/settings screens.
- Audio permissions and silent mode behavior.
- Haptic feedback intensity on real devices.
