import fs from 'fs'

export function writeJson(path: string, obj: any) {
  const jsonData = JSON.stringify(obj, undefined, 2)
  fs.writeFileSync(path + '.json', jsonData, { encoding: 'utf-8' })
}
