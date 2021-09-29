import fs from 'fs'
import { writeJson } from './writeJson'

const result = fs.readdirSync('./data')

console.log('result', result)

const fileName = 'chartData.json'

writeJson(`./data/chart/${fileName}`, {})
