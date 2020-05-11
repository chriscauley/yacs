import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter, Route } from 'react-router-dom'

import ConfigForm from './ConfigForm'
import Home from './Home'
import Sidebar from './Sidebar'
import Nav from './Nav'

const App = () => {
  return (
    <div className="container mx-auto">
      <HashRouter>
        <Nav />
        <div className="p-4" style={{ minHeight: 'calc(100vh - 230px)' }}>
          <div className="flex -mx-2">
            <div className="w-1/3 px-2">
              <Sidebar />
            </div>
            <div className="w-2/3 px-2">
              <Route exact path="/" component={Home} />
            </div>
          </div>
        </div>
      </HashRouter>
      <ConfigForm />
    </div>
  )
}

const domContainer = document.querySelector('#react-app')
ReactDOM.render(<App />, domContainer)
