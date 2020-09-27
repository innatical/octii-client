import React, { Suspense, useEffect } from 'react'
import { useMedia } from 'react-use'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { Authenticate } from './authentication/Authenticate'
import { PrivateRoute } from './authentication/PrivateRoute'
import { Conversations } from './conversation/Conversations'
import { Community } from './community/Community'
import Empty from './conversation/empty/Empty'
import { UI } from './uiStore'
import NewConversation from './conversation/NewConversation'
import { Plugins, KeyboardResize, KeyboardStyle } from '@capacitor/core'
import { isPlatform } from '@ionic/react'
import Settings from './settings/Settings'
import { Conversation } from './conversation/Conversation'
import { Sidebar } from './sidebar/Sidebar'
import { NewCommunity } from './sidebar/NewCommunity'
import { AnimatePresence } from 'framer-motion'
import Loader from './components/Loader'
import { Auth } from './authentication/state'
const { Keyboard, StatusBar } = Plugins

export const Router = () => {
  const uiStore = UI.useContainer()
  const auth = Auth.useContainer()
  const isDarkMode = useMedia('(prefers-color-scheme: dark)')
  useEffect(() => {
    if (isPlatform('capacitor')) {
      StatusBar.setOverlaysWebView({ overlay: true })
      Keyboard.setResizeMode({ mode: KeyboardResize.Native })
      Keyboard.setStyle({
        style: isDarkMode ? KeyboardStyle.Dark : KeyboardStyle.Light
      })
    }
  }, [isDarkMode])

  return (
    <BrowserRouter>
      <Route path='/authenticate' component={Authenticate} />
      <div id='main'>
        <AnimatePresence>
          {uiStore.modal === 'newConversation' && <NewConversation />}
          {uiStore.modal === 'newCommunity' && <NewCommunity />}
        </AnimatePresence>
        {uiStore.modal === 'settings' && <Settings />}

        {auth.authenticated && <Sidebar />}
        <Suspense fallback={<Loader />}>
          <Switch>
            <PrivateRoute
              path='/'
              component={() => (
                <>
                  <Conversations />
                  <Empty />
                </>
              )}
              exact
            />
            <PrivateRoute
              path='/conversations/:channelID'
              component={() => (
                <>
                  <Conversations />
                  <Conversation />
                </>
              )}
            />
            <PrivateRoute path='/communities/:id' component={Community} />
          </Switch>
        </Suspense>
      </div>
    </BrowserRouter>
  )
}
