# @perkycrow/cli_tools

Small shared toolkit for PerkyCrow CLI scripts: terminal formatting and a
declarative argv parser. Zero runtime dependencies.

## Install

Consumed as a git dependency (not published to npm).

```jsonc
// during development, linked live as a sibling directory:
"@perkycrow/cli_tools": "portal:../cli_tools"

// locked to a tagged version:
"@perkycrow/cli_tools": "git+ssh://git@github.com/perkycrow/cli_tools.git#v0.1.0"
```

Two entry points:

```js
import {bold, success, header} from '@perkycrow/cli_tools/format'
import {parseArgs} from '@perkycrow/cli_tools/parse_args'
// or everything from the root: '@perkycrow/cli_tools'
```

## format

Terminal output helpers. Color wrappers return a string; the rest log directly.

```js
import {header, success, warning, listItem, hint, bold, dim, green} from '@perkycrow/cli_tools/format'

header('Build report')
success('3 files written')
warning('1 file skipped')
listItem('sprites.json', 42)
hint('Run with --json for machine output')
console.log(`${bold('Size')} ${dim('328 × 400')}`)
```

Colors: `bold`, `dim`, `green`, `yellow`, `cyan`, `gray`.
Lines: `header`, `subHeader`, `success`, `successCompact`, `failureCompact`,
`warning`, `info`, `listItem`, `hint`, `divider`.

## parseArgs

Declarative replacement for the hand-rolled "handler map + for loop" that was
duplicated across scripts.

```js
import {parseArgs} from '@perkycrow/cli_tools/parse_args'

const cli = parseArgs(process.argv.slice(2), {
    usage: 'yarn sprite <command> <file> [options]',
    positionals: ['command', 'file'],
    flags: {
        cols:    {type: 'int', alias: '-c', default: null, help: 'Number of columns'},
        json:    {type: 'bool', help: 'Output as JSON'},
        ignore:  {type: 'string', multiple: true, help: 'Patterns to ignore'},
        key:     {parse: parseHexColor, help: 'Chroma key color'}
    }
})

// cli.command, cli.file   -> positionals (in order)
// cli.cols                -> 4            (--cols 4 / --cols=4 / -c 4)
// cli.json                -> true|false
// cli.ignore              -> []           (repeat the flag to append)
// cli.key                 -> parseHexColor(value)
// cli._                   -> full positional list
```

### Flag spec

| Key        | Meaning                                                        |
|------------|----------------------------------------------------------------|
| `type`     | `'string'` (default), `'int'`, `'float'`, `'bool'`             |
| `parse`    | custom `value => any` coercion (overrides `type`)              |
| `alias`    | extra token(s), e.g. `'-c'` or `['-c', '--columns']`          |
| `default`  | value when the flag is absent (bool defaults to `false`)       |
| `multiple` | collect repeated values into an array (defaults to `[]`)       |
| `help`     | one-line description shown in `--help`                         |

A camelCase flag key maps to a kebab-case token automatically
(`keepKey` → `--keep-key`); the parsed result keeps the camelCase key.
`bool` flags take no value; every other flag consumes the next token (or `=value`).
Unknown flags, missing values, and bad types throw `CliError`.

### Help

`--help` / `-h` print generated usage and `process.exit(0)` by default.
Override the output with `spec.help` (a string, or a function that prints), and
the after-action with `spec.onHelp`:

```js
parseArgs(argv, {
    flags: {...},
    help: printRichHelp   // your own function; called instead of the generated help
})
```

`formatHelp(spec)` is exported if you want the generated text without parsing.

## Tests

```sh
yarn test
```
