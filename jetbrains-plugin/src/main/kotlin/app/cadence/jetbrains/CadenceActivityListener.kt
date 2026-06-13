package app.cadence.jetbrains

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.event.DocumentEvent
import com.intellij.openapi.editor.event.DocumentListener
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.project.ProjectManager

class CadenceActivityListener : DocumentListener {
    override fun documentChanged(event: DocumentEvent) {
        val file = FileDocumentManager.getInstance().getFile(event.document)
        val project = ProjectManager.getInstance().openProjects.firstOrNull { project ->
            val base = project.basePath
            base != null && file?.path?.startsWith(base) == true
        } ?: return

        ApplicationManager.getApplication().service<CadenceHeartbeatService>().queueHeartbeat(project, file)
    }
}
