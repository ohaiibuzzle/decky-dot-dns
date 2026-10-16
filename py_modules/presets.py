DNS_PRESETS = {
    "None": {
        "insecure_dns": "",
        "secure_dns": "",
        "insecure_dnsv6": "",
        "mode": "plain"
    },
    "CloudFlare": {
        "insecure_dns": "1.1.1.1",
        "secure_dns": "cloudflare-dns.com",
        "insecure_dnsv6": "2606:4700:4700::1111",
        "mode": "dot"
    },
    "Google": {
        "insecure_dns": "8.8.8.8",
        "secure_dns": "dns.google",
        "insecure_dnsv6": "2001:4860:4860::8888",
        "mode": "dot"
    },
    "Quad9": {
        "insecure_dns": "9.9.9.10",
        "secure_dns": "dns10.quad9.net",
        "insecure_dnsv6": "2620:fe::10",
        "mode": "dot"
    },
    "AdGuard": {
        "insecure_dns": "94.140.14.14",
        "secure_dns": "dns.adguard-dns.com",
        "insecure_dnsv6": "2a10:50c0::ad1:ff",
        "mode": "dot"
    },
    "Mullvad": {
        "insecure_dns": "194.242.2.2",
        "secure_dns": "dns.mullvad.net",
        "insecure_dnsv6": "2a07:e340::2",
        "mode": "dot"
    },
    "Control D": {
        "insecure_dns": "76.76.2.0",
        "secure_dns": "p0.freedns.controld.com",
        "insecure_dnsv6": "2606:1a40::",
        "mode": "dot"
    },
    "DNS4EU": {
        "insecure_dns": "86.54.11.100",
        "secure_dns": "unfiltered.joindns4.eu",
        "insecure_dnsv6": "2a13:1001::86:54:11:100",
        "mode": "dot"
    }
}
