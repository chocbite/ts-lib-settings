import type { Option, ResultOk } from "@chocbite/ts-lib-result";
import type { StateROAW } from "@chocbite/ts-lib-state";

let name_transformer: ((name: string) => string) | undefined;
export const settings_set_name_transform = (
  transform: (name: string) => string,
) => {
  name_transformer = transform;
};

const packages = localStorage["settings/packageVersions"] as string | undefined;
let package_versions: { [key: string]: string } = {};
try {
  package_versions = packages
    ? (JSON.parse(packages) as { [key: string]: string })
    : {};
} catch (_e) {}
let store_package_versions_timeout: number | undefined;
const BOTTOM_GROUPS: { [key: string]: SettingsGroup } = {};

/**Initialises the settings for the package
 * @param package_name use import {name} from ("../package.json")
 * @param package_version use import {version} from ("../package.json")
 * @param versionChanged function to call when the version of the package changed
 * @param name name of group formatted for user reading
 * @param description a description of what the setting group is about*/
export const settings_init = (
  package_name: string,
  package_version: string,
  name: string,
  description: string,
) => {
  if (name_transformer) package_name = name_transformer(package_name);
  let changed: string | undefined;
  if (package_versions[package_name] !== package_version) {
    changed = package_versions[package_name];
    package_versions[package_name] = package_version;
    if (store_package_versions_timeout)
      clearTimeout(store_package_versions_timeout);
    store_package_versions_timeout = window.setTimeout(() => {
      localStorage["settings/packageVersions"] =
        JSON.stringify(package_versions);
    }, 1000);
  }
  return (BOTTOM_GROUPS[package_name] = new SettingsGroup(
    package_name,
    name,
    description,
    changed ? changed : undefined,
  ));
};

class Setting {
  readonly state: StateROAW<any>;
  readonly name: string;
  readonly description: string;
  constructor(state: StateROAW<any>, name: string, description: string) {
    this.state = state;
    this.name = name;
    this.description = description;
  }
}

/**Group of settings should never be instantiated manually use initSettings*/
export class SettingsGroup {
  private path_id: string;
  private settings: { [key: string]: Setting } = {};
  private sub_groups: { [key: string]: SettingsGroup } = {};
  readonly version_changed: string | undefined;
  readonly name: string;
  readonly description: string;

  constructor(
    path: string,
    name: string,
    description: string,
    version_changed?: string,
  ) {
    this.version_changed = version_changed;
    this.path_id = path;
    this.name = name;
    this.description = description;
  }

  /**Makes a settings subgroup for this group
   * @param id unique identifier for this subgroup in the parent group
   * @param name name of group formatted for user reading
   * @param description a description of what the setting group is about formatted for user reading*/
  make_sub_group(id: string, name: string, description: string) {
    if (id in this.sub_groups)
      throw new Error("Sub group already registered " + id);
    return (this.sub_groups[id] = new SettingsGroup(
      this.path_id + "/" + id,
      name,
      description,
      this.version_changed,
    ));
  }

  /**Gets value of setting or fallbacks to default
   * @param id unique identifier for this setting in the parent group
   * @param fallback value to use if no setting is stored
   * @param version_changed function called when the version of the package changed to migrate old value to new formats
   */
  get<TYPE>(
    id: string,
    fallback: TYPE,
    check?: (parsed: unknown) => Option<TYPE>,
    version_changed?: (existing: string, oldVersion: string) => TYPE,
  ): TYPE {
    const saved = localStorage.getItem(this.path_id + "/" + id);
    if (saved === null) return fallback;
    try {
      if (this.version_changed && version_changed) {
        const changed_value = version_changed(saved, this.version_changed);
        localStorage.setItem(
          this.path_id + "/" + id,
          JSON.stringify(changed_value),
        );
        return changed_value;
      }
      if (check) return check(JSON.parse(saved)).unwrap_or(fallback);
      return JSON.parse(saved) as TYPE;
    } catch (e) {
      return fallback;
    }
  }

  /**Sets value of setting, that has not been registered to a state
   * @param id unique identifier for this setting in the parent group
   * @param value value to set*/
  set(id: string, value: any) {
    if (id in this.settings)
      throw new Error("Settings is registered " + this.path_id + "/" + id);
    localStorage[this.path_id + "/" + id] = JSON.stringify(value);
  }

  /**Registers a state to a setting
   * @param id unique identifier for this setting in the parent group
   * @param name name of setting formatted for user reading
   * @param description a description of what the setting is about formatted for user reading
   * @param state initial value for the setting, use a promise for an eager async value, use a function returning a promise for a lazy async value
   */
  register<READ>(
    id: string,
    name: string,
    description: string,
    state: StateROAW<READ>,
  ) {
    if (id in this.settings)
      throw new Error("Settings already registered " + this.path_id + "/" + id);
    this.settings[id] = new Setting(state, name, description);
    state.sub((value) => {
      localStorage[this.path_id + "/" + id] = JSON.stringify(value.value);
    });
  }

  /**Registers a state to a setting
   * @param id unique identifier for this setting in the parent group
   * @param name name of setting formatted for user reading
   * @param description a description of what the setting is about formatted for user reading
   * @param state initial value for the setting, use a promise for an eager async value, use a function returning a promise for a lazy async value
   */
  register_transform<READ, TYPE>(
    id: string,
    name: string,
    description: string,
    state: StateROAW<READ>,
    transform: (state: ResultOk<READ>) => TYPE,
  ) {
    if (id in this.settings)
      throw new Error("Settings already registered " + this.path_id + "/" + id);
    this.settings[id] = new Setting(state, name, description);
    state.sub((value) => {
      localStorage[this.path_id + "/" + id] = JSON.stringify(transform(value));
    });
  }
}
