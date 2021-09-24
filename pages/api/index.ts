// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import Metascaper, { Metadata } from 'metascraper'
import metascaperTitle from 'metascraper-title'
import metascaperImage from 'metascraper-image'
import metascaperDescription from 'metascraper-description'
import fetch from 'node-fetch'

const metascaper = Metascaper([
  metascaperTitle(), 
  metascaperImage(),
  metascaperDescription()
])

type Data = {
  error?: string
  data?: Metadata
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const url = req.query.url

  if (typeof url !== 'string') {
    res.status(400).json({ error: 'url is required' })
    return
  }
  
  const html = await fetch(url).then(res => res.text())
  const data = await metascaper({ url, html })
  res.json({data})
}
