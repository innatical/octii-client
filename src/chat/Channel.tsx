import React, { Suspense, useMemo, useState } from 'react'
import styles from './Channel.module.scss'
import { useQuery } from 'react-query'
import { InternalChannelTypes, Permissions } from '../utils/constants'
import { Auth } from '../authentication/state'
import { useDropArea, useMedia } from 'react-use'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft,
  faHashtag,
  faPhone,
  faPhoneSlash,
  faTimes,
  faUserPlus
} from '@fortawesome/pro-solid-svg-icons'
import { useHistory, useParams } from 'react-router-dom'
import Box from './Box'
import Typing from '../state/typing'
import { Call } from '../state/call'
import Button from '../components/Button'
import { ChannelResponse, getChannel } from './remote'
import Messages from './Messages'
import { fetchManyUsers, getUser } from '../user/remote'
import { Chat } from './state'
import { Permission } from '../utils/permissions'
import AddParticipant from './AddParticipant'

const TypingIndicator = ({ channelID }: { channelID: string }) => {
  const { id } = Auth.useContainer()
  const { typing } = Typing.useContainer()
  const users = useMemo(
    () =>
      typing[channelID]?.filter((userID) => userID[0] !== id).map((t) => t[1]),
    [typing, channelID, id]
  )
  if (users?.length > 0) {
    return (
      <p className={styles.typing}>
        {users?.length === 1
          ? `${users[0]} is typing...`
          : users?.length === 2
          ? `${users.join(' and ')} are typing...`
          : users?.length === 3
          ? `${users.slice(0, 2).join(', ')} and ${
              users[users.length - 1]
            } are typing...`
          : users?.length > 3
          ? 'A lot of people are typing...'
          : ''}
      </p>
    )
  } else return <div className={styles.typingEmpty} />
}

const PrivateName = ({ id }: { id?: string }) => {
  const { token } = Auth.useContainer()
  const user = useQuery(['users', id, token], getUser)
  return (
    <div className={styles.title}>
      {user.data?.username}#
      {user.data?.discriminator === 0
        ? 'inn'
        : user.data?.discriminator.toString().padStart(4, '0')}
      <p className={styles.status}>{user.data?.status}</p>
    </div>
  )
}

const Header = ({
  participants,
  type,
  channel
}: {
  participants?: string[]
  type: InternalChannelTypes
  channel?: ChannelResponse
}) => {
  const { token } = Auth.useContainer()
  const { data: users } = useQuery(
    ['users', participants ?? [], token],
    fetchManyUsers
  )

  return (
    <div className={styles.title}>
      {type === InternalChannelTypes.PrivateChannel ? (
        <PrivateName id={participants?.[0]} />
      ) : type === InternalChannelTypes.GroupChannel ? (
        users?.map((i) => i.username).join(', ')
      ) : (
        channel?.name
      )}
      <p className={styles.status}>{channel?.description}</p>
    </div>
  )
}

const CommunityChannelView = () => {
  const { id, channelID } = useParams<{ id: string; channelID: string }>()
  return (
    <ChannelView
      type={InternalChannelTypes.CommunityChannel}
      channelID={channelID}
      communityID={id}
    />
  )
}

const supportedFiles = new Set(['image/png', 'image/gif', 'image/jpeg'])
const ChannelView = ({
  type,
  channelID,
  participants,
  communityID,
  conversationID
}: {
  type: InternalChannelTypes
  channelID: string
  participants?: string[]
  communityID?: string
  conversationID?: string
}) => {
  const { setUploadDetails } = Chat.useContainer()
  const { token, id } = Auth.useContainer()
  const call = Call.useContainer()
  const { typing } = Typing.useContainer()
  const typingUsers = useMemo(
    () =>
      typing[channelID]?.filter((userID) => userID[0] !== id).map((t) => t[1]),
    [typing, channelID, id]
  )

  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const isMobile = useMedia('(max-width: 740px)')
  const history = useHistory()

  const channel = useQuery(['channel', channelID, token], getChannel)
  const { hasPermissions } = Permission.useContainer()
  const [bond] = useDropArea({
    onFiles: (files) => {
      if (supportedFiles.has(files[0].type))
        setUploadDetails({
          status: 'pending',
          file: files[0]
        })
    }
  })

  return (
    <Suspense fallback={<ChannelPlaceholder />}>
      <div className={styles.chat} {...bond}>
        <div className={styles.header}>
          {isMobile ? (
            <div
              className={styles.icon}
              onClick={() => {
                if (isMobile) {
                  if (type === InternalChannelTypes.CommunityChannel) {
                    history.push(`/communities/${channel.data?.community_id}`)
                  } else {
                    history.push('/')
                  }
                }
              }}
            >
              <FontAwesomeIcon
                className={styles.backButton}
                icon={faChevronLeft}
              />
            </div>
          ) : (
            <div className={styles.icon}>
              <FontAwesomeIcon icon={faHashtag} />
            </div>
          )}
          <Suspense fallback={<></>}>
            <Header
              type={type}
              participants={participants}
              channel={channel.data}
            />
          </Suspense>
          <div className={styles.buttonGroup}>
            {type === InternalChannelTypes.PrivateChannel ||
            type === InternalChannelTypes.GroupChannel ? (
              <Button
                type='button'
                onClick={() => {
                  setShowAddParticipant(!showAddParticipant)
                }}
              >
                <FontAwesomeIcon
                  icon={showAddParticipant ? faTimes : faUserPlus}
                />
              </Button>
            ) : (
              <></>
            )}
            {type === InternalChannelTypes.PrivateChannel && participants ? (
              call.otherUserID !== participants[0] && [0] && (
                <Button
                  type='button'
                  onClick={async () => {
                    if (call.callState !== 'idle') call.endCall()
                    await call.ringUser(participants[0])
                  }}
                >
                  {call.callState !== 'idle' ? (
                    <FontAwesomeIcon icon={faPhoneSlash} />
                  ) : (
                    <FontAwesomeIcon icon={faPhone} />
                  )}
                </Button>
              )
            ) : (
              <></>
            )}
          </div>
          {showAddParticipant && (
            <AddParticipant
              isPrivate={type === InternalChannelTypes.PrivateChannel}
              groupID={
                type === InternalChannelTypes.GroupChannel
                  ? conversationID
                  : undefined
              }
            />
          )}
          <div className={styles.bg} />
        </div>
        <Suspense fallback={<Messages.Placeholder />}>
          {channel.data ? (
            <Messages.View channel={channel.data} />
          ) : (
            <Messages.Placeholder />
          )}
        </Suspense>
        <Box.View
          {...{
            hasPermission:
              type === InternalChannelTypes.CommunityChannel
                ? hasPermissions([Permissions.SEND_MESSAGES])
                : true,
            participants,
            channelID,
            typingIndicator: typingUsers?.length > 0,
            communityID
          }}
        />
        <TypingIndicator channelID={channelID} />
      </div>
    </Suspense>
  )
}

const ChannelPlaceholder = () => {
  const username = useMemo(() => Math.floor(Math.random() * 6) + 3, [])
  const status = useMemo(() => Math.floor(Math.random() * 10) + 8, [])
  return (
    <div className={styles.placeholder}>
      <div className={styles.header}>
        <div className={styles.icon} />
        <div className={styles.title}>
          <div className={styles.name} style={{ width: `${username}rem` }} />
          <div className={styles.status} style={{ width: `${status}rem` }} />
        </div>
      </div>
      <Messages.Placeholder />
      <br />
      <Box.Placeholder />
    </div>
  )
}

const Channel = {
  View: ChannelView,
  Community: CommunityChannelView,
  Placeholder: ChannelPlaceholder
}

export default Channel
