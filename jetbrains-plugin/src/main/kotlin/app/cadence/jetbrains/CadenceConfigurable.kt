package app.cadence.jetbrains

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.service
import com.intellij.openapi.options.Configurable
import javax.swing.JComponent
import javax.swing.JPanel
import javax.swing.JTextField
import java.awt.GridLayout

class CadenceConfigurable : Configurable {
    private val settings = ApplicationManager.getApplication().service<CadenceSettings>()
    private val apiKey = JTextField()
    private val endpoint = JTextField()

    override fun getDisplayName(): String = "Cadence"

    override fun createComponent(): JComponent {
        apiKey.text = settings.state.apiKey
        endpoint.text = settings.state.endpoint
        return JPanel(GridLayout(2, 1)).apply {
            add(apiKey)
            add(endpoint)
        }
    }

    override fun isModified(): Boolean =
        apiKey.text != settings.state.apiKey || endpoint.text != settings.state.endpoint

    override fun apply() {
        settings.state.apiKey = apiKey.text.trim()
        settings.state.endpoint = endpoint.text.trim().ifBlank { "https://vs-integrate.vercel.app/api/heartbeat" }
    }
}
