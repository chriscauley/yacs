import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter, Route } from 'react-router-dom'

import ConfigForm from './ConfigForm'
import Home from './Home'
import Nav from './Nav'
import Cos from './cos'

const App = () => {
  return (
    <>
      <HashRouter>
        <Nav />
        <div className="app-content">
          <Route exact path="/" component={Home} />
          <Route exact path="/cos/" component={Cos} />
        </div>
      </HashRouter>
      <ConfigForm />
    </>
  )
}

const domContainer = document.querySelector('#react-app')
ReactDOM.render(<App />, domContainer)
