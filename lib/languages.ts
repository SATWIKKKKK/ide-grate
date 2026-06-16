const LANGUAGE_ALIASES: Record<string, string> = {
  "c++": "cpp",
  "c/c++": "cpp",
  "c#": "csharp",
  "f#": "fsharp",
  "objective-c": "objective_c",
  "objectivec": "objective_c",
  "objective c": "objective_c",
  "visual basic": "visualbasic",
  "vb.net": "visualbasic",
  "pl/sql": "plsql",
  "t-sql": "tsql",
  "webassembly": "wasm",
  "shell": "bash",
  "sh": "bash",
  "zsh": "bash",
  "typescriptreact": "typescript",
  "javascriptreact": "javascript",
  "tsx": "typescript",
  "jsx": "javascript",
  "mathematica": "wolfram",
  "terraform": "hcl",
  "ansible dsl": "ansible",
  "reasonml": "reason",
  "labview": "labview",
  "tla+": "tla",
  "modula-2": "modula2",
  "modula-3": "modula3",
  "pl/i": "pli",
}

const EXCLUDED_LANGUAGE_KEYS = new Set([
  "",
  "unknown",
  "plaintext",
  "text",
  "dotenv",
  "env",
  "markdown",
  "md",
  "mdx",
  "lock",
  "log",
  "gitignore",
  "dockerignore",
  "editorconfig",
])

export const PROGRAMMING_LANGUAGE_KEYS = new Set([
  "python", "javascript", "typescript", "java", "c", "cpp", "csharp", "go", "rust",
  "swift", "kotlin", "ruby", "php", "scala", "r", "matlab", "perl", "haskell",
  "lua", "dart", "elixir", "clojure", "fsharp", "erlang", "julia", "groovy",
  "objective_c", "assembly", "asm", "cobol", "fortran", "pascal", "lisp", "prolog",
  "scheme", "ocaml", "racket", "ada", "vhdl", "verilog", "tcl", "bash",
  "powershell", "awk", "sed", "solidity", "move", "vyper", "wasm", "sql", "plsql",
  "tsql", "graphql", "html", "css", "scss", "sass", "less", "xml", "json", "yaml",
  "yml", "toml", "latex", "tex", "razor", "jinja", "jinja2", "handlebars", "hbs",
  "ejs", "pug", "coffeescript", "coffee", "elm", "purescript", "reason", "rescript",
  "zig", "nim", "crystal", "d", "v", "odin", "carbon", "mojo", "chapel", "hack",
  "actionscript", "applescript", "vbscript", "visualbasic", "vba", "abap", "rpg",
  "sas", "spss", "stata", "wolfram", "labview", "scratch", "alice", "logo",
  "smalltalk", "eiffel", "modula2", "modula3", "oberon", "simula", "algol", "pli",
  "rexx", "jcl", "forth", "postscript", "hcl", "puppet", "chef", "ansible",
  "bicep", "ballerina", "ring", "io", "factor", "arc", "picat", "mercury", "clean",
  "idris", "agda", "coq", "lean", "isabelle", "alloy", "tla", "promela", "spark",
  "whiley", "vue", "svelte",
])

export function normalizeLanguageKey(value: unknown): string | null {
  if (typeof value !== "string") return null
  const raw = value.trim().toLowerCase().replace(/\s+/g, " ")
  const compact = raw.replace(/[.\s-]/g, "")
  const candidate = LANGUAGE_ALIASES[raw] || LANGUAGE_ALIASES[compact] || raw
  if (EXCLUDED_LANGUAGE_KEYS.has(candidate)) return null
  return PROGRAMMING_LANGUAGE_KEYS.has(candidate) ? candidate : null
}

export function isDisplayLanguage(value: unknown): boolean {
  return normalizeLanguageKey(value) !== null
}

export function displayLanguageName(key: string): string {
  const names: Record<string, string> = {
    cpp: "C++",
    csharp: "C#",
    fsharp: "F#",
    objective_c: "Objective-C",
    plsql: "PL/SQL",
    tsql: "T-SQL",
    wasm: "WebAssembly",
    visualbasic: "Visual Basic",
    labview: "LabVIEW",
    modula2: "Modula-2",
    modula3: "Modula-3",
    pli: "PL/I",
    tla: "TLA+",
  }
  return names[key] || key
}
