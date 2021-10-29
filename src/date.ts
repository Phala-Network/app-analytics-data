import { DateTime } from 'luxon'

export const date = DateTime.now().setZone('UTC+0').toFormat('yyyy-MM-dd')
export const formatDate = (moment: number) =>
  DateTime.fromMillis(moment).toFormat('yyyy-MM-dd')
export const formatDateTime = (moment: number) =>
  DateTime.fromMillis(moment).toFormat('yyyy-MM-dd-HH-mm-ss')
