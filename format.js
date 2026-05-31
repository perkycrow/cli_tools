const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
}


export function bold (text) {
    return `${colors.bold}${text}${colors.reset}`
}


export function dim (text) {
    return `${colors.dim}${text}${colors.reset}`
}


export function green (text) {
    return `${colors.green}${text}${colors.reset}`
}


export function yellow (text) {
    return `${colors.yellow}${text}${colors.reset}`
}


export function cyan (text) {
    return `${colors.cyan}${text}${colors.reset}`
}


export function gray (text) {
    return `${colors.gray}${text}${colors.reset}`
}


export function header (title) {
    const line = '─'.repeat(50)
    console.log('')
    console.log(`${colors.cyan}${line}${colors.reset}`)
    console.log(`${colors.bold}${colors.cyan}  ${title}${colors.reset}`)
    console.log(`${colors.cyan}${line}${colors.reset}`)
    console.log('')
}


export function subHeader (title) {
    console.log(`\n${colors.bold}${title}${colors.reset}\n`)
}


export function success (message) {
    console.log(`${colors.green}✓${colors.reset} ${message}`)
}


export function successCompact (message) {
    console.log(`${colors.green}✓${colors.reset} ${colors.dim}${message}${colors.reset}`)
}


export function failureCompact (message) {
    console.log(`${colors.yellow}✗${colors.reset} ${message}`)
}


export function warning (message) {
    console.log(`${colors.yellow}!${colors.reset} ${message}`)
}


export function info (message) {
    console.log(`${colors.blue}›${colors.reset} ${message}`)
}


export function listItem (text, count = null) {
    const prefix = `  ${colors.dim}•${colors.reset} ${text}`
    const suffix = count === null ? '' : ` ${colors.gray}(${count})${colors.reset}`
    console.log(prefix + suffix)
}


export function hint (message) {
    console.log(`${colors.gray}  ${message}${colors.reset}`)
}


export function divider () {
    console.log('')
}
