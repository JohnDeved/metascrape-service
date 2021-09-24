// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch'
import cheerio from 'cheerio'

type Data = {
  error?: string
  meta?: {[key: string]: string}
  'jsonLD'?: {[key: string]: string}
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

  const html = await fetch(url).then(res => res.text()).catch(() => '')
  
  if (!html) {
    res.status(400).json({ error: 'could not load url' })
    return
  }

  const $ = cheerio.load(html)

  const meta: Data['meta'] = {}

  $('meta').each((i, el) => { 
    const { name, content, property } = el.attribs
    if (name && content) {
      meta[name] = content
    }
    if (property && content) {
      meta[property] = content
    }
  })

  const jsonLDStr = $('[type="application/ld+json"]').html()
  
  let jsonLD: Data['jsonLD']

  if (jsonLDStr) {
    try {
      jsonLD = JSON.parse(jsonLDStr)
    } catch {}
  }

  res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate')
  res.json({meta, jsonLD})
}
