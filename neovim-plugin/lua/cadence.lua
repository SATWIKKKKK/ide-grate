local M = {}

local config = {
  api_key = vim.env.CADENCE_API_KEY or "",
  endpoint = vim.env.CADENCE_ENDPOINT or "https://vs-integrate.vercel.app/api/heartbeat",
  debounce_ms = 30000,
  idle_timeout = 120,
}

local timer = nil
local last_activity = vim.loop.now()

local function json_encode(payload)
  return vim.fn.json_encode(payload)
end

local function current_project()
  return vim.fn.getcwd()
end

local function project_hash(project)
  return vim.fn.sha256(project):sub(1, 16)
end

local function post(payload)
  if config.api_key == "" then
    vim.notify("Cadence API key is not configured", vim.log.levels.WARN)
    return
  end

  local body = json_encode(payload)
  vim.fn.jobstart({
    "curl", "-sS", "-X", "POST",
    "-H", "Content-Type: application/json",
    "-H", "Authorization: Bearer " .. config.api_key,
    "-d", body,
    config.endpoint,
  }, { detach = true })
end

local function heartbeat(connection_test)
  local project = current_project()
  local file = vim.api.nvim_buf_get_name(0)
  local language = vim.bo.filetype ~= "" and vim.bo.filetype or "unknown"
  local now = os.time()
  local payload = {
    apiKey = config.api_key,
    ide = "neovim",
    timestamp = now * 1000,
    type = connection_test and "connection_test" or nil,
    language = language,
    file = file ~= "" and vim.fn.fnamemodify(file, ":e") or nil,
    project = vim.fn.fnamemodify(project, ":t"),
    projectHash = project_hash(project),
    platform = vim.loop.os_uname().sysname:lower(),
    isIdle = ((vim.loop.now() - last_activity) / 1000) > config.idle_timeout,
    timezoneOffset = -math.floor(os.difftime(os.time(os.date("!*t")), os.time(os.date("*t"))) / 60),
    localDate = os.date("%Y-%m-%d"),
  }
  post(payload)
end

local function queue()
  last_activity = vim.loop.now()
  if timer then
    timer:stop()
    timer:close()
  end
  timer = vim.loop.new_timer()
  timer:start(config.debounce_ms, 0, vim.schedule_wrap(function()
    heartbeat(false)
  end))
end

function M.setup(opts)
  config = vim.tbl_extend("force", config, opts or {})
  vim.api.nvim_create_user_command("CadenceTestConnection", function()
    heartbeat(true)
    vim.notify("Cadence connection test sent")
  end, {})

  vim.api.nvim_create_autocmd({ "BufEnter", "TextChanged", "TextChangedI", "BufWritePost" }, {
    group = vim.api.nvim_create_augroup("CadenceTelemetry", { clear = true }),
    callback = queue,
  })
end

return M
