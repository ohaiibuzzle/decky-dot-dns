import os

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code repo
# and add the `decky-loader/plugin/imports` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky
import asyncio
from settings import SettingsManager
import logging

import resolved
import udns
from presets import DNS_PRESETS

SETTINGS_DIR = os.environ["DECKY_PLUGIN_SETTINGS_DIR"]

class Plugin:
    SettingsManager = SettingsManager(SETTINGS_DIR, "settings.json")

    async def push_custom_dns_override(self, insecure_dns: str, secure_dns: str, insecure_dnsv6: str, secure_dnsv6: str = "", mode: str = "plain"):
        # technically not always the case, but worst case it would just fail over to v4.
        secure_dnsv6 = secure_dnsv6 or secure_dns
        logging.info(f"Pushing custom dns override: insecure_dns={insecure_dns}, secure_dns={secure_dns}, insecure_dnsv6={insecure_dnsv6}, secure_dnsv6={secure_dnsv6}, mode={mode}")
        try:
            if mode in ("doh", "doq"):
                protocol = "https" if mode == "doh" else "quic"
                udns.start([(insecure_dns, secure_dns), (insecure_dnsv6, secure_dnsv6)], protocol)
                file_content = resolved.write_override(udns.LISTEN, use_dot=False)
            else:
                udns.stop()
                use_dot = mode == "dot"
                dns_string = f"{insecure_dns}" + (f"#{secure_dns}" if use_dot else "")
                dns_string = f"{dns_string} {insecure_dnsv6}" + (f"#{secure_dnsv6}" if use_dot else "")
                file_content = resolved.write_override(dns_string, use_dot)

            self.SettingsManager.setSetting("insecure_dns", insecure_dns)
            self.SettingsManager.setSetting("secure_dns", secure_dns)
            self.SettingsManager.setSetting("insecure_dnsv6", insecure_dnsv6)
            self.SettingsManager.setSetting("secure_dnsv6", secure_dnsv6)
            self.SettingsManager.setSetting("mode", mode)

            logging.info(f"Pushed custom dns override: {file_content}")
            await self.restart_resolved()
        except Exception as e:
            logging.error(f"Failed to push custom dns override: {e}")

    async def apply_dns_preset(self, preset: str):
        if preset not in DNS_PRESETS:
            logging.error(f"Invalid dns preset: {preset}")
            return
        if preset == "None":
            await self.drop_custom_dns_override()
            return
        logging.info(f"Applying dns preset: {preset}")
        await self.push_custom_dns_override(**DNS_PRESETS[preset])

    async def get_presets(self):
        return list(DNS_PRESETS.keys())

    async def drop_custom_dns_override(self):
        udns.stop()
        resolved.drop_override()
        await self.restart_resolved()

    async def restart_resolved(self):
        resolved.restart()

    async def get_dns_settings(self):
        # this is so previous setups migrates over
        mode = self.SettingsManager.getSetting("mode") or ("dot" if self.SettingsManager.getSetting("use_dot") else "plain")
        return [
            self.SettingsManager.getSetting("insecure_dns"),
            self.SettingsManager.getSetting("secure_dns"),
            self.SettingsManager.getSetting("insecure_dnsv6"),
            self.SettingsManager.getSetting("secure_dnsv6"),
            mode
        ]

    async def _unload(self):
        pass

    async def _uninstall(self):
        await self.drop_custom_dns_override()
        await self.restart_resolved()
        pass

    async def _migration(self):
        pass
