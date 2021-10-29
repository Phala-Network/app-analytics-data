import fs from 'fs'
import path from 'path'
import { writeJson } from './writeJson'

const dailyFilsPath = path.resolve(__dirname, '../data/block')
const chartData: {}[] = []
const result = fs.readdirSync(dailyFilsPath)

result.map((file, index) => {
  const data = require(`${dailyFilsPath}/${file}.json`)

  if (index === 0 || index === 1) {
  } else {
    chartData.push({
      ...data,
    })
  }
})

console.log('result', result)

const fileName = 'blockChartData.json'

writeJson(`./data/chart/${fileName}.json`, chartData)
