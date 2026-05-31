import {describe, expect, test} from 'vitest'
import {gray, green, yellow, cyan, bold, dim} from './format.js'


describe('format colors', () => {

    test('gray returns string with gray ANSI code', () => {
        const result = gray('test')
        expect(result).toContain('test')
        expect(result).toContain('\x1b[90m')
    })


    test('green returns string with green ANSI code', () => {
        const result = green('test')
        expect(result).toContain('test')
        expect(result).toContain('\x1b[32m')
    })


    test('yellow returns string with yellow ANSI code', () => {
        const result = yellow('test')
        expect(result).toContain('test')
        expect(result).toContain('\x1b[33m')
    })


    test('cyan returns string with cyan ANSI code', () => {
        const result = cyan('test')
        expect(result).toContain('test')
        expect(result).toContain('\x1b[36m')
    })


    test('bold wraps text with bold ANSI code', () => {
        const result = bold('test')
        expect(result).toContain('test')
        expect(result).toContain('\x1b[1m')
    })


    test('dim wraps text with dim ANSI code', () => {
        const result = dim('test')
        expect(result).toContain('test')
        expect(result).toContain('\x1b[2m')
    })

})
