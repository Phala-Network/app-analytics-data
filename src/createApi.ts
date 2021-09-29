import { phalaDev } from '@phala/typedefs'
import { ApiPromise, WsProvider } from '@polkadot/api'

export async function createApi(endpoint: string) {
  const wsProvider = new WsProvider(endpoint)

  return await ApiPromise.create({
    provider: wsProvider,
    types: phalaDev,
  })
}
