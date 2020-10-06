import React, { useState } from 'react'
import { General } from './General'
import Invites from './Invites'
import { Navbar } from './Navbar'
import { useMedia } from 'react-use'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft } from '@fortawesome/pro-solid-svg-icons'
import { useHistory } from 'react-router-dom'
import styles from './Settings.module.scss'

export const Settings = () => {
  const [selected, setSelected] = useState('general')
  const isMobile = useMedia('(max-width: 800px)')
  const history = useHistory()
  return (
    <div className={styles.settings}>
      <h2 onClick={() => isMobile && history.goBack()}>
        {isMobile && (
          <FontAwesomeIcon className={styles.backButton} icon={faChevronLeft} />
        )}
        Settings
      </h2>
      <Navbar selected={selected} setSelected={setSelected} />
      {selected === 'general' && <General />}
      {selected === 'invites' && <Invites />}
    </div>
  )
}