import { stat } from 'node:fs/promises'
import path from 'node:path'

import { getCollection, type CollectionEntry } from 'astro:content'

type BlogCollection = CollectionEntry<'blog'>[]

export const prod = import.meta.env.PROD

const BLOG_CONTENT_DIR = path.resolve(process.cwd(), 'src/content/blog')
const DEFAULT_DATE_VALUE = new Date(0).valueOf()
const publishDateCache = new Map<string, Date>()

function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function humanizeSegment(segment: string) {
  return decodeSegment(segment).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function getFallbackTitle(id: string) {
  const segments = id.split('/').filter(Boolean)
  if (!segments.length) return 'Untitled'

  const lastSegment = segments[segments.length - 1]
  const raw = lastSegment === 'index' && segments.length > 1 ? segments[segments.length - 2] : lastSegment
  const title = humanizeSegment(raw)
  return (title || 'Untitled').slice(0, 60)
}

function stripMarkdown(input: string) {
  return input
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getFallbackDescription(body: string, title: string) {
  const lines = body
    .split('\n')
    .map((line) => stripMarkdown(line))
    .filter(Boolean)
  const firstLine = lines[0] ?? title
  return firstLine.slice(0, 160)
}

async function resolvePublishDateFromFile(id: string) {
  const cached = publishDateCache.get(id)
  if (cached) return cached

  const candidates = [
    path.join(BLOG_CONTENT_DIR, `${id}.md`),
    path.join(BLOG_CONTENT_DIR, `${id}.mdx`),
    path.join(BLOG_CONTENT_DIR, id, 'index.md'),
    path.join(BLOG_CONTENT_DIR, id, 'index.mdx')
  ]

  for (const filePath of candidates) {
    try {
      const fileStat = await stat(filePath)
      publishDateCache.set(id, fileStat.mtime)
      return fileStat.mtime
    } catch {
      // Keep trying next candidate.
    }
  }

  const fallback = new Date(DEFAULT_DATE_VALUE)
  publishDateCache.set(id, fallback)
  return fallback
}

async function normalizeBlogEntry(post: CollectionEntry<'blog'>) {
  const body = post.body ?? ''
  const title = post.data.title.trim() || getFallbackTitle(post.id)
  const description = post.data.description.trim() || getFallbackDescription(body, title)

  const hasValidPublishDate =
    !Number.isNaN(post.data.publishDate.valueOf()) && post.data.publishDate.valueOf() !== DEFAULT_DATE_VALUE
  const publishDate = hasValidPublishDate
    ? post.data.publishDate
    : await resolvePublishDateFromFile(post.id)
  const updatedDate = post.data.updatedDate ?? publishDate

  return {
    ...post,
    data: {
      ...post.data,
      title,
      description,
      publishDate,
      updatedDate
    }
  }
}

/** Note: this function filters out draft posts based on the environment */
export async function getBlogCollection() {
  const collections = await getCollection('blog', ({ data }) => {
    return prod ? !data.draft : true
  })

  return (await Promise.all(collections.map((post) => normalizeBlogEntry(post)))) as BlogCollection
}

function getYearFromCollection(collection: CollectionEntry<'blog'>): number | undefined {
  const dateStr = collection.data.updatedDate ?? collection.data.publishDate
  return dateStr ? new Date(dateStr).getFullYear() : undefined
}

export function groupCollectionsByYear(collections: BlogCollection): [number, CollectionEntry<'blog'>[]][] {
  const collectionsByYear = collections.reduce((acc, collection) => {
    const year = getYearFromCollection(collection)
    if (year !== undefined) {
      if (!acc.has(year)) {
        acc.set(year, [])
      }
      acc.get(year)!.push(collection)
    }
    return acc
  }, new Map<number, BlogCollection>())

  return Array.from(
    collectionsByYear.entries() as IterableIterator<[number, CollectionEntry<'blog'>[]]>
  ).sort((a, b) => b[0] - a[0])
}

export function sortMDByDate(collections: BlogCollection): BlogCollection {
  return collections.sort((a, b) => {
    const aDate = new Date(a.data.updatedDate ?? a.data.publishDate ?? 0).valueOf()
    const bDate = new Date(b.data.updatedDate ?? b.data.publishDate ?? 0).valueOf()
    return bDate - aDate
  })
}

/** Note: This function doesn't filter draft posts, pass it the result of getBlogCollection above to do so. */
export function getAllTags(collections: BlogCollection) {
  return collections.flatMap((collection) => [...collection.data.tags])
}

/** Note: This function doesn't filter draft posts, pass it the result of getBlogCollection above to do so. */
export function getUniqueTags(collections: BlogCollection) {
  return [...new Set(getAllTags(collections))]
}

/** Note: This function doesn't filter draft posts, pass it the result of getBlogCollection above to do so. */
export function getUniqueTagsWithCount(collections: BlogCollection): [string, number][] {
  return [
    ...getAllTags(collections).reduce(
      (acc, tag) => acc.set(tag, (acc.get(tag) || 0) + 1),
      new Map<string, number>()
    )
  ].sort((a, b) => b[1] - a[1])
}
