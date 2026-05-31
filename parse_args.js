/**
 * Tiny declarative argv parser shared across PerkyCrow CLI scripts.
 *
 * It generalizes the hand-rolled "handler map + for loop" pattern that was
 * duplicated across scripts (sprite_tool, snap, golden, leak, ...).
 *
 * Spec shape:
 *   {
 *     usage:    'yarn sprite <command> <file> [options]',
 *     description: 'optional blurb shown above the options in --help',
 *     positionals: ['command', 'file'],   // or [{name, help, required}]
 *     flags: {
 *       cols:      {type: 'int',  alias: '-c', default: null, help: 'Columns'},
 *       json:      {type: 'bool', help: 'Output as JSON'},
 *       ignore:    {type: 'string', multiple: true, help: 'Ignored regions'},
 *       key:       {parse: parseHexColor, help: 'Chroma key color'}
 *     }
 *   }
 *
 * A flag key in camelCase maps to the kebab-case CLI token automatically:
 *   keepKey -> --keep-key   (the parsed result keeps the camelCase key)
 *
 * Returns a plain object: every flag key is present (with its default), every
 * named positional is set, and `_` holds the full positional list.
 *
 * `--help` / `-h` print generated usage and exit(0) by default. Override what
 * gets printed with `spec.help` (a string, or a function that prints), and what
 * happens afterwards with `spec.onHelp` (defaults to `process.exit(0)`).
 */


export class CliError extends Error {}


const BUILTIN_TYPES = new Set(['string', 'int', 'float', 'bool'])


export function parseArgs (argv, spec = {}) {
    const flags = spec.flags || {}
    const lookup = buildLookup(flags)
    const result = defaultsFor(flags)

    const positionals = []

    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i]

        if (token === '--help' || token === '-h') {
            handleHelp(spec)
            continue
        }

        if (isFlagToken(token)) {
            const [name, inlineValue] = splitInline(token)
            const entry = lookup[name]

            if (!entry) {
                throw new CliError(`Unknown flag: ${name}`)
            }

            if (entry.spec.type === 'bool') {
                if (inlineValue !== null) {
                    throw new CliError(`Flag ${name} does not take a value`)
                }
                assign(result, entry, true)
                continue
            }

            let value = inlineValue
            if (value === null) {
                value = argv[i + 1]
                if (value === undefined) {
                    throw new CliError(`Flag ${name} expects a value`)
                }
                i += 1
            }

            assign(result, entry, coerce(entry, value, name))
            continue
        }

        positionals.push(token)
    }

    bindPositionals(result, spec.positionals, positionals)
    result._ = positionals

    return result
}


function buildLookup (flags) {
    const lookup = {}

    for (const [key, rawSpec] of Object.entries(flags)) {
        const flagSpec = normalizeSpec(key, rawSpec)
        const entry = {key, spec: flagSpec}

        for (const token of flagSpec.tokens) {
            if (lookup[token]) {
                throw new CliError(`Duplicate flag token: ${token}`)
            }
            lookup[token] = entry
        }
    }

    return lookup
}


function normalizeSpec (key, rawSpec) {
    const flagSpec = {...rawSpec}

    if (flagSpec.type && !BUILTIN_TYPES.has(flagSpec.type) && !flagSpec.parse) {
        throw new CliError(`Unknown flag type '${flagSpec.type}' for ${key}`)
    }

    if (!flagSpec.type) {
        flagSpec.type = flagSpec.parse ? 'custom' : 'string'
    }

    const aliases = toArray(flagSpec.alias)
    flagSpec.tokens = [`--${toKebab(key)}`, ...aliases]

    return flagSpec
}


function defaultsFor (flags) {
    const result = {}

    for (const [key, rawSpec] of Object.entries(flags)) {
        if (rawSpec.multiple) {
            result[key] = []
        } else if ('default' in rawSpec) {
            result[key] = rawSpec.default
        } else if (rawSpec.type === 'bool') {
            result[key] = false
        } else {
            result[key] = null
        }
    }

    return result
}


function assign (result, entry, value) {
    if (entry.spec.multiple) {
        result[entry.key].push(value)
    } else {
        result[entry.key] = value
    }
}


function coerce (entry, value, name) {
    const {spec} = entry

    if (spec.parse) {
        return spec.parse(value)
    }

    if (spec.type === 'int') {
        const n = parseInt(value, 10)
        if (Number.isNaN(n)) {
            throw new CliError(`Flag ${name} expects an integer, got '${value}'`)
        }
        return n
    }

    if (spec.type === 'float') {
        const n = parseFloat(value)
        if (Number.isNaN(n)) {
            throw new CliError(`Flag ${name} expects a number, got '${value}'`)
        }
        return n
    }

    return value
}


function bindPositionals (result, positionalSpec, positionals) {
    if (!positionalSpec) {
        return
    }

    positionalSpec.forEach((entry, index) => {
        const name = typeof entry === 'string' ? entry : entry.name
        const value = positionals[index]

        if (value === undefined && entry.required) {
            throw new CliError(`Missing required argument: <${name}>`)
        }

        result[name] = value === undefined ? null : value
    })
}


function handleHelp (spec) {
    if (typeof spec.help === 'function') {
        spec.help()
    } else if (typeof spec.help === 'string') {
        console.log(spec.help)
    } else {
        console.log(formatHelp(spec))
    }

    if (spec.onHelp) {
        spec.onHelp()
    } else {
        process.exit(0)
    }
}


export function formatHelp (spec = {}) {
    const lines = []

    if (spec.usage) {
        lines.push(`Usage: ${spec.usage}`)
    }

    if (spec.description) {
        lines.push('', spec.description)
    }

    const positionalSpec = spec.positionals || []
    const positionalRows = positionalSpec
        .map(toHelpRow)
        .filter(row => row.help)

    if (positionalRows.length) {
        lines.push('', 'Arguments:')
        appendRows(lines, positionalRows.map(row => [`<${row.name}>`, row.help]))
    }

    const flagRows = Object.entries(spec.flags || {}).map(([key, flagSpec]) => {
        const tokens = [`--${toKebab(key)}`, ...toArray(flagSpec.alias)]
        return [tokens.join(', '), flagSpec.help || '']
    })
    flagRows.push(['--help, -h', 'Show this help'])

    lines.push('', 'Options:')
    appendRows(lines, flagRows)

    return lines.join('\n')
}


function toHelpRow (entry) {
    if (typeof entry === 'string') {
        return {name: entry, help: ''}
    }
    return {name: entry.name, help: entry.help || ''}
}


function appendRows (lines, rows) {
    const width = rows.reduce((max, [left]) => Math.max(max, left.length), 0)
    for (const [left, right] of rows) {
        lines.push(`  ${left.padEnd(width)}  ${right}`.trimEnd())
    }
}


function isFlagToken (token) {
    return token.startsWith('-') && token !== '-'
}


function splitInline (token) {
    const eq = token.indexOf('=')
    if (eq === -1) {
        return [token, null]
    }
    return [token.slice(0, eq), token.slice(eq + 1)]
}


function toArray (value) {
    if (value === undefined || value === null) {
        return []
    }
    return Array.isArray(value) ? value : [value]
}


function toKebab (key) {
    return key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
}
