package app.cadence.jetbrains

import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage

@Service(Service.Level.APP)
@State(name = "CadenceSettings", storages = [Storage("cadence.xml")])
class CadenceSettings : PersistentStateComponent<CadenceSettings.State> {
    data class State(
        var apiKey: String = "",
        var endpoint: String = "https://ca-dence.vercel.app/api/heartbeat",
        var idleTimeoutSeconds: Int = 120,
        var debounceMillis: Int = 30000,
    )

    private var state = State()

    override fun getState(): State = state

    override fun loadState(state: State) {
        this.state = state
    }
}
