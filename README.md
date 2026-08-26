# Omarchy Power + Charge Limit

An upstream-tracking clone of Omarchy's power panel with two battery-care controls, written directly to the kernel's charge-control sysfs interface (no TLP required):

- **80%** restores the 75–80% charge thresholds.
- **100%** applies the vendor full-charge thresholds (96–100%). The battery firmware persists thresholds, so the limit stays at 100% until you press **80%** again.

The existing battery statistics, percentage toggle, and power-profile controls are preserved.

## Requirements

- Omarchy 4.0 or newer
- A battery exposed as `BAT0` with `charge_control_start_threshold` and `charge_control_end_threshold` sysfs support
- An active Polkit authentication agent

## Install

```bash
omarchy plugin add https://github.com/lvkz/omarchy-power-tlp.git --enable
```

Changing a charge limit opens an administrator authentication prompt. The 100% action is disabled while the charger is disconnected.

## Update

Run one command from the development checkout to fetch the original Omarchy
power panel, merge and validate its changes, push the fork, and update the
installed plugin:

```bash
~/src/omarchy-power-tlp/sync-upstream
```

The development checkout must have only the expected `origin` and
`omarchy-upstream` remotes. The command stops before changing or pushing either
branch when the working tree is dirty, the remote configuration is unexpected,
upstream history was rewritten, the merge conflicts, or any verification
fails. A rejected push also leaves the local branches unchanged.

## Upstream synchronization

The `upstream-power` branch contains the unmodified history extracted from
`basecamp/omarchy`'s `shell/plugins/panels/power` directory. The sync command
performs this workflow automatically. The equivalent manual steps are:

```bash
git fetch omarchy-upstream quattro
split=$(git subtree split --prefix=shell/plugins/panels/power omarchy-upstream/quattro)
git branch -f upstream-power "$split"
git merge upstream-power
```

Resolve any overlap with the charge-limit section, then run the checks below before pushing.

## Verification

```bash
node --test tests/model.test.js
qmllint -I /usr/share/omarchy/shell Panel.qml
omarchy plugin validate .
```

## License

MIT. The original power panel is copyright David Heinemeier Hansson and the Omarchy contributors.
