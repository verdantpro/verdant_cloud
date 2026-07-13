---
title: justin walters
description: security practitioner — dfir, incident response, threat intelligence.
unlisted: true
---

Hands-on security practitioner experienced in incident response and digital forensics across 30+ ransomware and business-email-compromise engagements as a primary responder. Skilled at triaging and investigating intrusions across Windows and Linux, performing root-cause analysis from EDR telemetry, log sources, and forensic artifacts, and driving remediation. Strong in SIEM operations and log analysis (Splunk, Zeek), static and dynamic malware analysis, threat hunting, and MITRE ATT&CK-based threat correlation, with supporting depth in security engineering, systems hardening, and automation in Python, Go, and Bash. Background includes SIEM operations and continuous monitoring in a federal regulated environment (CMS / FISMA). Open-source contributor and accepted HOPE 26 speaker.

[email](mailto:verdantpro@proton.me) · [github](https://github.com/verdantpro)

## experience

### Ransomware Recovery Consulting Specialist — Halcyon.ai

*July 2024 – March 2026*

- Triaged, investigated, and responded to 30+ active ransomware and BEC intrusions as a primary responder, performing tactical review of EDR telemetry, log sources, and forensic artifacts to determine root cause and drive remediation across Windows and Linux environments.
- Performed static and dynamic malware analysis in sandbox environments (Any.run, VirusTotal) to characterize payloads, extract IOCs, and inform containment and eradication decisions.
- Investigated suspicious Microsoft 365 and Azure activity during cloud-hosted engagements, identifying account compromise and providing remediation guidance.
- Cataloged ransomware ransom notes and performed TLSH similarity analysis to correlate threat actor TTPs against the MITRE ATT&CK framework and identify malware variants and attribution.
- Deployed Velociraptor across 700+ endpoints for mass forensic collection; built and maintained IR infrastructure including Timesketch for timeline analysis.
- Performed feasibility analysis to determine whether affected files were corrupted or encrypted, informing high-stakes recovery and ransom-payment decisions; coordinated with crisis management teams, outside counsel, and cyber insurance partners, and built Python and Go tooling to automate repetitive collection and analysis tasks.

### Security Engineer — ECS Federal (supporting CMS)

*February 2023 – July 2024*

- Operated and tuned a Splunk SIEM and Gurucul GRA UEBA platform in a FISMA / NIST 800-53 regulated federal environment, monitoring alerts and supporting continuous monitoring; performed log analysis across a Linux and Windows fleet and automated configuration and hardening with Ansible.

### Implementation Engineer — DataBank

*March 2020 – February 2023*

- Deployed and configured customer network and security infrastructure including Cisco ASAv firewalls, VMware virtualization, and VLAN segmentation.
- Worked directly with customers to scope, deliver, and document infrastructure projects through the full engagement lifecycle.

## projects & community

**scope-recon** — async Rust CLI that queries 12 concurrent threat-intelligence APIs with a live TUI for rapid IOC enrichment. Also author of **cryptkeeper**, a cross-platform Go collection tool.

**Threat-intel & NSM homelab** — self-hosted OpenCTI + MISP threat-intelligence platform alongside a Proxmox NSM stack (Suricata, Wazuh SIEM, Zeek feeding Splunk, OPNsense, Nebula VPN). Ran live malware investigations (FormBook / XLoader, SmartApeSG, PhantomStealer) using Zeek logs in Splunk; provisioned VMs via Terraform.

**Speaking** — accepted speaker at HOPE 26 (NYC, August 2026): *"What They Delete, What They Miss: Anti-Forensics from the Incident Response Side of the Table."*

## skills

| area                     | tools                                                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DFIR & IR                | Incident response, alert triage, root-cause analysis, EDR telemetry & forensic artifact analysis, Velociraptor, Timesketch, KAPE, EZ Tools, static & dynamic malware analysis, MITRE ATT&CK |
| SIEM & monitoring        | Splunk, Zeek, Suricata, Wazuh, Gurucul GRA UEBA, SIEM operations & tuning, log analysis, threat hunting                                                                                    |
| Threat intelligence      | OpenCTI, MISP, IOC enrichment, TLSH similarity analysis, threat actor TTP correlation                                                                                                      |
| Engineering & automation | Python, Go, Bash, Rust, Git, Ansible, Terraform (IaC), Docker, system hardening                                                                                                            |
| Platforms & cloud        | Windows, Linux, Microsoft 365, Azure, AWS, GCP, Active Directory, networking (TCP/IP, DNS, VLANs, OPNsense)                                                                                |

## education

Coursework toward B.A. in English — University of Baltimore, 2008–2011
