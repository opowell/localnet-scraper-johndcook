// A post (/blog/2026/11/02/projective-plane/) reads as its title, a head with its author and each paragraph, heading,
// list item, code block and picture of it. An author's page (/blog/author/john/) links to each post it shows. The
// blog's home page, categories and tags are not read but are marked as listings.
function parseJohnDCook(_profileId) {
  if (!location.hostname.endsWith('johndcook.com')) {
    return null
  }
  // A search's results (/blog/?s=fourier) are posts, each titled by a link to it, in the search's order.
  if (location.pathname.includes('/author/') || new URLSearchParams(location.search).has('s')) {
    return listingOf(linkUrls('article.post .entry-title a'))
  }
  if (/^\/blog\/(?:(?:category|tag)\/.*)?$/.test(location.pathname)) {
    return { listing: true }
  }
  const post = document.querySelector('article.post')
  const body = post?.querySelector('.entry-content')
  if (!body) {
    return null
  }
  return withAuthors({
    title: post.querySelector('.entry-title')?.innerText.trim() || document.title,
    content: textBlocks(body, { lists: true, skip: '.sharedaddy, .jp-relatedposts' }),
  }, linkedAuthors('article.post .byline a'))
}

// The parser a scrape calls.
registerParser(parseJohnDCook)
