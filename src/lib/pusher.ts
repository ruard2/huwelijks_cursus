import Pusher from 'pusher'
import PusherJS from 'pusher-js'

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

export function getPusherClient(): PusherJS {
  return new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  })
}

export function coupleChannel(coupleCode: string) {
  return `couple-${coupleCode.toLowerCase()}`
}

export const EVENTS = {
  ANSWER_UPDATED: 'answer-updated',
  PROGRESS_UPDATED: 'progress-updated',
} as const
