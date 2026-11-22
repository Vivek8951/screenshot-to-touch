package dev.dualsense.bridge
/** Architecture contracts only; not a runnable APK or implemented sensor engine. */
interface ControllerTransport {
    suspend fun pair(host: String, port: Int, temporaryPin: String, useTls: Boolean)
    suspend fun sendProtocolV1(jsonSnapshot: String)
    suspend fun disconnectAndNeutralize()
}
interface MotionEngine {
    fun start(onGyro: (FloatArray) -> Unit, onAcceleration: (FloatArray) -> Unit)
    fun calibrate()
    fun stop()
}
interface PhoneHaptics {
    fun pulse(durationMs: Long, amplitude: Int?)
    fun cancel()
}
interface MultitouchInputEngine {
    fun pointerDown(pointerId: Long, controlId: String, x: Float, y: Float)
    fun pointerMove(pointerId: Long, x: Float, y: Float)
    fun pointerUp(pointerId: Long)
    fun releaseAll()
}
