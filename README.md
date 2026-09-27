# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

## Wallet assistant API

The AI chat uses a small server-side proxy so the OpenAI key is never bundled into the mobile app.

1. Copy `api/.env.example` to `api/.env` and set `OPENAI_API_KEY` on the server. Keep this key in `api/.env`; never put it in an `EXPO_PUBLIC_*` variable.
2. Start the proxy:

   ```bash
   npm run api:dev
   ```

3. Copy `mobile.env.example` to the app's root `.env`, set `EXPO_PUBLIC_API_URL`, then restart Expo. Use `http://localhost:8787` for an iOS simulator, `http://10.0.2.2:8787` for the standard Android emulator, or your development machine's LAN address (for example `http://192.168.1.20:8787`) for a physical Android device.

The app sends the question, a small wallet summary, and recent transaction summaries to the proxy, which forwards them to OpenAI. It omits wallet addresses, transaction signatures, and account keys. The proxy has basic in-memory rate limiting for development; add authenticated access and production-grade abuse controls before deploying publicly.
