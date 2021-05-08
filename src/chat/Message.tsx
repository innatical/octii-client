import React, { FC, memo, Suspense, useCallback, useMemo } from 'react'
import styles from './Message.module.scss'
import dayjs from 'dayjs'
import dayjsUTC from 'dayjs/plugin/utc'
import dayjsCalendar from 'dayjs/plugin/calendar'
import {
  faCopy,
  faTrashAlt,
  IconDefinition,
  faPencilAlt
} from '@fortawesome/pro-solid-svg-icons'
import { Plugins } from '@capacitor/core'
import { Auth } from '../authentication/state'
import { useMutation, useQuery } from 'react-query'
import {
  clientGateway,
  MessageTypes,
  ModalTypes,
  Permissions
} from '../utils/constants'
import Context from '../components/Context'
import useMarkdown from '@innatical/markdown'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCatSpace,
  faTimesCircle,
  faUserNinja,
  faUserShield,
  faHeart
} from '@fortawesome/pro-duotone-svg-icons'
import { ErrorBoundary } from 'react-error-boundary'
import { UI } from '../state/ui'
import { patchMessage } from './remote'
import Editor from '../components/Editor'
import { Chat } from './state'
import { withHistory } from 'slate-history'
import { withReact } from 'slate-react'
import { withMentions } from '../utils/slate'
import { createEditor } from 'slate'
import Invite from './embeds/Invite'
import Mention from './Mention'
import { Permission } from '../utils/permissions'
import { useUser } from '../user/state'
import File from './embeds/File'
import { ExportedEncryptedMessage } from '@innatical/inncryption/dist/types'
import {
  decryptMessage,
  importEncryptedMessage,
  importPublicKey
} from '@innatical/inncryption'
import { Keychain } from '../keychain/state'
import { getKeychain } from '../user/remote'

const { Clipboard } = Plugins
dayjs.extend(dayjsUTC)
dayjs.extend(dayjsCalendar)

type Embed = {
  embed: React.ReactNode
  link: React.ReactNode
}

const isEmbed = (element: any): element is Embed => {
  return typeof element === 'object' && element['embed'] && element['link']
}

const EditBox: FC<{
  id: string
  content: string
  onDismiss: () => void
}> = ({ id, content, onDismiss }) => {
  const { token } = Auth.useContainer()
  const editor = useMemo(
    () => withHistory(withReact(withMentions(createEditor()))),
    []
  )
  return (
    <div className={styles.innerInput}>
      <Editor
        id={'editMessage'}
        editor={editor}
        userMentions={false}
        className={styles.editor}
        inputClassName={styles.input}
        mentionsClassName={styles.mentionsWrapper}
        newLines
        onDismiss={onDismiss}
        emptyEditor={[
          {
            children: [{ text: content }]
          }
        ]}
        onEnter={async (content) => {
          if (!token || !content) return
          onDismiss()
          await patchMessage(id, content, token)
        }}
      />

      <FontAwesomeIcon icon={faTimesCircle} onClick={() => onDismiss()} />
    </div>
  )
}

const MessageView: FC<{
  id: string
  authorID: string
  createdAt: string
  updatedAt: string
  content?: string | ExportedEncryptedMessage
  type: MessageTypes
  primary: boolean
}> = memo(({ id, authorID, createdAt, primary, content, type }) => {
  const auth = Auth.useContainer()

  const { keychain } = Keychain.useContainer()
  const { data: otherKeychain } = useQuery(
    ['keychain', authorID, auth.token],
    getKeychain
  )

  const { data: publicKey } = useQuery(
    ['publicKey', otherKeychain?.signing.publicKey],
    async (_: string, key: number[]) => {
      if (!key) return undefined
      return await importPublicKey(key, 'signing')
    }
  )

  const { data: messageContent } = useQuery(
    ['messageContent', content, publicKey, keychain],
    async () => {
      if (typeof content === 'string') {
        return content
      } else {
        if (!publicKey || !keychain || !content) return ''
        const decrypted = await decryptMessage(
          keychain,
          publicKey,
          importEncryptedMessage(content)
        )

        if (decrypted.verified) {
          return decrypted.message
        } else {
          return '*The sender could not be verified...*'
        }
      }
    }
  )
  const uiStore = UI.useContainer()
  const { editingMessageID, setEditingMessageID } = Chat.useContainerSelector(
    ({ editingMessageID, setEditingMessageID }) => ({
      editingMessageID,
      setEditingMessageID
    })
  )
  const ui = UI.useContainerSelector(({ setModal }) => ({
    setModal
  }))
  const { hasPermissions } = Permission.useContainer()
  const [deleteMessage] = useMutation(
    async () =>
      (
        await clientGateway.delete(`/messages/${id}`, {
          headers: { Authorization: auth.token }
        })
      ).data
  )
  const user = useUser(authorID)
  const getItems = useCallback(() => {
    const items: {
      text: string
      icon: IconDefinition
      danger: boolean
      onClick: any
    }[] = [
      {
        text: 'Copy Message',
        icon: faCopy,
        danger: false,
        onClick: async () => {
          await Clipboard.write({
            string: messageContent
          })
        }
      },
      {
        text: 'Copy ID',
        icon: faCopy,
        danger: false,
        onClick: async () => {
          await Clipboard.write({
            string: id
          })
        }
      }
    ]

    if (authorID === auth.id) {
      items.push({
        text: 'Edit Message',
        icon: faPencilAlt,
        danger: false,
        onClick: () => setEditingMessageID(id)
      })
    }
    if (hasPermissions([Permissions.MANAGE_MESSAGES]) || authorID === auth.id) {
      items.push({
        text: 'Delete Message',
        icon: faTrashAlt,
        danger: true,
        onClick: () =>
          uiStore.setModal({
            name: ModalTypes.DELETE_MESSAGE,
            props: {
              type: 'message',
              onConfirm: async () => {
                await deleteMessage()
                uiStore.clearModal()
              },
              onDismiss: () => uiStore.clearModal()
            }
          })
      })
    }
    return items
  }, [
    authorID,
    deleteMessage,
    id,
    uiStore,
    auth.id,
    setEditingMessageID,
    hasPermissions,
    messageContent
  ])
  const output = useMarkdown(messageContent!, {
    bold: (str, key) => <strong key={key}>{str}</strong>,
    italic: (str, key) => <i key={key}>{str}</i>,
    underlined: (str, key) => <u key={key}>{str}</u>,
    strikethough: (str, key) => <del key={key}>{str}</del>,
    link: (str, key) => {
      const link = (
        <a
          href={str}
          key={`${key}-href`}
          target='_blank'
          rel='noopener noreferrer'
        >
          {str}
        </a>
      )
      if (Invite.isInvite(str)) {
        return {
          link: <></>,
          embed: (
            <span key={key}>
              <ErrorBoundary fallbackRender={() => <Invite.ErrorEmbed />}>
                <Suspense fallback={<Invite.Placeholder />}>
                  <Invite.Embed url={str} />
                </Suspense>
              </ErrorBoundary>
            </span>
          )
        }
      } else if (File.isFile(str)) {
        console.log(str)
        return {
          link: <></>,
          embed: <File.Embed key={key} url={str} />
        }
      } else {
        return link
      }
    },
    codeblock: (str, key) => <code key={key}>{str}</code>,
    custom: [
      [
        /<@([A-Za-z0-9-]+?)>/g,
        (str, key) => (
          <span key={key}>
            <ErrorBoundary fallbackRender={() => <span>&lt;@{str}&gt;</span>}>
              <Suspense fallback={<span>@unknown</span>}>
                <Mention.User
                  userID={str}
                  selected={type !== MessageTypes.NORMAL}
                />
              </Suspense>
            </ErrorBoundary>
          </span>
        )
      ],
      [
        /<#([A-Za-z0-9-]+?)>/g,
        (str, key) => (
          <span key={key}>
            <ErrorBoundary fallbackRender={() => <span>&lt;@{str}&gt;</span>}>
              <Suspense fallback={<span>#unknown</span>}>
                <Mention.Channel
                  channelID={str}
                  selected={type !== MessageTypes.NORMAL}
                />
              </Suspense>
            </ErrorBoundary>
          </span>
        )
      ]
    ]
  })
  const main = useMemo(
    () => output.map((element) => (isEmbed(element) ? element.link : element)),
    [output]
  )
  const embeds = useMemo(
    () => output.filter(isEmbed).map((element) => element.embed),
    [output]
  )
  return (
    <Context.Wrapper
      title={`${user?.username || 'Unknown'}'s Message`}
      message={messageContent}
      key={id}
      items={getItems()}
    >
      <div
        className={`${styles.message} ${
          primary || type !== MessageTypes.NORMAL ? styles.primary : ''
        } ${
          type === MessageTypes.MEMBER_ADDED
            ? styles.joined
            : type === MessageTypes.MEMBER_REMOVED
            ? styles.left
            : ''
        }`}
      >
        {primary && type === MessageTypes.NORMAL && (
          <div
            className={styles.avatar}
            style={{ backgroundImage: `url(${user?.avatar})` }}
          />
        )}
        <div
          className={`${styles.content} ${
            !(primary || type !== MessageTypes.NORMAL) ? styles.spacer : ''
          }`}
        >
          {primary && type === MessageTypes.NORMAL && (
            <h2
              key='username'
              onClick={() =>
                ui.setModal({
                  name: ModalTypes.PREVIEW_USER,
                  props: { id: user?.id }
                })
              }
            >
              <span>
                {user?.username}
                {user?.id === '987d59ba-1979-4cc4-8818-7fe2f3d4b560' ? (
                  <FontAwesomeIcon
                    className={styles.badge}
                    icon={faUserNinja}
                  />
                ) : user?.id === '99343aac-2301-415d-aece-17b021d3a459' ? (
                  <FontAwesomeIcon className={styles.badge} icon={faCatSpace} />
                ) : user?.id === '71df7ca2-93c5-4a8a-be6e-f068fd91d68e' ? (
                  <FontAwesomeIcon className={styles.badge} icon={faHeart} />
                ) : (
                  user?.discriminator === 0 && (
                    <FontAwesomeIcon
                      className={styles.badge}
                      icon={faUserShield}
                    />
                  )
                )}
              </span>
              <span className={styles.time}>
                {dayjs.utc(createdAt).local().calendar()}
              </span>
            </h2>
          )}
          {editingMessageID === id ? (
            <EditBox
              id={id}
              content={messageContent!}
              onDismiss={() => setEditingMessageID(undefined)}
            />
          ) : (
            <p key={id}>{main}</p>
          )}
          {embeds.length > 0 ? embeds : <></>}
        </div>
      </div>
    </Context.Wrapper>
  )
})

const MessagePlaceholder: FC = () => {
  const username = useMemo(() => Math.floor(Math.random() * 6) + 3, [])
  const message = useMemo(() => Math.floor(Math.random() * 10) + 8, [])
  const isPrimary = useMemo(() => Math.floor(Math.random() * 1000000) + 1, [])
  return (
    <div
      className={`${styles.placeholder} ${
        isPrimary % 2 === 0 ? styles.primary : ''
      }`}
    >
      {isPrimary % 2 === 0 && <div className={styles.avatar} />}
      <div
        className={`${styles.content} ${
          isPrimary % 2 !== 0 ? styles.spacer : ''
        }`}
      >
        <div className={styles.user}>
          {isPrimary % 2 === 0 && (
            <div
              className={styles.username}
              style={{ width: `${username}rem` }}
            />
          )}
          {isPrimary % 2 === 0 && <div className={styles.date} />}
        </div>
        <div className={styles.message} style={{ width: `${message}rem` }} />
      </div>
    </div>
  )
}

const Message = { View: MessageView, Placeholder: MessagePlaceholder, Mention }

export default Message
