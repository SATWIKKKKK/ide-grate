package app.cadence.jetbrains

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import java.net.HttpURLConnection
import java.net.URI
import java.security.MessageDigest
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.Timer
import java.util.TimerTask

class CadenceHeartbeatService {
    private var timer: Timer? = null
    private var pendingFile: VirtualFile? = null
    private var pendingProject: Project? = null

    fun queueHeartbeat(project: Project, file: VirtualFile?) {
        val settings = ApplicationManager.getApplication().service<CadenceSettings>().state
        if (settings.apiKey.isBlank()) return
        pendingProject = project
        pendingFile = file
        timer?.cancel()
        timer = Timer("cadence-heartbeat", true)
        timer?.schedule(object : TimerTask() {
            override fun run() {
                sendHeartbeat(false)
            }
        }, settings.debounceMillis.toLong())
    }

    fun testConnection(): Boolean = sendHeartbeat(true)

    private fun sendHeartbeat(connectionTest: Boolean): Boolean {
        val settings = ApplicationManager.getApplication().service<CadenceSettings>().state
        if (settings.apiKey.isBlank()) return false

        val projectPath = pendingProject?.basePath.orEmpty()
        val language = pendingFile?.fileType?.name?.lowercase() ?: "unknown"
        val payload = buildString {
            append("{")
            append(json("apiKey", settings.apiKey)).append(',')
            append(json("ide", "jetbrains")).append(',')
            append(json("timestamp", OffsetDateTime.now().toString())).append(',')
            append(json("language", language)).append(',')
            append(json("file", pendingFile?.extension ?: "")).append(',')
            append(json("project", pendingProject?.name ?: "unknown")).append(',')
            append(json("projectHash", if (projectPath.isBlank()) "" else sha256(projectPath).take(16))).append(',')
            append(json("platform", System.getProperty("os.name").lowercase())).append(',')
            append("\"isIdle\":false,")
            append("\"timezoneOffset\":${OffsetDateTime.now().offset.totalSeconds / -60},")
            append(json("localDate", LocalDate.now().toString()))
            if (connectionTest) append(",").append(json("type", "connection_test"))
            append("}")
        }

        return try {
            val connection = URI(settings.endpoint).toURL().openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Authorization", "Bearer ${settings.apiKey}")
            connection.doOutput = true
            connection.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) }
            connection.responseCode in 200..299
        } catch (_: Exception) {
            false
        }
    }

    private fun json(key: String, value: String) = "\"$key\":\"${value.replace("\\", "\\\\").replace("\"", "\\\"")}\""

    private fun sha256(value: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(value.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }
}
