# Omarchy Power + TLP

An upstream-tracking clone of Omarchy's power panel with two TLP battery-care controls:

- **80%** restores the configured TLP charge thresholds (75–80% on this ThinkPad).
- **100% once** temporarily applies the vendor full-charge thresholds.

The existing battery statistics, percentage toggle, and power-profile controls are preserved.

## Requirements

- Omarchy 4.0 or newer
- TLP 1.10 or newer
- A battery exposed as `BAT0` with start and stop threshold support
- An active Polkit authentication agent

## Install

```bash
omarchy plugin add https://github.com/lvkz/omarchy-power-tlp.git --enable
```

Changing a charge limit opens an administrator authentication prompt. The 100% action is disabled while the charger is disconnected. TLP restores its configured thresholds after a reboot.

## Update

```bash
omarchy plugin update lvkz.power
```

## Upstream synchronization

The `upstream-power` branch contains the unmodified history extracted from `basecamp/omarchy`'s `shell/plugins/panels/power` directory. To incorporate new upstream work:

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
