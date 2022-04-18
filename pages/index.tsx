import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <h4>simple meta scrapping service</h4>
      <code className={styles.code}>/api?url={'<'}targetUrl{'>'}</code>

      <p style={{paddingTop: "35px"}}>custom scrapes can be defined as such:</p>
      <code className={styles.code}>/api?url={'<'}targetUrl{'>'}&allImgurImags=image[src*=imgur.com]</code>
    </div>
  )
}

export default Home
