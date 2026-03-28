# EasyAuth Flutter Example

This is a complete Flutter application demonstrating how to integrate `easy_auth_flutter` to implement a passwordless sign in flow.

## Getting Started

1. Ensure one of the backend examples (`examples/nextjs` or `examples/express-sqlite`) is actively running on `localhost:3000`.
2. Assuming you are using an Android Emulator, the IP `10.0.2.2` seamlessly routes to `localhost`. (If using iOS simulator or physical device, adjust the IP in `home_screen.dart`).
3. Run the app:
   ```bash
   flutter run
   ```

## Features Demonstrated

- Presenting the `EasyAuthModal` inside a bottom sheet.
- Validating the local IP to the HTTP remote using port 3000 backend.
- Returning an `EasyAuthResult` synchronously.
- Securely storing the JWT token via `flutter_secure_storage` exclusively for device permanence.
- Making a protected request mapping `Headers: { Authorization: "Bearer <token>" }` inside `dashboard_screen.dart`.
