# Android Release Mode

## Target output

Ship an Android App Bundle (`.aab`) for Google Play.

## Step 1: Install and generate Android project

```bash
npm install
npx cap add android
npm run mobile:build
npm run mobile:android
```

## Step 2: Open the Android project in Android Studio

Use the generated `android/` project.

## Step 3: Verify config before release

- Package id: `com.mathroyale.app`
- App name: `Math Royale`
- Orientation: portrait only
- Icons: replace temporary assets if needed
- Splash background: `#0b1020`

## Step 4: Test release-critical flows

- Cold start
- Offline start after one successful load
- Login / cloud sync
- Rush / Arena / Classic screens
- Audio and haptic feedback
- Keyboard behavior on auth and settings
- Install prompt and standalone mode

## Step 5: Build signed bundle

In Android Studio:

- `Build`
- `Generate Signed Bundle / APK`
- Choose `Android App Bundle`
- Use a production keystore

## Step 6: Pre-upload checks

- Version code incremented
- Version name matches release notes
- No placeholder icons or debug strings
- No broken network calls
- Performance acceptable on low-end Android devices

## Step 7: Upload to Play Console

- Create app listing
- Upload `.aab`
- Fill store text and screenshots
- Complete content rating and privacy sections

## Step 8: First post-upload pass

- Internal testing track first
- Verify install from Play
- Verify updates over an older build
- Check crash reporting before production rollout
