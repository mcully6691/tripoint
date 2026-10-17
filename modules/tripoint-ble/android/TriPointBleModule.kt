
package expo.modules.tripointble

import android.bluetooth.BluetoothManager
import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TriPointBleModule : Module() {

    override fun definition() = ModuleDefinition {

        Name("TriPointBle")

        Events("onPeer", "onState")

        Function("start") {
            val context = appContext.reactContext
                ?: throw Exception("Android context unavailable")

            val manager = context.getSystemService(
                Context.BLUETOOTH_SERVICE
            ) as BluetoothManager

            val enabled = manager.adapter?.isEnabled == true

            sendEvent(
                "onState",
                mapOf(
                    "state" to if (enabled) "ready" else "off"
                )
            )
        }

        Function("stop") {
            sendEvent(
                "onState",
                mapOf("state" to "stopped")
            )
        }

        Function("updatePayload") { value: String ->
            // Location exchange will be added next.
        }
    }
}
