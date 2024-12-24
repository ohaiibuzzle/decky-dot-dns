import {
  ButtonItem,
  Dropdown,
  PanelSection,
  PanelSectionRow,
  TextField,
  ToggleField,
  staticClasses,
  SingleDropdownOption
} from "@decky/ui";
import {
  callable,
  definePlugin,
  // routerHook
} from "@decky/api"
import { useEffect, useState } from "react";
import { FaNetworkWired } from "react-icons/fa";

// import logo from "../assets/logo.png";

// This function calls the python function "add", which takes in two numbers and returns their sum (as a number)
// Note the type annotations:
//  the first one: [first: number, second: number] is for the arguments
//  the second one: number is for the return value
const push_custom_dns_override = callable<[string, string, string, string, boolean], void>("push_custom_dns_override");
const drop_custom_dns_override = callable<[], void>("drop_custom_dns_override");
const restart_resolved = callable<[], void>("restart_resolved");
const get_dns_settings = callable<[], [string, string, string, string, boolean]>("get_dns_settings");

class DNSTemplate {
  name: string;
  insecure_dns: string;
  secure_dns: string;
  insecure_dnsv6: string;
  secure_dnsv6: string;
  use_dot: boolean;
  constructor(name: string, insecure_dns: string, secure_dns: string, insecure_dnsv6: string, secure_dnsv6: string, use_dot: boolean) {
    this.name = name;
    this.insecure_dns = insecure_dns;
    this.secure_dns = secure_dns;
    this.insecure_dnsv6 = insecure_dnsv6;
    this.secure_dnsv6 = secure_dnsv6;
    this.use_dot = use_dot;
  }
}

const DNSTemplates = {
  "None": new DNSTemplate("None", "", "", "", "", false),
  "CloudFlare": new DNSTemplate("CloudFlare", "1.1.1.1", "cloudflare-dns.com", "2606:4700:4700::1111", "cloudflare-dns.com", false),
  "Google": new DNSTemplate("Google", "8.8.8.8", "dns.google", "2001:4860:4860::8888", "dns.google", true),
  "dns0.eu": new DNSTemplate("dns0.eu", "193.110.81.0", "dns0.eu", "2a0f:fc80::", "dns0.eu", true),
  "Quad9": new DNSTemplate("Quad9", "9.9.9.10", "dns10.quad9.net", "2620:fe::10", "dns10.quad9.net", true)
}

function Content() {
  const [insecure_dns, setInsecureDNS] = useState<string>("");
  const [secure_dns, setSecureDNS] = useState<string>("");
  const [insecure_dnsv6, setInsecureDNSv6] = useState<string>("");
  const [secure_dnsv6, setSecureDNSv6] = useState<string>("");
  const [use_dot, setUseDot] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("None");

  const onSubmit = async () => {
    await push_custom_dns_override(insecure_dns, secure_dns, insecure_dnsv6, secure_dnsv6, use_dot);
    await restart_resolved();
  };

  const onDrop = async () => {
    await drop_custom_dns_override();
    await restart_resolved();
  };

  useEffect(() => {
    get_dns_settings().then(([insecure_dns, secure_dns, insecure_dnsv6, secure_dnsv6, use_dot]) => {
      setInsecureDNS(insecure_dns);
      setSecureDNS(secure_dns);
      setInsecureDNSv6(insecure_dnsv6);
      setSecureDNSv6(secure_dnsv6);
      setUseDot(use_dot);
    });
  }, []);

  const presetOptions: SingleDropdownOption[] = Object.keys(DNSTemplates).map(key => {
    return {
      label: <span>{key}</span>,
      data: DNSTemplates[key as keyof typeof DNSTemplates]
    }
  })

  const onSelectPreset = async (preset: DNSTemplate) => {
    setInsecureDNS(preset.insecure_dns);
    setSecureDNS(preset.secure_dns);
    setInsecureDNSv6(preset.insecure_dnsv6);
    setSecureDNSv6(preset.secure_dnsv6);
    setUseDot(preset.use_dot);
  };

  return (
    <PanelSection>
      <div className={staticClasses.PanelSectionTitle}>
        {"DNS Presets"}
      </div>
      <PanelSectionRow>
        <Dropdown
          strDefaultLabel="Select a preset"
          selectedOption={presetOptions.find((value: SingleDropdownOption, _index, _array) => value.data.name === selectedPreset)}
          rgOptions={presetOptions}
          onChange={(elem: SingleDropdownOption) => {
            setSelectedPreset(elem.data.name);
            onSelectPreset(elem.data as DNSTemplate);
          }}
        />
      </PanelSectionRow>

      <div className={staticClasses.PanelSectionTitle}>
        {"Custom DNS"}
      </div>
      <PanelSectionRow>
        <ToggleField
          label="Use DoT"
          checked={use_dot}
          onChange={setUseDot}
        />
        <TextField
          label="Insecure DNS"
          value={insecure_dns}
          onChange={e => setInsecureDNS(e.target.value)}
        />

        <TextField
          label="Secure DNS"
          value={secure_dns}
          onChange={e => setSecureDNS(e.target.value)}
          disabled={!use_dot}
        />

        <TextField
          label="Insecure DNSv6"
          value={insecure_dnsv6}
          onChange={e => setInsecureDNSv6(e.target.value)}
        />

        <TextField
          label="Secure DNSv6"
          value={secure_dnsv6}
          onChange={e => setSecureDNSv6(e.target.value)}
          disabled={!use_dot}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={onSubmit}
        >
          Submit
        </ButtonItem>

        <ButtonItem
          layout="below"
          onClick={onDrop}
        >
          Restore Defaults
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  );
};

export default definePlugin(() => {
  return {
    name: "Decky DNS Settings",
    titleView: <div className={staticClasses.Title}>Decky DNS Settings</div>,
    content: <Content />,
    icon: <FaNetworkWired />,
    onDismount() {
      console.log("Unloading")
    },
  };
});
