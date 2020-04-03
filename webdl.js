#!/usr/bin/env node

const { open } = require('./index')
const { program } = require('commander')
const path = require('path')

program
  .command('open <url> [dest]')
  .description('Open web page for track request files')
  .option(
    '-f, --filter <text>',
    'filter urls for save by the adblock filter ruler. see: https://adblockplus.org/filter-cheatsheet',
    arrayOption,
    []
  )
  .option('-s, --slient', "Don't show logs")
  .option('-o, --override', 'Override files')
  .action(function (url, dest, options) {
    open(url, path.resolve(process.env.PWD, dest), options)
  })

program.parse(process.argv)

function arrayOption(item, array) {
  array.push(item)
  return array
}
