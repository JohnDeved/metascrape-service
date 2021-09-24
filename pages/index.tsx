import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <h4>simple meta scrapping service</h4>
      <code className={styles.code}>/api?url={'<'}targetUrl{'>'}</code>
    </div>
  )
}

export default Home
