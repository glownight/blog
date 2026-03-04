#!/usr/bin/env node
import * as crypto from 'crypto'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function colorLog(message: string, color: string = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`)
}

function successLog(message: string): void {
  colorLog(`[ok] ${message}`, colors.green)
}

function infoLog(message: string): void {
  colorLog(`[info] ${message}`, colors.cyan)
}

function warningLog(message: string): void {
  colorLog(`[warn] ${message}`, colors.yellow)
}

function errorLog(message: string): void {
  colorLog(`[error] ${message}`, colors.red)
}

function updateLog(message: string): void {
  colorLog(`[update] ${message}`, colors.magenta)
}

function newLog(message: string): void {
  colorLog(`[new] ${message}`, colors.blue)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface ArticleMetadata {
  hash: string
  publishDate: string
  updatedDate: string
}

interface ArticleDatabase {
  [filename: string]: ArticleMetadata
}

interface ParsedFrontmatter {
  frontmatter: string
  body: string
  title: string | null
  description: string | null
  publishDate: string | null
  updatedDate: string | null
}

const BLOG_DIR = path.join(__dirname, '../src/content/blog')
const DATABASE_FILE = path.join(__dirname, 'blog-metadata.json')
const REQUIRED_FRONTMATTER_FIELDS = ['title', 'description', 'publishDate', 'updatedDate'] as const

function calculateHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex')
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function normalizePathForDb(input: string): string {
  return input.replace(/\\/g, '/')
}

function toRelativePath(filePath: string): string {
  return normalizePathForDb(path.relative(BLOG_DIR, filePath))
}

function normalizeNewlines(content: string): string {
  return content.replace(/\r\n/g, '\n')
}

function unquote(raw: string): string {
  const trimmed = raw.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function yamlString(value: string): string {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `"${escaped}"`
}

function isValidDateInput(value: string | null): value is string {
  if (!value) return false
  return !Number.isNaN(new Date(value).valueOf())
}

function extractField(frontmatter: string, field: string): string | null {
  const regex = new RegExp(`^${field}:\\s*(.+)$`, 'm')
  const match = frontmatter.match(regex)
  return match ? unquote(match[1]) : null
}

function parseFrontmatter(content: string): ParsedFrontmatter {
  const normalized = normalizeNewlines(content)
  const lines = normalized.split('\n')

  // No frontmatter: keep file body as-is and let caller initialize required fields.
  if (lines[0] !== '---') {
    return {
      frontmatter: '',
      body: normalized,
      title: null,
      description: null,
      publishDate: null,
      updatedDate: null
    }
  }

  let frontmatterEnd = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      frontmatterEnd = i
      break
    }
  }

  if (frontmatterEnd === -1) {
    throw new Error('Frontmatter not properly closed')
  }

  const frontmatter = lines.slice(1, frontmatterEnd).join('\n')
  const body = lines.slice(frontmatterEnd + 1).join('\n')

  return {
    frontmatter,
    body,
    title: extractField(frontmatter, 'title'),
    description: extractField(frontmatter, 'description'),
    publishDate: extractField(frontmatter, 'publishDate'),
    updatedDate: extractField(frontmatter, 'updatedDate')
  }
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getDefaultTitle(relativePath: string): string {
  const filename = path.basename(relativePath, path.extname(relativePath))
  return filename.trim() || 'Untitled'
}

function getDefaultDescription(body: string, title: string): string {
  const normalizedBody = normalizeNewlines(body)
  const lines = normalizedBody
    .split('\n')
    .map((line) => stripMarkdown(line))
    .filter(Boolean)
  const firstMeaningful = lines[0] ?? title
  return firstMeaningful.length > 150 ? `${firstMeaningful.slice(0, 147)}...` : firstMeaningful
}

function buildFrontmatter(
  frontmatter: string,
  title: string,
  description: string,
  publishDate: string,
  updatedDate: string
): string {
  const lines = frontmatter ? frontmatter.split('\n') : []
  const preserved = lines.filter((line) => {
    const key = line.split(':')[0]?.trim()
    return !REQUIRED_FRONTMATTER_FIELDS.includes(key as (typeof REQUIRED_FRONTMATTER_FIELDS)[number])
  })

  return [
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
    `publishDate: ${publishDate}`,
    `updatedDate: ${updatedDate}`,
    ...preserved
  ].join('\n')
}

function buildMarkdownWithFrontmatter(frontmatter: string, body: string): string {
  const normalizedBody = normalizeNewlines(body)
  const separatedBody = normalizedBody.startsWith('\n') ? normalizedBody : `\n${normalizedBody}`
  return `---\n${frontmatter}\n---${separatedBody}`
}

async function collectMarkdownFilesRecursively(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFilesRecursively(fullPath)))
      continue
    }
    if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

async function loadDatabase(): Promise<ArticleDatabase> {
  try {
    const content = await fs.readFile(DATABASE_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    infoLog('Creating new metadata database...')
    return {}
  }
}

async function saveDatabase(database: ArticleDatabase): Promise<void> {
  await fs.writeFile(DATABASE_FILE, JSON.stringify(database, null, 2))
}

function getLegacyKey(relativePath: string): string {
  return path.basename(relativePath)
}

function resolveDatabaseKey(
  database: ArticleDatabase,
  relativePath: string,
  canUseLegacyKey: boolean
): { key: string; entry: ArticleMetadata | undefined; migrated: boolean } {
  if (database[relativePath]) {
    return { key: relativePath, entry: database[relativePath], migrated: false }
  }

  if (!canUseLegacyKey) {
    return { key: relativePath, entry: undefined, migrated: false }
  }

  const legacyKey = getLegacyKey(relativePath)
  const legacyEntry = database[legacyKey]
  if (!legacyEntry) {
    return { key: relativePath, entry: undefined, migrated: false }
  }

  database[relativePath] = legacyEntry
  delete database[legacyKey]
  return { key: relativePath, entry: database[relativePath], migrated: true }
}

function classifyResult(
  hadEntryBefore: boolean,
  hashBefore: string | undefined,
  hashAfter: string
): 'new' | 'changed' | 'unchanged' {
  if (!hadEntryBefore) return 'new'
  if (!hashBefore || hashBefore !== hashAfter) return 'changed'
  return 'unchanged'
}

async function processArticle(
  filePath: string,
  relativePath: string,
  database: ArticleDatabase,
  canUseLegacyKey: boolean
): Promise<'new' | 'changed' | 'unchanged'> {
  const rawContent = await fs.readFile(filePath, 'utf-8')
  const normalizedRawContent = normalizeNewlines(rawContent)
  const stat = await fs.stat(filePath)
  const parsed = parseFrontmatter(normalizedRawContent)

  const title = (parsed.title || '').trim() || getDefaultTitle(relativePath)
  const description = (parsed.description || '').trim() || getDefaultDescription(parsed.body, title)
  const publishDate = isValidDateInput(parsed.publishDate)
    ? parsed.publishDate
    : formatDate(stat.mtime)
  const initialUpdatedDate = isValidDateInput(parsed.updatedDate) ? parsed.updatedDate : publishDate

  const { key, entry, migrated } = resolveDatabaseKey(database, relativePath, canUseLegacyKey)
  if (migrated) {
    infoLog(`Migrated metadata key: ${getLegacyKey(relativePath)} -> ${relativePath}`)
  }

  const hashBefore = entry?.hash
  const now = new Date()
  let updatedDate = initialUpdatedDate

  // Compare hash with a normalized representation (required fields guaranteed).
  const normalizedFrontmatterForHash = buildFrontmatter(
    parsed.frontmatter,
    title,
    description,
    publishDate,
    updatedDate
  )
  const normalizedContentForHash = buildMarkdownWithFrontmatter(
    normalizedFrontmatterForHash,
    parsed.body
  )
  const normalizedHash = calculateHash(normalizedContentForHash)

  if (entry && entry.hash !== normalizedHash) {
    updatedDate = formatDate(now)
  }

  const finalFrontmatter = buildFrontmatter(
    parsed.frontmatter,
    title,
    description,
    publishDate,
    updatedDate
  )
  const finalContent = buildMarkdownWithFrontmatter(finalFrontmatter, parsed.body)
  const finalHash = calculateHash(finalContent)

  if (finalContent !== normalizedRawContent) {
    await fs.writeFile(filePath, finalContent)
  }

  database[key] = {
    hash: finalHash,
    publishDate,
    updatedDate
  }

  const result = classifyResult(Boolean(entry), hashBefore, finalHash)

  if (result === 'new') {
    newLog(`${relativePath} indexed`)
  } else if (result === 'changed') {
    updateLog(`${relativePath} updated`)
  }

  return result
}

async function main(): Promise<void> {
  colorLog('\nStarting blog metadata sync...', colors.bright)

  try {
    await fs.mkdir(path.dirname(DATABASE_FILE), { recursive: true })
    const database = await loadDatabase()

    const markdownFilePaths = await collectMarkdownFilesRecursively(BLOG_DIR)
    const relativePaths = markdownFilePaths.map((filePath) => toRelativePath(filePath))

    const basenameCounts = relativePaths.reduce(
      (acc, relativePath) => {
        const basename = path.basename(relativePath)
        acc.set(basename, (acc.get(basename) ?? 0) + 1)
        return acc
      },
      new Map<string, number>()
    )

    infoLog(
      `Found ${markdownFilePaths.length} markdown files under src/content/blog (recursive scan enabled)`
    )

    let processedCount = 0
    let changedCount = 0
    let newCount = 0

    for (const filePath of markdownFilePaths) {
      const relativePath = toRelativePath(filePath)
      const canUseLegacyKey = (basenameCounts.get(path.basename(relativePath)) ?? 0) === 1

      try {
        const result = await processArticle(filePath, relativePath, database, canUseLegacyKey)
        if (result === 'new') newCount++
        if (result === 'changed') changedCount++
      } catch (error) {
        errorLog(`Error processing ${relativePath}: ${error}`)
      }

      processedCount++
    }

    const existingFiles = new Set(relativePaths)
    let deletedCount = 0
    for (const filename of Object.keys(database)) {
      if (!existingFiles.has(filename)) {
        warningLog(`Removing deleted file from metadata database: ${filename}`)
        delete database[filename]
        deletedCount++
      }
    }

    await saveDatabase(database)

    colorLog('\nSummary:', colors.bright)
    infoLog(`Total files processed: ${processedCount}`)
    if (newCount > 0) newLog(`New files: ${newCount}`)
    if (changedCount > 0) updateLog(`Updated files: ${changedCount}`)
    if (deletedCount > 0) warningLog(`Deleted files: ${deletedCount}`)

    successLog('Blog metadata sync completed.')
    infoLog(`Metadata database: ${DATABASE_FILE}`)
  } catch (error) {
    errorLog(`Fatal error: ${error}`)
    process.exit(1)
  }
}

const isDirectRun = process.argv[1] ? path.resolve(process.argv[1]) === __filename : false

if (isDirectRun) {
  void main()
}

export { main as updateBlogDates }
