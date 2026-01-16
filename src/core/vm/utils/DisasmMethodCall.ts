import { VMObject } from "../VMObject.js";

export class DisasmMethodCall {
  public ContractName: string;
  public MethodName: string;
  public Arguments: VMObject[];

  public toString(): string {
    const sb = Array<string>();
    sb.push(`${this.ContractName}.${this.MethodName}(`);
    for (let i = 0; i < this.Arguments.length; i++) {
      if (i > 0) {
        sb.push(",");
      }

      const arg = this.Arguments[i];
      sb.push(arg.toString());
    }
    sb.push(")");
    return sb.join("");
  }
}
