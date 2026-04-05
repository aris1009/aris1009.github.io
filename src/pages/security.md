---
pagination:
  data: supportedLocales
  size: 1
  alias: locale
layout: page.njk
permalink: "{{ locale }}/security/"
eleventyComputed:
  title: "{{ 'nav.security' | i18n }}"
  description: "{{ 'security.description' | i18n }}"
---

{% if locale == 'en-us' %}
# Security Disclosure Policy

If you discover a security vulnerability in any of my services or infrastructure, I encourage you to report it responsibly. I take all reports seriously and will respond promptly.

## Contact

Send your report to **security@ariscodes.com**. **Unencrypted emails containing vulnerability details will be ignored.** Please encrypt your message using my PGP key.

## PGP Key

**Fingerprint:**
```
EEA1 FE96 F44D 31CB 169B  E924 96BA 5662 7A68 85D5
```

**Obtain my public key:**
- Download: [pgp.asc](https://ariscodes.com/pgp.asc)
- WKD auto-discovery: your email client may fetch it automatically when composing to security@ariscodes.com
- Keyserver: [keys.openpgp.org](https://keys.openpgp.org/search?q=security%40ariscodes.com)

## How to Encrypt Your Email

If you are not familiar with PGP, here is a quick guide using GPG:

```bash
# Import my public key
curl -sL https://ariscodes.com/pgp.asc | gpg --import

# Verify the fingerprint matches the one above
gpg --fingerprint security@ariscodes.com

# Encrypt your message
gpg --armor --encrypt --recipient security@ariscodes.com message.txt
```

Attach the resulting `.asc` file to your email, or paste the armored text into the message body.

**Important:** Include your own public key or a secure contact method so I can reply to you privately.

## Responsible Disclosure

- **Response time:** I will acknowledge your report within 72 hours.
- **Resolution timeline:** I aim to resolve confirmed vulnerabilities within 90 days of acknowledgement. If a fix requires more time, I will communicate a revised timeline.
- **Scope:** Any service hosted under `ariscodes.com` or `home.arpa`, including web applications, APIs, DNS, and infrastructure.
- **Out of scope:** Third-party services I do not control, social engineering, and denial of service attacks.
- **Safe harbor:** I will not pursue legal action against researchers who report vulnerabilities in good faith, follow this policy, and do not access or modify data belonging to others.

## Acknowledgement

If you wish, I am happy to credit you publicly for your discovery once the issue is resolved.
{% else %}

*{{ 'security.englishOnly' | i18n }}*

{% internalLink 'English', '/en-us/security/' %}

{% endif %}
