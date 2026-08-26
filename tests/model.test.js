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

const SYSFS = "/sys/class/power_supply/BAT0"

test("chargeControlProbeCommand checks for sysfs threshold support", () => {
  assert.deepEqual(Model.chargeControlProbeCommand(), [
    "/usr/bin/test",
    "-f",
    `${SYSFS}/charge_control_end_threshold`
  ])
})

test("thresholdReadCommand reads start then end so output formats as start-end", () => {
  assert.deepEqual(Model.thresholdReadCommand(), [
    "/usr/bin/cat",
    `${SYSFS}/charge_control_start_threshold`,
    `${SYSFS}/charge_control_end_threshold`
  ])
})

test("formatThresholdOutput builds a threshold string from cat output", () => {
  assert.equal(Model.formatThresholdOutput("75\n80\n"), "75-80%")
  assert.equal(Model.formatThresholdOutput("96\n100"), "96-100%")
})

test("formatThresholdOutput rejects partial and invalid output", () => {
  assert.equal(Model.formatThresholdOutput(""), "")
  assert.equal(Model.formatThresholdOutput("80\n"), "")
  assert.equal(Model.formatThresholdOutput("cat: no such file"), "")
  assert.equal(Model.formatThresholdOutput("80\n75"), "")
  assert.equal(Model.formatThresholdOutput("0\n120"), "")
})

test("chargeLimitCommand restores the 75-80 limit, writing start before end", () => {
  const expected = [
    "pkexec",
    "/usr/bin/sh",
    "-c",
    `echo 75 > ${SYSFS}/charge_control_start_threshold && echo 80 > ${SYSFS}/charge_control_end_threshold`
  ]
  assert.deepEqual(Model.chargeLimitCommand(80, false), expected)
  assert.deepEqual(Model.chargeLimitCommand(80, true), expected)
})

test("chargeLimitCommand only permits a full charge on AC, writing end before start", () => {
  assert.deepEqual(Model.chargeLimitCommand(100, false), [
    "pkexec",
    "/usr/bin/sh",
    "-c",
    `echo 100 > ${SYSFS}/charge_control_end_threshold && echo 96 > ${SYSFS}/charge_control_start_threshold`
  ])
  assert.deepEqual(Model.chargeLimitCommand(100, true), [])
  assert.deepEqual(Model.chargeLimitCommand(60, false), [])
})
