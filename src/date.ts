import { DateTime } from 'luxon'

export const date = DateTime.now().setZone('UTC+0').toFormat('yyyy-MM-dd')
