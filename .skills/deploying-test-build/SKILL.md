---
name: deploying-test-build
description: Deploys iOS/Android test builds using EAS Build with internal distribution. Use when asked to deploy, build, or release a test/development/preview build.
---

# Deploying Test Builds

Build and deploy internal distribution builds for iOS and Android using EAS Build.

## Commands

### iOS Development Build (with dev client)
```bash
eas build --platform ios --profile development
```

### iOS Preview Build (internal distribution, no dev client)
```bash
eas build --platform ios --profile preview
```

### Android Development Build
```bash
eas build --platform android --profile development
```

### Android Preview Build
```bash
eas build --platform android --profile preview
```

## Live Activity Widget Setup (IMPORTANT)

If your app uses `@bacons/apple-targets` for Live Activity widgets, you MUST manually configure the capability in Apple Developer Console. **EAS does NOT auto-sync `com.apple.developer.live-activity`**.

### One-Time Setup for Live Activity

**Step 1**: Ensure `targets/widgets/generated.entitlements` contains:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.developer.live-activity</key>
    <true/>
  </dict>
</plist>
```

**Step 2**: Enable Live Activity in Apple Developer Console:
1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click **`com.buddybox.app.widget`** (your widget bundle ID)
3. Scroll down and check **"Push Notifications"** (required for Live Activity)
4. Save changes

**Step 3**: Clear the widget's provisioning profile (so EAS regenerates it with the entitlement):
```bash
eas credentials --platform ios
```
Then:
1. Select **development** profile
2. Choose **Build Credentials: Manage everything needed to build your project**
3. Choose **Provisioning Profile: Delete one from your project**
4. Select the widget profile (`com.buddybox.app.widget`)
5. Confirm deletion

**Step 4**: Clean prebuild and rebuild:
```bash
rm -rf ios && npx expo prebuild --platform ios
eas build --platform ios --profile development
```

## General Troubleshooting

### Clear All Credentials
If builds fail due to credential issues:
```bash
eas credentials --platform ios
```
Then navigate to delete Distribution Certificate (this removes all provisioning profiles).

### Common Issues

1. **Provisioning profile missing entitlement**:
   - The capability must be enabled in Apple Developer Console for the bundle ID
   - Delete the provisioning profile via `eas credentials`
   - Rebuild to regenerate with correct entitlements

2. **Device not registered**:
   ```bash
   eas device:create
   ```
   Then clear credentials and rebuild.

3. **Expired credentials**:
   - Clear credentials and rebuild

4. **"Synced capabilities: No updates"** for extensions:
   - EAS only syncs capabilities for the main app target
   - Extension capabilities must be enabled manually in Apple Developer Console

## Build Profiles

Defined in `eas.json`:

| Profile | Distribution | Dev Client | Use Case |
|---------|-------------|------------|----------|
| `development` | internal | yes | Local development with Expo Go replacement |
| `preview` | internal | no | Testing production-like builds |
| `production` | store | no | App Store / Play Store submission |

## Unsupported EAS Auto-Sync Capabilities

These must be enabled manually in Apple Developer Console:
- `com.apple.developer.live-activity` (Live Activity)
- HLS Interstitial Previews
- Any capability not in [Expo's supported list](https://docs.expo.dev/build-reference/ios-capabilities/)
