import React, { useState, useEffect, useRef, Suspense } from 'react'
import styles from './Chat.module.scss'
import { useInfiniteQuery, useMutation } from 'react-query'
import { clientGateway } from '../../constants'
import { Auth } from '../../authentication/state'
import ScrollableFeed from 'react-scrollable-feed'
import InfiniteScroll from 'react-infinite-scroller'
import Message from './Message'
import { BeatLoader } from 'react-spinners'
import { useInterval } from 'react-use'
import moment from 'moment'
import { Waypoint } from 'react-waypoint'
import Loader from '../../components/Loader'

interface Message {
  id: string
  author: {
    id: string
    username: string
    avatar: string
    discriminator: number
  },
  created_at: string
  updated_at: string
  content: string
}

const Chat = ({ channelID, title }: { channelID: string, title: string }) => {
  const { token } = Auth.useContainer()
  const fetchMessages = async (_: string, channel: string, date: string) => {
    return (await clientGateway.get<Message[]>(`/channels/${channel}/messages`, {
      headers: { Authorization: token },
      params: { created_at: date }
    })).data
  }
  const { data, canFetchMore, fetchMore, isFetchingMore } = useInfiniteQuery<Message[], any, string | undefined>(['messages', channelID], fetchMessages, {
    getFetchMore: (last) => {
      console.log(last)
      return last.length < 25 ? false : last[last.length - 1]?.created_at
    }
  })
  const messages = data?.flat().reverse()
  const [message, setMessage] = useState('')
  const [sendMessage] = useMutation(async (content: string) =>
    (await clientGateway.post(`/channels/${channelID}/messages`, new URLSearchParams({ content }), { headers: { Authorization: token } })).data
  )

  const isPrimary = (message: Message, index: number) => {
    return !(messages?.[index - 1] && message.author.id === messages?.[index - 1]?.author?.id && (moment.utc(message?.created_at)?.valueOf() - moment.utc(messages?.[index - 1]?.created_at)?.valueOf()) < 300000)
  }

  const adjectives = [
    ' amazing', 
    ' insightful', 
    ' funny', 
    ' about cats',
    ' interesting',
    ' special',
    ' innovative',
    ', anything really',
    ' delightful',
    ' steamy',
    ' about Innatical']
  const [adjective, setAdjectives] = useState(adjectives[Math.floor(Math.random() * adjectives.length)])

  useInterval(() => {
    setAdjectives(adjectives[Math.floor(Math.random() * adjectives.length)])
  }, 30000) // 30 seconds
  const ref = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [tracking, setTracking] = useState(true)
  
  useEffect(() => {
    if (tracking && ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight - ref.current.clientHeight
    }
  })

  return (
    <Suspense fallback={<Loader />}>
      <div className={styles.chat}>
        <div className={styles.header}>
          {title}
        </div>
        <div className={styles.messages} ref={ref}>
          {!loading && canFetchMore ? <Waypoint bottomOffset={20} onEnter={async () => {
            try {
              if(!ref.current) return
              setLoading(true)
              const oldHeight = ref.current.scrollHeight
              const oldTop = ref.current.scrollTop
              await fetchMore()
              ref.current.scrollTop = ref.current.scrollHeight - oldHeight + oldTop
            } finally {
              setLoading(false)
            }
          }}/> : <></>}
          {loading && <div key='loader' className={styles.loader}><h5>Loading more...</h5></div>}
          {!canFetchMore ? <div key='header' className={styles.top}><h3>Woah, you reached the top of the chat. Here's a cookie 🍪</h3></div>: <></>}
          {messages?.map((message, index) => message ? <Message key={message.id} primary={isPrimary(message, index)} avatar={message.author.avatar} timestamp={message.created_at} author={message.author.username}>{message.content}</Message> : <></>)}
          <Waypoint onEnter={() => setTracking(true)} onLeave={() => setTracking(false)}/>
          <div key='buffer' className={styles.buffer} />
        </div>
        <div className={styles.box}>
          <form onSubmit={(event) => {
            event.preventDefault()
            if (message !== '') {
              sendMessage(message)
              setMessage('')
            }
          }}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              type='text'
              placeholder={`Say something${adjective}...`}
            />
          </form>
        </div>
      </div>
    </Suspense>
  )
}

export default Chat
