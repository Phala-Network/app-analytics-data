import fs from 'fs'
import { writeJson } from './writeJson'

const result = fs.readdirSync('./data/daily')

console.log('result', result)

const fileName = 'chartData.json'

writeJson(`./data/chart/${fileName}`, {})
