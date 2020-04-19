const puppeteer = require('puppeteer')
const url = require('url')
const { FiltersEngine, Request } = require('@cliqz/adblocker')
const chalk = require('chalk')
const { outputFileSync } = require('fs-extra')
const { existsSync } = require('fs')
const path = require('path')
//host, pathname
//const CRX_PATH = __dirname

exports.save = save
exports.open = open

function save(dest, { filter, slient, rename, override }) {
  const f = urlFilter(Array.isArray(filter) ? filter.join('\n') : filter)
  return async (response) => {
    const urlString = response.url()
    if (urlString) {
      if (urlString.startsWith('data:')) {
        //skip data resouce
        return
      }
      const match = f(response)
      if (match) {
        !slient && console.log(chalk.green('✔'), urlString)
        let filePath
        if (rename) {
          filePath = rename(urlString)
        }
        if (!filePath || !rename) {
          const obj = url.parse(urlString)
          let pathname = obj.pathname || '/'
          if (pathname.endsWith('/')) {
            pathname += 'index.html'
          }
          filePath = path.join(obj.host, pathname)
        }
        filePath = path.join(dest, filePath)
        const write = override || !existsSync(filePath)
        !slient && console.log(chalk.cyan(write ? '>' : '-') + filePath)
        try {
          write && outputFileSync(filePath, await response.buffer())
        } catch (e) {}
      } else {
        if (!slient) console.log(chalk.red('✕'), urlString)
      }
    }
  }
}

async function open(url, dest, options) {
  const ppOpts = {
    executablePath: process.env.CHROME_BIN,
    args: [
      '--no-sandbox',
      '--disable-features=site-per-process', //https://github.com/puppeteer/puppeteer/issues/2548
      //'--disable-gpu',
      //`--disable-extensions-except=${CRX_PATH}`,
      //`--load-extension=${CRX_PATH}`,
      //'--disable-dev-shm-usage',
    ],
    ignoreHTTPSErrors: true,
    userDataDir: path.join(dest, 'chrome'),
    headless: options.headless || false,
  }
  if (options.userDataDir) {
    ppOpts.userDataDir = path.resolve(dest, options.userDataDir)
  }

  const browser = await puppeteer.launch(ppOpts)
  const page = await browser.newPage()
  await page.setUserAgent(
    options.userAgent ||
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36'
  )
  page.on('response', save(dest, options))

  await page.goto(url)
}

function urlFilter(ruler) {
  if (!ruler) return () => true

  const engine = FiltersEngine.parse(ruler)
  return (response) => {
    const request = response.request()
    const frame = request.frame()
    const sourceUrl = frame !== null ? frame.url() : undefined

    const req = Request.fromRawDetails({
      url: response.url(),
      type: request.resourceType(),
      sourceUrl,
    })
    const { match } = engine.match(req)
    return match
  }
}
