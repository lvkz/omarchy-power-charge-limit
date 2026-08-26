function clampIndex(index, length) {
  if (length <= 0) return 0
  return Math.max(0, Math.min(length - 1, index))
}

function selectProfileIndex(index, delta, profiles) {
  var values = Array.isArray(profiles) ? profiles : []
  if (values.length === 0) return 0
  return clampIndex(index + delta, values.length)
}

function parseKeyValue(raw) {
  var next = {}
  var lines = String(raw || "").split("\n")
  for (var i = 0; i < lines.length; i++) {
    var idx = lines[i].indexOf("\t")
    if (idx <= 0) continue
    next[lines[i].substring(0, idx)] = lines[i].substring(idx + 1).trim()
  }
  return next
}

function parseChargeLimit(raw) {
  var match = String(raw || "").trim().match(/^(?:\d{1,3}-)?(\d{1,3})%?$/)
  if (!match) return 0
  var limit = Number(match[1])
  return limit >= 1 && limit <= 100 ? limit : 0
}

var chargeControlDir = "/sys/class/power_supply/BAT0"

function chargeControlProbeCommand() {
  return ["/usr/bin/test", "-f", chargeControlDir + "/charge_control_end_threshold"]
}

function thresholdReadCommand() {
  return [
    "/usr/bin/cat",
    chargeControlDir + "/charge_control_start_threshold",
    chargeControlDir + "/charge_control_end_threshold"
  ]
}

function formatThresholdOutput(raw) {
  var nums = String(raw || "").match(/\d+/g)
  if (!nums || nums.length < 2) return ""
  var start = Number(nums[0])
  var end = Number(nums[1])
  if (start < 1 || start > 100 || end < 1 || end > 100 || start >= end) return ""
  return start + "-" + end + "%"
}

function chargeLimitCommand(limit, onBattery) {
  var start = chargeControlDir + "/charge_control_start_threshold"
  var end = chargeControlDir + "/charge_control_end_threshold"
  // start < end must hold at every point or the kernel rejects the write:
  // lowering writes start first, raising writes end first.
  if (limit === 80) return ["pkexec", "/usr/bin/sh", "-c", "echo 75 > " + start + " && echo 80 > " + end]
  if (limit === 100 && !onBattery) return ["pkexec", "/usr/bin/sh", "-c", "echo 100 > " + end + " && echo 96 > " + start]
  return []
}

function parseProfiles(raw, previousIndex) {
  var lines = String(raw || "").split("\n")
  var list = []
  var active = ""
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim()
    if (!line) continue
    var parts = line.split("\t")
    list.push(parts[0])
    if (parts[1] === "1") active = parts[0]
  }
  return {
    profiles: list,
    activeProfile: active,
    profileIndex: clampIndex(previousIndex || 0, list.length)
  }
}

function profileIcon(name) {
  if (name === "power-saver") return "󰌪"
  if (name === "balanced") return "󰊚"
  if (name === "performance") return "󰓅"
  return "󰂄"
}

function batteryFraction(device) {
  return device && device.isPresent ? Math.max(0, Math.min(1, device.percentage)) : 0
}

function chargeThresholdActive(device, onBattery, states) {
  var d = device || {}
  var s = states || {}
  if (!(d && d.isPresent && !onBattery)) return false

  var fraction = batteryFraction(d)
  if (d.state === s.Discharging) return false
  if (d.state === s.PendingCharge) return true
  if (d.state === s.FullyCharged && fraction < 0.99) return true
  if (d.state !== s.Charging || fraction >= 0.99) return false

  return Number(d.changeRate || 0) <= 0.2 || Number(d.timeToFull || 0) >= 8 * 60 * 60
}

function batteryIcon(device, onBattery, states) {
  var d = device || {}
  if (!d.isPresent) return ""

  var chargingIcons = ["󰢜", "󰂆", "󰂇", "󰂈", "󰢝", "󰂉", "󰢞", "󰂊", "󰂋", "󰂅"]
  var defaultIcons = ["󰁺", "󰁻", "󰁼", "󰁽", "󰁾", "󰁿", "󰂀", "󰂁", "󰂂", "󰁹"]
  var index = Math.max(0, Math.min(9, Math.floor(d.percentage * 10)))
  var threshold = chargeThresholdActive(d, onBattery, states)

  if (threshold) return defaultIcons[index]
  if (d.state === states.FullyCharged) return "󰂅"
  if (!onBattery) return chargingIcons[index]
  return defaultIcons[index]
}

function modeLabel(device, onBattery, states) {
  var d = device || {}
  if (!d.isPresent) return ""

  var percentage = d.isPresent ? d.percentage : 0
  if (chargeThresholdActive(d, onBattery, states)) return "Threshold"
  if (onBattery) return "On battery"
  if (!onBattery && percentage >= 1) return "Fully charged"
  return "Charging"
}

if (typeof module !== "undefined") {
  module.exports = {
    clampIndex: clampIndex,
    selectProfileIndex: selectProfileIndex,
    parseKeyValue: parseKeyValue,
    parseChargeLimit: parseChargeLimit,
    chargeControlProbeCommand: chargeControlProbeCommand,
    thresholdReadCommand: thresholdReadCommand,
    formatThresholdOutput: formatThresholdOutput,
    chargeLimitCommand: chargeLimitCommand,
    parseProfiles: parseProfiles,
    profileIcon: profileIcon,
    batteryFraction: batteryFraction,
    chargeThresholdActive: chargeThresholdActive,
    batteryIcon: batteryIcon,
    modeLabel: modeLabel
  }
}
