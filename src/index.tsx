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
import { useEffect, useReducer } from "react";
import { FaNetworkWired } from "react-icons/fa";

const push_custom_dns_override = callable<[string, string, string, string, boolean], void>("push_custom_dns_override");
const drop_custom_dns_override = callable<[], void>("drop_custom_dns_override");
const restart_resolved = callable<[], void>("restart_resolved");
const get_dns_settings = callable<[], [string, string, string, string, boolean]>("get_dns_settings");
const apply_dns_preset = callable<[string], void>("apply_dns_preset");
const get_presets = callable<[], string[]>("get_presets");

// decky still has that annoying qam remounts behavior, 
// so states needs to be cached outside of the component.
const cache: Record<string, any> = {};
const listeners = new Set<() => void>();
function usePersistent<T>(key: string, initial: T): [T, (v: T) => void] {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    listeners.add(rerender);
    return () => { listeners.delete(rerender); };
  }, []);
  return [key in cache ? cache[key] : initial, (v: T) => { cache[key] = v; listeners.forEach((l) => l()); }];
}

function Content() {
  const [insecure_dns, setInsecureDNS] = usePersistent<string>("insecure_dns", "");
  const [secure_dns, setSecureDNS] = usePersistent<string>("secure_dns", "");
  const [insecure_dnsv6, setInsecureDNSv6] = usePersistent<string>("insecure_dnsv6", "");
  const [secure_dnsv6, setSecureDNSv6] = usePersistent<string>("secure_dnsv6", "");
  const [use_dot, setUseDot] = usePersistent<boolean>("use_dot", false);
  const [selectedPreset, _ ] = usePersistent<string>("selectedPreset", "");

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

  const presetOptions: SingleDropdownOption[] = [];
  get_presets().then((presets) => {
    presets.forEach((preset) => {
      presetOptions.push({
        label: <span>{preset}</span>,
        data: preset
      });
    });
  });
  const onSelectPreset = async (preset: string) => {
    await apply_dns_preset(preset);
  };

  return (
    <PanelSection>
      <div className={staticClasses.PanelSectionTitle}>
        {"DNS Presets"}
      </div>
      <PanelSectionRow>
        <Dropdown
          strDefaultLabel="Select a preset"
          selectedOption={presetOptions.find((elem) => elem.data == (selectedPreset))}
          rgOptions={presetOptions}
          onChange={(elem: SingleDropdownOption) => {
            onSelectPreset(elem.data);
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
          Apply
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
    name: "DNS Settings",
    titleView: <div className={staticClasses.Title}>Decky DoT DNS</div>,
    content: <Content />,
    icon: <FaNetworkWired />,
    onDismount() {
      console.log("Unloading")
    },
  };
});
