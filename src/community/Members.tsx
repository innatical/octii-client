import { faBoxOpen, faChevronLeft } from '@fortawesome/pro-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AnimatePresence, motion } from 'framer-motion'
import moment from 'moment'
import React, { Suspense, useRef, useState } from 'react'
import { useInfiniteQuery } from 'react-query'
import { useHistory, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Waypoint } from 'react-waypoint'
import { Auth } from '../authentication/state'
import Loader from '../components/Loader'
import { clientGateway } from '../utils/constants'
import styles from './Members.module.scss'

interface MemberType {
  id: string
  user: {
    id: string
    username: string
    avatar: string
    discriminator: number
  }
  created_at: string
  updated_at: string
}

const Member = (member: MemberType) => {
  return (
    <motion.tr
      initial={{
        opacity: 0
      }}
      animate={{
        opacity: 1,
        transition: { y: { stiffness: 1000, velocity: -100 } }
      }}
      exit={{
        opacity: 0
      }}
    >
      <td>
        {member.user?.username}#
        {member.user?.discriminator === 0
          ? 'inn'
          : member.user?.discriminator.toString().padStart(4, '0')}
      </td>
      <td>{moment.utc(member.created_at).local().calendar()}</td>
    </motion.tr>
  )
}

export const Members = () => {
  const history = useHistory()
  const { token } = Auth.useContainer()
  const { id } = useParams<{ id: string }>()
  const fetchMembers = async (_: string, community: string, date: string) => {
    return (
      await clientGateway.get<MemberType[]>(
        `/communities/${community}/members`,
        {
          headers: { Authorization: token },
          params: { created_at: date }
        }
      )
    ).data
  }
  const { data, canFetchMore, fetchMore } = useInfiniteQuery<MemberType[], any>(
    ['members', id],
    fetchMembers,
    {
      getFetchMore: (last) => {
        return last.length < 25 ? undefined : last[last.length - 1]?.created_at
      }
    }
  )

  const members = data?.flat() || []

  const ref = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const isMobile = useMedia('(max-width: 940px)')
  return (
    <Suspense fallback={<Loader />}>
      <div className={styles.members}>
        {members.length > 0 ? (
          <div className={styles.membersBody}>
            <h2 onClick={() => isMobile && history.push(`/communities/${id}`)}>
              {isMobile && (
                <div
                  className={styles.icon}
                  onClick={() => isMobile && history.push('/settings')}
                >
                  <FontAwesomeIcon
                    className={styles.backButton}
                    icon={faChevronLeft}
                  />
                </div>
              )}
              Members
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Joined At</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {members.map(
                    (member) => member && <Member {...member} key={member.id} />
                  )}
                  {loading && (
                    <div key='loader' className={styles.loader}>
                      <h5>Loading more...</h5>
                    </div>
                  )}
                  {!loading && canFetchMore ? (
                    <Waypoint
                      bottomOffset={20}
                      onEnter={async () => {
                        try {
                          if (!ref.current || !ref.current.scrollHeight) return
                          setLoading(true)
                          const oldHeight = ref.current.scrollHeight
                          const oldTop = ref.current.scrollTop
                          await fetchMore()
                          ref.current.scrollTop = ref?.current?.scrollHeight
                            ? ref.current.scrollHeight - oldHeight + oldTop
                            : 0
                        } finally {
                          setLoading(false)
                        }
                      }}
                    />
                  ) : (
                    <></>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className={styles.membersEmpty}>
              <FontAwesomeIcon size={'5x'} icon={faBoxOpen} />
              <br />
              <h2>No members in this community!</h2>
              <br />
              <br />
            </div>
          </>
        )}
      </div>
    </Suspense>
  )
}
