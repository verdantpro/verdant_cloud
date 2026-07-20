---
title: wlan vs wifi
date: 2026-07-19
description: wlan vs wifi, and why security came last
status: draft
tags:
  - networking
---
a wlan, [wireless local area network](https://en.wikipedia.org/wiki/Wireless_LAN), is a network of devices connected wirelessly within a limited geographic area. these areas can include: homes, schools, office buildings, or campuses. radio waves are used to move data between client devices and a central connection point, typically an access point that bridges to a wired network and the internet. with wlans, the primary goals are flexibility and mobility.

[wifi](https://en.wikipedia.org/wiki/Wi-Fi) is the most popular way to implement a wlan. the name is sometimes expanded as "wireless fidelity", but that is essentially marketing verbiage. the [wifi alliance](https://www.wi-fi.org/) has stated that the term doesn't officially stand for anything.

keep in mind that wlan is the general concept, while wifi specifically refers to 802.11-based wlans that have been certified by the wifi alliance. all wifi networks are wlans, but not all wlans are wifi.

## historical background
### 19th century origins
wireless networking is ultimately radio-frequency communication, and the science behind it comes from the 1800s. [michael faraday](https://en.wikipedia.org/wiki/Michael_Faraday) established electromagnetic induction, [james clerk maxwell](https://en.wikipedia.org/wiki/James_Clerk_Maxwell) mathematically predicted electromagnetic waves, [heinrich rudolf hertz](https://en.wikipedia.org/wiki/Heinrich_Hertz) proved they could be transmitted and received (the unit of frequency is named after him), and [guglielmo marconi](https://en.wikipedia.org/wiki/Guglielmo_Marconi) turned the theory into practical long-distance radio.

wireless technologies have been evolving for over a century. modern wifi just applies these rf fundamentals to digital data.

### wwii era
the us military used wireless technology heavily during world war ii. many technologies still in use today were patented during that era. worth remembering: [frequency-hopping spread spectrum (fhss)](https://en.wikipedia.org/wiki/Frequency-hopping_spread_spectrum), co patented by [hedy lamarr](https://en.wikipedia.org/wiki/Hedy_Lamarr) and [george antheil](https://en.wikipedia.org/wiki/George_Antheil), was a wwii era concept for jam resistant, harder to intercept communication. spread spectrum stuck around: classic [bluetooth](https://en.wikipedia.org/wiki/Bluetooth) still frequency-hops (adaptive fhss today), and the original 1997 802.11 offered both fhss and [dsss](https://en.wikipedia.org/wiki/Direct-sequence_spread_spectrum).

### the first wireless network
the university of hawaii developed the first wireless data network, [alohanet](https://en.wikipedia.org/wiki/ALOHAnet), in 1971, to provide communications between the hawaiian islands. alohanet introduced the random-access just transmit and retry on collision approach to a shared medium. that idea evolved into [csma/cd](https://en.wikipedia.org/wiki/Carrier-sense_multiple_access_with_collision_detection) (ethernet) and [csma/ca](https://en.wikipedia.org/wiki/Carrier-sense_multiple_access_with_collision_avoidance) (carrier sense multiple access with collision avoidance), the medium access method wifi still uses today. we still can't reliably detect collisions on a radio medium, so we try to avoid them instead.

### commercial wlan emerges
low speed wireless data networking began appearing in the 1990s. the [ieee](https://en.wikipedia.org/wiki/Institute_of_Electrical_and_Electronics_Engineers) (institute of electrical and electronics engineers) ratified the original [802.11 standard](https://en.wikipedia.org/wiki/IEEE_802.11) in 1997; it ran at 2mbps max, very slow by today's standards. early adopters were warehousing and manufacturing environments, places where running cable was impractical.

### usability first, security last
home networks were the first to widely implement wireless. this adoption pattern seriously shaped the technology's development and future implementations. since the priority was ease and simplicity, security suffered. wifi's culture of making things easy is why many vulnerabilities exist. small companies adopted wireless over the following years; while medium and large businesses were much slower adopters, largely because of recurring security issues and weaknesses.

convenience drove wifi adoption, and security was repeatedly bolted on afterward. from [WEP](https://en.wikipedia.org/wiki/Wired_Equivalent_Privacy) to [WPA3](https://en.wikipedia.org/wiki/Wi-Fi_Protected_Access), each generation patched flaws in the last.

## standards bodies vs. the wifi alliance
these two are often mixed up, but they do different jobs. the ieee creates and maintains the 802.11 standards for wireless communication, with two critical caveats:
- the standards don't address every possible implementation detail
- manufacturers may not conform to all of a standard

these gaps caused real interoperability problems in early wireless devices: gear from different vendors wouldn't reliably communicate.

the wifi alliance is an industry group that solves the interoperability gap through certification and branding. in 1999 a group of companies formed the wireless ethernet compatibility alliance (weca). their mission was to test products, certify interoperability, and promote wireless technology. in 2002 the weca renamed itself the wifi alliance. the alliance owns and controls the wifi certified trademark/logo. the logo is a registered trademark permitted only on equipment that has passed testing, giving purchasers assurance that the product will interoperate with other wireless devices.

the ieee writes the rules; the wifi alliance certifies that products actually follow them and play nicely together.

## regulatory bodies
rf frequencies are usable worldwide because the spectrum exists everywhere, but if everyone used whatever frequency at will, interference would eventually disable all communication. rules exist to keep the rf spectrum organized and open for fair use — but "who writes the rules" is not one global org with three regional offices.

| Body | Full name | Role |
|------|-----------|------|
| **ITU-R** | International Telecommunication Union – Radiocommunication Sector | Global coordination (a **United Nations** specialized agency); frequency allocations across regions |
| **FCC** | Federal Communications Commission | **National regulator** for the united states (other countries have their own) |
| **CEPT** | European Conference of Postal and Telecommunications Administrations | Coordinates spectrum policy among european administrations |
| **ETSI** | European Telecommunications Standards Institute | **Standards body** — writes harmonized technical standards that european regulation references; *not* a spectrum regulator itself |

[itu-r](https://en.wikipedia.org/wiki/ITU-R) coordinates spectrum and frequency assignments across three distinct regions and tries to keep one country's rf signals from interfering with another.
- region 1: europe, africa, and northern asia
- region 2: north and south america
- region 3: southern asia and australasia

the [fcc](https://en.wikipedia.org/wiki/Federal_Communications_Commission) regulates frequencies, channels, and transmission power in the us. in europe, **national authorities** set the legal limits, coordinated through [cept](https://en.wikipedia.org/wiki/European_Conference_of_Postal_and_Telecommunications_Administrations); [etsi](https://www.etsi.org/) produces the technical standards those rules often point at. treating etsi as "the european fcc" collapses two different jobs.

the legal channels, allowed frequencies, and max transmit power differ by region. this affects which channels an ap can use, whether channels like the 5ghz [dfs](https://en.wikipedia.org/wiki/Dynamic_frequency_selection) band require radar avoidance, and how much power your device is allowed to output. when capturing or testing, your card's regulatory domain setting genuinely changes what channels you can see and use.

## where the standard is now
| Wi-Fi name | 802.11 amendment | ~Year | Bands | Headline feature |
|-----------|------------------|-------|-------|------------------|
| (legacy) | 802.11 | 1997 | 2.4 GHz | 2 Mbps, the original |
| — | 802.11a / 802.11b | 1999 | 5 GHz / 2.4 GHz | up to 54 / 11 Mbps |
| Wi-Fi 3[^wifi3] | 802.11g | 2003 | 2.4 GHz | 54 Mbps, backward compatible |
| Wi-Fi 4 | 802.11n | 2009 | 2.4 & 5 GHz | MIMO, dual-band |
| Wi-Fi 5 | 802.11ac | 2013 | 5 GHz | wider channels, 256-QAM, MU-MIMO |
| Wi-Fi 6 / 6E | 802.11ax | 2019/2020 | 2.4, 5, +6 GHz (6E) | OFDMA, efficiency in dense environments |
| **Wi-Fi 7** | **[802.11be](https://en.wikipedia.org/wiki/IEEE_802.11be)** | **2024–25** | 2.4, 5, 6 GHz | 320 MHz channels, 4096-QAM, Multi-Link Operation (MLO) |
| **Wi-Fi 8** | **[802.11bn](https://en.wikipedia.org/wiki/IEEE_802.11bn)** (in draft) | **~2028 target** | 2.4, 5, 6 GHz | "Ultra High Reliability" — focus on consistency, roaming, multi-AP coordination rather than raw speed |

[^wifi3]: the alliance's generation numbers officially start at wi-fi 4 (802.11n); "wi-fi 3" for 802.11g is common but retroactive shorthand.

