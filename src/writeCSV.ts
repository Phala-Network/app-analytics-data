import fs from 'fs'

export function writeCSV(path: string, items: any[]) {
  const replacer = (_: string, value: string) => (value === null ? '' : value) // specify how you want to handle null values here
  const header = Object.keys(items[0])
  const csv = [
    header.join(','), // header row first
    ...items.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(',')
    ),
  ].join('\r\n')

  fs.writeFileSync(path + '.csv', csv, { encoding: 'utf-8' })
}
