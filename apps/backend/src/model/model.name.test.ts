import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizeModelName } from './model.name'

describe('normalizeModelName', () => {
  it('collapses case and whitespace variants to the same key', () => {
    const key = normalizeModelName('logo700')
    assert.equal(normalizeModelName('Logo 700'), key)
    assert.equal(normalizeModelName('logo 700'), key)
    assert.equal(normalizeModelName('  LOGO   700  '), key)
  })

  it('ignores punctuation', () => {
    const key = normalizeModelName('logo700')
    assert.equal(normalizeModelName('Logo-700'), key)
    assert.equal(normalizeModelName('Logo_700'), key)
    assert.equal(normalizeModelName('Logo.700'), key)
  })

  it('keeps genuinely different names distinct', () => {
    assert.notEqual(normalizeModelName('Logo 700'), normalizeModelName('Logo 600'))
    assert.notEqual(normalizeModelName('GOOSKY S2'), normalizeModelName('GOOSKY RS4'))
  })

  it('handles empty-ish input', () => {
    assert.equal(normalizeModelName(''), '')
    assert.equal(normalizeModelName('   '), '')
    assert.equal(normalizeModelName('---'), '')
  })
})
