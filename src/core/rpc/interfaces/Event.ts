export interface Event {
  address: string;
  contract: string;
  kind: string;
  name: string;
  data: string; //Data in hexadecimal format, content depends on the event kind
}
