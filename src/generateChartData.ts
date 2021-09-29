import fs from 'fs'
import path from 'path'
import { writeJson } from './writeJson'

const dailyFilsPath = path.resolve(__dirname, '../data/daily')
const chartData: {}[] = []
const result = fs.readdirSync(dailyFilsPath)

result.map((file, index) => {
  const data = require(`${dailyFilsPath}/${file}`)

  if (index === 0) {
    chartData.push({
      ...data,
      reward: 0,
    })
  } else {
    const lastData = require(`${dailyFilsPath}/${result[index - 1]}`)
    const lastDataReward = lastData ? lastData.reward : data.reward

    chartData.push({
      ...data,
      reward: data.reward - lastDataReward,
    })
  }
})

console.log('result', result)

const fileName = 'chartData.json'

writeJson(`./data/chart/${fileName}`, chartData)
