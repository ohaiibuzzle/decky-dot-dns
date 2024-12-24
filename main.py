import os

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code repo
# and add the `decky-loader/plugin/imports` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky
import asyncio
from settings import SettingsManager
import logging

RESOLVED_DNS_CONFIG_PATH="/etc/systemd/resolved.conf.d/decky-dot-dns.conf"
SETTINGS_DIR = os.environ["DECKY_PLUGIN_SETTINGS_DIR"]

class Plugin:
    SettingsManager = SettingsManager(SETTINGS_DIR, "settings.json")
    
    async def push_custom_dns_override(self, insecure_dns: str, secure_dns: str, insecure_dnsv6: str, secure_dnsv6: str, use_dot: bool = False):
        logging.info(f"Pushing custom dns override: insecure_dns={insecure_dns}, secure_dns={secure_dns}, insecure_dnsv6={insecure_dnsv6}, secure_dnsv6={secure_dnsv6}, use_dot={use_dot}")
        try:
            # Ensure that the path exists
            os.makedirs(os.path.dirname(RESOLVED_DNS_CONFIG_PATH), exist_ok=True)

            dns_string = f"{insecure_dns}" + (f"#{secure_dns}" if use_dot else "")
            dns_string = f"{dns_string} {insecure_dnsv6}" + (f"#{secure_dnsv6}" if use_dot else "")
            file_content = f"""
[Resolve]
DNS={dns_string}
DNSOverTLS={"yes" if use_dot else "no"}
"""        
            with open(RESOLVED_DNS_CONFIG_PATH, "w") as f:
                f.write(file_content)

            self.SettingsManager.setSetting("insecure_dns", insecure_dns)
            self.SettingsManager.setSetting("secure_dns", secure_dns)
            self.SettingsManager.setSetting("insecure_dnsv6", insecure_dnsv6)
            self.SettingsManager.setSetting("secure_dnsv6", secure_dnsv6)
            self.SettingsManager.setSetting("use_dot", use_dot)
            
            logging.info(f"Pushed custom dns override: {file_content}")
            await self.restart_resolved()
        except Exception as e:
            logging.error(f"Failed to push custom dns override: {e}")

    async def drop_custom_dns_override(self):
        if os.path.exists(RESOLVED_DNS_CONFIG_PATH):
            os.remove(RESOLVED_DNS_CONFIG_PATH)
            logging.info(f"Removed custom dns override")
        else:
            logging.info(f"Custom dns override not found")

        await self.restart_resolved()

    async def restart_resolved(self):
        os.system("systemctl restart systemd-resolved")
        logging.info(f"Restarted systemd-resolved")

    async def get_dns_settings(self):
        return [
            self.SettingsManager.getSetting("insecure_dns"),
            self.SettingsManager.getSetting("secure_dns"),
            self.SettingsManager.getSetting("insecure_dnsv6"),
            self.SettingsManager.getSetting("secure_dnsv6"),
            self.SettingsManager.getSetting("use_dot")
        ]   

    async def _unload(self):
        await self.drop_custom_dns_override()
        await self.restart_resolved()
        pass

    async def _uninstall(self):
        await self._unload()
        pass

    async def _migration(self):
        pass