import { IContract, NativeContractKind } from "../../interfaces/index.js";
import { Stack } from "../../types/index.js";
import { VMObject } from "../VMObject.js";

export class DisasmUtils {
  private static PopArgs(
    contract: string,
    method: string,
    stack: Stack<VMObject>,
    methodArgumentCountTable: { [key: string]: number }
  ): VMObject[] {
    let key = method;
    if (contract != null) {
      key = `${contract}.${method}`;
    }

    if (methodArgumentCountTable.hasOwnProperty(key)) {
      let argCount = methodArgumentCountTable[key];
      let result: Array<VMObject> = new Array<VMObject>(argCount);
      for (let i = 0; i < argCount; i++) {
        if (stack.size() == 0) {
          throw new Error(
            `Cannot disassemble method => method ${key} expected ${argCount} args, ${i} were fetched`
          );
        }
        //result[i] = stack.pop();
      }
      return result;
    } else {
      throw new Error(`Cannot disassemble method => unknown name: ${key}`);
    }
  }

  //private static _defaultDisasmTable = DisasmUtils.GetDefaultDisasmTable();

  /*public static GetDefaultDisasmTable(): { [key: string]: number } {
        if (DisasmUtils._defaultDisasmTable != null) {
            return DisasmUtils._defaultDisasmTable;
        }
        let table: { [key: string]: number } = {};

        ExtCalls.IterateExtcalls((methodName: string, argCount: number, method: any) => {
            table[methodName] = argCount;
        });

        let nativeContracts = Enum.GetValues(NativeContractKind);
        for (const kind of nativeContracts) {
            if (kind == NativeContractKind.Unknown) {
                continue;
            }
            let contract = NativeContract.GetNativeContractByKind(kind);
            table.AddContractToTable(contract);
        }

        return table;
    }

    public static AddContractToTable(table: { [key: string]: number }, contract: IContract) {
        let abi = contract.ABI;

        for (const method of abi.Methods) {
            let key = `${contract.Name}.${method.name}`;
            table[key] = method.parameters.length;
        }
    }

    public static AddTokenToTable(table: { [key: string]: number }, token: IToken) {
        let abi = token.ABI;

        for (const method of abi.Methods) {
            let key = `${token.Symbol}.${method.name}`;
            table[key] = method.parameters.length;
        }
    }

    public static ExtractContractNames(disassembler: Disassembler): string[] {
        let instructions = disassembler.Instructions.toArray();
        let result = new Array<string>();

        let index = 0;
        let regs = new Array<VMObject>(16);
        while (index < instructions.length) {
            let instruction = instructions[index];

            switch (instruction.Opcode) {
                case Opcode.LOAD: {
                    let dst = instruction.Args[0] as number;
                    let type = instruction.Args*/
}
