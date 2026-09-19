<div align="center">

<img src="assets/icon.png" alt="MOFLASH" width="128" height="128" />

# MOFLASH

### Flash without Root.

**A native Android flashing & device management tool — everything done right on your phone.**

[![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://www.android.com/)
[![Android](https://img.shields.io/badge/Android-7.0%2B-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com/)
[![Kotlin](https://img.shields.io/badge/Kotlin-Compose-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)](https://kotlinlang.org/)
[![No Root](https://img.shields.io/badge/No--Root-Supported-00C853?style=for-the-badge&logo=checkmarx&logoColor=white)](#)

[![Stars](https://img.shields.io/github/stars/xskokernel/No-Root-Android-Flash-TooL?style=for-the-badge&color=yellow)](https://github.com/xskokernel/No-Root-Android-Flash-TooL/stargazers)
[![Forks](https://img.shields.io/github/forks/xskokernel/No-Root-Android-Flash-TooL?style=for-the-badge&color=blue)](https://github.com/xskokernel/No-Root-Android-Flash-TooL/network)

**[中文](README.md) | English**

</div>

---

## What is MOFLASH

Traditional flashing almost always requires Root or a computer: either gaining root and operating in a privileged environment, or connecting to a PC and typing commands.

**MOFLASH takes a different path — it leverages the phone's native USB Host capability to talk to devices directly**, running the required low-level communication entirely inside the app.

> **One phone + one OTG cable is all you need.**

---

## Highlights

| | Feature | Description |
|:---:|:---|:---|
| <img src="assets/icons/feat_noroot.png" width="56" height="56" style="vertical-align:middle" /> | **No Root required** | No bootloader unlock, no Magisk, no system partitions touched — ready out of the box |
| <img src="assets/icons/feat_nopc.png" width="56" height="56" style="vertical-align:middle" /> | **No PC required** | Phone-to-device directly, one OTG cable for the whole flow |
| <img src="assets/icons/feat_pipeline.png" width="56" height="56" style="vertical-align:middle" /> | **Complete pipeline** | 9008 deep flash, Fastboot, MTK, and ADB — four channels |
| <img src="assets/icons/feat_root.png" width="56" height="56" style="vertical-align:middle" /> | **Optional Root** | Root is an **option**, not a **barrier** — power users are welcome too |

---

## Features

### <img src="assets/icons/fn_9008.png" width="44" height="44" style="vertical-align:middle" /> 9008 / EDL Deep Flash
Connect directly to Qualcomm's 9008 / EDL port via USB Host for deep flashing.
Brick rescue, 9008 recovery, low-level restore — no Root needed.
> Supports partition flashing, batch extraction, batch erase, and full-disk operations.

### <img src="assets/icons/fn_fastboot.png" width="44" height="44" style="vertical-align:middle" /> Fastboot Flashing
Perform fastboot partition flashing, image writing, and device read/write without Root.
> Supports slot switching, partition preview, command line, and history.

### <img src="assets/icons/fn_mtk.png" width="44" height="44" style="vertical-align:middle" /> MTK TOOL (MediaTek Flashing)
A flashing tool for **MediaTek BROM / Preloader / DA** platforms.
Pick a DA (required) and a Preloader (optional), then read, write, and erase device partitions.
> Supports read / write / erase partitions, read-all, write-all, and one-click **scatter** flashing, and can generate a `scatter.txt` compatible with MTK SP Flash Tool.

### <img src="assets/icons/fn_adb.png" width="44" height="44" style="vertical-align:middle" /> ADB Device Management
Device detection, authorization, and day-to-day management — all in one app.
> Supports shell terminal, sideload, file operations, and quick reboot.

### <img src="assets/icons/fn_miui.png" width="44" height="44" style="vertical-align:middle" /> Xiaomi / Redmi Platform Flashing
Detects Xiaomi fastboot package structure, flashes selected partitions, handles erasing in one go.

### <img src="assets/icons/fn_oplus.png" width="44" height="44" style="vertical-align:middle" /> OPPO / OnePlus / realme Platform Flashing
Supports both Normal and Pure FastbootD modes, auto-scans images, and previews partitions.

### <img src="assets/icons/fn_payload.png" width="44" height="44" style="vertical-align:middle" /> Payload Extraction
Reads the partition list from `payload.bin`, extracts on demand, with multi-threading and search.

### <img src="assets/icons/fn_sn.png" width="44" height="44" style="vertical-align:middle" /> SN Patch
Patches Bootloader SN for a specified file.

### <img src="assets/icons/fn_ui.png" width="44" height="44" style="vertical-align:middle" /> Refined Experience
MIUI / HyperOS-style UI with liquid-glass effects, clear status feedback, and immersive logs.

---

## Requirements

| Item | Requirement |
|:---|:---|
| OS | Android 7.0 (API 24) or above |
| ABI | arm64-v8a |
| Hardware | **USB Host** (OTG) support |
| Permissions | USB access, storage, notifications, etc. (requested as needed) |

---

## Design Philosophy

> **Lower the barrier. Max out the capability.**

- **Zero-cost entry** — no root, no PC, no complex setup
- **Full coverage** — from deep-flash rescue to daily flashing and management in one chain
- **Power-user friendly** — No-Root first, Root-enhanced as an add-on; nobody settles

---

## Safety Notice

- Flashing is a **high-risk operation**. **Do not unplug or power off** during the process, or your device may be bricked.
- Always use firmware and images from **trusted sources**.
- **Back up** important data before proceeding.

---

## Acknowledgements

Thanks to everyone who supported this project with donations and testing.

> See the in-app "About → Acknowledgements" page for details.

---

<div align="center">

**No Root. One phone. Flash it.**

</div>