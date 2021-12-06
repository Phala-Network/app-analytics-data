import { ApiPromise } from '@polkadot/api'
import { DateTime } from 'luxon'
import { bn1e10, bn64b } from './bn'
import { createApi } from './createApi'
import { formatDate, formatDateTime } from './date'
import { writeCSV } from './writeCSV'
import { writeJson } from './writeJson'

export async function dumpSnapshots() {
  const endpoint = 'wss://khala-archive.phala.network/ws'
  // const endpoint = 'wss://khala-node-asia-1.phala.network/ws'
  // const endpoint = 'wss://khala.api.onfinality.io/public-ws'

  const api = await createApi(endpoint)
  const tip = await api.rpc.chain.getHeader()
  const tipNum = tip.number.toNumber()
  // const startNum = 417793
  const startNum = 828193
  // const startNum = 604993

  // Dump miner-to-worker map (instant snapshot)
  const minerBindings = await api?.query?.phalaMining?.minerBindings?.entries()

  if (!minerBindings) {
    console.error('minerBindings is null')
    return
  }

  const minerWorkerMap = minerBindings
    .map(([key, v]) => {
      // @ts-ignore
      return [key.args?.[0]?.toHuman(), v?.unwrap?.().toJSON()]
    })
    .reduce((map, [key, v]) => {
      // @ts-ignore
      map[key] = v
      return map
    }, {})

  const input = []

  // Dump miner status
  for (let n = startNum; n <= tipNum; n += 7200) {
    console.log('')
    input.push(n)
  }

  // fsExtra.emptyDirSync('./data/block')

  let lastReward = 0
  // await input
  for (const n of input) {
    console.time()
    lastReward = (await handleData(api, n, minerWorkerMap, lastReward)) ?? 0
    console.timeEnd()
    console.log('')
  }

  api.disconnect()
}

async function handleData(
  api: ApiPromise,
  n: number,
  minerWorkerMap: {},
  lastReward: number
) {
  console.log('n', n)
  const h = await api.rpc.chain.getBlockHash(n)
  const momentPrev = await api.query.timestamp.now.at(h)

  console.log('momentPrev', formatDate(momentPrev.toNumber()))

  const date = formatDate(momentPrev.toNumber())

  const output2 = `./data/block/block-result-${n}`
  const output = `./data/daily/daily-result-${formatDateTime(
    momentPrev.toNumber()
  )}`
  const outputLatest = `./data/latest/daily`

  // Check file access
  // fs.writeFileSync(output2, '')
  // fs.writeFileSync(output, '')
  // fs.writeFileSync(outputLatest, '')

  writeJson(output2, {})
  writeJson(output, {})
  writeJson(outputLatest, {})
  writeCSV(output2, [{}])
  writeCSV(output, [{}])
  writeCSV(outputLatest, [{}])

  const entries = await api.query?.phalaMining?.miners?.entriesAt(h)

  const frame = entries?.map(([key, v]) => {
    // @ts-ignore
    const m = v.unwrap()
    const miner = key.args[0]?.toHuman()

    return {
      miner,
      // @ts-ignore
      worker: minerWorkerMap[miner] || '',
      state: m.state.toString(),
      v: m.v.div(bn64b).toNumber(),
      pInit: m.benchmark.pInit.toNumber(),
      pInstant: m.benchmark.pInstant.toNumber(),
      updatedAt: m.benchmark.challengeTimeLast.toNumber(),
      totalReward: m.stats.totalReward.div(bn1e10).toNumber() / 100,
    }
  })

  if (!frame) {
    console.error('frame is null')
    return
  }

  const miningIdles = frame.filter((item) => item.state === 'MiningIdle')
  const reward = frame.reduce((sum, item) => sum + item.totalReward, 0)

  const result = {
    block: n,
    onlineWorkers: miningIdles.length,
    workers: frame.length,
    vCPU: miningIdles.reduce((sum, item) => sum + item.pInstant, 0) / 150,
    date,
    reward,
    dailyReward: reward - lastReward,
    datetime: DateTime.fromMillis(momentPrev.toNumber()).toISO(),
  }

  console.log('result', result)

  writeJson(output2, result)
  writeJson(output, result)
  writeJson(outputLatest, result)
  writeCSV(output2, [result])
  writeCSV(output, [result])
  writeCSV(outputLatest, [result])

  return reward ?? 0
}
