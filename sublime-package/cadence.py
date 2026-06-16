import hashlib
import json
import os
import platform
import threading
import time
import urllib.request

import sublime
import sublime_plugin


class CadenceState:
    timer = None
    last_activity = time.time()


def settings():
    return sublime.load_settings("Cadence.sublime-settings")


def project_hash(window):
    folders = window.folders() if window else []
    project = folders[0] if folders else ""
    return hashlib.sha256(project.encode("utf-8")).hexdigest()[:16] if project else ""


def send_heartbeat(view, connection_test=False):
    cfg = settings()
    api_key = cfg.get("api_key", "")
    endpoint = cfg.get("endpoint", "https://ca-dence.vercel.app/api/heartbeat")
    if not api_key:
        sublime.status_message("Cadence API key is not configured")
        return

    window = view.window() if view else sublime.active_window()
    file_name = view.file_name() if view else ""
    language = (view.settings().get("syntax") or "unknown").split("/")[-1].split(".")[0].lower() if view else "unknown"
    payload = {
        "apiKey": api_key,
        "ide": "sublime",
        "timestamp": int(time.time() * 1000),
        "type": "connection_test" if connection_test else None,
        "language": language,
        "file": os.path.splitext(file_name or "")[1].lstrip(".") or None,
        "project": os.path.basename(window.folders()[0]) if window and window.folders() else "unknown",
        "projectHash": project_hash(window),
        "platform": platform.system().lower(),
        "isIdle": (time.time() - CadenceState.last_activity) > cfg.get("idle_timeout", 120),
        "timezoneOffset": -int(time.localtime().tm_gmtoff / 60) if hasattr(time.localtime(), "tm_gmtoff") else 0,
        "localDate": time.strftime("%Y-%m-%d"),
    }
    body = json.dumps({k: v for k, v in payload.items() if v is not None}).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer " + api_key,
        },
        method="POST",
    )
    try:
        urllib.request.urlopen(request, timeout=5).read()
        sublime.status_message("Cadence heartbeat sent")
    except Exception as exc:
        sublime.status_message("Cadence heartbeat failed: {}".format(exc))


def queue_heartbeat(view):
    CadenceState.last_activity = time.time()
    if CadenceState.timer:
        CadenceState.timer.cancel()
    delay = settings().get("debounce_ms", 30000) / 1000
    CadenceState.timer = threading.Timer(delay, lambda: send_heartbeat(view))
    CadenceState.timer.daemon = True
    CadenceState.timer.start()


class CadenceEventListener(sublime_plugin.EventListener):
    def on_modified_async(self, view):
        queue_heartbeat(view)

    def on_post_save_async(self, view):
        queue_heartbeat(view)

    def on_activated_async(self, view):
        queue_heartbeat(view)


class CadenceTestConnectionCommand(sublime_plugin.ApplicationCommand):
    def run(self):
        view = sublime.active_window().active_view() if sublime.active_window() else None
        send_heartbeat(view, True)
