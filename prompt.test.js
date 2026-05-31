import {describe, test, expect} from 'vitest'
import {matchChoice, formatChoices} from './prompt.js'


const CHOICES = [
    {key: 'k', label: 'keep'},
    {key: 'd', label: 'discard'},
    {key: 's', label: 'skip'}
]


describe('matchChoice', () => {

    test('matches a choice by key', () => {
        expect(matchChoice('d', CHOICES).label).toBe('discard')
    })

    test('is case-insensitive', () => {
        expect(matchChoice('K', CHOICES).label).toBe('keep')
    })

    test('returns null for an unknown key', () => {
        expect(matchChoice('x', CHOICES)).toBeNull()
    })

})


describe('formatChoices', () => {

    test('renders (k)eep style hints', () => {
        expect(formatChoices(CHOICES)).toBe('(k)eep (d)iscard (s)kip')
    })

})
