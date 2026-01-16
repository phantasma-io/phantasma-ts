import { ScriptBuilder } from "../vm/index.js";

export enum Nexus {
  Mainnet = "mainnet",
  Simnet = "simnet",
  Testnet = "testnet",
}

export class EasyScript {
  nexus: Nexus;
  sb: ScriptBuilder;

  constructor(nexus: Nexus = Nexus.Mainnet) {
    this.sb = new ScriptBuilder();
    this.nexus = nexus;
  }

  buildScript(_type: string, _options: Array<any> = [null]) {
    this.sb = new ScriptBuilder();

    switch (_type) {
      case "interact":
        let contractNameInteract: string = _options[0];
        let methodNameInteract: string = _options[1];
        let inputArgumentsInteract: Array<any> = _options[2];

        return this.sb
          .CallContract("gas", "AllowGas", [])
          .CallContract(
            contractNameInteract,
            methodNameInteract,
            inputArgumentsInteract
          ) //The Meat of the Script
          .CallContract("gas", "SpendGas", [])
          .EndScript();

        break;

      case "invoke":
        let contractNameInvoke: string = _options[0];
        let methodNameInvoke: string = _options[1];
        let inputArgumentsInvoke: Array<any> = _options[2];

        return this.sb
          .CallContract(
            contractNameInvoke,
            methodNameInvoke,
            inputArgumentsInvoke
          ) //The Meat of the Script
          .EndScript();

        break;

      case "interop":
        let interopNameInterop: string = _options[0];
        let inputArgumentsInterop: Array<any> = _options[1];

        return this.sb
          .CallContract("gas", "AllowGas", [])
          .CallInterop(interopNameInterop, inputArgumentsInterop)
          .CallContract("gas", "SpendGas", [])
          .EndScript();

        break;
    }
  }
}
