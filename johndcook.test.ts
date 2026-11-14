import { afterEach, describe, expect, it } from 'vitest'
import { parserLoader, resetPage, visit } from '#scraper-test'

// The parser, evaluated with the helpers it is injected with, as a scrape runs it.
const load = parserLoader(__dirname)

afterEach(resetPage)

describe('listings', () => {
  it.each([
    ['johndcook.js', 'parseJohnDCook', 'https://www.johndcook.com/blog/'],
    ['johndcook.js', 'parseJohnDCook', 'https://www.johndcook.com/blog/category/math/'],
    ['johndcook.js', 'parseJohnDCook', 'https://www.johndcook.com/blog/tag/python/'],
  ])('%s marks a page it does not read, leaving its content and links to the default parse (%s %s)', async (file, name, url) => {
    const parse = load(file, [name])[name]
    visit(url, '')
    expect(await parse()).toEqual({ listing: true })
  })

  it.each([
    ['johndcook.js', 'parseJohnDCook', 'https://www.johndcook.com/blog/2026/11/02/projective-plane/', '<article class="post"><h1 class="entry-title">Post</h1><div class="entry-content"><p>Words</p></div></article>'],
  ])('%s leaves a post to read (%s %s)', (file, name, url, body) => {
    visit(url, body)
    const parsed = load(file, [name])[name]()
    expect(parsed.title).toBe('Post')
    expect(parsed.listing).toBeUndefined()
  })
})

describe('sites\' own searches', () => {
  it.each([
    ['johndcook.js', 'parseJohnDCook', 'https://www.johndcook.com/blog/?s=fourier', '<article class="post"><h1 class="entry-title"><a href="https://one.example/" rel="bookmark">One</a></h1></article>'],
  ])('%s reads its blog\'s search as a listing of the posts it found', async (file, parser, url, body) => {
    visit(url, body)
    expect(await load(file, [parser])[parser]()).toEqual({ listing: true, links: [{ url: 'https://one.example/', score: 1 }] })
  })
})

describe('blogs', () => {
  it('reads a John D. Cook post as its title and body', () => {
    const { parseJohnDCook } = load('johndcook.js', ['parseJohnDCook'])
    visit('https://www.johndcook.com/blog/2026/11/02/projective-plane/', `
      <article class="post"><header><h1 class="entry-title">Making peace with the projective plane</h1></header>
        <div class="entry-content"><p>In my newsletter.</p><blockquote><p>Projective space.</p></blockquote></div></article>`)
    expect(parseJohnDCook()).toEqual({ title: 'Making peace with the projective plane', content: ['In my newsletter.', 'Projective space.'] })
  })
})

describe('authors', () => {
  const head = (name: string, url: string) => `<post author="${name}" author-url="${url}">`

  it.each([
    ['johndcook.js', 'parseJohnDCook', 'https://www.johndcook.com/blog/2026/11/03/a/', 'https://www.johndcook.com/blog/author/ann/', `
      <article class="post"><h1 class="entry-title">A</h1><span class="byline"> by <span class="author vcard"><a class="url fn n" href="https://www.johndcook.com/blog/author/ann/">Ann</a></span></span>
        <div class="entry-content"><p>Text.</p></div></article>`],
  ])('heads a post of %s with its author, and links to their page', (file, parser, url, authorUrl, body) => {
    visit(url, body)
    expect(load(file, [parser])[parser]()).toEqual({ title: 'A', content: [head('Ann', authorUrl), 'Text.'], links: [{ url: authorUrl, score: 1 }] })
  })
})

describe('author pages', () => {
  const ranked = (...urls: string[]) => ({ listing: true, links: urls.map((url, rank) => ({ url, score: 1 / (1 + rank / 10) })) })

  it.each([
    ['johndcook.js', 'parseJohnDCook', 'https://www.johndcook.com/blog/author/john/', 'https://www.johndcook.com/blog/2026/11/03/one/', `
      <article class="post"><h2 class="entry-title"><a href="https://www.johndcook.com/blog/2026/11/03/one/">One</a></h2><div class="entry-content"><p>Excerpt.</p></div></article>`],
  ])('links an author\'s page of %s to each of their works', (file, parser, url, work, body) => {
    visit(url, body)
    expect(load(file, [parser])[parser]()).toEqual(ranked(work))
  })
})
