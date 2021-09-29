import fs from 'fs'
import { bn1e10, bn64b } from './bn'
import { createApi } from './createApi'
import { date } from './date'
import { writeJson } from './writeJson'

export async function dumpSnapshots() {
  const step = 100
  const since = -1
  const output = `./data/daily/daily-result-${date}.json`
  const outputLatest = `./data/latest/daily.json`
  const endpoint = 'wss://khala.api.onfinality.io/public-ws'

  // Check file access
  fs.writeFileSync(output, '')
  fs.writeFileSync(outputLatest, '')

  const api = await createApi(endpoint)
  const tip = await api.rpc.chain.getHeader()
  const tipNum = tip.number.toNumber()
  const startNum = since > 0 ? since : tipNum + since

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

  // Dump miner status
  const dataset = []
  for (let n = startNum; n <= tipNum; n += step) {
    const percentage = (((n - startNum) / (tipNum - startNum)) * 100).toFixed(2)
    console.log(`Dumping ${n} / ${tipNum} (${percentage}%)`)
    const h = await api.rpc.chain.getBlockHash(n)
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
    dataset.push({
      blocknum: n,
      frame,
    })
  }

  console.log('dataset.length', dataset[0]?.frame?.length)
  console.log('dataset[0].frame[0]', dataset[0]?.frame?.[0])

  const frame = dataset[0]?.frame

  if (!frame) {
    console.error('frame is null')
    return
  }

  const miningIdles = frame.filter((item) => item.state === 'MiningIdle')

  const result = {
    onlineWorkers: miningIdles.length,
    workers: frame.length,
    vCPU: miningIdles.reduce((sum, item) => sum + item.v, 0) / 150,
    reward: frame.reduce((sum, item) => sum + item.totalReward, 0),
    date,
  }

  console.log('result', result)

  writeJson(output, result)
  writeJson(outputLatest, result)

  api.disconnect()
}
