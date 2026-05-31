import {describe, test, expect} from 'vitest'
import {parseArgs, formatHelp, CliError} from './parse_args.js'


describe('parseArgs', () => {

    test('parses string flags and consumes the next token', () => {
        const result = parseArgs(['--out', 'sheet.json'], {
            flags: {out: {type: 'string'}}
        })
        expect(result.out).toBe('sheet.json')
    })

    test('coerces int flags', () => {
        const result = parseArgs(['--cols', '4'], {
            flags: {cols: {type: 'int'}}
        })
        expect(result.cols).toBe(4)
    })

    test('coerces float flags', () => {
        const result = parseArgs(['--tolerance', '0.25'], {
            flags: {tolerance: {type: 'float'}}
        })
        expect(result.tolerance).toBe(0.25)
    })

    test('bool flags are true when present, do not consume next', () => {
        const result = parseArgs(['--json', 'file.psd'], {
            flags: {json: {type: 'bool'}},
            positionals: ['file']
        })
        expect(result.json).toBe(true)
        expect(result.file).toBe('file.psd')
    })

    test('applies defaults when a flag is absent', () => {
        const result = parseArgs([], {
            flags: {
                cols: {type: 'int', default: 8},
                json: {type: 'bool'},
                out: {type: 'string'}
            }
        })
        expect(result).toMatchObject({cols: 8, json: false, out: null})
    })

    test('maps camelCase keys to kebab-case tokens', () => {
        const result = parseArgs(['--keep-key'], {
            flags: {keepKey: {type: 'bool'}}
        })
        expect(result.keepKey).toBe(true)
    })

    test('supports aliases', () => {
        const result = parseArgs(['-w', '256'], {
            flags: {width: {type: 'int', alias: '-w'}}
        })
        expect(result.width).toBe(256)
    })

    test('supports multiple aliases', () => {
        const spec = {flags: {height: {type: 'int', alias: ['-h2', '--ht']}}}
        expect(parseArgs(['-h2', '10'], spec).height).toBe(10)
        expect(parseArgs(['--ht', '20'], spec).height).toBe(20)
    })

    test('supports --flag=value inline syntax', () => {
        const result = parseArgs(['--cols=12', '--name=hero'], {
            flags: {cols: {type: 'int'}, name: {type: 'string'}}
        })
        expect(result.cols).toBe(12)
        expect(result.name).toBe('hero')
    })

    test('multiple collects values into an array', () => {
        const result = parseArgs(['--ignore', 'a', '--ignore', 'b'], {
            flags: {ignore: {type: 'string', multiple: true}}
        })
        expect(result.ignore).toEqual(['a', 'b'])
    })

    test('multiple defaults to an empty array', () => {
        const result = parseArgs([], {flags: {ignore: {type: 'string', multiple: true}}})
        expect(result.ignore).toEqual([])
    })

    test('custom parse hook overrides type coercion', () => {
        const parseSize = value => value.split('x').map(Number)
        const result = parseArgs(['--frame', '32x48'], {
            flags: {frame: {parse: parseSize}}
        })
        expect(result.frame).toEqual([32, 48])
    })

    test('collects positionals in order and exposes _', () => {
        const result = parseArgs(['extract', 'hero.png', 'extra'], {
            positionals: ['command', 'file']
        })
        expect(result.command).toBe('extract')
        expect(result.file).toBe('hero.png')
        expect(result._).toEqual(['extract', 'hero.png', 'extra'])
    })

    test('unset optional positionals are null', () => {
        const result = parseArgs(['only'], {positionals: ['command', 'file']})
        expect(result.command).toBe('only')
        expect(result.file).toBeNull()
    })

    test('flags and positionals interleave', () => {
        const result = parseArgs(['extract', '--cols', '4', 'hero.png', '--json'], {
            flags: {cols: {type: 'int'}, json: {type: 'bool'}},
            positionals: ['command', 'file']
        })
        expect(result).toMatchObject({command: 'extract', file: 'hero.png', cols: 4, json: true})
    })

    test('negative numbers are accepted as flag values', () => {
        const result = parseArgs(['--offset', '-5'], {flags: {offset: {type: 'int'}}})
        expect(result.offset).toBe(-5)
    })

    test('throws on unknown flag', () => {
        expect(() => parseArgs(['--nope'], {flags: {}})).toThrow(CliError)
    })

    test('throws when a value flag is missing its value', () => {
        expect(() => parseArgs(['--out'], {flags: {out: {type: 'string'}}})).toThrow(/expects a value/)
    })

    test('throws when an int flag gets a non-integer', () => {
        expect(() => parseArgs(['--cols', 'abc'], {flags: {cols: {type: 'int'}}})).toThrow(/integer/)
    })

    test('throws when a bool flag is given a value', () => {
        expect(() => parseArgs(['--json=1'], {flags: {json: {type: 'bool'}}})).toThrow(/does not take a value/)
    })

    test('throws on a required positional that is missing', () => {
        expect(() => parseArgs([], {positionals: [{name: 'file', required: true}]})).toThrow(/Missing required/)
    })

    test('--help triggers onHelp instead of exiting when provided', () => {
        let helped = false
        parseArgs(['--help'], {
            usage: 'demo',
            flags: {json: {type: 'bool'}},
            onHelp: () => {
                helped = true
            }
        })
        expect(helped).toBe(true)
    })

})


describe('formatHelp', () => {

    test('renders usage, arguments and options', () => {
        const help = formatHelp({
            usage: 'yarn sprite <command> <file> [options]',
            description: 'Asset pipeline tool.',
            positionals: [{name: 'command', help: 'What to do'}, {name: 'file', help: 'Input file'}],
            flags: {
                cols: {type: 'int', alias: '-c', help: 'Number of columns'},
                keepKey: {type: 'bool', help: 'Keep the chroma key'}
            }
        })

        expect(help).toContain('Usage: yarn sprite <command> <file> [options]')
        expect(help).toContain('Asset pipeline tool.')
        expect(help).toContain('<command>')
        expect(help).toContain('--cols, -c')
        expect(help).toContain('--keep-key')
        expect(help).toContain('--help, -h')
    })

})
