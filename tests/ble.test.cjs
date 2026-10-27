const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function setup() {
  let state = "PoweredOn";
  let scanCallback, disconnectedCallback;
  let discoveryError = false;
  let connectResolve;
  let delayed = false;
  let stateCallback;
  let removed = 0;
  const cancelled = [];
  const device = {
    id: "station-1",
    async discoverAllServicesAndCharacteristics() {
      if (discoveryError) throw new Error("discovery failed");
    },
    async requestMTU() {},
    monitorCharacteristicForService() {
      return {
        remove() {
          removed++;
        },
      };
    },
    onDisconnected(cb) {
      disconnectedCallback = cb;
      return {
        remove() {
          removed++;
        },
      };
    },
  };
  const manager = {
    async state() {
      return state;
    },
    onStateChange(cb) {
      stateCallback = cb;
      return { remove() {} };
    },
    startDeviceScan(_filter, _options, cb) {
      scanCallback = cb;
    },
    stopDeviceScan() {},
    async connectToDevice() {
      if (delayed)
        await new Promise((resolve) => {
          connectResolve = resolve;
        });
      return device;
    },
    async cancelDeviceConnection(id) {
      cancelled.push(id);
    },
  };
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync("src/services/ble.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  vm.runInNewContext(code, {
    exports,
    setTimeout,
    clearTimeout,
    atob,
    btoa,
    require(name) {
      if (name.includes("account-api")) return { requireAdmin: async () => {} };
      if (name === "react-native")
        return { Platform: { OS: "android", Version: 33 } };
      if (name === "react-native-ble-plx")
        return {
          BleManager: function () {
            return manager;
          },
          State: { PoweredOn: "PoweredOn" },
          BleErrorCode: { DeviceNotConnected: 205 },
        };
      if (name.includes("bleUUID"))
        return { BLE_UUID: { SERVICE: "service", RX: "rx", TX: "tx" } };
      throw new Error(name);
    },
  });
  return {
    service: exports.default,
    name: exports.stationDisplayName,
    cancelled,
    advertise: (d) => scanCallback(null, d),
    failDiscovery: () => {
      discoveryError = true;
    },
    delayConnection: () => {
      delayed = true;
    },
    resolveConnection: () => connectResolve(),
    powerOff: () => {
      state = "PoweredOff";
    },
    powerOn: () => {
      state = "PoweredOn";
      stateCallback(state);
    },
    subscriptionsRemoved: () => removed,
    disconnectNative: () => disconnectedCallback(),
  };
}

test("scan keeps stable unique fallback and accepts a later complete name", async () => {
  const s = setup();
  const found = [];
  await s.service.startScan((d) => found.push(d));
  s.advertise({ id: "AA:BB:CC:11:22:33", localName: "", name: null });
  s.advertise({ id: "AA:BB:CC:11:22:33", localName: "CASA-112233" });
  assert.equal(found[0].name, "CASA · 112233");
  assert.equal(found[1].name, "CASA-112233");
  s.advertise({ id: "AA:BB:CC:11:22:33", name: null });
  assert.equal(found[2].name, "CASA-112233");
  assert.notEqual(s.name({ id: "AA:BB:CC:11:22:44" }), found[0].name);
  s.service.stopScan();
  s.advertise({ id: "late", name: "ignored" });
  assert.equal(found.length, 3);
});
test("navigation disconnect releases native connection and subscriptions; reconnect works", async () => {
  const s = setup();
  await s.service.connect("station-1");
  await s.service.disconnect();
  assert.deepEqual(s.cancelled, ["station-1"]);
  assert.equal(s.subscriptionsRemoved(), 2);
  await s.service.connect("station-1");
  s.disconnectNative();
  assert.equal(s.subscriptionsRemoved(), 4);
});
test("failed discovery does not leave an invisible connected station", async () => {
  const s = setup();
  s.failDiscovery();
  await assert.rejects(s.service.connect("station-1"), /discovery failed/);
  assert.ok(s.cancelled.includes("station-1"));
});
test("leaving while connecting cancels the late native connection", async () => {
  const s = setup();
  s.delayConnection();
  const connecting = s.service.connect("station-1");
  await new Promise((resolve) => setImmediate(resolve));
  await s.service.disconnect();
  s.resolveConnection();
  await assert.rejects(connecting, /cancelada/);
  assert.ok(s.cancelled.length >= 1);
});
test("leaving while Bluetooth is off does not start a late scan", async () => {
  const s = setup();
  s.powerOff();
  const scanning = s.service.startScan(() => assert.fail("late scan"));
  await new Promise((resolve) => setImmediate(resolve));
  s.service.stopScan();
  s.powerOn();
  await scanning;
});
