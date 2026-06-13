package app.cadence.jetbrains

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.service
import com.intellij.openapi.ui.Messages

class CadenceTestConnectionAction : AnAction() {
    override fun actionPerformed(event: AnActionEvent) {
        val ok = ApplicationManager.getApplication().service<CadenceHeartbeatService>().testConnection()
        Messages.showInfoMessage(
            if (ok) "Cadence connection verified." else "Cadence connection failed. Check your API key and endpoint.",
            "Cadence"
        )
    }
}
