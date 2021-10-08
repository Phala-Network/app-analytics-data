import { ApiPromise } from '@polkadot/api'
import fs from 'fs'
import fsExtra from 'fs-extra'
import { bn1e10, bn64b } from './bn'
import { createApi } from './createApi'
import { formatDate } from './date'
import { writeJson } from './writeJson'

export async function dumpSnapshots(step = 1000, since = -1) {
  const endpoint = 'wss://khala.api.onfinality.io/public-ws'

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

  const input = []

  // Dump miner status
  for (let n = startNum; n <= tipNum; n += step) {
    console.log('')
    input.push(n)
  }

  fsExtra.emptyDirSync('./data/block')

  // await input
  for (const n of input) {
    console.time()
    await handleData(api, n, minerWorkerMap)
    console.timeEnd()
    console.log('')
  }

  api.disconnect()
}

async function handleData(api: ApiPromise, n: number, minerWorkerMap: {}) {
  console.log('n', n)
  const h = await api.rpc.chain.getBlockHash(n)
  const momentPrev = await api.query.timestamp.now.at(h)

  console.log('momentPrev', formatDate(momentPrev.toNumber()))

  const date = formatDate(momentPrev.toNumber())

  const output2 = `./data/block/block-result-${n}.json`
  const output = `./data/daily/daily-result-${date}.json`
  const outputLatest = `./data/latest/daily.json`

  // Check file access
  fs.writeFileSync(output2, '')
  fs.writeFileSync(output, '')
  fs.writeFileSync(outputLatest, '')

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

  const result = {
    block: n,
    onlineWorkers: miningIdles.length,
    workers: frame.length,
    vCPU: miningIdles.reduce((sum, item) => sum + item.pInstant, 0) / 150,
    reward: frame.reduce((sum, item) => sum + item.totalReward, 0),
    date,
  }

  console.log('result', result)

  writeJson(output2, result)
  writeJson(output, result)
  writeJson(outputLatest, result)
}
