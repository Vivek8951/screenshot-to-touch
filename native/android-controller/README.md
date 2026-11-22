# Native Android controller — architecture only

No Gradle application or APK is implemented. Do not advertise an Android installation command.

Planned Kotlin/Jetpack Compose application: landscape-first controller, independent pointer IDs with pointer capture, shared v1 snapshots, OkHttp WebSocket connection, NSD discovery, Android USB-tethered network interface selection, SensorManager gyro/accelerometer sampling, calibration and smoothing, VibratorManager ordinary vibration, foreground-session lifecycle, Android Keystore trusted credentials. Bluetooth is future transport only.

`ControllerPorts.kt` defines the platform boundaries. Implement these adapters and Gradle configuration before building. On any app background, connection loss or pointer cancellation, clear all inputs. Sensors and physical adaptive triggers are not provided by the web app.
