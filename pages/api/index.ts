// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch'
import cheerio from 'cheerio'

type Data = {
  error?: string
  meta?: Record<string, string>
  jsonLD?: Record<string, string>
  json?: Record<string, string>
  headers?: Record<string, string[]>
  status?: {
    code: number
    message: string
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate')
  const url = req.query.url

  if (typeof url !== 'string') {
    res.status(400).json({ error: 'url is required' })
    return
  }

  const optionsRes = await fetch(url, { method: 'OPTIONS' }).catch(() => undefined)
  if (!optionsRes) {
    res.status(400).json({ error: 'could not load url' })
    return
  }

  const status = {
    code: optionsRes.status,
    message: optionsRes.statusText,
  }

  const targetRes = await fetch(url)
  const headers = targetRes.headers.raw()
  const html = await targetRes.text().catch(() => '')
  
  if (!html) {
    res.status(400).json({ error: 'could not url contents' })
    return
  }

  let json
  try {
    json = JSON.parse(html)
  } catch (e) {}

  if (json) {
    return res.json({
      json,
      status,
      headers,
    })
  }

  const $ = cheerio.load(html)

  let meta: Data['meta']
  $('meta').each((i, el) => { 
    const { name, content, property } = el.attribs
    if (!meta) meta = {}
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

  res.json({ meta, jsonLD, headers, status })
}
