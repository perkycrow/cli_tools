export function matchChoice (key, choices) {
    const normalized = key.toLowerCase()
    return choices.find(choice => choice.key.toLowerCase() === normalized) || null
}


export function formatChoices (choices) {
    return choices.map(choice => `(${choice.key})${choice.label.slice(1)}`).join(' ')
}


export function readKey (input = process.stdin) {
    return new Promise(resolve => {
        const wasRaw = Boolean(input.isRaw)

        const cleanup = () => {
            input.removeListener('data', onData)
            if (input.isTTY && input.setRawMode) {
                input.setRawMode(wasRaw)
            }
            input.pause()
        }

        function onData (data) {
            cleanup()
            resolve(data.toString())
        }

        if (input.isTTY && input.setRawMode) {
            input.setRawMode(true)
        }
        input.resume()
        input.once('data', onData)
    })
}


export async function promptChoice (question, choices, io = {}) {
    const input = io.input || process.stdin
    const output = io.output || process.stdout

    output.write(`${question} ${formatChoices(choices)} `)

    for (;;) {
        const key = await readKey(input)

        if (key === '') {
            output.write('\n')
            process.exit(130)
        }

        const choice = matchChoice(key.trim().charAt(0) || key, choices)
        if (choice) {
            output.write(`${choice.key}\n`)
            return choice
        }
    }
}
