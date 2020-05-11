import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter, Route } from 'react-router-dom'

import ConfigForm from './ConfigForm'
import Home from './Home'
import Nav from './Nav'

const App = () => {
  return (
    <div className="container mx-auto">
      <HashRouter>
        <Nav />
        <div className="p-4" style={{ minHeight: 'calc(100vh - 230px)' }}>
          <Route exact path="/" component={Home} />
        </div>
      </HashRouter>
      <ConfigForm />
    </div>
  )
}

const domContainer = document.querySelector('#react-app')
ReactDOM.render(<App />, domContainer)
