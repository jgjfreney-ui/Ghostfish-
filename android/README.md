# Ghostbug — Android APK

Ghostbug is wrapped in a tiny native **WebView** shell so it installs and runs
like a normal app (fully offline — all assets live inside the APK).

## Easiest: download the APK from CI

1. Go to the repo's **Actions** tab → **Build Android APK**.
2. Open the latest successful run (or click **Run workflow** to start one).
3. Download the **`Ghostbug-APK`** artifact — inside is `Ghostbug.apk`.
4. Copy it to your Pixel and tap it. Allow "install from unknown sources" if
   prompted. Done.

> This is a **debug** APK (unsigned for the Play Store, but perfectly fine to
> sideload onto your own phone).

## Build it locally

Requires the Android SDK + JDK 17.

```bash
# from the repo root — bundle the web game into the app, then build
mkdir -p android/app/src/main/assets/www
cp -r index.html styles.css src android/app/src/main/assets/www/
cd android
gradle assembleDebug         # or ./gradlew if you've generated the wrapper
# -> app/build/outputs/apk/debug/app-debug.apk
```

Install over USB:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Notes

- The app targets Android 7.0+ (minSdk 24), locks to landscape, and goes
  fullscreen/immersive.
- `localStorage` (your collection + progress saves) works via DOM storage.
- Web Audio is allowed without a gesture, but the game still starts on the
  **▶ Start Summer** tap so the soundtrack kicks in cleanly.
