import {
  faBell,
  faBellSlash,
  faEllipsisH,
  faHouseLeave
} from '@fortawesome/pro-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Integrations } from './Integrations'
import React, { useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useMutation, useQuery } from 'react-query'
import { useHistory, useRouteMatch } from 'react-router-dom'
import { Auth } from '../../authentication/state'
import { getCommunity } from '../remote'
import styles from './Sidebar.module.scss'
import { Channels } from './Channels'
import { clientGateway } from '../../constants'
import { useLocalStorage } from 'react-use'

export const Sidebar = () => {
  const auth = Auth.useContainer()
  const match = useRouteMatch<{ id: string }>('/communities/:id')
  const history = useHistory()
  const [menu, setMenu] = useState(false)
  const [muted, setMuted] = useLocalStorage<string[]>('muted_communities', [])
  const community = useQuery(
    ['community', match?.params.id, auth.token],
    getCommunity
  )

  const [leaveCommunity] = useMutation(
    async () =>
      (
        await clientGateway.post(
          `/communities/${match?.params.id}/leave`,
          {},
          {
            headers: { Authorization: auth.token }
          }
        )
      ).data
  )
  return (
    <div className={styles.wrapper}>
      <div className={styles.sidebar}>
        <div className={styles.container}>
          <h3>
            {community.data?.name ? community.data?.name : <Skeleton />}{' '}
            <span
              className={styles.leave}
              onClick={() => {
                setMenu(!menu)
              }}
            >
              <FontAwesomeIcon icon={faEllipsisH} />
            </span>
          </h3>
          {menu && (
            <div className={styles.menu}>
              <div
                className={styles.menuItem}
                onClick={() => {
                  if (!community.data?.id) return
                  if (muted?.includes(community.data.id))
                    setMuted(
                      muted.filter(
                        (communities) => communities !== community.data?.id
                      )
                    )
                  else setMuted([...(muted || []), community.data.id])
                }}
              >
                {community.data && muted?.includes(community.data.id) ? (
                  <>
                    Unmute Community <FontAwesomeIcon icon={faBell} />
                  </>
                ) : (
                  <>
                    Mute Community <FontAwesomeIcon icon={faBellSlash} />
                  </>
                )}
              </div>
              {community.data?.owner_id !== auth.id && (
                <div
                  className={`${styles.menuItem} ${styles.danger}`}
                  onClick={() => {
                    leaveCommunity()
                    history.push('/')
                  }}
                >
                  Leave <FontAwesomeIcon icon={faHouseLeave} />
                </div>
              )}
            </div>
          )}
          <Integrations community={community.data} />
          <Channels community={community.data} />
        </div>
      </div>
    </div>
  )
}