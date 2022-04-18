// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch'
import cheerio from 'cheerio'

type Data = {
  error?: string
  meta?: Record<string, string>
  favicons?: {
    rel: string
    href: string
  }[]
  jsonLD?: Record<string, string>
  json?: Record<string, string>
  headers?: Record<string, string[]>
  scrape?: Record<string, {
    text?: string
    html?: string | null
    attr?: Record<string, string>
  }[]>
  status?: {
    code: number
    message: string
  }
}

function cors (res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
}

function cache (res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=31536000, stale-while-revalidate')
}

function prefixRelativeUrls (url: string, baseUrl: string) {
  return url.replace(/^\/?/, `${baseUrl.replace(/\/$/, '')}/`)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  cors(res)
  cache(res)

  const { url, ...scrapes } = req.query

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

  let favicons: Data['favicons']
  $('link[rel*=icon]').each((i, el) => {
    if (!favicons) favicons = []
    favicons.push({
      rel: el.attribs.rel,
      href: prefixRelativeUrls(el.attribs.href, url),
    })
  })

  const jsonLDStr = $('[type="application/ld+json"]').html()
  
  let jsonLD: Data['jsonLD']
  if (jsonLDStr) {
    try {
      jsonLD = JSON.parse(jsonLDStr)
    } catch {}
  }

  let scrape: Data['scrape']
  if (scrapes) {
    for (const key in scrapes) {
      if (Object.prototype.hasOwnProperty.call(scrapes, key)) {
        const query = scrapes[key]
        if (typeof query !== 'string') continue
        if (!scrape) scrape = {}
        scrape[key] = $(query).map((i, el) => ({
          text: $(el).text(),
          html: $(el).html(),
          attr: $(el).attr(),
        })).get()
      }
    }
  }

  res.json({ scrape, favicons, meta, jsonLD, headers, status })
}
