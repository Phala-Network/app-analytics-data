import fs from 'fs'
import path from 'path'
import { writeJson } from './writeJson'

const dailyFilsPath = path.resolve(__dirname, '../data/daily')
const chartData: {}[] = []
const result = fs.readdirSync(dailyFilsPath)

result.map((file) => {
  const data = require(`${dailyFilsPath}/${file}`)

  console.log(data)

  chartData.push(data)
})

console.log('result', result)

const fileName = 'chartData.json'

writeJson(`./data/chart/${fileName}`, chartData)
