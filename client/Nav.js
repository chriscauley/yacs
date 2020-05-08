import React from 'react'
import { Link } from 'react-router-dom'
import css from '@unrest/css'

export default function Nav() {
  return (
    <header className={css.nav.outer()}>
      <section className={css.nav.section()}>
        <Link to="/" className={css.nav.brand()}>
          YACS
        </Link>
      </section>
      <section className={css.nav.section('flex items-center')}>
        <a
          className="text-blue-500 fa fa-github"
          href="https://github.com/chriscauley/yacs/"
        />
      </section>
    </header>
  )
}
