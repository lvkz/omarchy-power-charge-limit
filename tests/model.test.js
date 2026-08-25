const test = require("node:test")
const assert = require("node:assert/strict")

const Model = require("../Model.js")

test("parseChargeLimit returns the effective stop threshold", () => {
  assert.equal(Model.parseChargeLimit("75-80%"), 80)
  assert.equal(Model.parseChargeLimit("96-100%"), 100)
  assert.equal(Model.parseChargeLimit("80%"), 80)
})

test("parseChargeLimit rejects missing and malformed thresholds", () => {
  assert.equal(Model.parseChargeLimit(""), 0)
  assert.equal(Model.parseChargeLimit("unknown"), 0)
  assert.equal(Model.parseChargeLimit("75-101%"), 0)
  assert.equal(Model.parseChargeLimit("error-80%"), 0)
  assert.equal(Model.parseChargeLimit("foo-100"), 0)
})

test("chargeLimitCommand restores the configured 80 percent limit", () => {
  assert.deepEqual(Model.chargeLimitCommand(80, false), [
    "pkexec",
    "/usr/bin/tlp",
    "setcharge",
    "BAT0"
  ])
  assert.deepEqual(Model.chargeLimitCommand(80, true), [
    "pkexec",
    "/usr/bin/tlp",
    "setcharge",
    "BAT0"
  ])
})

test("chargeLimitCommand only permits a one-time full charge on AC", () => {
  assert.deepEqual(Model.chargeLimitCommand(100, false), [
    "pkexec",
    "/usr/bin/tlp",
    "fullcharge",
    "BAT0"
  ])
  assert.deepEqual(Model.chargeLimitCommand(100, true), [])
  assert.deepEqual(Model.chargeLimitCommand(60, false), [])
})
