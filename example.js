const { open } = require('./index')
const path = require('path')

open('https://charting-library.tradingview.com/', path.join(__dirname, 'data'), {
  override: true,
  filter: `/charting_library/\n/datafeeds/`,
})
